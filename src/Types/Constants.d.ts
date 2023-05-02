export interface SettingsConstant {
  BETA_FLAG: number;
  MAX: {
    BAN_COUNT: number;
    CHANNEL_COUNT: number;
    FRIEND_COUNT: number;
    GUILD_COUNT: number;
    INVITE_COUNT: number;
    MEMBER_COUNT: number;
    OG_BADGES: number;
    ROLE_COUNT: number;
  };
}

export interface BADGES {
  DEVELOPER: number;
  GHOST: number;
  MAJOR_BUG_HUNTER: number;
  MINOR_BUG_HUNTER: number;
  MODERATOR: number;
  ORIGINAL_USER: number;
  PARTNER: number;
  SPONSOR: number;
  STAFF: number;
  VERIFIED_BOT_DEVELOPER: number;
}

export interface ALLOWED_MENTIONS {
  EVERYONE: number;
  HERE: number;
  ROLES: number;
  USERS: number;
}

export interface GUILD_FLAGS {
  NO_OWNER: number;
  OFFICIAL: number;
  PARTNERED: number;
  VERIFIED: number;
}

export interface CHANNEL_TYPES {
  DM: 10;
  GROUP_CHAT: 11;
  GUILD_CATEGORY: 1;
  GUILD_NEWS: 3;
  GUILD_NEW_MEMBER: 6;
  GUILD_RULES: 4;
  GUILD_TEXT: 2;
  GUILD_VOICE: 5;
}

export interface PRESENCE {
  DND: 3;
  IDLE: 2;
  OFFLINE: 4;
  ONLINE: 1;
}

// Unlike badges flags will actually let you do more stuff or restirct you for doing stuff
export interface FLAGS {
  BETA_TESTER: number;
  BOT: number;
  FRIEND_BAN: number;
  GHOST: number;
  GROUPCHAT_BAN: number;
  GUILD_BAN: number;
  SPAMMER: number;
  STAFF: number;
  SYSTEM: number;
  TOS: number;
  VERIFIED_BOT: number;
}

// These are BigInts since BigInt Bitfields don't loop around to One after 32 (1 << 32 loops 1 but 1n << 32n goes to 4294967296n)
export interface PERMISSIONS {
  ADMINISTRATOR: bigint | number;
  BAN_MEMBERS: bigint | number;
  BYPASS_SLOWMODE: bigint | number;
  CHANGE_NICKNAME: bigint | number;
  CREATE_INVITES: bigint | number;
  KICK_MEMBERS: bigint | number;
  MANAGE_BANS: bigint | number;
  MANAGE_CHANNEL: bigint | number;
  MANAGE_CHANNELS: bigint | number;
  MANAGE_EMOJIS: bigint | number;
  MANAGE_GUILD: bigint | number;
  MANAGE_INVITES: bigint | number;
  MANAGE_MEMBERS: bigint | number;
  MANAGE_MESSAGES: bigint | number;
  MANAGE_NICKNAMES: bigint | number;
  MANAGE_ROLES: bigint | number;
  MANAGE_WEBHOOKS: bigint | number;
  READ_MESSAGES: bigint | number;
  SEND_MESSAGES: bigint | number;
  VIEW_AUDIT_LOG: bigint | number;
  VIEW_CHANNEL: bigint | number;
}

export interface RELATIONSHIP_TYPES {
  BLOCKED: 2;
  FRIEND: 1;
  INCOMING_FRIEND_REQUEST: 3;
  OUTGOING_FRIEND_REQUEST: 4;
}

export interface RELATIONSHIP_FLAGS {
  MATUAL_FRIEND: number;
}
