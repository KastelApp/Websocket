import Events from '../../../Utils/Classes/Events.ts';
import { OpCodes } from '../../../Utils/Classes/OpCodes.ts';
import type User from '../../../Utils/Classes/User.ts';
import type Websocket from '../../../Utils/Classes/Websocket.ts';

export default class RequestMembers extends Events {
	public Websocket: Websocket;

	public constructor(wss: Websocket) {
		super();

		this.Websocket = wss;

		this.AuthRequired = true;

		this.Name = 'RequestMembers';

		this.Op = OpCodes.LazyRequestMembers;

		this.StrictCheck = false;

		this.Version = 1;
	}

	public override async Execute(user: User, data: {}) {}
}
