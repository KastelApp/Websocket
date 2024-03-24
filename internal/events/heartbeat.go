package events

import (
	"kstlws/internal"
)

type Heartbeat struct {
	Sequence int `json:"seq"`
}

func (h *Heartbeat) Run(server *internal.ServerInterface, user *internal.User, message *internal.Message) {

}