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

export interface WebsocketConfig {
  AllowedIps: string[];
  CloseOnError: boolean;
  MaxConnections: number;
  Port: number;
  SystemLoginInfo: {
    AllowNonLocalIp: boolean;
    ForceHeartbeats: boolean;
    LocalIps: string[];
    Password: string;
  };
}

export interface Encryption {
  Algorithm: string;
  InitVector: string;
  JwtKey: string;
  SecurityKey: string;
}

export interface Redis {
  Db: number | string;
  Host: string;
  Password: string;
  Port: number | string;
  User: string;
}

export interface MongoDB {
  AuthSource: string;
  Database: string;
  Host: string;
  Password: string;
  Port: number | string;
  Uri: string;
  User: string;
}
export interface Regexes {
  email: RegExp;
  password: RegExp;
}

export interface Config {
  Encryption: Encryption;
  MongoDB: MongoDB;
  Redis: Redis;
  Regexes: Regexes;
  Server: WebsocketConfig;
}
