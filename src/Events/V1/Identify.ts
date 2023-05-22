import type { User } from '@kastelll/core';
import { Events, HardCloseCodes, WsUtils } from '@kastelll/core';
import type { User as RawUser, Guild, Friend, GuildMember, Channel, Role, PermissionsOverides } from '../../Types/Raw';
import type { RawSettings } from '../../Types/User/Settings';
import type { PartialUser, UserAtMe } from '../../Types/User/User';
import FlagFields from '../../Utils/Classes/BitFields/Flags.js';
import { Encryption } from '../../Utils/Classes/Encryption.js';
import Token from '../../Utils/Classes/Token.js';
import UserUtils from '../../Utils/Classes/UserUtils.js';
import { OpCodes } from '../../Utils/Classes/WsUtils.js';
import schemaData from '../../Utils/SchemaData.js';
import { SettingSchema } from '../../Utils/Schemas/Schemas.js';
import type Websocket from '../../Websocket.js';

type FixedGuildMember = Omit<GuildMember, 'Roles' | 'User'> & {
	Roles: Role[];
	User: PartialUser;
};

type FixedChannel = Channel & {
	PermissionsOverides: PermissionsOverides[];
};

type FixedGuild = Omit<Guild, 'Channels' | 'CoOwners' | 'Members' | 'Owner' | 'Roles'> & {
	Channels: FixedChannel[];
	CoOwners: FixedGuildMember[];
	Members: FixedGuildMember[];
	Owner: FixedGuildMember;
	Roles: Role[];
};

type UpToDateUser = RawUser & {
	Guilds: FixedGuild[];
};

export class Identify extends Events {
	public Websocket: Websocket;

	public constructor(wss: Websocket) {
		super();

		this.Websocket = wss;

		this.AuthRequired = false;

		this.Name = 'Identify';

		this.Op = OpCodes.Auth;

		this.StrictCheck = false;

		this.Version = 1;
	}

	public override async Execute(
		user: User,
		data: {
			Settings: {
				// idk what else currently
				Compress: boolean; // Whether the client supports compression
				Intents?: number; // The intents the client has (WIP)
			};
			Token: string;
		},
	) {
		if (user.Authed) {
			user.close(HardCloseCodes.AlreadyAuthenticated, 'Already authed', false);

			return;
		}

		if (data?.Settings?.Compress) {
			user.setCompression(true);
		}

		if (!data.Token) {
			user.close(HardCloseCodes.AuthenticationFailed, 'Invalid token', false);

			return;
		}

		const ValidateToken = Token.ValidateToken(data.Token);

		if (!ValidateToken) {
			user.close(HardCloseCodes.AuthenticationFailed, 'Invalid token', false);

			return;
		}

		const TokenData = Token.DecodeToken(data.Token);

		if (!TokenData) {
			// This should never happen, Since ValidateToken is true and
			// the only way for it to be true is if it was decoded successfully (and some other checks)

			user.close(HardCloseCodes.UnknownError, 'Unknown error', false);

			return;
		}

		const UsersSettings = await SettingSchema.findOne({
			User: Encryption.encrypt(TokenData.Snowflake),
			'Tokens.Token': Encryption.encrypt(data.Token),
		});

		if (!UsersSettings) {
			user.close(HardCloseCodes.AuthenticationFailed, 'Invalid token', false);

			return;
		}

		await UsersSettings.populate<{
			User: RawUser;
		}>('User');

		await UsersSettings.populate<{
			User: RawUser & {
				Friends: Friend[];
				Guilds: Guild[];
			};
		}>(['User.Guilds', 'User.Friends']);

		await UsersSettings.populate<{
			User: RawUser & {
				Guilds: Guild & {
					Channels: Channel[];
					CoOwners: GuildMember[];
					Members: GuildMember[];
					Owner: GuildMember;
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

		if (Flags.hasString('WaitingOnDisableDataUpdate') || Flags.hasString('WaitingOnAccountDeletion')) {
			user.close(
				HardCloseCodes.AuthenticationFailed,
				'Your account is currently being deleted or it is disabled.',
				false,
			);

			return;
		}

		if (UserSettingsDecrypted.User.Banned || UserSettingsDecrypted.User.Locked) {
			user.close(HardCloseCodes.AuthenticationFailed, 'Your account is currently locked or banned.', false);

			return;
		}

		user.setAuthed(true);

		const NormalData = schemaData('User', UserSettingsDecrypted.User) as UserAtMe;

		const Guilds = schemaData('Guilds', Encryption.completeDecryption(UserSettingsDecrypted.User.Guilds)) as (Omit<
			FixedGuild,
			'_id' | 'Channels' | 'CoOwners' | 'Members' | 'Owner' | 'Roles'
		> & {
			Channels: (Omit<FixedChannel, '_id'> & {
				Id: string;
			})[];
			CoOwners: (Omit<FixedGuildMember, '_id' | 'Roles'> & {
				Id: string;
				Roles: (Omit<Role, '_id'> & {
					Id: string;
				})[];
			})[];
			Id: string;
			Members: (Omit<FixedGuildMember, '_id' | 'Roles'> & {
				Id: string;
				Roles: (Omit<Role, '_id'> & {
					Id: string;
				})[];
			})[];
			Owner: Omit<FixedGuildMember, '_id' | 'Roles'> & {
				Id: string;
				Roles: (Omit<Role, '_id'> & {
					Id: string;
				})[];
			};
			Roles: (Omit<Role, '_id'> & {
				Id: string;
			})[];
		})[];

		NormalData.PublicFlags = Number(FlagFields.RemovePrivateFlags(BigInt(NormalData.PublicFlags as number)));

		user.UserData = {
			...NormalData,
			FlagUtils: Flags,
			Guilds: Guilds.map((guild) => guild.Id),
		};

		const Utils = new UserUtils(data.Token, user);

		user.UserData.AllowedChannels = (await Utils.ChannelsCanSendMessagesIn(true))
			.filter((chan) => chan.CanSend)
			.map((chan) => chan.ChannelId);

		user.setHeartbeatInterval(WsUtils.GenerateHeartbeatInterval());

		user.setLastHeartbeat(Date.now());

		user.send(
			{
				op: OpCodes.Authed,
				d: {
					User: NormalData,
					Guilds: Guilds.map((guild) => {
						return {
							...guild,
							Members: guild.Members.filter((member) => member.Id === user.UserData.Id).map((member) => {
								return {
									...member,
									User: {
										...member.User,
										PublicFlags: Number(FlagFields.RemovePrivateFlags(BigInt(member.User.PublicFlags as number))),
									},
									// Members roles is broken so we just want to default tot he UserSettingsDecrypted roles
									Roles: (UserSettingsDecrypted.User.Guilds as unknown as FixedGuild[])
										.find((gl) => gl._id === guild.Id)
										?.Roles.map((role) => role._id) as string[],
								};
							}),
							Owner: {
								...guild.Owner,
								// we do this as we just want the role ids not the populated roles
								Roles: guild.Owner.Roles.map((role) => role.Id),
								User: {
									...guild.Owner.User,
									PublicFlags: Number(FlagFields.RemovePrivateFlags(BigInt(guild.Owner.User.PublicFlags as number))),
								},
							},
							CoOwners: guild.CoOwners.map((coOwner) => {
								return {
									...coOwner,
									Roles: coOwner.Roles.map((role) => role.Id),
									User: {
										...coOwner.User,
										PublicFlags: Number(FlagFields.RemovePrivateFlags(BigInt(coOwner.User.PublicFlags as number))),
									},
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
					SessionId: user.Id,
					HeartbeatInterval: user.HeartbeatInterval,
				},
			},
			false,
		);
	}
}
