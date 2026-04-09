package api

import (
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"

	"wwwmRemoteAccess/internal/api/handlers"
	"wwwmRemoteAccess/internal/api/handlers/fileexplorer"
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

	// File Explorer
	api.Post("/fileexplorer/navigate", fileexplorer.NavigateHandler)
	api.Post("/fileexplorer/delete-bulk", fileexplorer.DeleteBulkHandler)
	api.Post("/fileexplorer/rename", fileexplorer.RenameItem)

	api.Post("/fileexplorer/paste-bulk", fileexplorer.PasteBulkHandler)
	api.Post("/fileexplorer/move-bulk", fileexplorer.MoveBulkHandler)

	// Console WebSocket endpoint
	api.Use("/console", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})
	api.Get("/console", websocket.New(handlers.ConsoleWebSocketHandler, websocket.Config{
		Subprotocols: []string{"access_token"},
	}))

	// templates:
	// example := api.Group("/example")
	// example.Get("/users", handlers.UsersHandler)
}
