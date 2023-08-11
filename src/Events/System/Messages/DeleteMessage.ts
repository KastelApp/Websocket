import type { User } from '@kastelll/core';
import { Events, AuthCodes } from '@kastelll/core';
import type Websocket from '../../../Utils/Classes/Websocket.js';
import { SystemOpCodes, OpCodes } from '../../../Utils/Classes/WsUtils.js';

// This is Sent from the API to the System, then System sends it to the Client
export default class DeleteMessage extends Events {
	public Websocket: Websocket;

	public constructor(wss: Websocket) {
		super();

		this.Websocket = wss;

		this.AuthRequired = true;

		this.Name = 'DeleteMessage';

		this.Op = OpCodes.MessageDelete;

		this.StrictCheck = true;

		this.Version = 0;

		this.AllowedAuthTypes = AuthCodes.System;
	}

	public override async Execute(
		user: User,
		data: {
			Message: {
				AuthorId: string;
				ChannelId: string;
				Id: string;
				Timestamp: number;
			};
		},
	) {
		for (const Client of WSS.connectedUsers.values()) {
			if (Client.AuthType !== AuthCodes.User) continue;

			if (Client.UserData?.AllowedChannels?.includes(data.Message.ChannelId)) {
				Client.send({
					op: OpCodes.MessageDelete,
					event: 'MessageDelete',
					d: data.Message,
				});
			}
		}

		user.Send({
			op: SystemOpCodes.DeleteMessageAck,
		});
	}
}
