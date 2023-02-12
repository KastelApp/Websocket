import { Events, User } from '@kastelll/packages/dist/Ws';
import type { RawSettings } from '../Types/User/Settings';
import type { PartialUser, UserAtMe } from '../Types/User/User';
import { Encryption } from '../Utils/Classes/Encryption';
import schemaData from '../Utils/SchemaData';
import { SettingSchema } from '../Utils/Schemas/Schemas';
import Token from '../Utils/Classes/Token';
import { WsUtils } from '../Utils/Classes/WsUtils';
import FlagFields from '../Utils/Classes/BitFields/Flags';

import type { User as RawUser, Guild, Friend, GuildMember, Channel, Role, PermissionsOverides } from '../Types/Raw';

type FixedGuildMember = Omit<GuildMember, 'User' | 'Roles'> & {
  User: PartialUser;
  Roles: Role[]
};

type FixedChannel = (Channel & {
  PermissionsOverides: PermissionsOverides[];
})

type FixedGuild = Omit<Guild, "Owner" | "CoOwners" | "Members" | "Channels" | "Roles"> & {
  Owner: FixedGuildMember,
  CoOwners: FixedGuildMember[],
  Members: FixedGuildMember[],
  Channels: FixedChannel[],
  Roles: Role[]
}

type UpToDateUser = RawUser & {
  Guilds: FixedGuild[];
};

export class Identify extends Events {
  constructor() {
    super();

    this.authRequired = false;

    this.name = 'Identify';

    this.op = WsUtils.OpCodes.Auth;

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

    await UsersSettings.populate<{
      User: RawUser & {
        Guilds: Guild[];
        Friends: Friend[];
      };
    }>(['User.Guilds', 'User.Friends']);

    await UsersSettings.populate<{
      User: RawUser & {
        Guilds: Guild & {
          Owner: GuildMember;
          Members: GuildMember[];
          Channels: Channel[];
          CoOwners: GuildMember[];
          Roles: Role[];
        };
      };
    }>([
      'User.Guilds.Owner',
      'User.Guilds.Members',
      'User.Guilds.Channels',
      'User.Guilds.CoOwners',
      'User.Guilds.Roles',
    ]);

    await UsersSettings.populate<{
      User: UpToDateUser;
    }>([
      'User.Guilds.Channels.PermissionsOverides',
      'User.Guilds.Owner.User',
      'User.Guilds.Owner.Roles',
      'User.Guilds.CoOwners.User',
      'User.Guilds.CoOwners.Roles',
      'User.Guilds.Members.User',      
    ]);

    const UserSettingsDecrypted = Encryption.completeDecryption({
      ...UsersSettings.toObject(),
      _id: undefined,
    }) as RawSettings & {
      User: RawUser;
    };

    const Flags = new FlagFields(UserSettingsDecrypted.User.Flags);

    if (
      Flags.hasString('WaitingOnDisableDataUpdate') ||
      Flags.hasString('WaitingOnAccountDeletion')
    ) {
      user.close(
        WsUtils.HARD_CLOSE_CODES.AUTHENTICATION_FAILED,
        'Your account is currently being deleted or it is disabled.',
        false,
      );

      return;
    }

    if (UserSettingsDecrypted.User.Banned || UserSettingsDecrypted.User.Locked) {
      user.close(WsUtils.HARD_CLOSE_CODES.AUTHENTICATION_FAILED, 'Your account is currently locked or banned.', false);

      return;
    }

    user.setAuthed(true);

    const NormalData = schemaData('User', UserSettingsDecrypted.User) as UserAtMe;

    const Guilds = schemaData('Guilds', Encryption.completeDecryption(UserSettingsDecrypted.User.Guilds)) as (Omit<FixedGuild, | "_id" | "Members" | "Channels" | "Roles" | "Owner" | "CoOwners"> & {
      Id: string;
      Members: (Omit<FixedGuildMember, "_id" | "Roles"> & {
        Id: string;
        Roles: (Omit<Role, "_id"> & {
          Id: string;
        })[];
      })[];
      Channels: (Omit<FixedChannel, "_id"> & {
        Id: string;
      })[];
      Roles: (Omit<Role, "_id"> & {
        Id: string;
      })[];
      Owner: (Omit<FixedGuildMember, "_id" | "Roles"> & {
        Id: string;
        Roles: (Omit<Role, "_id"> & {
          Id: string;
        })[];
      });
      CoOwners: (Omit<FixedGuildMember, "_id" | "Roles"> & {
        Id: string;
        Roles: (Omit<Role, "_id"> & {
          Id: string;
        })[];
      })[];
    })[];

    NormalData.PublicFlags = Number(FlagFields.RemovePrivateFlags(BigInt(NormalData.PublicFlags as number)));

    user.UserData = {
      ...NormalData,
      FlagUtils: Flags,
      Guilds: Guilds.map((guild) => guild.Id),
    }

    user.setHeartbeatInterval(WsUtils.generateHeartbeatInterval())

    user.send({
      op: WsUtils.OpCodes.Authed,
      d: {
        User: NormalData,
        Guilds: Guilds.map((guild) => {
          return {
            ...guild,
            Members: [],
            Owner: {
              ...guild.Owner,
              // we do this as we just want the role ids not the populated roles
              Roles: guild.Owner.Roles.map((r) => r.Id),
              User: {
                ...guild.Owner.User,
                PublicFlags: Number(FlagFields.RemovePrivateFlags(BigInt(guild.Owner.User.PublicFlags as number))),
              }
            },
            CoOwners: guild.CoOwners.map((coOwner) => {
              return {
                ...coOwner,
                Roles: coOwner.Roles.map((r) => r.Id),
                User: {
                  ...coOwner.User,
                  PublicFlags: Number(FlagFields.RemovePrivateFlags(BigInt(coOwner.User.PublicFlags as number))),
                }
              };
            }),
          };
        }),
        Settings: {
          Theme: UserSettingsDecrypted.Theme,
          Language: UserSettingsDecrypted.Language,
          Privacy: UserSettingsDecrypted.Privacy,
        },
        Mentions: UserSettingsDecrypted.Mentions,
        SessionId: user.id,
        HeartbeatInterval: user.heartbeatInterval
      },
    }, false);
  }
}
