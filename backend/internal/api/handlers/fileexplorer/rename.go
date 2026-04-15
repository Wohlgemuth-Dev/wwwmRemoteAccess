package fileexplorer

import (
	"log"
	"path/filepath"
	"wwwmRemoteAccess/internal/api/handlers"

	"github.com/gofiber/fiber/v2"
)

type RenameRequest struct {
	OldPath string `json:"oldPath"`
	NewPath string `json:"newPath"`
}

func RenameItem(c *fiber.Ctx) error {
	var req RenameRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request format",
		})
	}
	oldPath := filepath.Clean(req.OldPath)
	newPath := filepath.Clean(req.NewPath)

	cmd, err := handlers.SetupCmd(c, "mv", oldPath, newPath)
	if err != nil {
		log.Printf("SetupCmd error: %v", err)
		return err
	}
	if err := cmd.Run(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not rename item. The new name may already exist or you may not have permission.",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Item renamed successfully",
	})
}
