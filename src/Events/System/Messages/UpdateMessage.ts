import type { User } from '@kastelll/core';
import { Events, AuthCodes } from '@kastelll/core';
import { SystemOpCodes, OpCodes } from '../../../Utils/Classes/WsUtils.js';
import WSS from '../../../index.js';

// This is Sent from the API to the System, then System sends it to the Client
export class UpdateMessages extends Events {
	public constructor() {
		super();

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
		for (const Client of WSS.connectedUsers.values()) {
			if (Client.AuthType !== AuthCodes.User) continue;

			if (Client.UserData?.AllowedChannels?.includes(data.Message.ChannelId)) {
				Client.send({
					op: OpCodes.MessageUpdate,
					event: 'MessageUpdate',
					d: data.Message,
				});
			}
		}

		user.send({
			op: SystemOpCodes.UpdateMessageAck,
		});
	}
}
