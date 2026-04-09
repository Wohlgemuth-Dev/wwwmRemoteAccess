package fileexplorer

import (
	"bytes"
	"fmt"
	"io"
	"path/filepath"

	"wwwmRemoteAccess/internal/api/handlers"

	"github.com/gofiber/fiber/v2"
)

func UploadHandler(c *fiber.Ctx) error {
	targetPath := filepath.Clean(c.FormValue("targetPath"))
	if targetPath == "" || targetPath == "." {
		homeDir := c.Locals("homeDir").(string)
		targetPath = homeDir
	}

	mkdirCmd, err := handlers.SetupCmd(c, "mkdir", "-p", targetPath)
	if err != nil {
		return err
	}
	if err := mkdirCmd.Run(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fmt.Sprintf("Failed to prepare destination folder: %v", err),
		})
	}

	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid multipart form",
		})
	}

	files := form.File["files"]
	if len(files) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No files provided",
		})
	}

	for _, fileHeader := range files {
		src, err := fileHeader.Open()
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": fmt.Sprintf("Failed to read uploaded file %s: %v", fileHeader.Filename, err),
			})
		}

		targetFilePath := filepath.Join(targetPath, filepath.Base(fileHeader.Filename))
		writeCmd, err := handlers.SetupCmd(c, "tee", targetFilePath)
		if err != nil {
			src.Close()
			return err
		}

		var stderr bytes.Buffer
		writeCmd.Stdin = src
		writeCmd.Stdout = io.Discard
		writeCmd.Stderr = &stderr

		if runErr := writeCmd.Run(); runErr != nil {
			src.Close()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": fmt.Sprintf("Failed to save file %s: %v (%s)", targetFilePath, runErr, stderr.String()),
			})
		}

		if closeErr := src.Close(); closeErr != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": fmt.Sprintf("Failed to close upload stream for %s: %v", fileHeader.Filename, closeErr),
			})
		}
	}

	return c.JSON(fiber.Map{
		"message": "Files uploaded successfully",
	})
}
