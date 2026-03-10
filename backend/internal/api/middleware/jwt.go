package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"

	"wwwmRemoteAccess/internal/auth"
)

// JWTMiddleware validates the JWT token in the Authorization header
func JWTMiddleware(store *auth.SessionStore) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing Authorization header",
			})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid Authorization header format",
			})
		}

		tokenString := parts[1]

		session, err := store.ValidateSession(tokenString)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		c.Locals("username", session.Username)
		c.Locals("uid", session.UID)
		c.Locals("gid", session.GID)
		c.Locals("homeDir", session.HomeDir)
		c.Locals("token", tokenString)

		return c.Next()
	}
}
