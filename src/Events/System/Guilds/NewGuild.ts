/*
 *   Copyright (c) 2023 
 *   All rights reserved.
 */
import { types } from '@kastelll/cassandra-driver';
import Events from '../../../Utils/Classes/Events.ts';
import { SystemOpCodes, OpCodes } from '../../../Utils/Classes/OpCodes.ts';
import type User from '../../../Utils/Classes/User.ts';
import { AuthCodes } from '../../../Utils/Classes/Utils.ts';
import type Websocket from '../../../Utils/Classes/Websocket.ts';
import Encryption from '../../../Utils/Classes/Encryption.ts';

// This is Sent from the API to the System, then System sends it to the Client
export default class NewGuild extends Events {
	public Websocket: Websocket;

	public constructor(wss: Websocket) {
		super();

		this.Websocket = wss;

		this.AuthRequired = true;

		this.Name = 'NewGuild';

		this.Op = OpCodes.GuildNew;

		this.StrictCheck = true;

		this.Version = 0;

		this.AllowedAuthTypes = AuthCodes.System;
	}

	public override async Execute(user: User, data: {
		Channels: Record<string, string[] | boolean | number | string | null>[];
		CoOwners: never[];
		Description: string | null;
		Features: string[];
		Flags: number;
		Icon: string | null;
		Id: string;
		MaxMembers: number;
		Name: string;
		OwnerId: string;
		Roles: Record<string, types.Long | boolean | number | string>[];
	}) {
		const Decrypted = Encryption.CompleteDecryption(data);
		
		this.Websocket.wss.MainSocket?.publish(`User:${Decrypted.OwnerId}`, JSON.stringify({
			Op: OpCodes.GuildNew,
			Event: this.Name,
			D: Decrypted,
		}))

		user.Send({
			op: SystemOpCodes.NewGuildAck,
		});
	}
}
