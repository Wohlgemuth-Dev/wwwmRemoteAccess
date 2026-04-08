package fileexplorer

import (
	"fmt"
	"os/exec"
	"path/filepath"
	"syscall"

	"github.com/gofiber/fiber/v2"
)

type PasteBulkRequest struct {
	Items           []string `json:"items"`
	DestinationPath string   `json:"destinationPath"`
}

func pasteBulkHandler(c *fiber.Ctx) error {
	uid := c.Locals("uid").(uint32)
	gid := c.Locals("gid").(uint32)
	username := c.Locals("username").(string)
	homeDir := c.Locals("homeDir").(string)

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
		cmd := exec.Command("cp", "-r", item, destPath)
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
				"error": fmt.Sprintf("Failed to copy %s: %v", item, err),
			})
		}
	}

	return c.JSON(fiber.Map{
		"message": "Items copied successfully",
	})
}
