import type { User } from '@kastelll/core';
import { Events, AuthCodes } from '@kastelll/core';
import type Websocket from '../../../Utils/Classes/Websocket.js';
import { SystemOpCodes, OpCodes } from '../../../Utils/Classes/WsUtils.js';

// This is Sent from the API to the System, then System sends it to the Client
export default class MemberLeave extends Events {
	public Websocket: Websocket;

	public constructor(wss: Websocket) {
		super();

		this.Websocket = wss;

		this.AuthRequired = true;

		this.Name = 'MemberLeave';

		this.Op = OpCodes.MemberLeave;

		this.StrictCheck = true;

		this.Version = 0;

		this.AllowedAuthTypes = AuthCodes.System;
	}

	public override async Execute(user: User, data: {}) {
		user.Send({
			op: SystemOpCodes.MemberLeaveAck,
		});
	}
}
