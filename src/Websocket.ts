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
import process from 'node:process';
import { AuthCodes, WebsocketServer, type User, WsUtils } from '@kastelll/core';
import mongoose from 'mongoose';
import { Server } from './Config.js';
import { OpCodes } from './Utils/Classes/WsUtils.js';
import Init from './Utils/Init.js';
import { uriGenerator } from './Utils/URIGen.js';

class Websocket {
	public wss: WebsocketServer;

	public EventsInit: Init;

	public constructor() {
		this.wss = new WebsocketServer(Server.Port, Server.AllowedIps, Server.CloseOnError);

		this.EventsInit = new Init(this);
	}

	public async start() {
		this.EventsInit.create();

		const DatabaseConnected = await this.connectDatabase();

		if (!DatabaseConnected) {
			console.error('Failed to connect to database');

			process.exit(1);
		}

		console.log('[Database] Connected to MongoDB');

		this.wss.on('connection', this.onConnection.bind(this));
		this.wss.on('debug', this.onDebug.bind(this));

		// temporary
		this.wss.maxPerIp = Number.POSITIVE_INFINITY;
		this.wss.maxConnectionsPerMinute = Number.POSITIVE_INFINITY;
		
		this.wss.createWs();
	}

	private async connectDatabase() {
		mongoose.set('strictQuery', true);

		try {
			await mongoose.connect(uriGenerator(), {});
		} catch (error) {
			console.error(error);

			return false;
		}

		return true;
	}

	// for backwards compatibility on the old code
	public SendToUsersInGuild(guildId: string, ignoreUserIds: string[], data: any) {
		for (const user of this.wss.connectedUsers.values()) {
			if (
				user.AuthType === AuthCodes.User &&
				user?.UserData?.Guilds?.includes(guildId) &&
				!ignoreUserIds.includes(user.Id)
			) {
				user.send(data);
			}
		}
	}

	private onConnection(user: User) {
		console.log(`[Stats] New connection from ${user.Ip}`);

		user.send({
			op: OpCodes.Hello,
			d: {
				Date: Date.now(),
			},
		});

		if (user.AuthType === AuthCodes.System) {
			if (Server.SystemLoginInfo.AllowNonLocalIp && !Server.SystemLoginInfo.LocalIps.includes(user.Ip)) {
				user.close(4_000, 'System login is not allowed from non local ip', false);

				return;
			}

			if (user.SocketVersion !== 0) {
				user.close(4_000, 'Invalid socket version', false);

				return;
			}

			const Params = user.Params as {
				c: string;
				// Password
				encoding: string;
				p: string;
				v: string;
			};

			if (!Params) {
				user.close(4_000, 'Invalid parameters', false);

				return;
			}
			
			const PasswordsLengths = [
				Buffer.from(Params.p),
				Buffer.from(Server.SystemLoginInfo.Password),
			]
			
			if (PasswordsLengths?.[0]?.length !== PasswordsLengths?.[1]?.length) {
				user.close(4_000, 'Invalid parameters', false);

				return;
			}

			if (!crypto.timingSafeEqual(Buffer.from(Params.p), Buffer.from(Server.SystemLoginInfo.Password))) {
				user.close(4_000, 'Invalid parameters', false);

				return;
			}

			user.setAuthed(true);

			if (Params.c === 'true') {
				user.setCompression(true);
			}

			if (Server.SystemLoginInfo.ForceHeartbeats) {
				user.setHeartbeatInterval(WsUtils.GenerateHeartbeatInterval());
				user.setLastHeartbeat(Date.now());
			}

			user.send({
				Authed: true,
				ApproximateMembers: Math.ceil(
					Array.from(this.wss.connectedUsers.values()).filter((usr) => usr.AuthType === AuthCodes.User).length / 2,
				),
				Misc: {
					HeartbeatInterval: user.HeartbeatInterval ?? null,
					SessionId: user.Id,
				},
			});
		} else if (user.SocketVersion === 0) {
			user.close(4_000, 'Invalid socket version', false);
		}
	}

	private onDebug(message: string[] | string) {
		console.log(message);
	}
}

export default Websocket;

export { Websocket };
