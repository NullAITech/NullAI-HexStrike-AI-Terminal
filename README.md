# ◈ NullAI Security Studio

**NullAI** — Sovereign red teaming workstation powered by the Ghost Byte neural core. 156+ tools, AI-driven attack chaining, real-time threat intelligence. Built on nullai.tech.

---

## Features

### Neural Intelligence Core
- **Real-Time Analysis** — Every tool output is streamed through a neural engine that identifies vulnerabilities and maps them to the MITRE ATT&CK framework
- **Sovereign Playbooks** — Pre-defined attack chains (e.g., `Full Recon` → `Web Vuln` → `Cred Blast`) that execute tools sequentially
- **Neural Autopilot** — Self-driving mode where the AI analyzes the current state and automatically triggers the next logical tool
- **Target Intelligence Persistence** — Local storage of target profiles (`intel.json`), ensuring intelligence gathered in one session informs the next

### Sovereign Arsenal (40+ Tools)
- **AI Red Teaming**: `garak`, `llmfuzzer`, `vigil`, `iatelligence`
- **Network Recon**: `nmap`, `masscan`, `amass`, `subfinder`, `rustscan`
- **Web Exploitation**: `sqlmap`, `nikto`, `gobuster`, `ffuf`, `wapiti`, `xsstrike`, `nuclei`
- **Credential Attacks**: `hydra`, `hashcat`, `john`, `cewl`
- **Post-Exploitation**: `metasploit`, `bettercap`, `sliver`
- **Cloud/Container**: `pacu`, `kubescape`, `trivy`, `scoutsuite`, `prowler`
- **OSINT**: `theharvester`, `shodan`, `recondev`, `dnsenum`
- **Church of Malware**: `cloudTOWN`, `PEN_toolkit`, `Cerberus`, `ROGUE`

### Operator Interface
- **Ghost Byte Aesthetic** — Void-Red/Blood-Red/Obsidian CRT theme, nullai.tech brand
+ **Ghost Byte Aesthetic** — Void-Red/Blood-Red/Obsidian CRT theme, nullai.tech brand
- **Live-Wire Streaming** — Zero-latency output via Server-Sent Events (SSE)
- **Command Palette** — Fast-access tool execution via `Ctrl + K`
- **Sovereign Reporting** — One-click export of target intelligence into Markdown/HTML reports

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite (CRT shaders, dark theme) |
| Backend | FastAPI + Python (async orchestration) |
| Intelligence | LocalAI / GPT-4 (Neural reasoning layer) |
| Tooling | Parrot OS / Kali Linux toolset |

---

## Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/NullAITech/NullAI-HexStrike-AI-Terminal.git
cd NullAI-HexStrike-AI-Terminal
```

### 2. Initialize the Backend
```bash
chmod +x setup-backend.sh
./setup-backend.sh
```

### 3. Launch the Neural Core (LocalAI)
```bash
chmod +x setup-localai.sh
./setup-localai.sh
```

### 4. Start the UI
```bash
chmod +x setup-ui.sh
./setup-ui.sh
```

---

## Usage

1. **Set Target** — Enter an IP or domain in the `TARGET_VECTOR` bar
2. **Select Vector** — Choose a single tool or a **Sovereign Playbook** for automated chaining
3. **Execute** — Click `EXECUTE STRIKE`
4. **Analyze** — Watch `RAW_OUTPUT` stream and `NEURAL_ANALYSIS` vulnerability matrix
5. **Automate** — Toggle `AUTOPILOT` to let the AI drive the compromise
6. **Export** — Click `EXPORT REPORT` to save findings

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Returns strike statistics, tool success rates, top targets |
| POST | `/api/report/generate` | Generate an HTML report for a target (or all targets) |
| GET | `/api/report/download` | Download a generated report by ID or latest |

### Analytics Response
```json
{
  "total_strikes": 42,
  "success_rate_by_tool": {"nmap": 95.2, "sqlmap": 87.5},
  "avg_compromise_time_seconds": 12.4,
  "top_targets": [{"target": "192.168.1.1", "strikes": 10}],
  "unique_tools": 8,
  "unique_targets": 5
}
```

---

## Tool Categories

| Category | Tools |
|----------|-------|
| AI Red Teaming | garak, llmfuzzer, vigil, iatelligence |
| Network Recon | nmap, masscan, amass, subfinder, rustscan |
| Web Exploitation | sqlmap, nikto, gobuster, ffuf, wapiti, xsstrike, nuclei |
| Credential Attacks | hydra, hashcat, john |
| Post-Exploitation | metasploit, bettercap, sliver |
| Cloud/Container | pacu, kubescape, trivy, scoutsuite, prowler |
| OSINT | theharvester, shodan, recondev, dnsenum |

---

## Screenshots

> _Screenshots placeholder — add operational screenshots here_

---

## License

MIT License — see [LICENSE](LICENSE) for details.

**STATUS**: `Sovereign` | **KERNEL**: `Stable` | **INTELLIGENCE**: `Active`