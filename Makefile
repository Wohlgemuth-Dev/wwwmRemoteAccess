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
	mkdir -p $(ASSETS_TARGET_DIR)
	cp -r $(FRONTEND_DIR)/dist/* $(ASSETS_TARGET_DIR)/

build-backend:
	@echo "Building backend..."
	cd $(BACKEND_DIR) && go mod tidy
	cd $(BACKEND_DIR) && go build -o bin/server ./cmd/server

# Cleanup build artifacts
clean:
	@echo "Cleaning up..."
	rm -rf $(FRONTEND_DIR)/dist $(BACKEND_DIR)/bin $(ASSETS_TARGET_DIR)

run:
	@echo "Running backend..."
	cd $(BACKEND_DIR) && go run ./cmd/server
