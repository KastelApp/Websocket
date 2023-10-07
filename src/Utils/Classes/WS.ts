import type { Buffer } from 'node:buffer';
import { EventEmitter } from 'node:events';
import { setInterval } from 'node:timers';
import WsError from './Errors.ts';
import Events from './EventsHandler.ts';
import type Logger from './Logger.ts';
import { OpCodes } from './OpCodes.ts';
import User from './User.ts';
import Utils, { HardCloseCodes, AuthCodes, SoftCloseCodes } from './Utils.ts';
import { Server, ServerWebSocket } from 'bun';

export interface WebsocketServer {
	emit(event: 'connection', user: User): boolean;
	emit(event: 'debug', message: string[] | string): boolean;
	emit(event: 'error', error: Error, user?: User): boolean;
	emit(event: 'close', user: User, expecting: boolean): boolean;
	emit(event: 'listening', port: number): boolean;
	on(event: 'connection', listener: (user: User) => void): this;
	on(event: 'debug', listener: (message: string[] | string) => void): this;
	on(event: 'error', listener: (error: Error, user?: User) => void): this;
	on(event: 'close', listener: (user: User, expecting: boolean) => void): this;
	on(event: 'listening', listener: (port: number) => void): this;
}

export class WebsocketServer extends EventEmitter {
	public ConnectedUsers: Map<string, User>;

	public MainSocket: Server | null;

	private readonly Logger: Logger;

	public Port: number;

	public AllowedIps: string[];

	public CloseOnError: boolean;

	public MaxPerIp: number;

	public MaxConnectionsPerMinute: number;

	public HeartbeatInterval: number;

	public ClosedInterval: number;

	public UnauthedTimeout: number;

	public constructor(port: number, allowedIps: string[], closeOnError: boolean, logger: Logger) {
		super();

		this.ConnectedUsers = new Map();

		this.Logger = logger;

		this.MainSocket = null;

		this.Port = port;

		this.AllowedIps = allowedIps;

		this.CloseOnError = closeOnError;

		this.MaxPerIp = 10; // only 5 connections per ip (This is a BAD solution, but it works for now)

		this.MaxConnectionsPerMinute = 5; // the max connections per minute per ip (meaning 5 people can connect in 1 minute, but 6th will be disconnected)

		this.HeartbeatInterval = 1_000 * 1; // 1 second

		this.ClosedInterval = 1_000 * 5; // 5 seconds

		this.UnauthedTimeout = 1_000 * 10; // 10 seconds
	}

	public CreateWs(): Server {
		this.MainSocket = Bun.serve<{ url: string; headers: Headers; sessionId: string; user: User | null; }>({
			port: this.Port,
			fetch: (req, server) => this.Upgrade(req, server),
			websocket: {
				open: (ws) => this.onConnection(ws),
				message: (ws, message) => this.onMessage(ws, message),
				close: (ws, code, reason) => this.HandleClose(ws, code, reason),
				// max is 10MB
				maxPayloadLength: 10 * 1_024 * 1_024,
			},
			hostname: 'localhost'
		});

		this.emit('listening', this.Port ?? 0);

		this.StartHeartbeatCheck();
		this.ClearUsers();
		this.ClearConnectedUsers();

		return this.MainSocket;
	}

	public HandleClose(ws: ServerWebSocket<{
		url: string;
		headers: Headers;
		sessionId: string;
		user: User | null;
	}>, code: number, reason: string) {
		if ([2, 3].includes(ws.readyState)) {
			this.Logger.debug(`Connection from ${ws.data.sessionId} has been closed`, code, reason);

			if (ws.data.user?.Closed || ws.data.user?.ClosedAt) {
				this.emit('close', ws.data.user, true);

				return; // We were expecting this
			} else {
				ws.data.user?.Close(code, 'Connection closed', true);

				this.emit('close', ws.data.user as User, false);
			}
		} else {
			ws.close(code, reason);
		}
	}

	private Upgrade(req: Request, server: Server): Response { // in case we want to do stuff with like headers
		server.upgrade<{ url: string; headers: Headers; sessionId: string; user: User | null; }>(req, {
			data: {
				url: req.url,
				headers: req.headers,
				sessionId: Utils.GenerateSessionId(),
				user: null,
			}
		});

		return new Response();
	}

	private onConnection(socket: ServerWebSocket<{ url: string; headers: Headers; sessionId: string; user: User | null; }>) {
		const ip = socket.remoteAddress as string;
		const ipConnections = Array.from(this.ConnectedUsers.values()).filter((usr) => usr.Ip === ip);
		const InvalidRequest = new WsError(OpCodes.Error);

		if (ipConnections.length >= this.MaxPerIp) {
			// (M) = IP (max connections reached)

			InvalidRequest.AddError({
				Connection: {
					Code: 'MaxConnections',
					Message: 'Max connections reached',
				}
			});

			socket.send(InvalidRequest.toString());
			socket.close(HardCloseCodes.AuthenticationFailed);

			this.Logger.debug(`Max connections reached for ${ip}`);

			return;
		}

		const lastMinuteConnections = ipConnections.filter((usr) => usr.ConnectedAt >= Date.now() - 60_000);

		if (lastMinuteConnections.length >= this.MaxConnectionsPerMinute) {
			// (MX) = IP (max connections reached)
			InvalidRequest.AddError({
				Connection: {
					Code: 'MaxConnections',
					Message: 'Max connections reached',
				}
			});

			socket.send(InvalidRequest.toString());
			socket.close(HardCloseCodes.AuthenticationFailed);

			this.Logger.debug(`Max connections reached for ${ip} in the last minute`);

			return;
		}

		this.Logger.debug(`New connection from ${ip}`);

		if (this.AllowedIps.length > 0 && !this.AllowedIps.includes(ip as string)) {
			// (P) = IP (not allowed)

			InvalidRequest.AddError({
				Connection: {
					Code: 'InvalidConnection',
					Message: 'Invalid connection',
				}
			});

			socket.send(InvalidRequest.toString());
			socket.close(HardCloseCodes.AuthenticationFailed);

			this.Logger.debug(`Connection from ${ip} was not allowed`);

			return;
		}

		const foundStuff = Utils.getStuff(socket.data.url as string);
		
		const userType = ['client', 'system', 'bot'].includes(foundStuff.type) ? `/${foundStuff.type}` : null;
		const params = foundStuff.query;

		if (!userType || !params) {
			// (T) = Type (not found)

			InvalidRequest.AddError({
				Connection: {
					Code: 'InvalidConnection',
					Message: 'Failed to detect type of connection',
				}
			});

			socket.send(InvalidRequest.toString());
			socket.close(HardCloseCodes.AuthenticationFailed);

			this.Logger.debug(`Was not client or bot from ${ip}`);

			return;
		}

		const user = new User(socket.data.sessionId, socket, false, ip);

		user.AuthType = (
			userType === '/bot' ? AuthCodes.Bot : userType === '/system' ? AuthCodes.System : AuthCodes.User
		);

		user.Params = params;

		const usersParams = user.Params as {
			encoding?: string; // encoding (should always be json for now)
			v?: string; // version
		};

		if (!usersParams.encoding || usersParams.encoding !== 'json') {
			// (EN) = Encoding (not json)

			InvalidRequest.AddError({
				Encoding: {
					Code: 'InvalidEncoding',
					Message: `The Encoding you provided was invalid, Accepted types are "json", received "${usersParams.encoding ?? 'none'}"`,
				}
			});

			socket.send(InvalidRequest.toString());
			socket.close(HardCloseCodes.InvalidRequest);
			user.Close(InvalidRequest.Op, 'Invalid request (EN)');

			this.Logger.debug(`Encoding was not json from ${ip}`);

			return;
		}

		if (!usersParams.v) {
			// (V) = Version (not found)

			InvalidRequest.AddError({
				Version: {
					Code: 'InvalidVersion',
					Message: 'The Version you provided was invalid',
				}
			});

			socket.send(InvalidRequest.toString());
			socket.close(HardCloseCodes.InvalidRequest);
			user.Close(InvalidRequest.Op, 'Invalid request (V)');

			this.Logger.debug(`Version was not found from ${ip}`);

			return;
		}

		user.Encoding = usersParams.encoding;
		user.SocketVersion = Number.parseInt(usersParams.v, 10);

		this.ConnectedUsers.set(user.Id, user);

		socket.data.user = user;

		this.emit('connection', user);
	}

	private onMessage(socket: ServerWebSocket<{ url: string; headers: Headers; sessionId: string; user: User | null; }>, message: string | Buffer) {
		try {
			const InvalidRequest = new WsError(OpCodes.Error);

			const json: {
				D?: any;
				Event?: string;
				Op?: number;
			} = JSON.parse(typeof message === 'string' ? message : "{}");

			if (!json.Event && !json.Op) {
				// (E/O) = Event or OP

				InvalidRequest.AddError({
					Op: {
						Code: 'InvalidOp',
						Message: 'The Op you provided was invalid',
					}
				});

				socket.send(InvalidRequest.toString());
				socket.data.user?.Close(HardCloseCodes.InvalidRequest, 'Invalid request (E/O)', this.CloseOnError);

				this.Logger.debug(`Event or OP was not found from ${socket.data.sessionId} (${socket.data.user?.Ip})`, json);

				return;
			}

			const foundEvent =
				Events.GetEventName(json.Event as string, socket.data.user?.SocketVersion as number) ??
				Events.GetEventCode(json.Op as number, socket.data.user?.SocketVersion as number);

			if (!foundEvent) {
				// (E) = Event (not found)
				socket.data.user?.Close(HardCloseCodes.UnknownOpcode, 'Invalid request (E)', this.CloseOnError);

				this.Logger.debug(
					`Event was not found from ${socket.data.sessionId} with the name ${json.Event ?? json.Op} (${socket.data.user?.Ip}) version: ${socket.data.user?.SocketVersion
					}`,
				);

				return;
			}

			if (foundEvent.AuthRequired && !this.ConnectedUsers.get(socket.data.sessionId)?.Authed) {
				// (A) = Auth (not authed)
				socket.data.user?.Close(HardCloseCodes.NotAuthenticated, 'Invalid request (A)', this.CloseOnError);

				this.Logger.debug(`Event ${foundEvent.Name} was not authed from ${socket.data.sessionId} (${socket.data.user?.Ip})`);

				return;
			}

			if (foundEvent.StrictCheck) {
				const validated = Utils.ValidateAuthCode(foundEvent.AllowedAuthTypes, socket.data.user?.AuthType ?? AuthCodes.User);

				if (!validated) {
					// (A) = Auth (not authed)
					socket.data.user?.Close(HardCloseCodes.NotAuthenticated, 'Invalid request (A)', this.CloseOnError);

					this.Logger.debug(`Event ${foundEvent.Name} was not authed from ${socket.data.sessionId} (${socket.data.user?.Ip})`);

					return;
				}
			}

			foundEvent.Execute(socket.data.user as User, json.D, this.ConnectedUsers);
		} catch (error: any) {
			this.Logger.debug(`Error while parsing JSON from ${socket.remoteAddress}: ${error?.message}`);

			this.emit('error', error, socket.data.user as User);

			try {
				// (J) = JSON (invalid)
				socket.data.user?.Close(HardCloseCodes.DecodeError, 'Invalid request (J)', this.CloseOnError);

				this.Logger.debug(`JSON was invalid from ${socket.data.sessionId} (${socket.data.user?.Ip})`);
			} catch {
				this.Logger.debug(`User ${socket.remoteAddress} has already been closed`);
			}
		}

	}

	public StartHeartbeatCheck() {
		setInterval(() => {
			for (const [id, user] of this.ConnectedUsers) {
				if (!user.Authed) continue;
				if (!user.HeartbeatInterval || !user.LastHeartbeat) continue;

				if (user.LastHeartbeat + user.HeartbeatInterval + 10_000 < Date.now()) {
					this.Logger.debug(
						`User ${id} has not sent a heartbeat in ${user.HeartbeatInterval + 10_000
						}ms, closing connection (We got ${this.ConnectedUsers.size} users left)`,
					);

					user.Close(SoftCloseCodes.MissedHeartbeat, 'Missed Heartbeat', false);
				} else {
					this.Logger.debug(
						`User ${id} sent a heartbeat at ${new Date(user.LastHeartbeat).toLocaleString()}, which is ${Date.now() - user.LastHeartbeat
						}ms ago`,
					);
				}
			}
		}, this.HeartbeatInterval);
	}

	public ClearUsers() {
		setInterval(() => {
			for (const [id, user] of this.ConnectedUsers) {
				if (!user.Closed) continue;

				// if they closed more then 8 seconds ago, remove them
				if ((user.ClosedAt as number) + 8_000 < Date.now()) {
					this.ConnectedUsers.delete(id);
					this.Logger.debug(`User ${id} has been removed for being closed (We got ${this.ConnectedUsers.size} users left)`);
				} else {
					this.Logger.debug(`User ${id} has been closed for ${Date.now() - (user.ClosedAt as number)}ms`);
				}
			}
		}, this.ClosedInterval);
	}

	public ClearConnectedUsers() {
		setInterval(() => {
			for (const [id, user] of this.ConnectedUsers) {
				if (user.Authed) continue;

				// if its been more then 45 seconds since they connected, remove them
				if ((user.ConnectedAt as number) + 45_000 < Date.now()) {
					this.ConnectedUsers.delete(id);
					user.Close(HardCloseCodes.NotAuthenticated, 'Not Authenticated', false);

					this.Logger.debug(
						`User ${id} has been removed for being connected and not authed (We got ${this.ConnectedUsers.size} users left)`,
					);
				} else {
					this.Logger.debug(`User ${id} has been connected for ${Date.now() - (user.ConnectedAt as number)}ms`);
				}
			}
		}, this.UnauthedTimeout);
	}

	public MassSend(data: any) {
		for (const [, user] of this.ConnectedUsers) {
			user.Send(data);
		}
	}

	public MasDisconnect(reason: string, code?: number) {
		for (const [, user] of this.ConnectedUsers) {
			user.Close(code ? code : HardCloseCodes.ServerShutdown, reason, false);
		}
	}

	public ConnectionsByIP(ip: string) {
		let connections = 0;

		for (const [, user] of this.ConnectedUsers) {
			if (user.Ip === ip) connections++;
		}

		return connections;
	}
}

export default WebsocketServer;
