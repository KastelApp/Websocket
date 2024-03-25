package v1

import (
	"kstlws/internal"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

type User struct {
	internal.BaseUser
	Token             string
	Username          string
	Email             string
	Password          string
	Settings          SettingStruct
	Id                string
	Guilds            []string
	Bot               bool
	FlagsUtil         internal.FlagFields
	HeartbeatInterval int
	LastHeartbeat     time.Time
	LastHeartbeatAck  time.Time
	Version           int
	Encoding          string
	ExpectingClose    bool
	Ip                string
	Metadata          struct {
		Client string
		Device string
		Os     string
	}
	Sequence    int
	FetchedUser UserType
	ClosedAt    int
	OpenedAt    int
	Resumeable  bool
}

type SettingStruct struct {
	AllowedInvites int
	Bio            string
	CustomStatus   string
	EmojiPack      string
	GuildOrder     []struct {
		GuildId  string
		Position int
	}
	Language       string
	NavBarLocation string
	Privacy        int
	Status         string
	Theme          string
}

type UserType struct {
	AllowedInvites int
	Avatar         string
	Bio            string
	Email          string
	EmailVerified  bool
	Flags          string
	GlobalNickname string
	Id             string
	MfaEnabled     bool
	MfaVerified    bool
	PhoneNumber    string
	PublicFlags    string
	Tag            string
	Username       string
}

func (u *User) Close(code int, reason string) {
	err := u.Socket.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(code, reason))

	if err != nil {
		u.Socket.Close()

		log.Fatal(err)

		return
	}

	u.Socket.Close()
}

func (u *User) Send(message []byte) {
	u.Socket.WriteMessage(websocket.TextMessage, message)
}

func (u User) GetBaseUser() internal.BaseUser {
	return u.BaseUser
}
