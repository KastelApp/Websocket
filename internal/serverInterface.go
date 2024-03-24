package internal

import (
	"sync"

	"github.com/scylladb/gocqlx/v2"
)

type ServerInterface interface {
	Send(user *User, message string)
	SendWithWait(user *User, message string, wait *sync.WaitGroup)
	RemoveClient(clientID string)
	Publish(topic string, message []byte)
	Subscribe(topic string, client *User, clientID string)
	Unsubscribe(topic string, clientID string)
	GetSubscriptions() Subscription
	GetSnowflake() *Snowflake
	GetConstants() Constants
	GetSession() gocqlx.Session
	GetEncryption() Encryption
}
