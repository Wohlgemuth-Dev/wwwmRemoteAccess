package fileexplorer

import (
	"fmt"
	"log"
	"os/exec"
	"path/filepath"
	"strings"
	"wwwmRemoteAccess/internal/api/handlers"

	"github.com/gofiber/fiber/v2"
)

type CreateRequest struct {
	ParentPath string `json:"parentPath"`
	Name       string `json:"name"`
	Type       string `json:"type"`
}

func CreateItem(c *fiber.Ctx) error {
	homeDir := c.Locals("homeDir").(string)

	var req CreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request format",
		})
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Name is required",
		})
	}
	if strings.Contains(name, "/") || strings.Contains(name, "\\") || name == "." || name == ".." {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Name cannot contain slashes or special path characters",
		})
	}

	parentPath := filepath.Clean(req.ParentPath)
	if parentPath == "." {
		parentPath = homeDir
	}
	targetPath := filepath.Join(parentPath, name)

	var cmd *exec.Cmd
	var err error
	switch req.Type {
	case "file":
		cmd, err = handlers.SetupCmd(c, "touch", targetPath)
		if err != nil {
			log.Printf("SetupCmd error: %v", err)
			return err
		}
	case "folder":
		cmd, err = handlers.SetupCmd(c, "mkdir", targetPath)
		if err != nil {
			log.Printf("SetupCmd error: %v", err)
			return err
		}
	default:
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid type",
		})
	}
	if err := cmd.Run(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fmt.Sprintf("Could not create %s. Check that the name is not already in use and you have write permission.", name),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Item created successfully",
	})
}
