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
	Size int64  `json:"size"`
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
			"error": "Invalid request format",
		})
	}

	// Default to home directory if path is empty
	targetPath := req.Path
	if targetPath == "" {
		targetPath = homeDir
	}

	// Clean path
	targetPath = filepath.Clean(targetPath)

	// Use ls -lF to list directory contents as the authenticated user
	// -l: long listing format to get file sizes
	// -F: append indicator (/ for directories)
	// --time-style=long-iso: ensures consistent date formatting for easier parsing
	cmd, err := handlers.SetupCmd(c, "ls", "-lF", "--time-style=long-iso", targetPath)
	if err != nil {
		log.Printf("SetupCmd error: %v", err)
		return err
	}

	output, err := cmd.Output()
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Could not access this directory. Check that the path exists and you have permission to read it.",
		})
	}

	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	items := make([]FileItem, 0, len(lines))

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "total ") {
			continue
		}

		fields := strings.Fields(line)
		if len(fields) < 8 {
			continue
		}

		sizeStr := fields[4]
		var size int64
		fmt.Sscanf(sizeStr, "%d", &size)

		name := strings.Join(fields[7:], " ")
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
			Size: size,
		})
	}

	return c.JSON(NavigateResponse{
		CurrentPath: targetPath,
		Items:       items,
	})
}
