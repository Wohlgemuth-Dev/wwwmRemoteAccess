package api

import (
	"github.com/gofiber/fiber/v2"

	"wwwmRemoteAccess/internal/api/handlers"
)

// SetupRoutes configures all the API routes
func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	// Status endpoint
	api.Get("/status", handlers.StatusHandler)

	// templates:
	// example := api.Group("/example")
	// example.Get("/users", handlers.UsersHandler)
}
