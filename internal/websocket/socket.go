package websocket

import (
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"
	"kstlws/internal"
)

const (
	maxClientMessageSize = 1024 * 512       // clients
	maxMessageSize       = 1024 * 1024 * 10 // ours
)

var server = &Server{Subscriptions: make(Subscription), Snowflake: *internal.NewSnowflake(1, 1)}

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

	server.Send(conn, fmt.Sprintf(`{"op": 0, "data": {"client_id": "%s"}}`, clientID))

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