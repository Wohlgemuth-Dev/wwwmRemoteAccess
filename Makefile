# Build Automation for wwwmRemoteAccess

FRONTEND_DIR = frontend
BACKEND_DIR = backend
ASSETS_TARGET_DIR = $(BACKEND_DIR)/internal/assets/dist/frontend_dist

.PHONY: all build-frontend copy-assets build-backend clean

# Default target
all: build-frontend copy-assets build-backend

# 1. Build the React frontend
build-frontend:
	@echo "Building frontend..."
	cd $(FRONTEND_DIR) && npm install && npm run build

# 2. Copy the frontend dist to the backend asset directory
copy-assets:
	@echo "Copying assets to backend..."
	powershell -Command "if (!(Test-Path $(ASSETS_TARGET_DIR))) { New-Item -ItemType Directory -Force $(ASSETS_TARGET_DIR) }; Copy-Item -Path $(FRONTEND_DIR)/dist/* -Destination $(ASSETS_TARGET_DIR)/ -Recurse -Force"

# 3. Build the Go backend
build-backend:
	@echo "Building backend..."
	cd $(BACKEND_DIR) && go build -o bin/server.exe ./cmd/server

# Cleanup build artifacts
clean:
	@echo "Cleaning up..."
	powershell -Command "Remove-Item -Recurse -Force $(FRONTEND_DIR)/dist, $(BACKEND_DIR)/bin, $(ASSETS_TARGET_DIR)"
