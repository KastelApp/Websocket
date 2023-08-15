import { inspect } from 'node:util';
import type { User } from '@kastelll/core';
import { Events, HardCloseCodes, WsUtils } from '@kastelll/core';
import type Websocket from '../../Utils/Classes/Websocket.js';
import { OpCodes } from '../../Utils/Classes/WsUtils.js';

export default class Identify extends Events {
	public Websocket: Websocket;

	public constructor(wss: Websocket) {
		super();

		this.Websocket = wss;

		this.AuthRequired = false;

		this.Name = 'Identify';

		this.Op = OpCodes.Auth;

		this.StrictCheck = false;

		this.Version = 1;
	}

	public override async Execute(
		user: User,
		data: {
			settings: {
				// idk what else currently
				compress: boolean; // Whether the client supports compression
				intents?: number; // The intents the client has (WIP)
			};
			token: string;
		},
	) {}
}
