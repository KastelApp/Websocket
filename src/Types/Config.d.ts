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
  Port: number;
  AllowedIps: string[];
  CloseOnError: boolean;
  MaxConnections: number;
  SystemLoginInfo: {
    Password: string;
    AllowNonLocalIp: boolean;
    LocalIps: string[];
  }
}

export interface Encryption {
  Algorithm: string;
  InitVector: string;
  SecurityKey: string;
  JwtKey: string;
}

export interface Redis {
  Host: string;
  Port: number | string;
  User: string;
  Password: string;
  Db: number | string;
}

export interface MongoDB {
  User: string;
  Host: string;
  Port: string | number;
  Password: string;
  Database: string;
  AuthSource: string;
  Uri: string;
}
export interface Regexes {
  password: RegExp;
  email: RegExp;
}

export interface Config {
  Encryption: Encryption;
  Server: WebsocketConfig;
  Redis: Redis;
  MongoDB: MongoDB;
  Regexes: Regexes;
}
