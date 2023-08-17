import { Flags } from '../../Constants.js';
import type IdentifyPayload from '../../Types/V1/Identify.js';
import type { Channel, Guild, PermissionOverride, Role } from '../../Types/V1/Identify.js';
import Encryption from '../../Utils/Classes/Encryption.js';
import WsError from '../../Utils/Classes/Errors.js';
import Events from '../../Utils/Classes/Events.js';
import FlagUtilsBInt from '../../Utils/Classes/Flags.js';
import { OpCodes } from '../../Utils/Classes/OpCodes.js';
import Token from '../../Utils/Classes/Token.js';
import type User from '../../Utils/Classes/User.js';
import Utils, { AuthCodes, HardCloseCodes, HardOpCodes } from '../../Utils/Classes/Utils.js';
import type Websocket from '../../Utils/Classes/Websocket.js';
import type { User as UserType } from '../../Utils/Cql/Types/index.js';

export default class Identify extends Events {
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
		User: User,
		Data: {
			Settings: {
				// idk what else currently
				Compress: boolean; // Whether the client supports compression
				Intents?: number; // The intents the client has (WIP) (Bot Only)
			};
			Token: string;
		},
	) {
		const FailedToAuth = new WsError(HardOpCodes.Error);

		if (!Data.Token || User.Authed) { // lazy way to check if the user is already authed

			FailedToAuth.AddError({
				Token: {
					Code: 'InvalidToken',
					Message: 'The token you provided was invalid.'
				}
			});

			User.Send(FailedToAuth);
			User.Close(HardCloseCodes.AuthenticationFailed, 'Invalid Token');

			return;
		}

		const ValidatedToken = Token.ValidateToken(Data.Token);

		if (!ValidatedToken) {

			FailedToAuth.AddError({
				Token: {
					Code: 'InvalidToken',
					Message: 'The token you provided was invalid.'
				}
			});

			User.Send(FailedToAuth);
			User.Close(HardCloseCodes.AuthenticationFailed, 'Invalid Token');

			return;
		}

		const DecodedToken = Token.DecodeToken(Data.Token);

		const UsersSettings = await this.Websocket.Cassandra.Models.Settings.get({
			UserId: Encryption.Encrypt(DecodedToken.Snowflake),
		}, {
			fields: ['bio', 'language', 'mentions', 'presence', 'privacy', 'status', 'theme', 'tokens']
		});

		const UserData = await this.Websocket.Cassandra.Models.User.get({
			UserId: Encryption.Encrypt(DecodedToken.Snowflake),
		});

		if (!UsersSettings || !UserData) {
			this.Websocket.Logger.debug("User settings wasn't found", (DecodedToken.Snowflake));
			this.Websocket.Logger.debug(UserData, UsersSettings);

			FailedToAuth.AddError({
				Token: {
					Code: 'InvalidToken',
					Message: 'The token you provided was invalid.'
				}
			});

			User.Send(FailedToAuth);
			User.Close(HardCloseCodes.AuthenticationFailed, 'Invalid Token');

			return;
		}

		const UserFlags = new FlagUtilsBInt<typeof Flags>(UserData.Flags, Flags);

		if (
			UserFlags.hasString('AccountDeleted') ||
			UserFlags.hasString('WaitingOnDisableDataUpdate') ||
			UserFlags.hasString('WaitingOnAccountDeletion')
		) {

			this.Websocket.Logger.debug('Account Is Deleted or about to be deleted');

			FailedToAuth.AddError({
				Email: {
					Code: 'AccountDeleted',
					Message: 'The Account has been deleted',
				},
			});

			User.Send(FailedToAuth);
			User.Close(HardCloseCodes.AuthenticationFailed, 'Account Deleted');

			return;
		}

		if (UserFlags.hasString('Terminated') || UserFlags.hasString('Disabled')) {

			this.Websocket.Logger.debug('Account Is Disabled or Terminated');

			FailedToAuth.AddError({
				Email: {
					Code: 'AccountDisabled',
					Message: 'The Account has been disabled',
				},
			});

			User.Send(FailedToAuth);
			User.Close(HardCloseCodes.AuthenticationFailed, 'Account Disabled');

			return;
		}

		if (UserFlags.hasOneArrayString(['Bot', 'VerifiedBot']) && User.AuthType !== AuthCodes.Bot) {

			this.Websocket.Logger.debug('Account Is a Bot but not authenticated as a bot');

			FailedToAuth.AddError({
				Token: {
					Code: 'InvalidToken',
					Message: 'The token you provided was invalid.'
				}
			});

			User.Send(FailedToAuth);
			User.Close(HardCloseCodes.AuthenticationFailed, 'Account Is Bot');

			return;
		}

		const CompleteDecrypted: UserType = Encryption.CompleteDecryption({
			...UserData,
			Flags: UserData.Flags.toString()
		});

		User.WsUser = {
			Token: Data.Token,
			Bot: UserFlags.hasString('Bot') || UserFlags.hasString('VerifiedBot'),
			FlagsUtil: UserFlags,
			Email: CompleteDecrypted.Email,
			Id: CompleteDecrypted.UserId,
			Password: CompleteDecrypted.Password,
			Guilds: CompleteDecrypted.Guilds,
			Channels: {}
		};

		const Payload: Partial<IdentifyPayload> = {
			User: {
				Avatar: CompleteDecrypted.Avatar,
				Email: CompleteDecrypted.Email,
				EmailVerified: UserFlags.hasString('EmailVerified'),
				GlobalNickname: CompleteDecrypted.GlobalNickname,
				Id: CompleteDecrypted.UserId,
				PhoneNumber: CompleteDecrypted.PhoneNumber,
				PublicFlags: Number(UserFlags.cleaned),
				Tag: CompleteDecrypted.Tag,
				TwoFaEnabled: UserFlags.hasString('TwoFaEnabled'),
				TwoFaVerified: UserFlags.hasString('TwoFaVerified'),
				Username: CompleteDecrypted.Username,
				Bio: Encryption.Decrypt(UsersSettings.Bio),
			},
			Settings: {
				Language: UsersSettings.Language,
				Presence: UsersSettings.Presence,
				Privacy: UsersSettings.Privacy,
				Status: UsersSettings.Status,
				Theme: UsersSettings.Theme,
			},
			Mentions: UsersSettings.Mentions ?? [],
			Guilds: await this.FetchGuilds(Encryption.CompleteDecryption(UserData.Guilds))
		};

		for (const Guild of (Payload.Guilds ?? [])) {
			User.WsUser.Channels[Guild.Id] = Guild.Channels.map((channel) => channel.Id);
		}

		User.Authed = true;
		User.LastHeartbeat = Date.now();
		User.HeartbeatInterval = Utils.GenerateHeartbeatInterval();
		User.Compression = Data.Settings.Compress ?? false;

		User.Send({
			Op: OpCodes.Authed,
			D: {
				...this.EmptyStringToNull(Payload),
				HeartbeatInterval: User.HeartbeatInterval,
			}
		}, false);

		console.log(User.WsUser);
	}

	private EmptyStringToNull<T = any>(obj: T): T {
		if (typeof obj !== 'object' || obj === null) {
			if (typeof obj === 'string' && obj === '') return null as T;

			return obj;
		}

		if (!Array.isArray(obj)) {
			const newObject: any = {};

			for (const [key, value] of Object.entries(obj)) {
				if (value instanceof Date || value === null) {
					newObject[key] = value;
				} else if (typeof value === 'object') {
					newObject[key] = this.EmptyStringToNull(value);
				} else {
					newObject[key] = value === '' ? null : value;
				}

			}

			return newObject;
		} else if (Array.isArray(obj)) {
			return obj.map((value) => this.EmptyStringToNull(value)) as T;
		}

		return obj;
	}

	private async FetchChannels(GuildId: string): Promise<Channel[]> {
		const FixedChannels: Channel[] = [];

		const Channels = await this.Websocket.Cassandra.Models.Channel.find({
			GuildId: Encryption.Encrypt(GuildId)
		});

		for (const Channel of Channels.toArray()) {
			const PermissionOverrides: PermissionOverride[] = [];

			for (const PermissionOverrideId of (Channel.PermissionsOverrides ?? [])) {
				const Override = await this.Websocket.Cassandra.Models.PermissionOverride.get({
					PermissionId: PermissionOverrideId
				});

				if (!Override) continue;

				PermissionOverrides.push({
					Allow: Override.Allow.toString(),
					Deny: Override.Deny.toString(),
					Slowmode: Override.Slowmode,
					Type: Override.Type,
					Id: Encryption.Decrypt(Override.Id),
					Editable: Override.Editable,
				});
			}

			FixedChannels.push({
				Id: Channel.ChannelId,
				Name: Channel.Name,
				AllowedMenions: Channel.AllowedMentions,
				Children: Channel.Children ?? [],
				Description: Channel.Description,
				Nsfw: Channel.Nsfw,
				ParentId: Channel.ParentId,
				PermissionsOverrides: PermissionOverrides,
				Position: Channel.Position,
				Slowmode: Channel.Slowmode,
				Type: Channel.Type
			});
		}

		return Encryption.CompleteDecryption(FixedChannels);
	}

	private async FetchGuilds(Guilds: string[]): Promise<Guild[]> {
		const BuildGuilds = [];

		for (const GuildId of Guilds) {
			const Guild = await this.Websocket.Cassandra.Models.Guild.get({
				GuildId: Encryption.Encrypt(GuildId)
			});

			if (!Guild) continue;

			const FixedRoles: Role[] = [];

			const FixedGuild: Guild = {
				Id: Guild.GuildId,
				Icon: Guild.Icon,
				CoOwners: Guild.CoOwners ?? [],
				Features: Guild.Features ?? [],
				Description: Guild.Description,
				Channels: await this.FetchChannels(GuildId) as Channel[],
				Flags: Guild.Flags,
				MaxMembers: Guild.MaxMembers,
				Name: Guild.Name,
				OwnerId: Guild.OwnerId,
				Roles: [],
			};

			const Roles = await this.Websocket.Cassandra.Models.Role.find({
				GuildId: Encryption.Encrypt(GuildId)
			});

			for (const Role of Roles.toArray()) {
				FixedRoles.push({
					Id: Role.RoleId,
					Name: Role.Name,
					AllowedMenions: Role.AllowedMentions,
					AllowedNsfw: Role.AllowedNsfw,
					Color: Role.Color,
					Deleteable: Role.Deleteable,
					Hoisted: Role.Hoisted,
					Permissions: Role.Permissions.toString(),
					Position: Role.Position
				});
			}

			BuildGuilds.push({
				...FixedGuild,
				Roles: FixedRoles
			});
		}

		return Encryption.CompleteDecryption(BuildGuilds);
	}
}
