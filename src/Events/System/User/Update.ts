import Events from '../../../Utils/Classes/Events.js';
import { SystemOpCodes, OpCodes } from '../../../Utils/Classes/OpCodes.js';
import type User from '../../../Utils/Classes/User.js';
import { AuthCodes } from '../../../Utils/Classes/Utils.js';
import type Websocket from '../../../Utils/Classes/Websocket.js';

// This is Sent from the API to the System, then System sends it to the Client
export default class SelfUpdate extends Events {
	public Websocket: Websocket;

	public constructor(wss: Websocket) {
		super();

		this.Websocket = wss;

		this.AuthRequired = true;

		this.Name = 'SelfUpdate';

		this.Op = OpCodes.SelfUpdate;

		this.StrictCheck = true;

		this.Version = 0;

		this.AllowedAuthTypes = AuthCodes.System;
	}

	public override async Execute(
		user: User,
		data: {
			Avatar: string;
			Bio?: string;
			Email: string;
			EmailVerified: boolean;
			GlobalNickname: string;
			Id: string;
			PhoneNumber: null;
			PublicFlags: number;
			Tag: string;
			TwoFaEnabled: boolean;
			TwoFaVerified: boolean;
			Username: string;
		},
	) {
		this.Websocket.Logger.debug('yummy data', data);

		user.Send({
			op: SystemOpCodes.SelfUpdateAck,
		});
	}
}
