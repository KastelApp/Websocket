import WsError from '../../Utils/Classes/Errors.ts';
import Events from '../../Utils/Classes/Events.ts';
import { OpCodes } from '../../Utils/Classes/OpCodes.ts';
import type User from '../../Utils/Classes/User.ts';
import { HardCloseCodes } from '../../Utils/Classes/Utils.ts';
import type Websocket from '../../Utils/Classes/Websocket.ts';

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
			Sequence: number;
		},
	) {
		if (user.Seq !== data.Sequence) {
			this.Websocket.Logger.debug(`Expected ${user.Seq} but got ${data.Sequence}`);

			const FailedToHeartBeat = new WsError(OpCodes.Error);

			FailedToHeartBeat.AddError({
				Sequence: {
					Code: 'InvalidSequence',
					Message: 'The sequence you provided was invalid.',
				},
			});

			user.Send(FailedToHeartBeat, false);
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
