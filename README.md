# NullAI HexStrike Terminal 🧪🔴

> **Current Version:** v2.1.0 (Echo Update)  
> **System:** Parrot OS 7 "Echo" Security Edition  
> **Status:** Active / Stable

**NullAI HexStrike** is an advanced, AI-augmented offensive security dashboard built specifically for **Parrot OS 7**. This platform bridges the gap between raw tool output (Nmap, Nikto, EmailHarvester) and autonomous intelligence, using a local, privacy-first LLM to analyze attack vectors in real-time.

---

## 🚨 CRITICAL UPDATE (2-1-26): Intelligence Core

To enable "Pro-Level" analysis without truncating reports, you must configure the **LocalAI** model settings as follows.

### 1. Model Requirement
Download the specialized GGUF and place it in your `~/nullai_001/framework/models/` directory:
- **Model:** `Hermes-3-Llama-3.2-3B-Q4_K_M.gguf`
- **Alias:** `gpt-4`

### 2. Enhanced YAML Configuration
Create or update `~/nullai_001/framework/models/gpt-4.yaml` to prevent "mid-sentence cutoffs" and enforce strict security reasoning:

```bash
name: gpt-4
parameters:
    model: Hermes-3-Llama-3.2-3B-Q4_K_M.gguf
    temperature: 0.2     # Low for technical accuracy
    max_tokens: 2000     # Generation ceiling (prevents cutoffs)
    threads: 4           # LIMIT CPU USAGE (Prevents laptop overheating)
context_size: 8192       # Expanded window for large scan logs

```

    Note: You must restart the service after applying these changes:


```bash
    systemctl --user restart localai.service
```

🏗️ Architecture Overview

This project implements a "Blood-Red" offensive pipeline using a four-tier architecture:

    UI (React/Vite): A high-performance, split-pane dashboard for command execution and intelligence analysis.

    Backend (FastAPI): The bridge logic that coordinates between the user, the tools, and the local brain.

    HexStrike Server: The "Muscle" that executes native security tools (EmailHarvester, Nmap, SQLmap, etc.) on the Parrot OS system.

    LocalAI (Podman): The "Brain" running locally as a system service to analyze logs and suggest attack vectors.

🚦 System Port Mapping

To avoid conflicts with existing Parrot OS services, we utilize the following port standards:
Service	Port	Description
Frontend	5173	React/Vite UI Dashboard
Backend	8000	FastAPI Bridge (Python)
HexStrike	8888	HexStrike AI MCP Server
LocalAI	8090	Local Intelligence Core (Podman)
🚀 Installation & Setup
1. Prerequisites

Ensure your Parrot OS system is updated and the core engines are installed:

```bash

sudo apt update && sudo apt install hexstrike-ai podman

```

2. Configure the "Brain" (LocalAI)

We use a Podman Quadlet to run the AI as a system service. This configuration includes Resource Throttling to prevent system lockups.

A. Create Directories:

```bash

mkdir -p ~/nullai_001/framework/models
mkdir -p ~/.config/containers/systemd

```

B. Create the Optimized Service File: Create the file ~/.config/containers/systemd/localai.container and paste the following:


```bash

[Unit]
Description=LocalAI Offensive Intelligence Core
After=network-online.target

[Container]
Image=docker.io/localai/localai:latest-aio-cpu
ContainerName=local-ai
# Map Host 8090 -> Container 8080
PublishPort=8090:8080
Volume=%h/nullai_001/framework/models:/models:rw

# --- RESOURCE THROTTLING (App Level) ---
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

```

C. Activate the Service:

```bash

systemctl --user daemon-reload
systemctl --user start localai.service
sudo loginctl enable-linger $USER
```

3. Setup the Backend Bridge

```bash

cd ~/nullai_001/backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn requests pydantic

```

4. Setup the UI

```bash

cd ~/nullai_001/ui
npm install


```

🛠️ Running the Framework

Start the services in this specific order to ensure proper handshakes:

    HexStrike Server:

```bash

hexstrike_server --port 8888

```

FastAPI Backend:

```bash

# From ~/nullai_001/backend
python3 main.py

```

React Dashboard:

```bash

    # From ~/nullai_001/ui
    npm run dev
```
### 🧠 Offensive Intelligence Features

    Split-Pane Execution: View raw STDOUT from tools (left) and LocalAI reasoning (right) side-by-side.

    Persona-Driven Analysis: The AI is configured as a "Red Team Lead," providing concise, actionable exploitation summaries via the hex_bridge.py.

    Parrot OS 7 Integration: Native support for:

        EmailHarvester: Domain-based email OSINT.

        Nikto/SQLMap: Vulnerability scanning.

        TruffleHog: Secret scanning in repositories.

    Shadow Service Detection: Identifies automation tools like n8n (port 5678) and analyzes their security posture.

### 🔒 Legal & Customization

#### NullAI.tech Disclaimer: This tool is for authorized penetration testing and educational purposes only. Unauthorized use on systems you do not own is illegal.

🍴 Fork and Customize

This project is part of the NullAI Ecosystem. You are encouraged to:

    Add Modules: Expand hex_bridge.py with new tools (e.g., Metasploit, Hydra).

    UI Themes: Modify index.css to create custom "Cyber-Gothic" themes.

    Swap Models: Drop any GGUF into the /models folder and update your YAML config.

Maintained by Neo @ NullAI.tech