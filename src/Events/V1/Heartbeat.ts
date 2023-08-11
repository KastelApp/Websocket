import type { User } from '@kastelll/core';
import { Events, HardCloseCodes } from '@kastelll/core';
import type Websocket from '../../Utils/Classes/Websocket.js';
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

		this.Version = 1;
	}

	public override async Execute(
		user: User,
		data: {
			sequence: number;
		},
	) {
		if (user.Seq !== data.sequence) {
			this.Websocket.Logger.debug(`Expected ${user.Seq} but got ${data.sequence}`);

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
