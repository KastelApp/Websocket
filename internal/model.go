package internal

type Subscription map[string]Client

type Client map[string]*User

type Message struct {
	Op    int         `json:"op"`
	Event string      `json:"event,omitempty"`
	Data  interface{} `json:"data"`
	Seq   int         `json:"seq,omitempty"`
}
