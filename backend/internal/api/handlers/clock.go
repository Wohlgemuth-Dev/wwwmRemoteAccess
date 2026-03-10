package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
)

func getSystemTime() string {
	return time.Now().Format("15:04:05")
}

// ClockHandler returns the current time
func ClockHandler(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status": "success",
		"time":   getSystemTime(),
	})
}
