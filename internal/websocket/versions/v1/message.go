package v1

import (
	"encoding/json"
	"log"
	"net/http"

	"kstlws/internal"

	"github.com/gorilla/websocket"
)

func HandleUserCreation(w http.ResponseWriter, r *http.Request, s *websocket.Conn, clientID string) User {
	heartbeatInterval := internal.GetHeartbeatInterval()

	baseUser := internal.BaseUser{
		Socket:    s,
		SessionId: clientID,
	}

	user := User{
		BaseUser:          baseUser,
		HeartbeatInterval: heartbeatInterval,
	}

	json, _ := json.Marshal(internal.Message{
		Op: int(internal.Hello),
		Data: map[string]interface{}{
			"sessionId":         clientID,
			"heartbeatInterval": heartbeatInterval,
		},
	})

	user.Send(json)

	return user
}

func HandleProcessingMessage(server internal.ServerInterface, user User, clientID string, msg []byte) {
	log.Println("Processing message:", string(msg))
}
