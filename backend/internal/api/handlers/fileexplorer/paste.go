package fileexplorer

import (
	"fmt"
	"log"
	"path/filepath"
	"wwwmRemoteAccess/internal/api/handlers"

	"github.com/gofiber/fiber/v2"
)

type PasteBulkRequest struct {
	Items           []string `json:"items"`
	DestinationPath string   `json:"destinationPath"`
}

func PasteBulkHandler(c *fiber.Ctx) error {
	var req PasteBulkRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	// Clean destination path
	destPath := filepath.Clean(req.DestinationPath)

	for _, item := range req.Items {
		item = filepath.Clean(item)
		cmd, err := handlers.SetupCmd(c, "cp", "-r", item, destPath)
		if err != nil {
			log.Printf("SetupCmd error: %v", err)
			return err
		}
		if err := cmd.Run(); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": fmt.Sprintf("Failed to copy %s: %v", item, err),
			})
		}
	}

	return c.JSON(fiber.Map{
		"message": "Items copied successfully",
	})
}
