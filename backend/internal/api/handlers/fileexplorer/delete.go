package fileexplorer

import (
	"fmt"
	"os/exec"
	"path/filepath"
	"syscall"

	"github.com/gofiber/fiber/v2"
)

func DeleteBulkHandler(c *fiber.Ctx) error {
	uid := c.Locals("uid").(uint32)
	gid := c.Locals("gid").(uint32)
	username := c.Locals("username").(string)
	homeDir := c.Locals("homeDir").(string)

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
		item = filepath.Clean(item)
		cmd := exec.Command("rm", "-rf", item)
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
				"error": fmt.Sprintf("Failed to delete %s: %v", item, err),
			})
		}
	}

	return c.JSON(fiber.Map{
		"message": "Items deleted successfully",
	})
}
