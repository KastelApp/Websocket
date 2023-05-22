import { Events, type User } from '@kastelll/core';
import { OpCodes } from '../../Utils/Classes/WsUtils.js';
import type Websocket from '../../Websocket.js';

export class Resume extends Events {
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
		user: User,
		data: {
			Sequence: number;
			SessionId: string;
		},
	) {}
}
