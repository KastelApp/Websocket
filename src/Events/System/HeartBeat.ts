import Events from '../../Utils/Classes/Events.js';
import { OpCodes } from '../../Utils/Classes/OpCodes.js';
import type User from '../../Utils/Classes/User';
import { AuthCodes, HardCloseCodes } from '../../Utils/Classes/Utils.js';
import type Websocket from '../../Utils/Classes/Websocket';

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

			user.Close(HardCloseCodes.InvalidSeq, 'Invalid sequence');

			return;
		}

		user.LastHeartbeat = Date.now();

		user.Send(
			{
				Op: OpCodes.HeartBeatAck,
			},
			false,
		);
	}
}
