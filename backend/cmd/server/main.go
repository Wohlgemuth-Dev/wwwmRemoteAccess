package main

import (
	"context"
	"log"
	"net"
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
	port := "8080"
	log.Println("wwwm Remote Access Server starting:")
	log.Printf("  ➜  Local:   http://localhost:%s", port)
	log.Printf("  ➜  Network: http://%s:%s", getLocalIP(), port)
	go func() {
		if err := app.Listen(":" + port); err != nil {
			log.Printf("Server finished: %v", err)
		}
	}()

	// Graceful Shutdown
	<-ctx.Done()
}

func getLocalIP() string {
	// Dial a non-existent UDP address to determine the local IP address used for outbound traffic.
	// This doesn't actually send any packets but allows us to see which local interface would be used.
	conn, err := net.Dial("udp", "10.255.255.255:80")
	if err != nil {
		log.Fatal("Could not determine IP: ", err)
	}
	defer conn.Close()
	localAddr := conn.LocalAddr().(*net.UDPAddr)
	return localAddr.IP.String()
}
