# Build Automation for wwwmRemoteAccess

FRONTEND_DIR = frontend
BACKEND_DIR = backend
ASSETS_TARGET_DIR = $(BACKEND_DIR)/internal/assets/dist/frontend_dist

.PHONY: all check install-deps build-frontend copy-assets build-backend clean run install

# Default target
all: check build-frontend copy-assets build-backend

check:
	@echo "Checking dependencies..."
	@command -v go >/dev/null 2>&1 || { echo >&2 "Error: 'go' is not installed. Run 'make install-deps' to install."; exit 1; }
	@command -v node >/dev/null 2>&1 || { echo >&2 "Error: 'node' is not installed. Run 'make install-deps' to install."; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo >&2 "Error: 'npm' is not installed. Run 'make install-deps' to install."; exit 1; }
	@echo "Dependencies OK"

install-deps:
	@echo "Attempting to install dependencies (requires apt)..."
	sudo apt-get update
	sudo apt-get install -y golang nodejs npm

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

install: all
	@echo "Installing application..."
	sudo cp $(BACKEND_DIR)/bin/server /usr/local/bin/wwwmRemoteAccess
	@echo "Installed wwwmRemoteAccess to /usr/local/bin/"
