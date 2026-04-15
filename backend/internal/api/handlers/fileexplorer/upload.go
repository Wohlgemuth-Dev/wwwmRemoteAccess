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
			"error": "Could not prepare the upload folder. Check that you have write permission.",
		})
	}

	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "File upload format is invalid or files are too large",
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
				"error": fmt.Sprintf("Could not read file %s. The file may be corrupted or inaccessible.", fileHeader.Filename),
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
				"error": fmt.Sprintf("Could not save file %s. Check that you have write permission and disk space is available.", fileHeader.Filename),
			})
		}

		if closeErr := src.Close(); closeErr != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": fmt.Sprintf("Upload was interrupted while processing %s. Please try again.", fileHeader.Filename),
			})
		}
	}

	return c.JSON(fiber.Map{
		"message": "Files uploaded successfully",
	})
}
