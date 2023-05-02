export interface SettingsConstant {
  MAX: {
    GUILD_COUNT: number;
    CHANNEL_COUNT: number;
    ROLE_COUNT: number;
    INVITE_COUNT: number;
    BAN_COUNT: number;
    FRIEND_COUNT: number;
    OG_BADGES: number;
    MEMBER_COUNT: number;
  };
  BETA_FLAG: number;
}

export interface BADGES {
  GHOST: number;
  SPONSOR: number;
  STAFF: number;
  DEVELOPER: number;
  VERIFIED_BOT_DEVELOPER: number;
  ORIGINAL_USER: number;
  PARTNER: number;
  MODERATOR: number;
  MINOR_BUG_HUNTER: number;
  MAJOR_BUG_HUNTER: number;
}

export interface ALLOWED_MENTIONS {
  EVERYONE: number;
  HERE: number;
  ROLES: number;
  USERS: number;
}

export interface GUILD_FLAGS {
  VERIFIED: number;
  PARTNERED: number;
  OFFICIAL: number;
  NO_OWNER: number;
}

export interface CHANNEL_TYPES {
  GUILD_CATEGORY: 1;
  GUILD_TEXT: 2;
  GUILD_NEWS: 3;
  GUILD_RULES: 4;
  GUILD_VOICE: 5;
  GUILD_NEW_MEMBER: 6;
  DM: 10;
  GROUP_CHAT: 11;
}

export interface PRESENCE {
  ONLINE: 1;
  IDLE: 2;
  DND: 3;
  OFFLINE: 4;
}

// Unlike badges flags will actually let you do more stuff or restirct you for doing stuff
export interface FLAGS {
  GHOST: number;
  SYSTEM: number;
  STAFF: number;
  BETA_TESTER: number;
  BOT: number;
  VERIFIED_BOT: number;
  SPAMMER: number;
  TOS: number;
  GUILD_BAN: number;
  FRIEND_BAN: number;
  GROUPCHAT_BAN: number;
}

// These are BigInts since BigInt Bitfields don't loop around to One after 32 (1 << 32 loops 1 but 1n << 32n goes to 4294967296n)
export interface PERMISSIONS {
  ADMINISTRATOR: number | bigint;
  MANAGE_GUILD: number | bigint;
  MANAGE_ROLES: number | bigint;
  MANAGE_CHANNELS: number | bigint;
  MANAGE_MEMBERS: number | bigint;
  MANAGE_EMOJIS: number | bigint;
  MANAGE_BANS: number | bigint;
  MANAGE_NICKNAMES: number | bigint;
  MANAGE_INVITES: number | bigint;
  MANAGE_MESSAGES: number | bigint;
  SEND_MESSAGES: number | bigint;
  READ_MESSAGES: number | bigint;
  KICK_MEMBERS: number | bigint;
  BAN_MEMBERS: number | bigint;
  CREATE_INVITES: number | bigint;
  VIEW_CHANNEL: number | bigint;
  BYPASS_SLOWMODE: number | bigint;
  MANAGE_CHANNEL: number | bigint;
  CHANGE_NICKNAME: number | bigint;
  MANAGE_WEBHOOKS: number | bigint;
  VIEW_AUDIT_LOG: number | bigint;
}

export interface RELATIONSHIP_TYPES {
  FRIEND: 1;
  BLOCKED: 2;
  INCOMING_FRIEND_REQUEST: 3;
  OUTGOING_FRIEND_REQUEST: 4;
}

export interface RELATIONSHIP_FLAGS {
  MATUAL_FRIEND: number;
}
