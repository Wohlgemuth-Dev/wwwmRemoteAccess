package handlers

import (
	"fmt"
	"os"
	"os/user"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/msteinert/pam/v2"

	"wwwmRemoteAccess/internal/auth"
)

// LoginRequest defines the structure for the login request
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func pamAuthenticate(username, password string) error {
	service := os.Getenv("PAM_SERVICE")
	if service == "" {
		service = "wwwmremote-backend"
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

// ValidateToken parses and validates a JWT token
func ValidateToken(tokenString string) (jwt.MapClaims, error) {
	secretStr := os.Getenv("JWT_SECRET")
	if secretStr == "" {
		secretStr = "my-super-secret-key-12345"
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secretStr), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("invalid token")
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

	u, err := user.Lookup(req.Username)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not find user information",
		})
	}

	uid, _ := strconv.ParseUint(u.Uid, 10, 32)
	gid, _ := strconv.ParseUint(u.Gid, 10, 32)

	token, err := auth.GlobalStore.CreateSession(req.Username, uint32(uid), uint32(gid), u.HomeDir)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not create session token",
		})
	}

	return c.JSON(fiber.Map{
		"token": token,
	})
}


func LogoutHandler(c *fiber.Ctx) error {
	token, ok := c.Locals("token").(string)
	if ok && token != "" {
		auth.GlobalStore.DeleteSession(token)
	}

	return c.JSON(fiber.Map{
		"message": "Logout successful",
	})
}
