import { Config, MongoDB, Redis } from './Types/Config';
import type { Encryption as En, Regexes as Rg, WebsocketConfig } from './Types/Config';

const Server: WebsocketConfig = {
  AllowedIps: [],
  CloseOnError: false,
  Port: 8_080,
  MaxConnections: Number.MAX_SAFE_INTEGER,
  SystemLoginInfo: {
    AllowNonLocalIp: false,
    Password: '',
    LocalIps: [],
    ForceHeartbeats: true, // This makes it where the system has to send a heartbeat in a random time (just like clients)
  },
};

const Redis: Redis = {
  Host: '',
  Port: '',
  User: '',
  Password: '',
  Db: '',
};

const MongoDB: MongoDB = {
  User: '',
  Host: '',
  Port: '',
  Password: '',
  Database: '',
  AuthSource: '',
  Uri: '',
};

const Encryption: En = {
  Algorithm: '',
  InitVector: '',
  SecurityKey: '',
  JwtKey: '',
};

const Regexes: Rg = {
  // Source: https://regexr.com/2rhq7
  email: new RegExp(
    /[\d!#$%&'*+/=?^_`a-z{|}~-]+(?:\.[\d!#$%&'*+/=?^_`a-z{|}~-]+)*@(?:[\da-z](?:[\da-z-]*[\da-z])?\.)+[\da-z](?:[\da-z-]*[\da-z])?/,
  ),
  // Source: https://regexr.com/3bfsi
  password: new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[A-Za-z]).{8,}$/),
};

const Config: Config = {
  Encryption,
  MongoDB,
  Redis,
  Regexes,
  Server,
};

export default Config;

export { Config, Encryption, MongoDB, Redis, Regexes, Server };
