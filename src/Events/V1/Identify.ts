import { Flags } from '../../Constants.ts';
import type IdentifyPayload from '../../Types/V1/Identify.ts';
import type { Channel, Guild, Member, PermissionOverride, Role } from '../../Types/V1/Identify.ts';
import Encryption from '../../Utils/Classes/Encryption.ts';
import WsError from '../../Utils/Classes/Errors.ts';
import Events from '../../Utils/Classes/Events.ts';
import FlagUtilsBInt from '../../Utils/Classes/Flags.ts';
import { OpCodes } from '../../Utils/Classes/OpCodes.ts';
import Token from '../../Utils/Classes/Token.ts';
import type User from '../../Utils/Classes/User.ts';
import Utils, { AuthCodes, HardCloseCodes } from '../../Utils/Classes/Utils.ts';
import type Websocket from '../../Utils/Classes/Websocket.ts';
import type { User as UserType } from '../../Utils/Cql/Types/index.ts';

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
		const FailedToAuth = new WsError(OpCodes.Error);

		if (!Data.Token || User.Authed) {
			// lazy way to check if the user is already authed

			FailedToAuth.AddError({
				Token: {
					Code: 'InvalidToken',
					Message: 'The token you provided was invalid.',
				},
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
					Message: 'The token you provided was invalid.',
				},
			});

			User.Send(FailedToAuth);
			User.Close(HardCloseCodes.AuthenticationFailed, 'Invalid Token');

			return;
		}

		const DecodedToken = Token.DecodeToken(Data.Token);

		const UsersSettings = await this.Websocket.Cassandra.Models.Settings.get(
			{
				UserId: Encryption.Encrypt(DecodedToken.Snowflake),
			},
			{
				fields: ['bio', 'language', 'mentions', 'presence', 'privacy', 'status', 'theme', 'tokens'],
			},
		);

		const UserData = await this.Websocket.Cassandra.Models.User.get({
			UserId: Encryption.Encrypt(DecodedToken.Snowflake),
		});

		if (!UsersSettings || !UserData) {
			this.Websocket.Logger.debug("User settings wasn't found", DecodedToken.Snowflake);
			this.Websocket.Logger.debug(UserData, UsersSettings);

			FailedToAuth.AddError({
				Token: {
					Code: 'InvalidToken',
					Message: 'The token you provided was invalid.',
				},
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
					Message: 'The token you provided was invalid.',
				},
			});

			User.Send(FailedToAuth);
			User.Close(HardCloseCodes.AuthenticationFailed, 'Account Is Bot');

			return;
		}

		const CompleteDecrypted: UserType = Encryption.CompleteDecryption({
			...UserData,
			Flags: UserData.Flags.toString(),
		});

		User.WsUser = {
			Token: Data.Token,
			Bot: UserFlags.hasString('Bot') || UserFlags.hasString('VerifiedBot'),
			FlagsUtil: UserFlags,
			Email: CompleteDecrypted.Email,
			Id: CompleteDecrypted.UserId,
			Password: CompleteDecrypted.Password,
			Guilds: CompleteDecrypted.Guilds,
			Channels: {},
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
				Bio: Encryption.isEncrypted(UsersSettings.Bio) ? Encryption.Decrypt(UsersSettings.Bio) : UsersSettings.Bio,
			},
			Settings: {
				Language: UsersSettings.Language,
				Presence: UsersSettings.Presence,
				Privacy: UsersSettings.Privacy,
				Status: UsersSettings.Status,
				Theme: UsersSettings.Theme,
			},
			Mentions: UsersSettings.Mentions ?? [],
			Guilds: await this.FetchGuilds(Encryption.CompleteDecryption(UserData.Guilds ?? []), CompleteDecrypted),
			HeartbeatInterval: Utils.GenerateHeartbeatInterval(),
			SessionId: User.Id,
		};

		for (const Guild of Payload.Guilds ?? []) {
			User.WsUser.Channels[Guild.Id] = Guild.Channels.map((channel) => {
				console.log(channel);
				User.Ws.subscribe(`Channel:${channel.Id}`);

				return channel.Id;
			});

			User.Ws.subscribe(`Guild:${Guild.Id}`);
		}

		User.Authed = true;
		User.LastHeartbeat = Date.now();
		User.HeartbeatInterval = Payload.HeartbeatInterval as number;
		User.Compression = Data.Settings.Compress ?? false;

		User.Ws.subscribe(`User:${CompleteDecrypted.UserId}`); // subscribe to yourself so we can easily broadcast to yourself when we receive a system socket message

		User.Send(
			{
				Op: OpCodes.Authed,
				D: {
					...this.EmptyStringToNull(Payload),
					HeartbeatInterval: User.HeartbeatInterval,
				},
			},
			false,
		);
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
			GuildId: Encryption.Encrypt(GuildId),
		});

		for (const Channel of Channels.toArray()) {
			const PermissionOverrides: PermissionOverride[] = [];

			for (const PermissionOverrideId of Channel.PermissionsOverrides ?? []) {
				const Override = await this.Websocket.Cassandra.Models.PermissionOverride.get({
					PermissionId: PermissionOverrideId,
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
				AllowedMentions: Channel.AllowedMentions,
				Children: Channel.Children ?? [],
				Description: Channel.Description,
				Nsfw: Channel.Nsfw,
				ParentId: Channel.ParentId,
				PermissionsOverrides: PermissionOverrides,
				Position: Channel.Position,
				Slowmode: Channel.Slowmode,
				Type: Channel.Type,
			});
		}

		return Encryption.CompleteDecryption(FixedChannels);
	}

	private async FetchGuilds(Guilds: string[], User: UserType): Promise<Guild[]> {
		const BuildGuilds = [];

		for (const GuildId of Guilds) {
			const Guild = await this.Websocket.Cassandra.Models.Guild.get({
				GuildId: Encryption.Encrypt(GuildId),
			});

			const Member = await this.Websocket.Cassandra.Models.GuildMember.get(
				{
					UserId: Encryption.Encrypt(User.UserId),
					GuildId: Encryption.Encrypt(GuildId),
				},
				{ allowFiltering: true },
			);

			if (!Guild || !Member) continue;

			const FixedRoles: Role[] = [];
			
			const Members = await this.Websocket.Cassandra.Models.GuildMember.find({
				GuildId: Encryption.Encrypt(GuildId),
			}, {
				limit: 200
			});
			
			const FixedMembers: Member[] = [];
			
			for (const Member of Members.toArray()) {
				if (Encryption.Decrypt(Member.UserId) === User.UserId) continue; // don't add yourself to the members list (you're already in it)
				
				const MemberUser = await this.Websocket.Cassandra.Models.User.get({
					UserId: Member.UserId,
				});

				if (!MemberUser) continue;
				
				FixedMembers.push({
					JoinedAt: Member.JoinedAt,
					Nickname: Member.Nickname,
					Owner: Encryption.Decrypt(Guild.OwnerId) === Member.UserId, // should be false
					Roles: Member.Roles ?? [],
					User: {
						Id: MemberUser.UserId,
						Avatar: MemberUser.Avatar,
						Username: MemberUser.Username,
						Tag: MemberUser.Tag,
						GlobalNickname: MemberUser.GlobalNickname,
						Flags: MemberUser.Flags,
					}
				})
			}

			const FixedGuild: Guild = {
				Id: Guild.GuildId,
				Icon: Guild.Icon,
				CoOwners: Guild.CoOwners ?? [],
				Features: Guild.Features ?? [],
				Description: Guild.Description,
				Channels: (await this.FetchChannels(GuildId)) ?? [],
				Flags: Guild.Flags,
				MaxMembers: Guild.MaxMembers,
				Name: Guild.Name,
				OwnerId: Guild.OwnerId,
				Roles: [],
				Members: [
					{
						User: {
							Id: User.UserId,
							Avatar: User.Avatar,
							Username: User.Username,
							Tag: User.Tag,
							GlobalNickname: User.GlobalNickname,
							Flags: User.Flags,
						},
						JoinedAt: Member.JoinedAt,
						Nickname: Member.Nickname,
						Roles: Member.Roles ?? [],
						Owner: Encryption.Decrypt(Guild.OwnerId) === User.UserId,
					},
					...FixedMembers
				],
			};

			const Roles = await this.Websocket.Cassandra.Models.Role.find({
				GuildId: Encryption.Encrypt(GuildId),
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
					Position: Role.Position,
				});
			}

			BuildGuilds.push({
				...FixedGuild,
				Roles: FixedRoles,
			});
		}

		return Encryption.CompleteDecryption(BuildGuilds);
	}
}
