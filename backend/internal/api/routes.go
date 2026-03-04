package api

import (
	"github.com/gofiber/fiber/v2"

	"wwwmRemoteAccess/internal/api/handlers"
)

// SetupRoutes configures all the API routes
func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")
	auth := app.Group("/auth")

	// Status endpoint
	api.Get("/status", handlers.StatusHandler)

	// Authentication endpoints
	auth.Post("/login", handlers.LoginHandler)
	auth.Post("/logout", handlers.LogoutHandler)

	// templates:
	// example := api.Group("/example")
	// example.Get("/users", handlers.UsersHandler)
}
