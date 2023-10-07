import Events from '../../../Utils/Classes/Events.ts';
import { SystemOpCodes, OpCodes } from '../../../Utils/Classes/OpCodes.ts';
import type User from '../../../Utils/Classes/User.ts';
import { AuthCodes } from '../../../Utils/Classes/Utils.ts';
import type Websocket from '../../../Utils/Classes/Websocket.ts';

interface UserData {
	Avatar: string;
	Bot: boolean;
	Bots: string[];
	Dms: string[];
	Email: string;
	Flags: string;
	GlobalNickname: string;
	Guilds: string[];
	Id: string;
	Ips: string[];
	Password: string;
	PhoneNumber: string;
	Tag: string;
	TwoFaSecret: string;
	Username: string;
}

// This is Sent from the API to the System, then System sends it to the Client
export default class RelationshipUpdate extends Events {
	public Websocket: Websocket;

	public constructor(wss: Websocket) {
		super();

		this.Websocket = wss;

		this.AuthRequired = true;

		this.Name = 'RelationshipUpdate';

		this.Op = OpCodes.RelationshipUpdate;

		this.StrictCheck = true;

		this.Version = 0;

		this.AllowedAuthTypes = AuthCodes.System;
	}

	public override async Execute(
		user: User,
		data: {
			Causer: UserData;
			To: {
				Flags: number;
				User: {
					Avatar: string;
					GlobalNickname: string;
					Id: string;
					PublicFlags: number;
					Tag: string;
					Username: string;
				};
			};
		},
	) {
		this.Websocket.Logger.debug('yummy data', data);

		user.Send({
			op: SystemOpCodes.RelationshipUpdateAck,
		});
	}
}
