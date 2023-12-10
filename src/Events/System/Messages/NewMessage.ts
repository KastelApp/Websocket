import Encryption from '../../../Utils/Classes/Encryption.ts';
import Events from '../../../Utils/Classes/Events.ts';
import { SystemOpCodes, OpCodes } from '../../../Utils/Classes/OpCodes.ts';
import type User from '../../../Utils/Classes/User.ts';
import { AuthCodes } from '../../../Utils/Classes/Utils.ts';
import type Websocket from '../../../Utils/Classes/Websocket.ts';
import type { MainObject } from '../../../Utils/Cql/Types/Message.ts';

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
			ChannelId: string;
			Msg: {
				AllowedMentions: number;
				Attachments: string[];
				Author: {
					Avatar: string;
					Bot: boolean;
					Flags: string;
					Id: string;
					JoinedAt: Date;
					PublicFlags: string;
					Roles: string[];
					Tag: string;
					Username: string;
				};
				Content: string;
				Embeds: MainObject[];
				Flags: number;
				Id: string;
				Mentions: {
					Channels: string[];
					Roles: string[];
					Users: string[];
				};
				Nonce: string;
				ReplyingTo: string;
	
			}
		},
	) {
		console.log(data.ChannelId)
		this.Websocket.wss.MainSocket?.publish(
			`Channel:${data.ChannelId}`,
			JSON.stringify({
				Op: OpCodes.MessageCreate,
				Event: this.Name,
				D: Encryption.CompleteDecryption(data.Msg),
			})
		)
		
		user.Send({
			op: SystemOpCodes.MessageCreateAck,
		});
	}
}
