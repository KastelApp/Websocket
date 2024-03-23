package websocket

import (
	"encoding/json"
	"fmt"
	"sync"

	"kstlws/internal"

	"github.com/gorilla/websocket"
)

type Server struct {
	Subscriptions Subscription
	Snowflake internal.Snowflake
}

func (s *Server) Send(conn *websocket.Conn, message string) {
	conn.WriteMessage(websocket.TextMessage, []byte(message))
}

func (s *Server) SendWithWait(conn *websocket.Conn, message string, wait *sync.WaitGroup) {
	conn.WriteMessage(websocket.TextMessage, []byte(message))

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

func (s *Server) Subscribe(topic string, client *websocket.Conn, clientID string) {
	if _, exist := s.Subscriptions[topic]; !exist {
		clients := s.Subscriptions[topic]

		if _, exists := clients[clientID]; exists {
			return // Already subscribed
		}

		clients[clientID] = client

		return
	}

	s.Subscriptions[topic] = make(Client)

	s.Subscriptions[topic][clientID] = client
}

func (s *Server) Unsubscribe(topic string, clientID string) {
	if _, exist := s.Subscriptions[topic]; !exist {
		return
	}

	delete(s.Subscriptions[topic], clientID)
}


func (s *Server) ProcessMessage(conn *websocket.Conn, clientID string, msg []byte) *Server {
	m := Message{}
	if err := json.Unmarshal(msg, &m); err != nil {
		s.Send(conn, "whar?")
	}

	fmt.Println(m)

	return s;
}