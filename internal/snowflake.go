package internal

import (
	"strconv"
	"sync"
	"time"
)

const (
	maxWorkerID        = 31
	maxProcessID       = 31
	maxIncrement       = 4095
	epoch        int64 = 1701410400000 // Kastel's epoch (2024-01-01) in milliseconds
)

type Snowflake struct {
	mu        sync.Mutex
	workerID  int64
	processID int64
	increment int64
	epoch     int64
}

func NewSnowflake(workerID, processID int64) *Snowflake {
	if workerID > maxWorkerID || processID > maxProcessID {
		panic("worker ID or process ID is out of range")
	}
	return &Snowflake{
		workerID:  workerID,
		processID: processID,
		epoch:     epoch,
	}
}

func (s *Snowflake) Generate() string {
	s.mu.Lock()
	defer s.mu.Unlock()

	timestamp := time.Now().UnixNano()/1e6 - s.epoch
	if timestamp < s.increment {
		panic("clock moved backwards")
	}

	if timestamp == s.increment {
		s.increment++
		if s.increment > maxIncrement {
			panic("increment is out of range")
		}
	} else {
		s.increment = 0
	}

	snowflake := ((timestamp << 22) | (s.workerID << 17) | (s.processID << 12) | s.increment)

	return strconv.FormatInt(snowflake, 10)

}

func (s *Snowflake) MassGenerate(amount int) []string {
	var snowflakes []string
	for i := 0; i < amount; i++ {
		snowflakes = append(snowflakes, s.Generate())
	}
	return snowflakes
}

func (s *Snowflake) Parse(snowflake string) int64 {
	id, err := strconv.ParseInt(snowflake, 10, 64)
	if err != nil {
		panic("failed to parse snowflake")
	}
	return id
}

func (s *Snowflake) TimeStamp(snowflake string) int64 {
	return ((s.Parse(snowflake) >> 22) + s.epoch)
}

func (s *Snowflake) Json(snowflake string) map[string]int64 {
	return map[string]int64{
		"timestamp": ((s.Parse(snowflake) >> 22) + s.epoch),
		"workerId":  ((s.Parse(snowflake) >> 17) & maxWorkerID),
		"processId": ((s.Parse(snowflake) >> 12) & maxProcessID),
		"increment": (s.Parse(snowflake) & maxIncrement),
	}
}

func (s *Snowflake) Validate(snowflake string) bool {
	json := s.Json(snowflake)

	if json["workerId"] > maxWorkerID {
		return false
	}
	if json["processId"] > maxProcessID {
		return false
	}

	return json["increment"] <= maxIncrement
}
