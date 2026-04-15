package fileexplorer

import (
	"bytes"
	"errors"
	"fmt"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
	"wwwmRemoteAccess/internal/api/handlers"

	"github.com/gofiber/fiber/v2"
)

type DownloadRequest struct {
	Paths []string `json:"paths"`
}

func DownloadHandler(c *fiber.Ctx) error {
	homeDir := c.Locals("homeDir").(string)
	homeAbs, err := filepath.Abs(filepath.Clean(homeDir))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to resolve home directory",
		})
	}

	var req DownloadRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request format",
		})
	}

	if len(req.Paths) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No paths provided",
		})
	}

	selectedPaths := make([]string, 0, len(req.Paths))
	for _, rawPath := range req.Paths {
		cleanedPath := filepath.Clean(strings.TrimSpace(rawPath))
		if cleanedPath == "" || cleanedPath == "." {
			continue
		}

		candidatePath := cleanedPath
		if !filepath.IsAbs(candidatePath) {
			candidatePath = filepath.Join(homeAbs, candidatePath)
		}

		candidateAbs, err := filepath.Abs(filepath.Clean(candidatePath))
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": fmt.Sprintf("Invalid path: %s", rawPath),
			})
		}

		if !isWithinBasePath(homeAbs, candidateAbs) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Cannot download items outside of your home directory.",
			})
		}

		statCmd, err := handlers.SetupCmd(c, "test", "-e", candidateAbs)
		if err != nil {
			return err
		}
		if err := statCmd.Run(); err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "One or more items do not exist or you do not have permission to access them.",
			})
		}

		selectedPaths = append(selectedPaths, candidateAbs)
	}

	if len(selectedPaths) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No valid paths provided",
		})
	}

	zipBaseDir := commonParentDir(selectedPaths)
	relativePaths := make([]string, 0, len(selectedPaths))
	for _, selectedPath := range selectedPaths {
		relPath, err := filepath.Rel(zipBaseDir, selectedPath)
		if err != nil || relPath == "" || strings.HasPrefix(relPath, "..") {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": fmt.Sprintf("Invalid path for archive: %s", selectedPath),
			})
		}

		relativePaths = append(relativePaths, relPath)
	}

	mktempPattern := filepath.Join(homeAbs, ".wwwm-download-XXXXXXXX.zip")
	mktempCmd, err := handlers.SetupCmd(c, "mktemp", mktempPattern)
	if err != nil {
		return err
	}

	mktempOutput, err := mktempCmd.Output()
	if err != nil {
		if errors.Is(err, exec.ErrNotFound) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Download is unavailable: required command 'mktemp' was not found on the server",
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create download archive",
		})
	}

	tempZipPath := strings.TrimSpace(string(mktempOutput))
	if tempZipPath == "" {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to allocate download archive path",
		})
	}

	removeTempCmd, err := handlers.SetupCmd(c, "rm", "-f", tempZipPath)
	if err != nil {
		return err
	}
	if err := removeTempCmd.Run(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to prepare download archive path",
		})
	}

	defer func() {
		cleanupCmd, setupErr := handlers.SetupCmd(c, "rm", "-f", tempZipPath)
		if setupErr == nil {
			_ = cleanupCmd.Run()
		}
	}()

	zipArgs := []string{"-r", "-q", tempZipPath}
	zipArgs = append(zipArgs, relativePaths...)
	zipCmd, err := handlers.SetupCmd(c, "zip", zipArgs...)
	if err != nil {
		return err
	}
	zipCmd.Dir = zipBaseDir
	var zipErrOutput bytes.Buffer
	zipCmd.Stderr = &zipErrOutput
	if err := zipCmd.Run(); err != nil {
		if errors.Is(err, exec.ErrNotFound) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Download is unavailable: required command 'zip' was not found on the server",
			})
		}

		message := strings.TrimSpace(zipErrOutput.String())
		if message == "" {
			message = err.Error()
		}

		archiveCreatedCmd, setupErr := handlers.SetupCmd(c, "test", "-s", tempZipPath)
		if setupErr != nil {
			return setupErr
		}

		if checkErr := archiveCreatedCmd.Run(); checkErr != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Could not create download archive. Some items may be inaccessible due to permissions.",
			})
		}
	}

	archiveName := fmt.Sprintf("download-%s.zip", time.Now().UTC().Format("20060102-150405"))
	c.Set(fiber.HeaderContentType, "application/zip")
	return c.Download(tempZipPath, archiveName)
}

func isWithinBasePath(basePath string, candidatePath string) bool {
	relPath, err := filepath.Rel(basePath, candidatePath)
	if err != nil {
		return false
	}

	return relPath == "." || (!strings.HasPrefix(relPath, "..") && relPath != "")
}

func commonParentDir(paths []string) string {
	if len(paths) == 0 {
		return "/"
	}

	common := filepath.Dir(paths[0])
	for _, path := range paths[1:] {
		common = commonPathPrefix(common, filepath.Dir(path))
	}

	if common == "" {
		return "/"
	}

	return common
}

func commonPathPrefix(a string, b string) string {
	aParts := strings.Split(filepath.Clean(a), string(filepath.Separator))
	bParts := strings.Split(filepath.Clean(b), string(filepath.Separator))

	max := len(aParts)
	if len(bParts) < max {
		max = len(bParts)
	}

	commonParts := make([]string, 0, max)
	for i := 0; i < max; i++ {
		if aParts[i] != bParts[i] {
			break
		}
		commonParts = append(commonParts, aParts[i])
	}

	if len(commonParts) == 0 {
		return string(filepath.Separator)
	}

	if commonParts[0] == "" {
		return string(filepath.Separator) + filepath.Join(commonParts[1:]...)
	}

	return filepath.Join(commonParts...)
}
