# NullAI HexStrike Terminal 🧪🔴

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

To avoid conflicts with existing services (like n8n or Mixpost), this project uses the following port standards:

| Service | Port | Description |
| :--- | :--- | :--- |
| **Frontend** | `5173` | React/Vite UI Dashboard |
| **Backend** | `8000` | FastAPI Bridge (Python) |
| **HexStrike** | `8888` | HexStrike AI MCP Server |
| **LocalAI** | `8090` | Local Intelligence Core (Podman) |
| **Automation** | `5678` | n8n (Internal Automation) |

---

## 🚀 Installation & Setup

### 1. Prerequisites (Parrot OS 7)
Ensure your system is updated and the core HexStrike engine is installed:
```bash
sudo apt update && sudo apt install hexstrike-ai podman

2. Configure the "Brain" (LocalAI)

We run LocalAI as a Podman Quadlet to ensure it starts as a system service.

    Create the model directory:
    Bash

mkdir -p ~/nullai_001/framework/models

Create the service file: mkdir -p ~/.config/containers/systemd vim ~/.config/containers/systemd/localai.container
Ini, TOML

[Container]
Image=docker.io/localai/localai:latest-aio-cpu
ContainerName=local-ai
PublishPort=8090:8080
Volume=/home/neo/nullai_001/framework/models:/models:rw

[Service]
Restart=always

[Install]
WantedBy=default.target

Activate:
Bash

    systemctl --user daemon-reload
    systemctl --user start localai.service
    sudo loginctl enable-linger $USER

3. Setup the Backend Bridge
Bash

cd ~/nullai_001/backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn requests pydantic

4. Setup the UI
Bash

cd ~/nullai_001/ui
npm install

🛠️ Running the Framework

Start the services in this specific order:

    HexStrike Server:
    Bash

hexstrike_server --port 8888

FastAPI Backend:
Bash

python3 main.py

React Dashboard:
Bash

    npm run dev

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