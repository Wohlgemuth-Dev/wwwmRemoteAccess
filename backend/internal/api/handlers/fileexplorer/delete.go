package fileexplorer

import (
	"fmt"
	"log"
	"path/filepath"

	"wwwmRemoteAccess/internal/api/handlers"

	"github.com/gofiber/fiber/v2"
)

var body struct {
	Paths []string `json:"paths"`
}

func DeleteBulkHandler(c *fiber.Ctx) error {
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	items := body.Paths
	if len(items) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No paths provided",
		})
	}

	for _, item := range items {
		item = filepath.Clean(item)
		cmd, err := handlers.SetupCmd(c, "rm", "-rf", item)
		if err != nil {
			log.Printf("SetupCmd error: %v", err)
			return err
		}
		if err := cmd.Run(); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": fmt.Sprintf("Failed to delete %s: %v", item, err),
			})
		}
	}

	return c.JSON(fiber.Map{
		"message": "Items deleted successfully",
	})
}
