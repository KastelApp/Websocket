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

import type FlagFields from '../../Utils/Classes/BitFields/Flags';

export interface LessUser {
  AccountDeletionInProgress: boolean;
  AvatarHash: string;
  Banned: boolean;
  BannedReason: string;
  Email: string;
  Flags: number;
  // Less user is just less data but important data
  Id: string;
  Locked: boolean;
  Tag: string;
  Token: string;
  TwoFa: boolean;
  TwoFaVerified: boolean;
  Username: string;
}

export type UserData = UserAtMe & {
  AllowedChannels?: string[];
  FlagUtils: FlagFields;
  Guilds: string[]; // Channels they can receive messages from
};

export interface RawUser {
  AccountDeletionInProgress: boolean;
  AvatarHash: string | null;
  BanReason: string | null;
  Banned: boolean;
  Bots: string[];
  Dms: string[];
  Email: string;
  EmailVerified: boolean;
  Flags: number;
  GroupChats: string[];
  Guilds: string[];
  Ips: string[];
  Locked: boolean;
  Password?: string | null;
  PhoneNumber: string | null;
  Tag: string;
  TwoFa: boolean;
  TwoFaSecret: string | null;
  TwoFaVerified: boolean;
  Username: string;
  __v: number;
  _id: string;
}

interface IPopulatedUserWJ {
  toJSON(): RawUser;
  toObject(): RawUser;
}

export type PopulatedUserWJ = IPopulatedUserWJ & RawUser;

export interface UserAtMe {
  AvatarHash: string | null;
  Email: string;
  EmailVerified: boolean;
  Id: string;
  PhoneNumber?: string | null;
  PublicFlags: number;
  Tag: string;
  TwoFa: boolean;
  TwoFaVerified: boolean;
  Username: string;
}

interface PartialUser {
  AvatarHash: null;
  Id: string;
  PublicFlags: number;
  Tag: string;
  Username: string;
}
