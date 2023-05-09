import type { User } from '@kastelll/core';
import { Events, AuthCodes } from '@kastelll/core';
import { SystemOpCodes, OpCodes } from '../../../Utils/Classes/WsUtils.js';
// import WSS from '../../../index';

// This is Sent from the API to the System, then System sends it to the Client
export class UpdateChannel extends Events {
	public constructor() {
		super();

		this.AuthRequired = true;

		this.Name = 'UpdateChannel';

		this.Op = OpCodes.ChannelUpdate;

		this.StrictCheck = true;

		this.Version = 0;

		this.AllowedAuthTypes = AuthCodes.System;
	}

	public override async Execute(user: User, data: {}) {
		user.send({
			op: SystemOpCodes.UpdateChannelAck,
		});
	}
}
