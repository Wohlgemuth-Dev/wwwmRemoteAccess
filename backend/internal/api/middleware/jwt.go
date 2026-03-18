package middleware

import (
	"encoding/base64"
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"

	"wwwmRemoteAccess/internal/auth"
)

// JWTMiddleware validates the JWT token in the Authorization header
func JWTMiddleware(store *auth.SessionStore) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tokenString := ""
		authHeader := c.Get("Authorization")

		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString = parts[1]
			}
		} else {
			// Extract token from Subprotocols
			wsProtocols := c.Get("Sec-WebSocket-Protocol")
			
			if wsProtocols != "" {
				parts := strings.Split(wsProtocols, ",")
				for i, p := range parts {
					if strings.TrimSpace(p) == "access_token" && i+1 < len(parts) {
						safeTokenString := strings.TrimSpace(parts[i+1])
						padded := safeTokenString
						if len(safeTokenString)%4 != 0 {
							padded += strings.Repeat("=", 4-len(safeTokenString)%4)
						}
						decoded, err := base64.StdEncoding.DecodeString(padded)

						if err == nil {
							tokenString = string(decoded)
						} else {
							tokenString = safeTokenString
						}
						break
					}
				}
			}
		}

		if tokenString == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing or invalid authorization token",
			})
		}

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
