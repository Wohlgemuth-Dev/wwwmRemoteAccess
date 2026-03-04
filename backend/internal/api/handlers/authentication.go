package handlers

import (
	"github.com/gofiber/fiber/v2"
)

// LoginRequest defines the structure for the login request
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginHandler handles user login
func LoginHandler(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	// For demonstration, we'll use a static username and password
	if req.Username != "test" || req.Password != "test" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid credentials",
		})
	}

	return c.JSON(fiber.Map{
		"token": "123",
	})
}

// LogoutHandler handles user logout
func LogoutHandler(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"message": "Logout successful",
	})
}
