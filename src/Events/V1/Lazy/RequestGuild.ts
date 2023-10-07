import Events from '../../../Utils/Classes/Events.ts';
import { OpCodes } from '../../../Utils/Classes/OpCodes.ts';
import type User from '../../../Utils/Classes/User.ts';
import type Websocket from '../../../Utils/Classes/Websocket.ts';

export default class RequestGuild extends Events {
	public Websocket: Websocket;

	public constructor(wss: Websocket) {
		super();

		this.Websocket = wss;

		this.AuthRequired = true;

		this.Name = 'RequestGuild';

		this.Op = OpCodes.LazyRequestGuild;

		this.StrictCheck = false;

		this.Version = 1;
	}

	public override async Execute(user: User, data: {}) {}
}
