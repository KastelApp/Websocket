import type { User } from '@kastelll/core';
import { Events, AuthCodes } from '@kastelll/core';
import { SystemOpCodes, OpCodes } from '../../../Utils/Classes/WsUtils.js';
import WSS from '../../../index.js';

// This is Sent from the API to the System, then System sends it to the Client
export class NewMessage extends Events {
	public constructor() {
		super();

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
		for (const Client of WSS.connectedUsers.values()) {
			if (Client.AuthType !== AuthCodes.User) continue;

			if (Client.UserData?.AllowedChannels?.includes(data.Message.ChannelId)) {
				Client.send({
					op: OpCodes.MessageCreate,
					event: 'MessageCreate',
					d: data.Message,
				});
			}
		}

		user.send({
			op: SystemOpCodes.MessageCreateAck,
		});
	}
}
