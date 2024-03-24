package internal

type Config struct {
	Config     ConfigConfig     `json:"config"`
	RabbitMQ   RabbitMQConfig   `json:"rabbitMQ"`
	Encryption EncryptionConfig `json:"encryption"`
	Redis      RedisConfig      `json:"redis"`
	ScyllaDB   ScyllaDBConfig   `json:"scyllaDB"`
}

type ConfigConfig struct {
	MaxConnections int                   `json:"maxConnections"`
	Port           int                   `json:"port"`
	Intervals      ConfigConfigIntervals `json:"intervals"`
}

type ConfigConfigIntervals struct {
	CloseTimeout    ConfigConfigIntervalsCloseTimeout    `json:"closeTimeout"`
	Heartbeat       ConfigConfigIntervalsHeartbeat       `json:"heartbeat"`
	UnAuthedTimeout ConfigConfigIntervalsUnAuthedTimeout `json:"unAuthedTimeout"`
}

type ConfigConfigIntervalsCloseTimeout struct {
	Interval int `json:"interval"`
	Leeway   int `json:"leeway"`
}

type ConfigConfigIntervalsHeartbeat struct {
	Interval int `json:"interval"`
	Leeway   int `json:"leeway"`
}

type ConfigConfigIntervalsUnAuthedTimeout struct {
	Interval int `json:"interval"`
	Leeway   int `json:"leeway"`
}

type RabbitMQConfig struct {
	Host     string `json:"host"`
	Password string `json:"password"`
	Port     int    `json:"port"`
	Username string `json:"username"`
	Vhost    string `json:"vhost"`
}

type EncryptionConfig struct {
	Algorithm   string `json:"algorithm"`
	InitVector  string `json:"initVector"`
	SecurityKey string `json:"securityKey"`
	TokenKey    string `json:"tokenKey"`
}

type RedisConfig struct {
	Db       int    `json:"db"`
	Port     int    `json:"port"`
	Host     string `json:"host"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type ScyllaDBConfig struct {
	Keyspace      string   `json:"keyspace"`
	Username      string   `json:"username"`
	Password      string   `json:"password"`
	Nodes         []string `json:"nodes"`
	DurableWrites bool     `json:"durableWrites"`
}
