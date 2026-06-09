# Internal Development Guide

## 🏗️ Architecture & Technology Stack

The application uses a decoupled architecture where a React single-page application (SPA) communicates with a Go REST/WebSocket API.

### 🖥️ Frontend Stack
- **Framework**: React 19
- **Language**: TypeScript
- **Bundler**: Vite
- **Routing**: React Router (`react-router-dom`)
- **Data Visualization**: Recharts (used for real-time system monitoring graphs)
- **Location**: `/frontend`

#### Frontend Structure Map
- **`src/App.tsx`**: The entry point that wraps the application in an `AuthProvider` and mounts the `SessionTimeoutManager`. If unauthenticated, it shows the `LoginScreen`; otherwise, it renders the `Desktop`.
- **`src/components/`**: Contains the modular UI features:
  - `desktop/`: The main authenticated workspace view.
  - `fileExplorer/`: Interface for navigating the host's file system, moving/deleting files, and uploading/downloading.
  - `systemMonitor/`: Live charts and process lists displaying CPU, RAM, Disk, and Network metrics.
  - `console/`: A terminal emulator interface connecting to the backend via WebSockets.
  - `login/`: The authentication screen.
  - `navbar/` & `Toast/`: Global UI components.
  - `sessionTimeout/`: Handles JWT token expiration and prompts the user to renew their session.
- **`src/service/`**: Contains API clients, WebSocket managers, and the `AuthContext` which manages the JWT state globally.

### ⚙️ Backend Stack
- **Language**: Go (1.24+)
- **Web Framework**: Fiber (`github.com/gofiber/fiber/v2`)
- **Authentication**: PAM via `github.com/msteinert/pam/v2`
- **Session Management**: JWT (`github.com/golang-jwt/jwt/v5`)
- **System Telemetry**: `gopsutil` (`github.com/shirou/gopsutil/v3`) for cross-platform system metric gathering.
- **WebSockets**: Fiber WebSocket contrib module for the terminal console.
- **Location**: `/backend`

#### Backend Structure Map
- **`cmd/server/main.go`**: The application entry point. Initializes Fiber, configures CORS, sets up graceful shutdown, mounts the API routes, and configures the static file server to serve the compiled React frontend.
- **`internal/api/routes.go`**: Defines the central routing table.
- **`internal/api/handlers/`**: Controllers for specific domains:
  - `fileexplorer/`: Handlers for navigating, uploading, downloading, and modifying files on the disk.
  - `systemmanager/`: Handlers that utilize `gopsutil` to fetch CPU, memory, disk, network, and process information, as well as kill processes.
  - `console.go`: The WebSocket handler that spawns a pseudo-terminal (PTY) or shell session.
- **`internal/api/middleware/`**: Contains the JWT verification middleware used to protect the `/api/*` routes.
- **`internal/auth/`**: Contains `session.go`, which handles the critical PAM authentication logic (verifying Linux usernames and passwords against `/etc/shadow`) and JWT generation.

---

## 🔍 Deep Dive: Core Functions & Code Structure

### 1. Authentication & Session Management (`session.go` & `AuthContext.tsx`)
**Backend:** The authentication system in `backend/internal/auth/session.go` is built around a thread-safe `SessionStore` (using `sync.RWMutex`). 
- When a user logs in, the system uses the `github.com/msteinert/pam/v2` library to validate the username and password against the Linux system's PAM configuration.
- Upon success, it generates a JSON Web Token (JWT) containing the user's `UID`, `GID`, and `HomeDir`, and stores it in the in-memory `sessions` map.
- The `RenewSession` function allows the frontend to request a new token right before the old one expires without requiring the user to re-enter their password.

**Frontend:** In `frontend/src/service/AuthContext.tsx`, React Context is used to provide the authentication state globally. It intercepts unauthorized API calls, manages the `isAuthenticated` flag, and triggers the `SessionTimeoutManager` UI to warn users before their session expires.

### 2. The Web Console (`handlers/console.go`)
The terminal emulator is powered by WebSockets.
- In `backend/internal/api/handlers/console.go`, a Fiber WebSocket route upgrades the HTTP connection.
- The Go backend executes a `bash` shell process (`cmd.Start()`).
- It captures `stdin`, `stdout`, and `stderr` using Go's `io.Pipe`.
- Two goroutines continuously scan `stdout` and `stderr` and push the text over the WebSocket to the frontend.
- Incoming WebSocket messages (keystrokes or commands) from the frontend are written directly to the bash process's `stdin`.

### 3. File Explorer (`handlers/fileexplorer/`)
This package provides a full CRUD interface for the host filesystem.
- Features include directory navigation, bulk deletion, renaming, file creation, bulk moving/copying, and uploading/downloading.
- **Security:** It is critical that all handlers in this package validate paths to ensure users cannot navigate outside of permitted directories or access files their Linux user (`UID`/`GID` from the JWT) shouldn't access.

### 4. System Manager (`handlers/systemmanager/`)
Provides real-time telemetry.
- Relies heavily on `github.com/shirou/gopsutil/v3`.
- Endpoints like `/systemmanager/cpu` or `/systemmanager/memory` query the OS directly and return JSON structures.
- The `/systemmanager/processes` endpoint lists active processes, and `/kill` allows terminating them based on PID.
- **Frontend:** The `systemMonitor` components in React poll these endpoints on an interval (e.g., every 1-2 seconds) and feed the data into Recharts to create moving time-series graphs.

---

## 💻 Local Development Workflow

When developing locally, you should run the frontend and backend as separate processes. This allows you to utilize Vite's Hot Module Replacement (HMR) for instant frontend UI updates without recompiling the Go binary.

### 1. Backend Development Server

Open a terminal, navigate to the backend directory, and start the Go server:

```bash
cd backend
go run ./cmd/server
```

**⚠️ Important PAM Authentication Note:**
Because the backend authenticates against the host Linux system's PAM modules, the Go process often requires read access to `/etc/shadow`. If your login attempts fail during development, try running the backend with `sudo`:
```bash
sudo go run ./cmd/server
```
*Alternatively, you can implement a mock authentication bypass in `session.go` locally if you prefer not to use `sudo` during UI development.*

### 2. Frontend Development Server

Open a second terminal, navigate to the frontend directory, and start Vite:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on its default port (e.g., `http://localhost:5173`). 
Ensure that your API calls in the React application are correctly pointing to the Go backend (typically `http://localhost:8080`). This is usually handled via an environment variable or a proxy configuration in `vite.config.ts`.

---

## 📦 The Build & Delivery Process

In production, the application is delivered as a single compiled Go binary.

1. **Frontend Compilation**: `npm run build` generates a `dist/` folder containing an `index.html` and static JS/CSS assets.
2. **Asset Transfer**: The `Makefile` copies these assets into `backend/internal/assets/dist/frontend_dist`.
3. **Go Embedding**: The Fiber framework is configured in `main.go` to serve these files statically using `filesystem.New()`. Any route not matching an `/api/*` endpoint falls back to serving the React `index.html` (SPA fallback).
4. **Compilation**: `go build` produces a standalone binary that includes both the backend logic and serves the frontend assets from disk.

To execute this entire pipeline manually during development:
```bash
make build-frontend && make copy-assets && make build-backend
```

### ⚙️ Systemd Service Deployment
When deploying the application as a persistent background service (via `make deploy-service`):
- You must modify the [wwwmremote-backend.service](file:///home/aaron/dev/wwwmRemoteAccess/wwwmremote-backend.service) file in the root project folder before running the installation/deployment commands.
- Specifically, update the `WorkingDirectory` and `ExecStart` paths to point to the actual directories/files in your system (replacing the `/[PATH-TO-REPO]/` placeholder).



