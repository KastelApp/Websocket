interface PermissionOverride {
    Allow: string;
    Deny: string;
    Editable: boolean;
    Id: string; // Id of the user or role
    Slowmode: number;
    Type: number;
}

interface UserObject {
    Avatar: string | null;
    Bio?: string;
    Email: string;
    EmailVerified: boolean;
    GlobalNickname: string | null;
    Id: string;
    PhoneNumber: string | null;
    PublicFlags: number;
    Tag: string;
    TwoFaEnabled: boolean;
    TwoFaVerified: boolean;
    Username: string;
}

interface Settings {
    Language: string;
    Presence: number;
    Privacy: number;
    Status: string;
    Theme: string;
}

interface Mention {
    MessageId: string;
}

interface Role {
    AllowedMenions: number,
    AllowedNsfw: boolean,
    Color: number,
    Deleteable: boolean,
    Hoisted: boolean,
    Id: string,
    Name: string,
    Permissions: string;
    Position: number;
}

interface Channel {
    AllowedMentions: number;
    Children: string[];
    Description: string;
    Id: string;
    Name: string;
    Nsfw: boolean;
    ParentId: string;
    PermissionsOverrides: PermissionOverride[];
    Position: number;
    Slowmode: number;
    Type: number;
}

interface Member {
    JoinedAt: Date;
    Nickname: string;
    Owner: boolean;
    Roles: string[];
    User: {
        Avatar: string;
        Flags: string;
        GlobalNickname: string;
        Id: string;
        Tag: string;
        Username: string;
    };
}

interface Guild {
    Channels: Channel[];
    CoOwners: string[];
    Description: string | null;
    Features: string[];
    Flags: number;
    Icon: string | null;
    Id: string;
    MaxMembers: number;
    Members: Member[];
    Name: string;
    OwnerId: string;
    Roles: Role[];
}

export default interface IdentifyPayload {
    Guilds: Guild[];
    HeartbeatInterval: number;
    Mentions: Mention[];
    SessionId: string;
    Settings: Settings;
    User: UserObject;
}

export type { UserObject, Settings, Mention, Role, Channel, Guild, IdentifyPayload, PermissionOverride };
