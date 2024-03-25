package v1

import (
	"kstlws/internal"
)

type Heartbeat struct {
	Sequence int `json:"seq"`
}

func (h *Heartbeat) Run(server *internal.ServerInterface, user *internal.BaseUser, message *internal.Message) {

}
