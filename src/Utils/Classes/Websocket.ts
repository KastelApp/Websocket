/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { URL } from 'node:url';
// import { AuthCodes, WebsocketServer, type User, WsUtils, Events as EventsBuilder, EventsHandler } from '@kastelll/core';
import { CacheManager } from '@kastelll/util';
import { type SimpleGit, simpleGit } from 'simple-git';
import Config, { Server, Redis } from '../../Config.js';
import Constants from '../../Constants.js';
import ProcessArgs from '../ProcessArgs.js';
import Connection from './Connection.js';
import { Events as EventBuilder } from './Events.js';
import EventsHandler from './EventsHandler.js';
import Logger from './Logger.js';
import { OpCodes } from './OpCodes.js';
import SystemInfo from './SystemInfo.js';
import type User from './User.js';
import { AuthCodes, WsUtils } from './Utils.js';
import WebsocketServer from './WS.js';

type GitType = 'Added' | 'Copied' | 'Deleted' | 'Ignored' | 'Modified' | 'None' | 'Renamed' | 'Unmerged' | 'Untracked';

class Websocket {
	private EventsDirectory: string = join(new URL('.', import.meta.url).pathname, '../../Events');

	public wss: WebsocketServer;

	public Logger: Logger = new Logger();

	public Cassandra: Connection;

	public Cache: CacheManager;

	public Config: typeof Config = Config;

	public Constants: typeof Constants = Constants;

	public Events: {
		default: EventBuilder;
		directory: string;
		systemEvent: boolean;
	}[] = [];

	private Clean: boolean = false;

	public InternetAccess: boolean = false;

	public Git: SimpleGit = simpleGit();

	private GitFiles: {
		filePath: string;
		type: GitType;
	}[] = [];

	public GitBranch: string = 'Unknown';

	public GitCommit: string = 'Unknown';

	private TypeIndex = {
		A: 'Added',
		D: 'Deleted',
		M: 'Modified',
		R: 'Renamed',
		C: 'Copied',
		U: 'Unmerged',
		'?': 'Untracked',
		'!': 'Ignored',
		' ': 'None',
	};

	public Args: 'debug'[] = ProcessArgs(['debug']).Valid as 'debug'[];

	public constructor() {
		this.wss = new WebsocketServer(Server.Port, Server.AllowedIps, Server.CloseOnError, this.Logger);

		this.Cache = new CacheManager({
			Host: Redis.Host,
			Port: Redis.Port,
			Password: Redis.Password,
			DB: Redis.DB,
			Username: Redis.Username,
			AllowForDangerousCommands: true,
		});

		this.Cassandra = new Connection(Config.ScyllaDB.Nodes, Config.ScyllaDB.Username, Config.ScyllaDB.Password, Config.ScyllaDB.Keyspace, Config.ScyllaDB.NetworkTopologyStrategy, Config.ScyllaDB.DurableWrites, Config.ScyllaDB.CassandraOptions);
	}

	public async Start() {
		await this.SetupDebug(this.Args.includes('debug'));

		this.wss.on('connection', this.onConnection.bind(this));
		this.wss.on('debug', this.onDebug.bind(this));
		this.wss.on('listening', (port) =>
			this.Logger.info(`Websocket is ${port === 0 ? 'listening on server' : `listening on port ${port}`}`),
		);
		this.Cache.on('Connected', () => this.Logger.info('Connected to Redis'));
		this.Cache.on('Error', (error) => {
			this.Logger.fatal(`Redis error: ${error}`);

			process.exit(1);
		});
		this.Cache.on('MissedPing', () => this.Logger.warn('Redis missed ping'));
		this.Cassandra.on('Connected', () => this.Logger.info('Connected to ScyllaDB'));
		this.Cassandra.on('Error', (err) => {
			this.Logger.fatal(err);

			process.exit(1);
		});

		// temporary
		this.wss.MaxPerIp = Number.POSITIVE_INFINITY;
		this.wss.MaxConnectionsPerMinute = Number.POSITIVE_INFINITY;

		this.Logger.info('Connecting to ScyllaDB');
		this.Logger.warn('IT IS NOT FROZEN, ScyllaDB may take a while to connect')
		
		await Promise.all([
			this.Cassandra.Connect(),
			this.Cache.connect(),
		]);

		this.Logger.info('Creating ScyllaDB Tables.. This may take a while..');
		this.Logger.warn('IT IS NOT FROZEN, ScyllaDB may take a while to create the tables')
		
		const TablesCreated = await this.Cassandra.CreateTables();

		if (TablesCreated) {
			this.Logger.info('Created ScyllaDB tables');
		} else {
			this.Logger.warn('whar');
		}

		const Events = await this.EventsInit();

		new EventsHandler(...Events.map((event) => event.default));

		for (const Event of Events) {
			this.Logger.verbose(`Loaded event ${Event.default.Name} [${Event.systemEvent ? 'System' : 'User'}]`);
		}

		this.wss.CreateWs();
	}

	private onConnection(user: User) {
		user.Send({
			Op: OpCodes.Hello,
			D: {
				Date: Date.now(),
			},
		});

		if (user.AuthType === AuthCodes.System) {
			if (Server.SystemLoginInfo.AllowNonLocalIp && !Server.SystemLoginInfo.LocalIps.includes(user.Ip)) {
				user.Close(4_000, 'System login is not allowed from non local ip', false);

				return;
			}

			if (user.SocketVersion !== 0) {
				user.Close(4_000, 'Invalid socket version', false);

				return;
			}

			const Params = user.Params as {
				c: string;
				encoding: string;
				// Password
				p: string;
				v: string;
			};

			if (!Params) {
				user.Close(4_000, 'Invalid parameters', false);

				return;
			}

			const PasswordsLengths = [Buffer.from(Params.p), Buffer.from(Server.SystemLoginInfo.Password)];

			if (PasswordsLengths?.[0]?.length !== PasswordsLengths?.[1]?.length) {
				user.Close(4_000, 'Invalid parameters', false);

				return;
			}

			if (!crypto.timingSafeEqual(Buffer.from(Params.p), Buffer.from(Server.SystemLoginInfo.Password))) {
				user.Close(4_000, 'Invalid parameters', false);

				return;
			}

			user.Authed = true;

			if (Params.c === 'true') {
				user.Compression = true;
			}

			if (Server.SystemLoginInfo.ForceHeartbeats) {
				user.HeartbeatInterval = WsUtils.GenerateHeartbeatInterval();
				user.LastHeartbeat = Date.now();
			}

			user.Send({
				Authed: true,
				ApproximateMembers: Math.ceil(
					Array.from(this.wss.ConnectedUsers.values()).filter((usr) => usr.AuthType === AuthCodes.User).length / 2,
				),
				Misc: {
					HeartbeatInterval: user.HeartbeatInterval ?? null,
					SessionId: user.Id,
				},
			});
		} else if (user.SocketVersion === 0) {
			user.Close(4_000, 'Invalid socket version', false);
		}
	}

	private onDebug(message: string[] | string) {
		this.Logger.debug(message);
	}

	private async EventsInit(): Promise<(typeof this)['Events']> {
		const Events = await this.WalkDirectory(this.EventsDirectory);

		for (const Event of Events) {
			if (!Event.endsWith('.js')) {
				this.Logger.debug(`Skipping ${Event} as it is not a .js file`);

				continue;
			}

			const EventClass = await import(Event);

			if (!EventClass.default) {
				this.Logger.warn(`Skipping ${Event} as it does not have a default export`);

				continue;
			}

			const EventInstance = new EventClass.default(this);

			if (!(EventInstance instanceof EventBuilder)) {
				this.Logger.warn(`Skipping ${Event} as it does not extend Events`);

				continue;
			}

			this.Events.push({
				default: EventInstance,
				directory: Event,
				systemEvent: EventInstance.AllowedAuthTypes === AuthCodes.System,
			});
		}

		return this.Events;
	}

	private async WalkDirectory(dir: string): Promise<string[]> {
		const Events = await readdir(dir, { withFileTypes: true });

		const Files: string[] = [];

		for (const Event of Events) {
			if (Event.isDirectory()) {
				const SubFiles = await this.WalkDirectory(join(dir, Event.name));
				Files.push(...SubFiles);
			} else {
				Files.push(join(dir, Event.name));
			}
		}

		return Files;
	}

	private async SetupDebug(Log: boolean) {
		const SystemClass = new SystemInfo();
		const System = await SystemClass.Info();
		const GithubInfo = await this.GithubInfo();

		const Strings = [
			'='.repeat(40),
			`Kastel Debug Logs`,
			'='.repeat(40),
			`Gateway Version: ${this.Constants.Relative.Version}`,
			`Node Version: ${process.version}`,
			'='.repeat(40),
			`System Info:`,
			`OS: ${System.OperatingSystem.Platform}`,
			`Arch: ${System.OperatingSystem.Arch}`,
			`Os Release: ${System.OperatingSystem.Release}`,
			`Internet Status: ${System.InternetAccess ? 'Online' : 'Offline - Some features may not work'}`,
			'='.repeat(40),
			'Hardware Info:',
			`CPU: ${System.Cpu.Type}`,
			`CPU Cores: ${System.Cpu.Cores}`,
			`Current CPU Usage: ${System.Cpu.Usage}`,
			`Total Memory: ${System.Ram.Total}`,
			`Free Memory: ${System.Ram.Available}`,
			`Used Memory: ${System.Ram.Usage}`,
			'='.repeat(40),
			`Process Info:`,
			`PID: ${process.pid}`,
			`Uptime: ${System.Process.Uptime}`,
			'='.repeat(40),
			`Git Info:`,
			`Branch: ${this.GitBranch}`,
			`Commit: ${GithubInfo.CommitShort ?? GithubInfo.Commit}`,
			`Status: ${this.Clean ? 'Clean' : 'Dirty - You will not be given support if something breaks with a dirty instance'
			}`,
			'='.repeat(40),
			'Changed Files:',
		];

		for (const File of this.GitFiles) {
			Strings.push(`${File.type}: ${File.filePath}`);
		}

		Strings.push('='.repeat(40));

		if (Log) {
			for (const String of Strings) {
				this.Logger.importantDebug(String);
			}
		}
	}

	private async GithubInfo(): Promise<{
		Branch: string;
		Clean: boolean;
		Commit: string | undefined;
		CommitShort: string | undefined;
	}> {
		const Branch = await this.Git.branch();
		const Commit = await this.Git.log();
		const Status = await this.Git.status();

		if (!Commit.latest?.hash) {
			this.Logger.fatal('Could not get Commit Info, are you sure you pulled the repo correctly?');

			process.exit(1);
		}

		this.GitBranch = Branch.current;

		this.GitCommit = Commit.latest.hash;

		this.Clean = Status.files.length === 0;

		for (const File of Status.files) {
			this.GitFiles.push({
				filePath: File.path,
				type: this.TypeIndex[File.working_dir as keyof typeof this.TypeIndex] as GitType,
			});
		}

		return {
			Branch: Branch.current,
			Commit: Commit.latest.hash,
			CommitShort: Commit.latest.hash.slice(0, 7),
			Clean: Status.files.length === 0,
		};
	}
}

export default Websocket;

export { Websocket };
