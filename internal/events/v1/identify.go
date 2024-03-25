package v1

import (
	"fmt"
	"kstlws/internal"
	"kstlws/internal/websocket/versions/v1"
)

type Meta struct {
	// os, device, client (client is optional) and device is a enum of [browser, mobile, desktop]
	Os     string `json:"os"`
	Device string `json:"device"`
	Client string `json:"client"`
}

type Identify struct {
	Token string `json:"token"`
	Meta  Meta   `json:"meta"`
}

func (i *Identify) Run(server internal.ServerInterface, user *v1.User, message Identify, raw *internal.Message) {
	user.Metadata.Client = i.Meta.Client
	user.Metadata.Device = i.Meta.Device
	user.Metadata.Os = i.Meta.Os

	user.Token = i.Token

	// encryption := server.GetEncryption()
	// session := server.GetSession()

	if user.Token == "" {
		invalidToken := internal.ErrorCodes["invalidToken"]

		user.Close(invalidToken.Code, invalidToken.Reason)

		return
	}

	if !server.ValidateToken(user.Token) {
		invalidToken := internal.ErrorCodes["invalidToken"]

		user.Close(invalidToken.Code, invalidToken.Reason)

		return
	}

	fmt.Print("User identified: ", server.DecodeToken(user.Token))
}
