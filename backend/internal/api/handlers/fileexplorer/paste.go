package fileexplorer

import (
	"fmt"
	"log"
	"path/filepath"
	"strings"
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
			"error": "Invalid request format",
		})
	}

	// Clean destination path
	destPath := filepath.Clean(req.DestinationPath)

	var failedItems []string
	for _, item := range req.Items {
		item = filepath.Clean(item)
		cmd, err := handlers.SetupCmd(c, "cp", "-r", item, destPath)
		if err != nil {
			log.Printf("SetupCmd error: %v", err)
			failedItems = append(failedItems, filepath.Base(item))
			continue
		}
		if err := cmd.Run(); err != nil {
			failedItems = append(failedItems, filepath.Base(item))
		}
	}

	if len(failedItems) > 0 {
		errorMsg := fmt.Sprintf("Could not copy: %s. Check that the destination exists and you have write permission.", strings.Join(failedItems, ", "))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": errorMsg,
		})
	}

	return c.JSON(fiber.Map{
		"message": "Items copied successfully",
	})
}
