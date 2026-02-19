package assets

import (
	"embed"
	"io/fs"
)

//go:embed frontend_dist/*
var distFS embed.FS

// GetDistFS returns a filesystem tailored for the frontend assets
func GetDistFS() (fs.FS, error) {
	// Root the filesystem at "frontend_dist" so "index.html" is at the top level
	return fs.Sub(distFS, "frontend_dist")
}
