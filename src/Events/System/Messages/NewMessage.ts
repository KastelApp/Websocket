import { Events, User } from '@kastelll/packages/dist/Ws';
import { WsUtils } from '../../../Utils/Classes/WsUtils';
import WSS from '../../../index';

// This is Sent from the API to the System, then System sends it to the Client
export class NewMessage extends Events {
  constructor() {
    super();

    this.authRequired = true;

    this.name = 'NewMessage';

    this.op = WsUtils.OpCodes.MessageCreate;

    this.strictCheck = true;

    this.version = 0;

    this.allowedAuthTypes = WsUtils.AUTH_CODES.SYSTEM;
  }

  override async execute(
    user: User,
    data: {
        Message: {
          Id: string;
          Author: {
              Id: string;
              Username: string;
              Discriminator: string;
              Avatar: string;
              PublicFlags: number;
          }
          Content: string;
          ChannelId: string;
          AuthorId: string;
          Timestamp: number;
          AllowedMentions: number;
          Nonce: string;
          Flags: number;
          System: boolean;
      }
    },
  ) {
    for (const Client of WSS.connectedUsers.values()) {
      if (!(Client.authType === WsUtils.AUTH_CODES.USER)) continue;

        if (Client.UserData?.AllowedChannels?.includes(data.Message.ChannelId)) {
            Client.send({
                op: WsUtils.OpCodes.MessageCreate,
                event: "MessageCreate",
                d: data.Message
            })
        }
    }

    user.send({
        op: WsUtils.SystemOpCodes.MessageCreateAck
    })
  }
}
