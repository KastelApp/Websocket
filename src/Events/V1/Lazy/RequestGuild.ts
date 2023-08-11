import type { User } from '@kastelll/core';
import { Events, HardCloseCodes } from '@kastelll/core';
import type Websocket from '../../../Utils/Classes/Websocket.js';
import { OpCodes } from '../../../Utils/Classes/WsUtils.js';

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
