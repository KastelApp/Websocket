import type { User } from '@kastelll/core';
import { Events, AuthCodes } from '@kastelll/core';
import { SystemOpCodes, OpCodes } from '../../../Utils/Classes/WsUtils.js';

// This is Sent from the API to the System, then System sends it to the Client
export class MemberLeave extends Events {
  public constructor() {
    super();

    this.AuthRequired = true;

    this.Name = 'MemberLeave';

    this.Op = OpCodes.MemberLeave;

    this.StrictCheck = true;

    this.Version = 0;

    this.AllowedAuthTypes = AuthCodes.System;
  }

  public override async Execute(user: User, data: {}) {
    console.log('MemberLeave', data);

    user.send({
      op: SystemOpCodes.MemberLeaveAck,
    });
  }
}
