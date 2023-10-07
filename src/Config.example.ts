import type {
	Config as ConfigConfigType,
	ScyllaDB as ScyllaDBConfigType,
	Redis as RedisConfigType,
	Encryption as EncrpytionConfigType,
	WebsocketConfig as WebsocketConfigType
} from './Types/Config';

const Server: WebsocketConfigType = {
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
	Host: 'localhost',
	Port: 6_379,
	Username: '',
	Password: '',
	DB: 0,
};

const ScyllaDB: ScyllaDBConfigType = {
	Nodes: ["localhost"],
	Keyspace: 'kastel',
	Username: 'kstl',
	Password: '',
	CassandraOptions: {},
	DurableWrites: true,
	NetworkTopologyStrategy: {}
};

const Encryption: EncrpytionConfigType = {
	Algorithm: 'aes-256-cbc',
	InitVector: '',
	SecurityKey: '',
	TokenKey: '',
};


const Config: ConfigConfigType = {
	Encryption,
	ScyllaDB,
	Redis,
	Server,
};

export default Config;

export { Config, Encryption, ScyllaDB, Redis, Server };
