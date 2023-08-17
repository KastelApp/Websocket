import Events from '../../../Utils/Classes/Events.js';
import { SystemOpCodes, OpCodes } from '../../../Utils/Classes/OpCodes.js';
import type User from '../../../Utils/Classes/User.js';
import { AuthCodes } from '../../../Utils/Classes/Utils.js';
import type Websocket from '../../../Utils/Classes/Websocket.js';

// This is Sent from the API to the System, then System sends it to the Client
export default class NewMessage extends Events {
	public Websocket: Websocket;

	public constructor(wss: Websocket) {
		super();

		this.Websocket = wss;

		this.AuthRequired = true;

		this.Name = 'NewMessage';

		this.Op = OpCodes.MessageCreate;

		this.StrictCheck = true;

		this.Version = 0;

		this.AllowedAuthTypes = AuthCodes.System;
	}

	public override async Execute(
		user: User,
		data: {
			Message: {
				AllowedMentions: number;
				Author: {
					Avatar: string;
					Discriminator: string;
					Id: string;
					PublicFlags: number;
					Username: string;
				};
				AuthorId: string;
				ChannelId: string;
				Content: string;
				Flags: number;
				Id: string;
				Nonce: string;
				System: boolean;
				Timestamp: number;
			};
		},
	) {

	}
}
