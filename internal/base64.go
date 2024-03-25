package internal

import (
	"encoding/base64"
	"strings"
)

func Base64EncodeStripped(s string) string {
	encoded := base64.StdEncoding.EncodeToString([]byte(s))
	return strings.TrimRight(encoded, "=")
}

func AlreadyBase64EncodedStripped(s string) string {
	return strings.TrimRight(s, "=")
}

func Base64DecodeStripped(s string) (string, error) {
	if i := len(s) % 4; i != 0 {
		s += strings.Repeat("=", 4-i)
	}
	decoded, err := base64.StdEncoding.DecodeString(s)
	return string(decoded), err
}
