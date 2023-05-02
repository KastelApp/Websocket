import { Events, User } from '@kastelll/packages/dist/Ws';
import { WsUtils } from '../../Utils/Classes/WsUtils';

export class HeartBeat extends Events {
  constructor() {
    super();

    this.authRequired = true;

    this.name = 'HeartBeat';

    this.op = WsUtils.OpCodes.HeartBeat;

    this.strictCheck = false;

    this.version = 1;
  }

  override async execute(
    user: User,
    data: {
        Sequence: number;
    },
  ) {

    if (user.seq !== data.Sequence) {

        console.log(`Expected ${user.seq} but got ${data.Sequence}`)

        user.close(WsUtils.HARD_CLOSE_CODES.INVALID_SEQ, 'Invalid sequence', false)

        return;
    }

    user.setLastHeartbeat(Date.now());

    user.send({
        op: WsUtils.OpCodes.HeartBeatAck,
    }, false)

  }
}
