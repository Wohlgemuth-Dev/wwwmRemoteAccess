package fileexplorer

import (
	"fmt"
	"log"
	"path/filepath"
	"strings"
	"wwwmRemoteAccess/internal/api/handlers"

	"github.com/gofiber/fiber/v2"
)

type NavigateRequest struct {
	Path string `json:"path"`
}

type FileItem struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type NavigateResponse struct {
	CurrentPath string     `json:"currentPath"`
	Items       []FileItem `json:"items"`
}

// NavigateHandler uses ls as a logged in user
func NavigateHandler(c *fiber.Ctx) error {
	homeDir := c.Locals("homeDir").(string)

	var req NavigateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	// Default to home directory if path is empty
	targetPath := req.Path
	if targetPath == "" {
		targetPath = homeDir
	}

	// Clean path
	targetPath = filepath.Clean(targetPath)

	// Use ls -1F to list directory contents as the authenticated user
	// -1: one entry per line
	// -F: append indicator (/ for directories)
	cmd, err := handlers.SetupCmd(c, "ls", "-1F", targetPath)
	if err != nil {
		log.Printf("SetupCmd error: %v", err)
		return err
	}

	output, err := cmd.Output()
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fmt.Sprintf("Cannot list directory: %v", err),
		})
	}

	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	items := make([]FileItem, 0, len(lines))

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Ignore . and ..
		name := line
		itemType := "file"

		// ls -F appends / for directories, * for executables, @ for symlinks, etc.
		if strings.HasSuffix(name, "/") {
			name = strings.TrimSuffix(name, "/")
			itemType = "folder"
		} else {
			// Remove other ls -F indicators
			name = strings.TrimRight(name, "*@|=>")
		}

		// Skip . and ..
		if name == "." || name == ".." {
			continue
		}

		items = append(items, FileItem{
			Name: name,
			Type: itemType,
		})
	}

	return c.JSON(NavigateResponse{
		CurrentPath: targetPath,
		Items:       items,
	})
}
