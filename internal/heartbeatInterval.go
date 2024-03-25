package internal

import (
	"math/rand"
)

func GetHeartbeatInterval() int {
	maxInterval := 1000 * 45     // 45 seconds
	minimumInterval := 1000 * 35 // 35 seconds

	interval := rand.Intn(maxInterval-minimumInterval+1) + minimumInterval

	return interval
}
