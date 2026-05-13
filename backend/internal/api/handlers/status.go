package handlers

import "github.com/gofiber/fiber/v2"

type StatusResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}
func StatusHandler(c *fiber.Ctx) error {
	return c.JSON(StatusResponse{
		Status:  "success",
		Message: "API is up and running!",
	})
}
