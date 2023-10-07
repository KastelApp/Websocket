import WsError from '../../Utils/Classes/Errors.ts';
import Events from '../../Utils/Classes/Events.ts';
import { OpCodes } from '../../Utils/Classes/OpCodes.ts';
import type User from '../../Utils/Classes/User.ts';
import { HardCloseCodes } from '../../Utils/Classes/Utils.ts';
import type Websocket from '../../Utils/Classes/Websocket.ts';

export default class Resume extends Events {
	public Websocket: Websocket;

	public constructor(wss: Websocket) {
		super();

		this.Websocket = wss;

		this.AuthRequired = false;

		this.Name = 'Resume';

		this.Op = OpCodes.Resume;

		this.StrictCheck = false;

		this.Version = 1;
	}

	public override async Execute(
		User: User,
		Data: {
			Sequence: number;
			SessionId: string;
		},
		Users: Map<string, User>
	) {
		const FailedToResume = new WsError(OpCodes.Error);

		const FoundUser = Users.get(Data.SessionId);

		if (!FoundUser?.Authed || User.Authed) { // no need to resume if you aren't even authed
			FailedToResume.AddError({
				SessionId: {
					Code: 'InvalidSessionId',
					Message: 'The session id you provided was invalid.',
				}
			});

			User.Send(FailedToResume, false);
			User.Close(HardCloseCodes.InvalidRequest, 'Invalid session id');

			return;
		}

		if (FoundUser.Seq !== Data.Sequence) {
			FailedToResume.AddError({
				Sequence: {
					Code: 'InvalidSequence',
					Message: 'The sequence you provided was invalid.',
				}
			});

			User.Send(FailedToResume, false);
			User.Close(HardCloseCodes.InvalidSeq, 'Invalid sequence');

			return;
		}

		Users.delete(User.Id);
		Users.delete(FoundUser.Id);

		FoundUser.Id = User.Id;
		FoundUser.LastHeartbeat = Date.now();
		FoundUser.Ws = User.Ws;

		Users.set(FoundUser.Id, FoundUser);

		FoundUser.Send({
			Op: OpCodes.Authed,
			Data: {
				HeartbeatInterval: FoundUser.HeartbeatInterval
			}
		}, false);

		FoundUser.Queue();
	}
}
