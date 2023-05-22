import type { User } from '@kastelll/core';
import { Events, AuthCodes } from '@kastelll/core';
import { SystemOpCodes, OpCodes } from '../../../Utils/Classes/WsUtils.js';
import type Websocket from '../../../Websocket.js';

// This is Sent from the API to the System, then System sends it to the Client
export class DeleteChannel extends Events {
	public Websocket: Websocket;

	public constructor(wss: Websocket) {
		super();

		this.Websocket = wss;

		this.AuthRequired = true;

		this.Name = 'DeleteChannel';

		this.Op = OpCodes.ChannelDelete;

		this.StrictCheck = true;

		this.Version = 0;

		this.AllowedAuthTypes = AuthCodes.System;
	}

	public override async Execute(user: User, data: {}) {
		user.send({
			op: SystemOpCodes.DeleteChannelAck,
		});
	}
}
