package fileexplorer

import (
	"fmt"
	"os/exec"
	"path/filepath"
	"syscall"

	"github.com/gofiber/fiber/v2"
)

type RenameRequest struct {
	OldPath string `json:"oldPath"`
	NewPath string `json:"newPath"`
}

func RenameItem(c *fiber.Ctx) error {
	uid := c.Locals("uid").(uint32)
	gid := c.Locals("gid").(uint32)
	username := c.Locals("username").(string)
	homeDir := c.Locals("homeDir").(string)

	var req RenameRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}
	oldPath := filepath.Clean(req.OldPath)
	newPath := filepath.Clean(req.NewPath)

	cmd := exec.Command("mv", oldPath, newPath)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Credential: &syscall.Credential{
			Uid: uid,
			Gid: gid,
		},
	}
	cmd.Env = []string{
		"HOME=" + homeDir,
		"USER=" + username,
	}
	if err := cmd.Run(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fmt.Sprintf("Failed to rename %s: %v", oldPath, err),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Item renamed successfully",
	})
}
