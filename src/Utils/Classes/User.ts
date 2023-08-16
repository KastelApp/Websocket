import type { Buffer } from 'node:buffer';
import { deprecate } from 'node:util';
import { deflateSync } from 'node:zlib';
import type WebSocket from 'ws';
import Errors from './Errors.js';
import { HardCloseCodes } from './Utils.js';

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

	public Ws: WebSocket.WebSocket;

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

	private ResumeDepWarning: boolean = false;

	public constructor(id: string, ws: WebSocket.WebSocket, authed: boolean, ip: string) {
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

	public Close(code: number, reason: string, force: boolean, soft?: boolean) {
		try {
			if (this.Closed) {
				return; // Its already closed, why are you trying to close it again?
			}

			if (soft) {
				// soft is when the user is closing the connection
				this.Closed = true;
				this.ClosedAt = Date.now();
				this.ClosedCode = code;

				return;
			}

			if (force) {
				this.Ws.close(code, reason);
			} else {
				this.Ws.send(new Errors(reason).toString());

				this.Ws.close(code, reason);
			}

			this.Closed = true;
			this.ClosedAt = Date.now();
			this.ClosedCode = code;
		} catch (error) {
			console.error(error);

			this.Ws.terminate();
		}
	}

	/**
	 * @deprecated Just do `this.Authed = true` or `this.Authed = false` Will be removed in 0.4.0
	 * @param authed - Whether the user is authenticated or not
	 */
	public setAuthed(authed: boolean) {
		this.Authed = authed;
	}

	/**
	 * @deprecated Just do `this.Closed = true` or `this.Closed = false` Will be removed in 0.4.0
	 * @param closed - Whether the user is closed or not
	 */
	public setClosed(closed: boolean) {
		this.Closed = closed;
	}

	/**
	 * @deprecated Just do `this.Id = sessionId` Will be removed in 0.4.0
	 * @param sessionId - The session id of the user
	 */
	public setSessionId(sessionId: string) {
		this.Id = sessionId;
	}

	/**
	 * @deprecated Just do `this.Ws = ws` Will be removed in 0.4.0
	 * @param ws - The websocket of the user
	 */
	public setWs(ws: WebSocket.WebSocket) {
		this.Ws = ws;
	}

	/**
	 * @deprecated Just do `this.HeartbeatInterval = interval` Will be removed in 0.4.0
	 * @param interval - The interval of the heartbeat
	 */
	public setHeartbeatInterval(interval: number) {
		this.HeartbeatInterval = interval;
	}

	/**
	 * @deprecated Just do `this.LastHeartbeat = lastHeartbeat` Will be removed in 0.4.0
	 * @param lastHeartbeat - The last heartbeat of the user
	 */
	public setLastHeartbeat(lastHeartbeat: number) {
		this.LastHeartbeat = lastHeartbeat;
	}

	/**
	 * @deprecated Just do `this.AuthType = auth` Will be removed in 0.4.0
	 * @param auth - The auth type of the user
	 */
	public setAuth(auth: number) {
		this.AuthType = auth;
	}

	/**
	 * @deprecated Just do `this.Encoding = encoding` Will be removed in 0.4.0
	 * @param encoding - The encoding of the user
	 */
	public setEncoding(encoding: 'json') {
		this.Encoding = encoding;
	}

	/**
	 * @deprecated Just do `this.Compression = compression` Will be removed in 0.4.0
	 * @param compression - Whether the payloads are compressed or not
	 */
	public setCompression(compression: boolean) {
		this.Compression = compression;
	}

	/**
	 * @deprecated Just do `this.Params = params` Will be removed in 0.4.0
	 * @param params - The params of the user
	 */
	public setParams(params: { [key: string]: string | undefined; }) {
		this.Params = params;
	}

	/**
	 * @deprecated Just do `this.SocketVersion = Number.parseInt(version, 10)` Will be removed in 0.4.0
	 * @param version - The version of the socket
	 */
	public setVersion(version: string) {
		this.SocketVersion = Number.parseInt(version, 10);
	}

	/**
	 * @deprecated Use {@link User#Resume} instead. Will be removed in 0.4.0
	 * @param seq - The sequence number to resume with
	 * @returns Whether the resume was successful or not
	 */
	public resume(seq: number): boolean {
		if (!this.ResumeDepWarning) {
			deprecate(() => {
				this.ResumeDepWarning = true;
			}, 'Use User#Resume instead, User#resume will be removed in 0.4.0');
		}

		return this.Resume(seq);
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
