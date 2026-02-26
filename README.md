## Prerequisites

Before building the project, ensure you have the required dependencies (Go, Node.js, and npm) installed. You can check your dependencies or install them automatically on Debian/Ubuntu-based systems:

```bash
# Check if required tools are installed
make check

# Install required tools (requires apt/sudo)
make install-deps
```

## Build Instructions

You can use the provided `Makefile` to easily build, run, and install the application.

### Build the entire project
Builds the frontend, copies the assets, and compiles the backend executable.
```bash
make all
# or simply
make
```

### Run the application locally
Starts the Go backend server for development.
```bash
make run
```

### Install the application
Builds the project and installs the binary to `/usr/local/bin` (requires sudo).
```bash
sudo make install
```

### Clean up build artifacts
Removes all compiled frontend files, backend binaries, and copied assets.
```bash
make clean
```