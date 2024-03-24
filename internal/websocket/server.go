package websocket

import (
	"encoding/json"
	"fmt"
	"kstlws/internal"
	"kstlws/internal/events"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/scylladb/gocqlx/v2"
)

type Server struct {
	Subscriptions internal.Subscription
	Snowflake     internal.Snowflake
	Constants     internal.Constants
	Session       gocqlx.Session
	Encryption    internal.Encryption
}

func (s *Server) Send(user *internal.User, message string) {
	user.Socket.WriteMessage(websocket.TextMessage, []byte(message))
}

func (s *Server) SendWithWait(user *internal.User, message string, wait *sync.WaitGroup) {
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

func (s *Server) Subscribe(topic string, client *internal.User, clientID string) {
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

func (s *Server) ProcessMessage(user *internal.User, clientID string, msg []byte) *Server {
	m := internal.Message{}
	if err := json.Unmarshal(msg, &m); err != nil {
		s.Send(user, "whar?")
	}

	switch m.Op {
	case int(internal.Identify):
		{
			var identify events.Identify

			jsonData, err := json.Marshal(m.Data)
			if err != nil {
				fmt.Print("Error marshaling map to JSON:", err)

				break;
			}

			if err := json.Unmarshal(jsonData, &identify); err != nil {
				s.Send(user, "whar?")
			}

			identify.Run(s, user, identify, &m)

			break
		}

	default:
		{
			s.Send(user, "whar?")

			// print out all the user data
			fmt.Println(user)
		}
	}

	return s
}

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
