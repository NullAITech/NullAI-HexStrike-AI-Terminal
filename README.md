# NullAI HexStrike Terminal 🧪🔴
# -------------------------------------------
# UPDATE (2-1-26)
## 🧠 Local Intelligence Configuration

The "Pro-Level" analysis requires specific model settings to handle dense security logs without truncation.

### 1. Model Setup
Download the required GGUF and place it in your `models/` directory:
- **Model:** `Hermes-3-Llama-3.2-3B-Q4_K_M.gguf`
- **Alias:** `gpt-4`

### 2. Model YAML Configuration
Create or update `~/nullai_001/framework/models/gpt-4.yaml` with these enhanced parameters to prevent the "mid-sentence cutoff":

\`\`\`yaml
name: gpt-4
parameters:
    model: Hermes-3-Llama-3.2-3B-Q4_K_M.gguf
    temperature: 0.2     # Low for technical accuracy
    max_tokens: 2000     # Generation ceiling
context_size: 8192       # Expanded window for large scan logs
\`\`\`

### 3. Apply Changes
After updating the YAML, you **must** restart the LocalAI service:
\`\`\`bash
systemctl --user restart localai.service
\`\`\`
# ------------------------------------------------------------------------
> **Part of the NullAI.tech Intelligence Suite.**
> An advanced, AI-augmented offensive security dashboard built for Parrot OS 7 (Echo). This platform bridges the gap between raw tool output and autonomous intelligence.

---

## 🏗️ Architecture Overview

This project implements a "Blood-Red" offensive pipeline using a four-tier architecture:

1.  **UI (React/Vite):** A high-performance, split-pane dashboard for command execution and intelligence analysis.
2.  **Backend (FastAPI):** The bridge logic that coordinates between the user, the tools, and the local brain.
3.  **HexStrike Server:** The "Muscle" that executes native security tools (Nmap, Sherlock, etc.) on the Parrot OS system.
4.  **LocalAI (Podman):** The "Brain" running locally as a system service to analyze logs and suggest attack vectors.

---

## 🚦 System Port Mapping

To avoid conflicts with existing services, this project uses the following port standards:

| Service | Port | Description |
| :--- | :--- | :--- |
| **Frontend** | `5173` | React/Vite UI Dashboard |
| **Backend** | `8000` | FastAPI Bridge (Python) |
| **HexStrike** | `8888` | HexStrike AI MCP Server |
| **LocalAI** | `8090` | Local Intelligence Core (Podman) |

---

## 🚀 Installation & Setup

### 1. Prerequisites (Parrot OS 7)
Ensure your system is updated and the core HexStrike engine is installed:
```bash
sudo apt update && sudo apt install hexstrike-ai podman
```
### 2. Configure the "Brain" (LocalAI)

We run LocalAI as a Podman Quadlet to ensure it starts as a system service.

### Create the model directory:

```bash

mkdir -p ~/nullai_001/framework/models
```
### Create the service file: 
```bash
mkdir -p ~/.config/containers/systemd vim ~/.config/containers/systemd/localai.container
```
```bash
[Container]
Image=docker.io/localai/localai:latest-aio-cpu
ContainerName=local-ai
PublishPort=8090:8080
Volume=/home/neo/nullai_001/framework/models:/models:rw

[Service]
Restart=always

[Install]
WantedBy=default.target
```
### Activate:
```bash

    systemctl --user daemon-reload
    systemctl --user start localai.service
    sudo loginctl enable-linger $USER
```
### 3. Setup the Backend Bridge
```bash

cd ~/nullai_001/backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn requests pydantic
```
### 4. Setup the UI
```bash

cd ~/nullai_001/ui
npm install
```
🛠️ Running the Framework

Start the services in this specific order:

    HexStrike Server:
```bash

hexstrike_server --port 8888
```
FastAPI Backend:

```bash

python3 main.py
```
React Dashboard:
```bash

    npm run dev
```
🧠 Offensive Intelligence Features

    Split-Pane Execution: View raw STDOUT from tools on the left and LocalAI reasoning on the right.

    Persona-Driven Analysis: The AI is configured as a "Red Team Lead," providing concise, actionable exploitation summaries.

    Shadow Service Detection: Identifies automation tools like n8n (port 5678) and analyzes their security posture.

🔒 Legal & Customization

NullAI.tech Disclaimer: This tool is for authorized penetration testing and educational purposes only. Unauthorized use on systems you do not own is illegal.
🍴 Fork and Customize

This project is part of the NullAI ecosystem. You are encouraged to:

    Fork the repo and add new tool modules to hex_bridge.py.

    Customize the UI to fit your specific SOC/Red Team requirements.

    Swap Models: Replace gpt-4 with specialized hacking LLMs in the /models directory.

Versions will be updated as time and the NullAI roadmap allow.

Maintained by Neo @ NullAI.tech