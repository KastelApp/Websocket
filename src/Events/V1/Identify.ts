import { inspect } from 'node:util';
import Events from '../../Utils/Classes/Events.js';
import { OpCodes } from '../../Utils/Classes/OpCodes.js';
import type User from '../../Utils/Classes/User.js';
import type Websocket from '../../Utils/Classes/Websocket.js';

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
		User: User,
		Data: {
			Settings: {
				// idk what else currently
				Compress: boolean; // Whether the client supports compression
				Intents?: number; // The intents the client has (WIP) (Bot Only)
			};
			Token: string;
		},
	) {
		console.log(Data);
	}
}
