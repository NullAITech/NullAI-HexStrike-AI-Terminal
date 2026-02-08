#!/bin/bash

# ==============================================================================
# 🧠 NullAI HexStrike - LocalAI Intelligence Core Setup Script
# ==============================================================================
# This script configures the local AI brain as a systemd service using Podman.
# It applies specific resource limits to prevent laptop overheating.
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}[*] Starting NullAI Intelligence Core Setup...${NC}"

# 1. Install Podman if missing
if ! command -v podman &> /dev/null; then
    echo -e "${BLUE}[*] Podman not found. Installing...${NC}"
    sudo apt update && sudo apt install -y podman
else
    echo -e "${GREEN}[+] Podman is already installed.${NC}"
fi

# 2. Create Required Directories
# We use $HOME to make this work for any user (not just 'neo')
MODELS_DIR="$HOME/nullai_001/framework/models"
SYSTEMD_DIR="$HOME/.config/containers/systemd"

echo -e "${BLUE}[*] Creating directory structure...${NC}"
mkdir -p "$MODELS_DIR"
mkdir -p "$SYSTEMD_DIR"
echo -e "${GREEN}[+] Directories verified:${NC}"
echo "   - Models: $MODELS_DIR"
echo "   - Config: $SYSTEMD_DIR"

# 3. Create the Optimized Quadlet Service File
# We use a Here-Doc (cat <<EOF) to write the file directly
CONTAINER_FILE="$SYSTEMD_DIR/localai.container"

echo -e "${BLUE}[*] Generating optimized Service File ($CONTAINER_FILE)...${NC}"

cat <<EOF > "$CONTAINER_FILE"
[Unit]
Description=LocalAI Offensive Intelligence Core
After=network-online.target

[Container]
Image=docker.io/localai/localai:latest-aio-cpu
ContainerName=local-ai
# Map Host Port 8090 -> Container Port 8080
PublishPort=8090:8080
# Map the models directory (using %h for home)
Volume=%h/nullai_001/framework/models:/models:rw

# --- RESOURCE THROTTLING (App Level) ---
# Limit internal threads to prevent CPU spikes (4 is safe for laptops)
Environment=THREADS=4
Environment=DEBUG=true
Environment=MODELS_PATH=/models

[Service]
# --- RAM & CPU CAPPING (System Level) ---
# Hard limit: Kill container if it hits 6GB
MemoryMax=6G
# Soft limit: Aggressively reclaim memory at 4GB
MemoryHigh=4G
# Low CPU priority to keep UI snappy
CPUWeight=20
Restart=always

[Install]
WantedBy=default.target
EOF

echo -e "${GREEN}[+] Service file created successfully.${NC}"

# 4. Activate and Start the Service
echo -e "${BLUE}[*] Registering with systemd...${NC}"

# Reload systemd to see the new generator file
systemctl --user daemon-reload

# Enable lingering so the AI stays running even if you detach the terminal session
sudo loginctl enable-linger $USER

# Start the service
echo -e "${BLUE}[*] Starting LocalAI Service (This might take a moment)...${NC}"
systemctl --user restart local-ai.service

# 5. Verification
if systemctl --user is-active --quiet local-ai.service; then
    echo -e "${GREEN}====================================================${NC}"
    echo -e "${GREEN}✅ SUCCESS: LocalAI is running!${NC}"
    echo -e "${GREEN}====================================================${NC}"
    echo -e "📊 Status Check:"
    systemctl --user status local-ai.service --no-pager | grep "Active:"
    echo -e "\n🧠 Resource Limits:"
    systemctl --user show local-ai.service | grep -E "Memory(Max|High)"
else
    echo -e "${RED}[!] ERROR: Service failed to start. Check logs with:${NC}"
    echo "journalctl --user -u local-ai.service -f"
fi