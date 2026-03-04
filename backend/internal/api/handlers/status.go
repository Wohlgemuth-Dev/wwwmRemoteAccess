package handlers

import "github.com/gofiber/fiber/v2"

// StatusHandler returns the API status
func StatusHandler(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "API is up and running!",
	})
}
