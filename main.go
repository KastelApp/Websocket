package main

import (
	"net/http"

	"kstlws/internal/websocket"
)

func main() {
	http.HandleFunc("/", websocket.HandleWebsocket)

	if err := http.ListenAndServe(":8080", nil); err != nil {
		panic(err)
	}

}
