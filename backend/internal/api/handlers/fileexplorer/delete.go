package fileexplorer

import (
	"fmt"
	"os"

	"github.com/gofiber/fiber/v2"
)

func DeleteBulkHandler(c *fiber.Ctx) error {
	var body struct {
		Paths []string `json:"paths"`
	}

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
		if err := os.RemoveAll(item); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": fmt.Sprintf("Failed to delete %s: %v", item, err),
			})
		}
	}
	return c.JSON(fiber.Map{
		"message": "Items deleted successfully",
	})
}
