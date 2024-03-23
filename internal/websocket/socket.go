package websocket

import (
	"encoding/json"
	"fmt"
	"net/http"

	"kstlws/internal"

	"github.com/gorilla/websocket"
)

const (
	maxMessageSize = 1024 * 1024 * 2 // ours
)

var server = &Server{
	Subscriptions: make(Subscription),
	Snowflake:     *internal.NewSnowflake(1, 1),
	Constants:     internal.ServerConstants,
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func HandleWebsocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("Error: %v", err)))
		return
	}
	defer conn.Close()

	clientID := server.Snowflake.Generate()

	json, _ := json.Marshal(Message{
		Op: 0,
		Data: map[string]interface{}{
			"sessionId":         clientID,
			"heartbeatInterval": internal.GetHeartbeatInterval(),
		},
	})

	server.Send(conn, string(json))

	done := make(chan struct{})

	go writeData(conn, clientID, done)
	readData(conn, clientID, done)
}

func readData(conn *websocket.Conn, clientID string, done chan<- struct{}) {
	conn.SetReadLimit(maxMessageSize)

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			server.RemoveClient(clientID)
			close(done)
			break
		}

		server.ProcessMessage(conn, clientID, msg)
	}
}

func writeData(conn *websocket.Conn, clientID string, done <-chan struct{}) {
}
