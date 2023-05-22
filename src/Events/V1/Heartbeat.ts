import type { User } from '@kastelll/core';
import { Events, HardCloseCodes } from '@kastelll/core';
import { OpCodes } from '../../Utils/Classes/WsUtils.js';
import type Websocket from '../../Websocket.js';

export class HeartBeat extends Events {
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
			Sequence: number;
		},
	) {
		if (user.Seq !== data.Sequence) {
			console.log(`Expected ${user.Seq} but got ${data.Sequence}`);

			user.close(HardCloseCodes.InvalidSeq, 'Invalid sequence', false);

			return;
		}

		user.setLastHeartbeat(Date.now());

		user.send(
			{
				op: OpCodes.HeartBeatAck,
			},
			false,
		);
	}
}
