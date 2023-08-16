import Events from '../../../Utils/Classes/Events.js';
import { SystemOpCodes, OpCodes } from '../../../Utils/Classes/OpCodes.js';
import type User from '../../../Utils/Classes/User.js';
import { AuthCodes } from '../../../Utils/Classes/Utils.js';
import type Websocket from '../../../Utils/Classes/Websocket.js';

// This is Sent from the API to the System, then System sends it to the Client
export default class UpdateMessages extends Events {
	public Websocket: Websocket;

	public constructor(wss: Websocket) {
		super();

		this.Websocket = wss;

		this.AuthRequired = true;

		this.Name = 'UpdateMessages';

		this.Op = OpCodes.MessageUpdate;

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
					Id: string;
					JoinedAt: number;
					Nickname: string;
					Roles: string[];
					User: {
						AvatarHash: string;
						Id: string;
						PublicFlags: number;
						Tag: string;
						Username: string;
					};
				};
				ChannelId: string;
				Content: string;
				CreatedAt: number;
				Flags: number;
				Id: string;
				UpdatedAt: number;
			};
		},
	) {
	}
}
