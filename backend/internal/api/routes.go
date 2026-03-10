package api

import (
	"github.com/gofiber/fiber/v2"

	"wwwmRemoteAccess/internal/api/handlers"
	"wwwmRemoteAccess/internal/api/middleware"
	"wwwmRemoteAccess/internal/auth"
)

// SetupRoutes configures all the API routes
func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")
	authGroup := app.Group("/auth")

	// Authentication endpoints (public)
	authGroup.Post("/login", handlers.LoginHandler)

	// Apply JWT middleware to all /api routes
	api.Use(middleware.JWTMiddleware(auth.GlobalStore))

	// Protected logout endpoint
	api.Post("/logout", handlers.LogoutHandler)

	// Status endpoint
	api.Get("/status", handlers.StatusHandler)
	api.Get("/clock", handlers.ClockHandler)

	// templates:
	// example := api.Group("/example")
	// example.Get("/users", handlers.UsersHandler)
}
