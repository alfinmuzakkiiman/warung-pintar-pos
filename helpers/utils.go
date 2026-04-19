package helpers

import (
	"math/rand"
	"time"
)

func RandString(n int) string {
	rand.Seed(time.Now().UnixNano())
	letters := []rune("0123456789")
	b := make([]rune, n)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}
