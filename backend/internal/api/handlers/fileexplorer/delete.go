package fileexplorer

import (
	"fmt"
	"log"
	"path/filepath"
	"strings"

	"wwwmRemoteAccess/internal/api/handlers"

	"github.com/gofiber/fiber/v2"
)

var body struct {
	Paths []string `json:"paths"`
}

func DeleteBulkHandler(c *fiber.Ctx) error {
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request format",
		})
	}

	items := body.Paths
	if len(items) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No paths provided",
		})
	}

	var failedItems []string
	for _, item := range items {
		item = filepath.Clean(item)
		cmd, err := handlers.SetupCmd(c, "rm", "-rf", item)
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
		errorMsg := fmt.Sprintf("Could not delete: %s. Check that you have permission and the items are not in use.", strings.Join(failedItems, ", "))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": errorMsg,
		})
	}

	return c.JSON(fiber.Map{
		"message": "Items deleted successfully",
	})
}
