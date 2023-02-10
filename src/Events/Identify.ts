import { Events, User } from '@kastelll/packages/dist/Ws';
import type { RawSettings } from '../Types/User/Settings';
import type { RawUser } from '../Types/User/User';
import { Encryption } from '../Utils/Classes/Encryption';
import schemaData from '../Utils/SchemaData';
import { SettingSchema } from '../Utils/Schemas/Schemas';
import Token from '../Utils/Classes/Token';
import { WsUtils } from '../Utils/Classes/WsUtils';

export class Identify extends Events {
  constructor() {
    super();

    this.authRequired = false;

    this.name = 'test';

    this.op = 5;

    this.strictCheck = false;

    this.version = 1;
  }

  override async execute(
    user: User,
    data: {
      token: string;
      settings: {
        // idk what else currently
        compress: boolean; // Whether the client supports compression
        intents?: number; // The intents the client has (WIP)
      };
    },
  ) {
    if (data.settings.compress) {
      user.setCompression(true);
    }

    if (!data.token) {
      user.close(WsUtils.HARD_CLOSE_CODES.AUTHENTICATION_FAILED, 'Invalid token', false);

      return;
    }

    const ValidateToken = Token.ValidateToken(data.token);

    if (!ValidateToken) {
      user.close(WsUtils.HARD_CLOSE_CODES.AUTHENTICATION_FAILED, 'Invalid token', false);

      return;
    }

    const TokenData = Token.DecodeToken(data.token);

    if (!TokenData) {
      // This should never happen, Since ValidateToken is true and
      // the only way for it to be true is if it was decoded successfully (and some other checks)
      user.close(WsUtils.HARD_CLOSE_CODES.UNKNOWN_ERROR, 'Unknown error', false);

      return;
    }

    const UsersSettings = await SettingSchema.findOne({
      User: Encryption.encrypt(TokenData.Snowflake),
    });

    if (!UsersSettings || !UsersSettings?.Tokens?.includes(Encryption.encrypt(data.token))) {
      user.close(WsUtils.HARD_CLOSE_CODES.AUTHENTICATION_FAILED, 'Invalid token', false);

      return;
    }

    await UsersSettings.populate<{
      User: RawUser;
    }>('User');

    await UsersSettings.populate(['User.Guilds', 'User.Friends']);

    await UsersSettings.populate([
      'User.Guilds.Owner',
      'User.Guilds.Members',
      'User.Guilds.Channels',
      'User.Guilds.CoOwners',
      'User.Guilds.Roles',
    ]);

    const UserSettingsDecrypted = Encryption.completeDecryption(UsersSettings.toObject()) as RawSettings & {
      User: RawUser;
    };

    user.setAuthed(true);

    const SchemedUser = (await schemaData('RawUser', UserSettingsDecrypted.User)) as RawUser;

    delete SchemedUser['Password'];

    user.UserData = SchemedUser;

    console.log(JSON.stringify(UsersSettings.toObject(), null, 4));
  }
}
