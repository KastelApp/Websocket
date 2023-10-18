import Encryption from '../../../Utils/Classes/Encryption.ts';
import Events from '../../../Utils/Classes/Events.ts';
import { SystemOpCodes, OpCodes } from '../../../Utils/Classes/OpCodes.ts';
import type User from '../../../Utils/Classes/User.ts';
import { AuthCodes } from '../../../Utils/Classes/Utils.ts';
import type Websocket from '../../../Utils/Classes/Websocket.ts';
import type { PermissionOverride } from '../../../Utils/Cql/Types/index.ts';

// This is Sent from the API to the System, then System sends it to the Client
export default class UpdateChannel extends Events {
	public Websocket: Websocket;

	public constructor(wss: Websocket) {
		super();

		this.Websocket = wss;

		this.AuthRequired = true;

		this.Name = 'UpdateChannel';

		this.Op = OpCodes.ChannelUpdate;

		this.StrictCheck = true;

		this.Version = 0;

		this.AllowedAuthTypes = AuthCodes.System;
	}

	public override async Execute(
		user: User,
		data: {
			AllowedMentions: number;
			ChannelId: string;
			Children: string[];
			Description: string;
			GuildId: string;
			Name: string;
			Nsfw: boolean;
			ParentId: string;
			PermissionsOverrides: PermissionOverride[];
			Position: number;
			Slowmode: number;
			Type: number;
		},
	) {
		const Decrypted = Encryption.CompleteDecryption(data);

		const Data: {
			AllowedMentions: number;
			ChannelId?: string;
			Children: string[];
			Description: string;
			GuildId: string;
			Id?: string | undefined;
			Name: string;
			Nsfw: boolean;
			ParentId: string;
			PermissionsOverrides: PermissionOverride[];
			Position: number;
			Slowmode: number;
			Type: number;
		} = Decrypted;

		Data.Id = Data.ChannelId;

		delete Data.ChannelId;

		this.Websocket.wss.MainSocket?.publish(
			`Guild:${Decrypted.GuildId}`,
			JSON.stringify({
				Op: OpCodes.ChannelUpdate,
				Event: this.Name,
				D: Data,
			}),
		);

		user.Send({
			op: SystemOpCodes.UpdateChannelAck,
		});
	}
}
