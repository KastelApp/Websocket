import { Events, User } from '@kastelll/packages/dist/Ws';
import { WsUtils } from '../../Utils/Classes/WsUtils';

export class Resume extends Events {
  constructor() {
    super();

    this.authRequired = false;

    this.name = 'Resume';

    this.op = WsUtils.OpCodes.Resume;

    this.strictCheck = false;

    this.version = 1;
  }

  override async execute(
    user: User,
    data: {
        Sequence: number;
        SessionId: string;
    },
  ) {

    return;

  }
}
