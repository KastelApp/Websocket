import { Events, User } from '@kastelll/packages/dist/Ws';
import { WsUtils } from '../../../Utils/Classes/WsUtils';
// import WSS from '../../../index';

// This is Sent from the API to the System, then System sends it to the Client
export class MemberLeave extends Events {
  constructor() {
    super();

    this.authRequired = true;

    this.name = 'MemberLeave';

    this.op = WsUtils.OpCodes.MemberLeave;

    this.strictCheck = true;

    this.version = 0;

    this.allowedAuthTypes = WsUtils.AUTH_CODES.SYSTEM;
  }

  override async execute(
    user: User,
    data: {

    },
  ) {

    user.send({
        op: WsUtils.SystemOpCodes.MemberLeaveAck
    })
  }
}
