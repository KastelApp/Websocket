package websocket

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"kstlws/internal"
	v1 "kstlws/internal/websocket/versions/v1"

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
	Encryption:    internal.Encryption{},
	Config:        config,
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

func HandlePostUpgrade(w http.ResponseWriter, r *http.Request, s *websocket.Conn, version string) internal.UserInterface {
	clientID := server.Snowflake.Generate()

	switch version {
	case "v1":
		{
			return v1.HandleUserCreation(w, r, s, clientID)
		}

	default:
		{
			log.Println("Invalid version, we received:", version)
			return nil
		}
	}

}

func HandleWebsocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("Error: %v", err)))
		return
	}
	defer conn.Close()

	version := r.URL.Query().Get("version")
	// encoding := r.URL.Query().Get("encoding") // todo: implement

	user := HandlePostUpgrade(w, r, conn, version)

	if user == nil {
		invalidVersionError := internal.ErrorCodes["invalidVersion"]

		err := conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(invalidVersionError.Code, invalidVersionError.Reason))

		if err != nil {
			conn.Close()

			log.Fatal(err)

			return
		}

		conn.Close()

		return
	}

	done := make(chan struct{})

	clientID := user.GetBaseUser().SessionId

	go writeData(user, version, clientID, done)
	readData(user, version, clientID, done)
}

func readData(user internal.UserInterface, version, clientID string, done chan<- struct{}) {
	baseUser := user.GetBaseUser()

	baseUser.Socket.SetReadLimit(maxMessageSize)

	for {
		_, msg, err := baseUser.Socket.ReadMessage()
		if err != nil {
			server.RemoveClient(clientID)
			close(done)
			break
		}

		switch version {
		case "v1":
			{
				if user, ok := user.(v1.User); ok {
					v1.HandleProcessingMessage(server, user, clientID, msg)
				} else {
					fmt.Println("Error casting to v1.User")
				}
			}
		}
	}
}

func writeData(user internal.UserInterface, version, clientID string, done <-chan struct{}) {
}
