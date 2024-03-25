package websocket

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"kstlws/internal"
	"math/rand"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/scylladb/gocqlx/v2"
)

type Server struct {
	Subscriptions internal.Subscription
	Snowflake     internal.Snowflake
	Constants     internal.Constants
	Session       gocqlx.Session
	Encryption    internal.Encryption
	Config        internal.Config
}

func (s *Server) Send(user *internal.BaseUser, message string) {
	user.Socket.WriteMessage(websocket.TextMessage, []byte(message))
}

func (s *Server) SendWithWait(user *internal.BaseUser, message string, wait *sync.WaitGroup) {
	user.Socket.WriteMessage(websocket.TextMessage, []byte(message))

	wait.Done()
}

func (s *Server) RemoveClient(clientID string) {
	for _, client := range s.Subscriptions {
		delete(client, clientID)
	}
}

func (s *Server) Publish(topic string, message []byte) {
	if _, exist := s.Subscriptions[topic]; !exist {
		return
	}

	clients := s.Subscriptions[topic]

	wait := &sync.WaitGroup{}
	for _, client := range clients {
		wait.Add(1)
		go s.SendWithWait(client, string(message), wait)
	}

	wait.Wait()
}

func (s *Server) Subscribe(topic string, client *internal.BaseUser, clientID string) {
	if _, exist := s.Subscriptions[topic]; !exist {
		clients := s.Subscriptions[topic]

		if _, exists := clients[clientID]; exists {
			return // Already subscribed
		}

		clients[clientID] = client

		return
	}

	s.Subscriptions[topic] = make(internal.Client)

	s.Subscriptions[topic][clientID] = client
}

func (s *Server) Unsubscribe(topic string, clientID string) {
	if _, exist := s.Subscriptions[topic]; !exist {
		return
	}

	delete(s.Subscriptions[topic], clientID)
}

// func (s *Server) ProcessMessage(user *internal.BaseUser, clientID string, msg []byte) *Server {
// 	m := internal.Message{}
// 	if err := json.Unmarshal(msg, &m); err != nil {
// 		s.Send(user, "whar?")
// 	}

// 	s.Send(user, s.GenerateToken("39839308932321282"))

// 	switch m.Op {
// 	case int(internal.Identify):
// 		{
// 			var identify events.Identify

// 			jsonData, err := json.Marshal(m.Data)
// 			if err != nil {
// 				fmt.Print("Error marshaling map to JSON:", err)

// 				break
// 			}

// 			if err := json.Unmarshal(jsonData, &identify); err != nil {
// 				s.Send(user, "whar?")
// 			}

// 			identify.Run(s, user, identify, &m)

// 			break
// 		}

// 	default:
// 		{
// 			s.Send(user, "whar?")

// 			// print out all the user data
// 			fmt.Println(user)
// 		}
// 	}

// 	return s
// }

func (s *Server) GetSubscriptions() internal.Subscription {
	return s.Subscriptions
}

func (s *Server) GetSnowflake() *internal.Snowflake {
	return &s.Snowflake
}

func (s *Server) GetConstants() internal.Constants {
	return s.Constants
}

func (s *Server) GetSession() gocqlx.Session {
	return s.Session
}

func (s *Server) GetEncryption() internal.Encryption {
	return s.Encryption
}

func (s *Server) GenerateToken(id string) string {
	snowflake64 := internal.Base64EncodeStripped(id)
	nonce := strconv.FormatInt(rand.Int63(), 10)
	stringDated := internal.Base64EncodeStripped(strconv.FormatInt(time.Now().Unix(), 10) + nonce)

	hmac := hmac.New(sha256.New, []byte(s.Config.Encryption.TokenKey))
	hmac.Write([]byte(snowflake64 + "." + stringDated))
	hmacSig := base64.URLEncoding.EncodeToString(hmac.Sum(nil))

	return snowflake64 + "." + stringDated + "." + internal.AlreadyBase64EncodedStripped(hmacSig)
}

func (s *Server) ValidateToken(token string) bool {
	parts := strings.Split(token, ".")

	for i := 0; i < 2; i++ {
		decoded, cerr := internal.Base64DecodeStripped(parts[i])

		if cerr != nil {
			return false
		}

		parts[i] = string(decoded)
	}

	for _, part := range parts {
		if part == "" {
			return false
		}
	}

	hmac := hmac.New(sha256.New, []byte(s.Config.Encryption.TokenKey))
	hmac.Write([]byte(parts[0] + "." + parts[1]))
	hmacSig := base64.URLEncoding.EncodeToString(hmac.Sum(nil))

	hmacSig = internal.AlreadyBase64EncodedStripped(hmacSig)

	return hmacSig == parts[2]
}

func (s *Server) DecodeToken(token string) string {
	parts := strings.Split(token, ".")

	corrected, cerr := internal.Base64DecodeStripped(parts[0])

	if cerr != nil {
		return ""
	}

	return corrected
}
