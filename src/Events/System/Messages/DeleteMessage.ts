import { Events, User } from '@kastelll/packages/dist/Ws';
import WSS from '../../..';
import { WsUtils } from '../../../Utils/Classes/WsUtils';
// import WSS from '../../../index';

// This is Sent from the API to the System, then System sends it to the Client
export class DeleteMessage extends Events {
  constructor() {
    super();

    this.authRequired = true;

    this.name = 'DeleteMessage';

    this.op = WsUtils.OpCodes.MessageDelete;

    this.strictCheck = true;

    this.version = 0;

    this.allowedAuthTypes = WsUtils.AUTH_CODES.SYSTEM;
  }

  override async execute(
    user: User,
    data: {
      Message: {
        Id: string;
        ChannelId: string;
        AuthorId: string;
        Timestamp: number;
      }
    },
  ) {

    for (const Client of WSS.connectedUsers.values()) {
      if (!(Client.authType === WsUtils.AUTH_CODES.USER)) continue;

        if (Client.UserData?.AllowedChannels?.includes(data.Message.ChannelId)) {
            Client.send({
                op: WsUtils.OpCodes.MessageDelete,
                event: "MessageDelete",
                d: data.Message
            })
        }
    }

    user.send({
        op: WsUtils.SystemOpCodes.DeleteMessageAck
    })
  }
}
