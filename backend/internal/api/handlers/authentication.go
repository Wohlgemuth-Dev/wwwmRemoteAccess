package handlers

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/msteinert/pam/v2"
)

// LoginRequest defines the structure for the login request
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func pamAuthenticate(username, password string) error {
	service := os.Getenv("PAM_SERVICE")
	if service == "" {
		service = "wwwmremote"
	}

	tx, err := pam.StartFunc(service, username, func(style pam.Style, msg string) (string, error) {
		switch style {
		case pam.PromptEchoOff, pam.PromptEchoOn:
			return password, nil
		default:
			return "", nil
		}
	})
	if err != nil {
		return err
	}

	if err := tx.Authenticate(0); err != nil {
		return err
	}

	if err := tx.AcctMgmt(0); err != nil {
		return err
	}

	return nil
}

// LoginHandler handles user login
func LoginHandler(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	req.Username = strings.TrimSpace(req.Username)
	if req.Username == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Username and password are required",
		})
	}

	if err := pamAuthenticate(req.Username, req.Password); err != nil {
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
