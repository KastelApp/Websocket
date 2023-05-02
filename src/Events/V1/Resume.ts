import type { User } from '@kastelll/core';
import { Events } from '@kastelll/core';
import { OpCodes } from '../../Utils/Classes/WsUtils.js';

export class Resume extends Events {
  public constructor() {
    super();

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
