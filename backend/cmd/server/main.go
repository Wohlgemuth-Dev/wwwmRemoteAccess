package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	assets "wwwmRemoteAccess/internal/assets/dist"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
)

func main() {
	// 1. Context for Graceful Shutdown
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	// 2. Setup Fiber
	app := fiber.New(fiber.Config{
		DisableStartupMessage: true,
	})

	// 3. Serve Frontend (Static + SPA Fallback)
	distFS, err := assets.GetDistFS()
	if err != nil {
		log.Fatalf("Failed to get dist filesystem: %v", err)
	}

	app.Use("/", filesystem.New(filesystem.Config{
		Root:   http.FS(distFS),
		Browse: false,
		Index:  "index.html",
	}))

	// 4. Start Server
	log.Printf("wwwm Remote Access Server starting on http://localhost:%s", "8080")
	go func() {
		if err := app.Listen(":" + "8080"); err != nil {
			log.Printf("Server finished: %v", err)
		}
	}()

	// Graceful Shutdown
	<-ctx.Done()
}
