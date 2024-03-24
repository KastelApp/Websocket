package main

import (
	"log"
	"net/http"

	"kstlws/internal/websocket"
)

func main() {
	http.HandleFunc("/", websocket.HandleWebsocket)

	log.Print("Server started on :8080")

	if err := http.ListenAndServe(":62240", nil); err != nil {
		panic(err)
	}

}
