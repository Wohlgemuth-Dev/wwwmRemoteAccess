# wwwmRemoteAccess

A powerful, web-based remote access and monitoring application featuring a high-performance Go backend and a modern React frontend. This application provides secure access to your system's resources, including file management, system monitoring, and terminal access, directly from your browser.

## Features

- **System Monitoring**: Real-time insights into CPU, Disk, Memory, Network, and GPU usage, alongside process management.
- **File Explorer**: Fully featured file manager to navigate, upload, download, move, copy, and delete files on the host system.
- **Web Console**: A WebSocket-based terminal emulator for direct command-line access.
- **Secure Authentication**: Integrates directly with the host system's PAM (Pluggable Authentication Modules), meaning you log in using your actual Linux user credentials.
- **Session Management**: JWT-based session handling with automatic timeouts and renewal.

## Getting Started

Follow these instructions to set up, build, and deploy the project on your local machine or a remote server. 

> **Developer Note:** If you are looking to contribute to the codebase or run the application in a hot-reloading development environment, please consult the [DEVELOPMENT.md](DEVELOPMENT.md) guide.

### Prerequisites

The project requires the following dependencies to be installed on your system:
- **Go (1.24+)**: Used to compile the backend server.
- **Node.js & npm**: Required to build the React frontend.
- **`libpam0g-dev`**: A C library required by the Go backend to interface with Linux PAM for user authentication.

#### Validating Prerequisites

You can automatically verify if you have the necessary tools installed by running:

```bash
make check
```

#### Installing Prerequisites (Debian/Ubuntu)

If you are on a Debian or Ubuntu-based Linux distribution, you can install all missing dependencies automatically. **Note: This requires `sudo` privileges.**

```bash
make install-deps
```

### Build Instructions

The project includes a robust `Makefile` that automates the entire build and deployment process.

To view all available commands and their descriptions at any time, run:

```bash
make help
```

#### 1. Build the Complete Project

To build the frontend, copy its compiled static assets into the backend, and compile the Go executable in one step, run:

```bash
make all
```

*What happens under the hood?*
1. Navigates to `frontend/` and runs `npm install` and `npm run build`.
2. Copies the resulting `frontend/dist/` folder to `backend/internal/assets/dist/frontend_dist`.
3. Navigates to `backend/`, runs `go mod tidy`, and compiles the Go binary to `backend/bin/server`.
4. Restarts the systemd service if it is already active.

#### 2. Running Locally (Development Mode)

If you want to quickly test the backend server without installing it system-wide:

```bash
make run
```
The server will start on port `8080` (e.g., `http://localhost:8080`). You will see log output detailing the local and network IP addresses you can use to access the web interface.

> **Important Auth Note**: Because the application uses PAM for authentication, running it as a standard user may restrict it from authenticating against the `/etc/shadow` file. For authentication to succeed, you may need to run the application via `sudo` or configure PAM specifically for your user.

#### 3. System-Wide Installation

To build the project and install the resulting binary into your system's `PATH` (specifically `/usr/local/bin/wwwmRemoteAccess`), run:

```bash
sudo make install
```

#### 4. Deploying as a Background Service

To deploy the application as a persistent background service that automatically starts on boot, run:

```bash
make deploy-service
```
This command copies the `wwwmremote-backend.service` file to `/etc/systemd/system/`, reloads the systemd daemon, enables the service to start on boot, and starts it immediately.

You can later restart or disable the service using:
```bash
make reload-service
make disable-service
```

### Cleanup

If you need to clean your workspace by removing all compiled frontend files, backend binaries, and copied assets, simply run:

```bash
make clean
```