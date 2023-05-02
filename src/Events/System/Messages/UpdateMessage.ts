import { Events, User } from '@kastelll/packages/dist/Ws';
import WSS from '../../..';
import { WsUtils } from '../../../Utils/Classes/WsUtils';
// import WSS from '../../../index';

// This is Sent from the API to the System, then System sends it to the Client
export class UpdateMessages extends Events {
  constructor() {
    super();

    this.authRequired = true;

    this.name = 'UpdateMessages';

    this.op = WsUtils.OpCodes.MessageUpdate;

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
          User: {
                Id: string;
                AvatarHash: string;
                Username: string;
                Tag: string;
                PublicFlags: number;
              };
              Roles: string[];
              Nickname: string;
              JoinedAt: number;
            }
            Content: string;
            ChannelId: string;
            AllowedMentions: number;
        CreatedAt: number;
        UpdatedAt: number;
        Flags: number;
    }
    },
  ) {

    for (const Client of WSS.connectedUsers.values()) {
      if (!(Client.authType === WsUtils.AUTH_CODES.USER)) continue;

        if (Client.UserData?.AllowedChannels?.includes(data.Message.ChannelId)) {
            Client.send({
                op: WsUtils.OpCodes.MessageUpdate,
                event: "MessageUpdate",
                d: data.Message
            })
        }
    }

    user.send({
        op: WsUtils.SystemOpCodes.UpdateMessageAck
    })
  }
}
