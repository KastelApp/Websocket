import type { User } from '@kastelll/core';
import { Events, AuthCodes, HardCloseCodes } from '@kastelll/core';
import type Websocket from '../../Utils/Classes/Websocket';
import { OpCodes } from '../../Utils/Classes/WsUtils.js';

export default class HeartBeat extends Events {
	public Websocket: Websocket;

	public constructor(wss: Websocket) {
		super();

		this.Websocket = wss;

		this.AuthRequired = true;

		this.Name = 'HeartBeat';

		this.Op = OpCodes.HeartBeat;

		this.StrictCheck = false;

		this.StrictCheck = true;

		this.Version = 0;

		this.AllowedAuthTypes = AuthCodes.System;
	}

	public override async Execute(
		user: User,
		data: {
			Sequence: number;
		},
	) {
		if (user.Seq !== data.Sequence) {
			this.Websocket.Logger.debug(`Expected ${user.Seq} but got ${data.Sequence}`);

			user.Close(HardCloseCodes.InvalidSeq, 'Invalid sequence', false);

			return;
		}

		user.setLastHeartbeat(Date.now());

		user.Send(
			{
				op: OpCodes.HeartBeatAck,
			},
			false,
		);
	}
}
