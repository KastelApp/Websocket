import type { Buffer } from 'node:buffer';
import { deflateSync } from 'node:zlib';
import { Flags } from '../../Constants.ts';
import type { WsUser } from '../../Types/index.ts';
import FlagUtilsBInt from './Flags.ts';
import { HardCloseCodes } from './Utils.ts';
import { ServerWebSocket } from 'bun';

interface EventQueue {
	E: {
		D: any;
		Event?: string;
		Op: number;
	};
	Seq: boolean;
}

class User {
	public Id: string;

	public Ws: ServerWebSocket<{
		url: string;
		headers: Headers;
		sessionId: string;
		user: User | null;
	}>;

	public Authed: boolean;

	public Seq: number;

	public ConnectedAt: number;

	public LastHeartbeat: number | null;

	public HeartbeatInterval: number | null;

	public Closed: boolean;

	public ClosedAt: number | null;

	public ClosedCode: number;

	public EventQueue: EventQueue[];

	public Encoding: 'json'; // encoding is always json (This is here for future use)

	public Compression: boolean; // compression is possible when encoding is json (because its zlib idk)

	public AuthType: number | null;

	public Params: {
		[key: string]: string | undefined;
	};

	public SocketVersion: number | null;

	public Ip: string;

	public WsUser: WsUser;

	public constructor(id: string, ws: ServerWebSocket<{
		url: string;
		headers: Headers;
		sessionId: string;
		user: User | null;
	}>, authed: boolean, ip: string) {
		this.Id = id;

		this.Ws = ws;

		this.Authed = authed;

		this.Ip = ip;

		this.AuthType = null;

		this.Seq = 0;

		this.Encoding = 'json';

		this.Compression = false;

		this.SocketVersion = null;

		this.ConnectedAt = Date.now();

		this.LastHeartbeat = null;

		this.HeartbeatInterval = null;

		this.Closed = false;

		this.ClosedAt = null;

		this.ClosedCode = -1;

		this.EventQueue = [];

		this.Params = {};

		this.WsUser = {
			Bot: false,
			Email: '',
			Token: '',
			Password: '',
			Id: '',
			FlagsUtil: new FlagUtilsBInt<typeof Flags>(0n, Flags),
			Channels: {},
			Guilds: []
		};
	}

	public Compress(data: any): Buffer | string {
		let changedData = data;

		if (typeof changedData !== 'string') {
			changedData = JSON.stringify(data);
		}

		if (typeof changedData !== 'string') {
			throw new TypeError('Invalid data (not a string even after conversion)');
		}

		if (!this.Compression) {
			return changedData; // just to make my life easier
		}

		return deflateSync(changedData);
	}

	public Send(data: any, seq = true) {
		// if seq is true, it will add a sequence number to the data else it will not
		if (this.Closed) {
			if (Date.now() - (this.ClosedAt as number) <= 60_000) {
				this.EventQueue.push({
					Seq: seq,
					// eslint-disable-next-line id-length
					E: data,
				});
			}

			return;
		}

		if (seq) {
			this.Seq++;
		}

		const changedData = this.Compress({
			...data,
			// eslint-disable-next-line id-length
			...(seq ? { S: this.Seq } : {}),
		});

		this.Ws.send(changedData);
	}

	public Close(code: number, reason: string, soft?: boolean) {
		try {
			if (this.Closed) {
				return; // Its already closed, why are you trying to close it again?
			}

			if (soft) { // soft is when the connection is already terminated
				this.Closed = true;
				this.ClosedAt = Date.now();
				this.ClosedCode = code;

				return;
			}

			this.Ws.close(code, reason);

			this.Closed = true;
			this.ClosedAt = Date.now();
			this.ClosedCode = code;
		} catch (error) {
			console.error(error);

			this.Ws.terminate();
		}
	}

	public Resume(seq: number): boolean {
		if (!this.Closed || !this.ClosedAt) {
			return false; // how can you resume if you never closed?
		}

		if (this.Seq !== seq) {
			return false;
		}

		// if this.closedAt has been longer then 60 seconds, return false (session expired)
		if (Date.now() - this.ClosedAt > 60_000) {
			return false;
		}

		if (Object.values(HardCloseCodes).includes(this.ClosedCode)) {
			return false;
		}

		this.Closed = false;
		this.ClosedAt = null;

		return true;
	}

	public NextQueue(): EventQueue | null {
		if (this.EventQueue.length === 0) {
			return null;
		}

		const event = this.EventQueue.shift();

		if (!event) {
			return null;
		}

		this.Send(event.E, event.Seq);

		return event;
	}

	public Queue() {
		// loop through the queue and call nextQueue after sending the first event
		const firstEvent = this.EventQueue[0];

		if (!firstEvent) {
			return;
		}

		this.Send(firstEvent.E, firstEvent.Seq);

		while (this.NextQueue()) {
			// do nothing
		}
	}
}

export default User;

export { User };
