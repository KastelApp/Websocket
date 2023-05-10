/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

import type { User } from '@kastelll/core';
import Constants, { RelationshipFlags } from '../../Constants.js';
import type { GuildPermissions } from '../../Types/Guilds/User';
import type { PopulatedUserWJ } from '../../Types/User/User';
import schemaData from '../SchemaData.js';
import { FriendSchema, UserSchema } from '../Schemas/Schemas.js';
import GuildMemberFlags from './BitFields/GuildMember.js';
import Permissions from './BitFields/Permissions.js';
import Encryption from './Encryption.js';

class UserUtils {
	public Token: string;

	public user: User;

	public constructor(Token: string, user: User) {
		this.Token = Token;

		this.user = user;
	}

	public async fetchFriends(FilterBlocked = false) {
		const FriendsR = await FriendSchema.find({
			Receiver: Encryption.encrypt(this.user.UserData.Id as string),
		});

		const FriendsS = await FriendSchema.find({
			Sender: Encryption.encrypt(this.user.UserData.Id as string),
		});

		const FriendRArray: {
			Flags: number;
			Receiver: PopulatedUserWJ;
			Sender: PopulatedUserWJ;
		}[] = [];

		const FriendSArray: {
			Flags: number;
			Receiver: PopulatedUserWJ;
			Sender: PopulatedUserWJ;
		}[] = [];

		for (const Friend of FriendsR) {
			if (FilterBlocked && Friend.Flags === RelationshipFlags.Blocked) continue;

			const PopulatedFriend = await Friend.populate<{
				Receiver: PopulatedUserWJ;
				Sender: PopulatedUserWJ;
			}>(['Receiver', 'Sender']);

			const FixedData = schemaData('Friend', {
				Sender: Encryption.completeDecryption(PopulatedFriend.toJSON()),
				Receiver: Encryption.completeDecryption(PopulatedFriend.toJSON()),
				Flags: Friend.Flags,
			});

			FriendRArray.push(FixedData);
		}

		for (const Friend of FriendsS) {
			if (FilterBlocked && Friend.Flags === RelationshipFlags.Blocked) continue;

			const PopulatedFriend = await Friend.populate<{
				Receiver: PopulatedUserWJ;
				Sender: PopulatedUserWJ;
			}>(['Receiver', 'Sender']);

			const FixedData = schemaData('Friend', {
				Sender: Encryption.completeDecryption(PopulatedFriend.toJSON()),
				Receiver: Encryption.completeDecryption(PopulatedFriend.toJSON()),
				Flags: Friend.Flags,
			});

			FriendSArray.push(FixedData);
		}

		return [...FriendRArray, ...FriendSArray];
	}

	// This is for Guilds not DM channels
	public async canSendMessagesGuildV(ChannelId: string): Promise<boolean> {
		const Guilds = await this.getGuilds();

		const Guild = Guilds.find((gld) => gld.Channels.find((chan) => chan._id === ChannelId));

		if (!Guild) return false;

		const GuildMember = Guild.Members.find((mem) => mem.User._id === this.user.UserData.Id);

		if (!GuildMember) return false;

		const MemberFlags = new GuildMemberFlags(Number(GuildMember.Flags));

		if (!MemberFlags.hasString('In')) return false;

		if (MemberFlags.hasString('Owner') || MemberFlags.hasString('CoOwner')) return true;

		// Soon we will check for PermissionOverides
		const Channel = Guild.Channels.find((chan) => chan._id === ChannelId);

		if (!Channel) return false;

		const OneRoleHasPermission = GuildMember.Roles.some((rle) => {
			const Role = Guild.Roles.find((gr) => gr._id === rle);

			if (!Role) return false;

			const RolePermissions = new Permissions(Number(Role.Permissions));

			return RolePermissions.hasString('SendMessages');
		});

		return OneRoleHasPermission ?? false;
	}

	public async canSendMessagesArray(ChannelId: string[]) {
		const FetchedGuilds = await this.getGuilds();

		const Guilds = FetchedGuilds.filter((gld) => gld.Channels.find((chan) => ChannelId.includes(chan._id)));

		const GuildsData: { CanSend: boolean; GuildId: string }[] = [];

		for (const Guild of Guilds) {
			const GuildMember = Guild.Members.find((mem) => mem.User._id === this.user.UserData.Id);

			if (!GuildMember) continue;

			const MemberFlags = new GuildMemberFlags(Number(GuildMember.Flags));

			if (!MemberFlags.hasString('In')) continue;

			if (MemberFlags.hasString('Owner') || MemberFlags.hasString('CoOwner')) {
				GuildsData.push({ GuildId: Guild._id, CanSend: true });
				continue;
			}

			// Soon we will check for PermissionOverides
			const Channels = Guild.Channels.filter((chan) => ChannelId.includes(chan._id));

			if (!Channels.length) continue;

			const OneRoleHasPermission = GuildMember.Roles.some((rle) => {
				const Role = Guild.Roles.find((gr) => gr._id === rle);

				if (!Role) return false;

				const RolePermissions = new Permissions(Number(Role.Permissions));

				return RolePermissions.hasString('SendMessages');
			});

			if (OneRoleHasPermission) GuildsData.push({ GuildId: Guild._id, CanSend: true });
		}

		return GuildsData;
	}

	public async CanSendMessagesInChannels(ChannelId: string[]) {
		const ChannelData: {
			CanSend: boolean;
			ChannelId: string;
		}[] = [];

		const Guilds = await this.getGuilds();

		for (const Channel of ChannelId) {
			const Guild = Guilds.find((gld) => gld.Channels.find((chan) => chan._id === Channel));

			if (!Guild) {
				ChannelData.push({ ChannelId: Channel, CanSend: false });
				continue;
			}

			const GuildMember = Guild.Members.find((mem) => mem.User._id === this.user.UserData.Id);

			if (!GuildMember) {
				ChannelData.push({ ChannelId: Channel, CanSend: false });
				continue;
			}

			const MemberFlags = new GuildMemberFlags(Number(GuildMember.Flags));

			if (!MemberFlags.hasString('In')) {
				ChannelData.push({ ChannelId: Channel, CanSend: false });
				continue;
			}

			if (MemberFlags.hasString('Owner') || MemberFlags.hasString('CoOwner')) {
				ChannelData.push({ ChannelId: Channel, CanSend: true });
				continue;
			}

			// Soon we will check for PermissionOverides
			const ChannelData2 = Guild.Channels.find((chan) => chan._id === Channel);

			if (!ChannelData2) {
				ChannelData.push({ ChannelId: Channel, CanSend: false });
				continue;
			}

			const OneRoleHasPermission = GuildMember.Roles.some((rle) => {
				const Role = Guild.Roles.find((gr) => gr._id === rle);

				if (!Role) return false;

				const RolePermissions = new Permissions(Number(Role.Permissions));

				return RolePermissions.hasString('SendMessages');
			});

			if (OneRoleHasPermission) ChannelData.push({ ChannelId: Channel, CanSend: true });
		}

		return ChannelData;
	}

	public async ChannelsCanSendMessagesIn(ChannelTypeCheck: boolean = false) {
		const Guidls = await this.getGuilds();

		const Channels = Guidls.flatMap((gld) => gld.Channels);

		const ChannelData: {
			CanSend: boolean;
			ChannelId: string;
		}[] = [];

		for (const Channel of Channels) {
			const Guild = Guidls.find((gld) => gld.Channels.find((chan) => chan._id === Channel._id));

			if (!Guild) {
				ChannelData.push({ ChannelId: Channel._id, CanSend: false });
				continue;
			}

			const GuildMember = Guild.Members.find((mem) => mem.User._id === this.user.UserData.Id);

			if (!GuildMember) {
				ChannelData.push({ ChannelId: Channel._id, CanSend: false });
				continue;
			}

			const MemberFlags = new GuildMemberFlags(Number(GuildMember.Flags));

			if (!MemberFlags.hasString('In')) {
				ChannelData.push({ ChannelId: Channel._id, CanSend: false });
				continue;
			}

			// Soon we will check for PermissionOverides
			const ChannelData2 = Guild.Channels.find((chan) => chan._id === Channel._id);

			if (!ChannelData2) {
				ChannelData.push({ ChannelId: Channel._id, CanSend: false });
				continue;
			}

			console.log(ChannelData2.Type);

			if (ChannelTypeCheck && ChannelData2.Type === Constants.ChannelTypes.GuildCategory) {
				ChannelData.push({ ChannelId: Channel._id, CanSend: false });
				continue;
			}

			if (MemberFlags.hasString('Owner') || MemberFlags.hasString('CoOwner')) {
				ChannelData.push({ ChannelId: Channel._id, CanSend: true });
				continue;
			}

			const OneRoleHasPermission = GuildMember.Roles.some((rle) => {
				const Role = Guild.Roles.find((gr) => gr._id === rle);

				if (!Role) return false;

				const RolePermissions = new Permissions(Number(Role.Permissions));

				return RolePermissions.hasString('SendMessages');
			});

			if (OneRoleHasPermission) ChannelData.push({ ChannelId: Channel._id, CanSend: true });
		}

		return ChannelData;
	}

	public async getGuilds(): Promise<GuildPermissions[]> {
		const UserSchemad = await UserSchema.findById(Encryption.encrypt(this.user.UserData.Id as string));

		if (!UserSchemad) return [];

		await UserSchemad.populate('Guilds');

		await UserSchemad.populate(['Guilds.Members', 'Guilds.Roles', 'Guilds.Channels']);

		await UserSchemad.populate(['Guilds.Members.User', 'Guilds.Channels.PermissionsOverides']);

		return Encryption.completeDecryption(UserSchemad.toObject().Guilds);
	}

	public async getMember(GuildId: string, UserId: string) {
		const Guild = await this.getGuilds();

		const GuildData = Guild.find((gld) => gld._id === GuildId);

		if (!GuildData) return null;

		const Member = GuildData.Members.find((mem) => mem.User._id === UserId);

		if (!Member) return null;

		return Member;
	}

	public async getMemberFromChannel(ChannelId: string, UserId: string) {
		const Guild = await this.getGuilds();

		const GuildData = Guild.find((gld) => gld.Channels.find((chan) => chan._id === ChannelId));

		if (!GuildData) return null;

		const Member = GuildData.Members.find((mem) => mem.User._id === UserId);

		if (!Member) return null;

		return Member;
	}
}

export default UserUtils;

export { UserUtils };
