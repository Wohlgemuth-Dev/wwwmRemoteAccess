package fileexplorer

import (
	"fmt"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"

	"github.com/gofiber/fiber/v2"
)

type CreateRequest struct {
	ParentPath string `json:"parentPath"`
	Name       string `json:"name"`
	Type       string `json:"type"`
}

func CreateItem(c *fiber.Ctx) error {
	uid := c.Locals("uid").(uint32)
	gid := c.Locals("gid").(uint32)
	username := c.Locals("username").(string)
	homeDir := c.Locals("homeDir").(string)

	var req CreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
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
			"error": "Invalid name",
		})
	}

	parentPath := filepath.Clean(req.ParentPath)
	if parentPath == "." {
		parentPath = homeDir
	}
	targetPath := filepath.Join(parentPath, name)

	var cmd *exec.Cmd
	switch req.Type {
	case "file":
		cmd = exec.Command("touch", targetPath)
	case "folder":
		cmd = exec.Command("mkdir", targetPath)
	default:
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid type",
		})
	}

	cmd.SysProcAttr = &syscall.SysProcAttr{
		Credential: &syscall.Credential{
			Uid: uid,
			Gid: gid,
		},
	}
	cmd.Env = []string{
		"HOME=" + homeDir,
		"USER=" + username,
		"PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
	}
	if err := cmd.Run(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fmt.Sprintf("Failed to create %s: %v", targetPath, err),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Item created successfully",
	})
}
