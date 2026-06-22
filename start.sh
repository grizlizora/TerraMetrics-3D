#!/bin/bash

echo "=========================================="
echo "  TerraMetrics 3D - Mac/Linux Launcher"
echo "=========================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "[INFO] Node.js is not installed on your system."
    echo "[INFO] Downloading a portable version of Node.js..."
    
    mkdir -p .node
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    
    # macOS reports 'darwin' instead of 'mac' in node releases
    if [ "$OS" = "darwin" ]; then
        OS_NAME="darwin"
    else
        OS_NAME="linux"
    fi

    ARCH=$(uname -m)
    if [ "$ARCH" = "x86_64" ]; then
        NODE_ARCH="x64"
    elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
        NODE_ARCH="arm64"
    else
        echo "[ERROR] Unsupported architecture: $ARCH"
        echo "Please install Node.js manually from nodejs.org"
        exit 1
    fi
    
    NODE_VERSION="v20.14.0"
    NODE_DIR="node-${NODE_VERSION}-${OS_NAME}-${NODE_ARCH}"
    NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/${NODE_DIR}.tar.xz"
    
    if [ ! -f ".node/${NODE_DIR}/bin/node" ]; then
        echo "[WAIT] Downloading Node.js (this may take a minute)..."
        curl -f -L "$NODE_URL" -o ".node/node.tar.xz"
        
        if [ $? -ne 0 ]; then
            echo "[ERROR] Failed to download Node.js. Are you connected to the internet?"
            exit 1
        fi
        
        echo "[WAIT] Extracting Node.js..."
        tar -xf ".node/node.tar.xz" -C .node/
        rm ".node/node.tar.xz"
    fi
    
    echo "[INFO] Portable Node.js ready!"
    export PATH="$(pwd)/.node/${NODE_DIR}/bin:$PATH"
else
    echo "[INFO] Node.js is already installed."
fi

echo ""
echo "[INFO] Installing project dependencies (if needed)..."
npm install --silent

echo "[INFO] Starting the local server..."
echo "[INFO] Your browser should open automatically in a few seconds."
echo ""

# Wait 2 seconds in the background to ensure Vite has started, then open browser
(sleep 2 && (open http://localhost:5173 2>/dev/null || xdg-open http://localhost:5173 2>/dev/null)) &

# Run Vite
npm run dev
