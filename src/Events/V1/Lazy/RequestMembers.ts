import Events from '../../../Utils/Classes/Events.js';
import { OpCodes } from '../../../Utils/Classes/OpCodes.js';
import type User from '../../../Utils/Classes/User.js';
import type Websocket from '../../../Utils/Classes/Websocket.js';

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

	public override async Execute(user: User, data: {}) { }
}
