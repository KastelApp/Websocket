package websocket

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"kstlws/internal"

	"github.com/gocql/gocql"
	"github.com/gorilla/websocket"
	"github.com/scylladb/gocqlx/v2"
	"github.com/texttheater/golang-levenshtein/levenshtein"
)

const (
	maxMessageSize = 1024 * 1024 * 2 // ours
)

var config internal.Config

var server = &Server{
	Subscriptions: make(internal.Subscription),
	Snowflake:     *internal.NewSnowflake(1, 1),
	Constants:     internal.ServerConstants,
	Encryption:   internal.Encryption{},
}

func init() {
	configFile := "default"

	if len(os.Args) > 1 && os.Args[1] == "--config" {
		configFile = os.Args[2]
	}

	file, err := os.Open(fmt.Sprintf("configs/%s.json", configFile))

	if err != nil {
		possibleConfigs, err := os.ReadDir("configs")

		if err != nil {
			panic(err)
		}

		possibleConfigsString := ""

		for _, file := range possibleConfigs {
			namewithoutjson := file.Name()[:len(file.Name())-5]

			similarity := levenshtein.DistanceForStrings([]rune(configFile), []rune(namewithoutjson), levenshtein.DefaultOptions)


			if similarity <= 2 {
				possibleConfigsString += fmt.Sprintf(" - %s\n", file.Name())
			}
		}

		if possibleConfigsString != "" {
			panic(fmt.Sprintf("Config file not found. Did you mean one of these?\n%s", possibleConfigsString))
		} else {
			panic("Config file not found.")
		}
	}

	defer file.Close()

	decoder := json.NewDecoder(file)

	err = decoder.Decode(&config)

	if err != nil {
		panic(err)
	}

	server.Encryption.SetConfig(map[string]string{
		"algorithm":   config.Encryption.Algorithm,
		"initVector":  config.Encryption.InitVector,
		"securityKey": config.Encryption.SecurityKey,
	})

	cluster := gocql.NewCluster(config.ScyllaDB.Nodes...)

	cluster.Keyspace = config.ScyllaDB.Keyspace

	cluster.Authenticator = gocql.PasswordAuthenticator{
		Username: config.ScyllaDB.Username,
		Password: config.ScyllaDB.Password,
	}

	session, err := gocqlx.WrapSession(cluster.CreateSession())

	if err != nil {
		panic(err)
	}

	server.Session = session
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
	heartbeatInterval := internal.GetHeartbeatInterval()

	json, _ := json.Marshal(internal.Message{
		Op: int(internal.Hello),
		Data: map[string]interface{}{
			"sessionId":         clientID,
			"heartbeatInterval": heartbeatInterval,
		},
	})

	user := &internal.User{
		Socket:            conn,
		SessionId:         clientID,
		HeartbeatInterval: heartbeatInterval,
	}

	server.Send(user, string(json))

	done := make(chan struct{})

	go writeData(user, clientID, done)
	readData(user, clientID, done)
}

func readData(user *internal.User, clientID string, done chan<- struct{}) {
	user.Socket.SetReadLimit(maxMessageSize)

	for {
		_, msg, err := user.Socket.ReadMessage()
		if err != nil {
			server.RemoveClient(clientID)
			close(done)
			break
		}

		server.ProcessMessage(user, clientID, msg)
	}
}

func writeData(user *internal.User, clientID string, done <-chan struct{}) {
}
