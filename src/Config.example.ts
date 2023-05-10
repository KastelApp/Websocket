import type {
	Encryption as En,
	Regexes as RegexsConfigType,
	WebsocketConfig,
	Config as ConfigType,
	MongoDB as MongoDBConfigType,
	Redis as RedisConfigType,
} from './Types/Config';

const Server: WebsocketConfig = {
	AllowedIps: [],
	CloseOnError: false,
	Port: 8_080,
	MaxConnections: Number.MAX_SAFE_INTEGER,
	SystemLoginInfo: {
		AllowNonLocalIp: false,
		Password: '123',
		LocalIps: ['::1', '::ffff:127.0.0.1', 'localhost'],
		ForceHeartbeats: true, // This makes it where the system has to send a heartbeat in a random time (just like clients)
	},
};

const Redis: RedisConfigType = {
	Host: '',
	Port: 6_379,
	Username: '',
	Password: '',
	DB: 0,
};

const MongoDB: MongoDBConfigType = {
	User: 'dev',
	Host: '',
	Port: '80',
	Password: '',
	Database: '',
	AuthSource: '',
	Uri: '',
};

const Encryption: En = {
	Algorithm: 'aes-256-cbc',
	InitVector: '',
	SecurityKey: '',
	JwtKey: '',
};

const Regexs: RegexsConfigType = {
	// Source: https://regexr.com/2rhq7
	Email:
		/[\d!#$%&'*+/=?^_`a-z{|}~-]+(?:\.[\d!#$%&'*+/=?^_`a-z{|}~-]+)*@(?:[\da-z](?:[\da-z-]*[\da-z])?\.)+[\da-z](?:[\da-z-]*[\da-z])?/g,
	// Source: https://regexr.com/3bfsi
	Password: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[A-Za-z]).{8,72}$/g,
};

const Config: ConfigType = {
	Encryption,
	MongoDB,
	Redis,
	Regexs,
	Server,
};

export default Config;

export { Config, Encryption, MongoDB, Redis, Regexs, Server };
