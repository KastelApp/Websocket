/*
 *   Copyright (c) 2023
 *   All rights reserved.
 */
import type { Channel, Guild, Member, PermissionOverride, Role } from '../../../Types/V1/Identify.ts';
import Encryption from '../../../Utils/Classes/Encryption.ts';
import Events from '../../../Utils/Classes/Events.ts';
import { SystemOpCodes, OpCodes } from '../../../Utils/Classes/OpCodes.ts';
import type User from '../../../Utils/Classes/User.ts';
import { AuthCodes } from '../../../Utils/Classes/Utils.ts';
import type Websocket from '../../../Utils/Classes/Websocket.ts';
import type { User as UserType } from '../../../Utils/Cql/Types/index.ts';



// This is Sent from the API to the System, then System sends it to the Client
export default class GuildJoin extends Events {
	public Websocket: Websocket;

	public constructor(wss: Websocket) {
		super();

		this.Websocket = wss;

		this.AuthRequired = true;

		this.Name = 'GuildJoin';

		this.Op = OpCodes.GuildJoin;

		this.StrictCheck = true;

		this.Version = 0;

		this.AllowedAuthTypes = AuthCodes.System;
	}

	public override async Execute(
		user: User,
		data: {
            GuildId: string;
            UserId: string;
		},
	) {
        const fetchedUser = await this.Websocket.Cassandra.Models.User.get({ UserId: data.UserId });
        
        if (!fetchedUser) return;
        
		const Decrypted = Encryption.CompleteDecryption(await this.FetchGuilds([data.GuildId], Encryption.CompleteDecryption(fetchedUser)));

		this.Websocket.wss.MainSocket?.publish(
			`User:${data.UserId}`,
			JSON.stringify({
				Op: OpCodes.GuildNew,
				Event: this.Name,
				D: Decrypted,
			}),
		);

		user.Send({
			op: SystemOpCodes.NewGuildAck,
		});
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
