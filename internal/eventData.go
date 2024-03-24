package internal

// ErrorCode represents an error code with its details.
type ErrorCode struct {
    Code    int    `json:"code"`
    Reason string `json:"reason"`
    Reconnect bool `json:"reconnect"`
}

// ErrorCodes is a map of error code names to their details.
var ErrorCodes = map[string]ErrorCode{
    "unknownError": {
        Code:    4000,
        Reason: "Unknown error occurred.",
        Reconnect: true,
    },
    "invalidToken": {
        Code:    4001,
        Reason: "Invalid token provided.",
        Reconnect: false,
    },
    "accountUnAvailable": {
        Code:    4002,
        Reason: "Account is unavailable.",
        Reconnect: false,
    },
    "invalidOpCode": {
        Code:    4003,
        Reason: "You sent an opcode that is invalid or is not client-sendable.",
        Reconnect: true,
    },
    "invalidPayload": {
        Code:    1007,
        Reason: "You sent a payload that is invalid.",
        Reconnect: true,
    },
    "internalServerError": {
        Code:    1011,
        Reason: "Internal server error :(",
        Reconnect: false,
    },
    "unauthorized": {
        Code:    4004,
        Reason: "You sent a payload that requires authorization, or didn't authorize in time.",
        Reconnect: false,
    },
    "alreadyAuthorized": {
        Code:    4005,
        Reason: "You sent a payload that requires you not to be authorized.",
        Reconnect: true,
    },
    "invalidSequence": {
        Code:    4006,
        Reason: "You sent an invalid sequence.",
        Reconnect: true,
    },
    "heartbeatTimeout": {
        Code:    4007,
        Reason: "You missed a heartbeat.. your heart is now dead :(.",
        Reconnect: true,
    },
}

// OpCode represents an operation code.
type OpCode int

// Operation codes.
const (
    Event OpCode = iota
    Identify
    Ready
    Heartbeat
    PresenceUpdate
    RequestGuild
    RequestGuildMembers
    Resume
    HeartbeatAck
    Hello
)

// UserSendCodes is a slice of operation codes that the client can send.
var UserSendCodes = []OpCode{
    Identify,
    Heartbeat,
    PresenceUpdate,
    RequestGuild,
    RequestGuildMembers,
    Resume,
}