package internal

import (
	"sync"

	"github.com/gorilla/websocket"
	"github.com/scylladb/gocqlx/v2"
)

type BaseUser struct { // these are things every client has when they connect
	Socket    *websocket.Conn
	SessionId string
}

type UserInterface interface {
	GetBaseUser() BaseUser
}

type ServerInterface interface {
	Send(user *BaseUser, message string)
	SendWithWait(user *BaseUser, message string, wait *sync.WaitGroup)
	RemoveClient(clientID string)
	Publish(topic string, message []byte)
	Subscribe(topic string, client *BaseUser, clientID string)
	Unsubscribe(topic string, clientID string)
	GenerateToken(id string) string
	ValidateToken(token string) bool
	DecodeToken(token string) string
	GetSubscriptions() Subscription
	GetSnowflake() *Snowflake
	GetConstants() Constants
	GetSession() gocqlx.Session
	GetEncryption() Encryption
}
