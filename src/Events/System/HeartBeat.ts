import type { User } from '@kastelll/core';
import { Events, AuthCodes, HardCloseCodes } from '@kastelll/core';
import { OpCodes } from '../../Utils/Classes/WsUtils.js';

export class HeartBeat extends Events {
  public constructor() {
    super();

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
