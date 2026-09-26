# ◈ NullAI Security Studio

**NullAI** — Sovereign red teaming workstation powered by the Ghost Byte neural core. 156+ tools, AI-driven attack chaining, real-time threat intelligence. Built on nullai.tech.

---

## ◈ Features

### Neural Intelligence Core
- **Real-Time Analysis** — Every tool output streamed through neural engine mapping vulnerabilities to MITRE ATT&CK
- **Sovereign Playbooks** — Pre-defined attack chains: Recon → Web Vuln → Cred Blast → Exfil
- **Neural Autopilot** — Self-driving mode at 80% compromise threshold
- **Target Intelligence Persistence** — Local `intel.json` profile storage across sessions

### Sovereign Arsenal (156 Tools)
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
- **Live-Wire Streaming** — Zero-latency SSE output
- **Command Palette** — `Ctrl+K` fast-access tool execution with search, recent commands, keyboard nav
- **Sovereign Reporting** — MD/JSON/CSV export with HTML reports
- **Tool Detail Modal** — Click any tool for full info: description, usefulness rating, difficulty, tags
- **Favorites** — Star tools to bookmark, persisted in localStorage
- **Live Output Viewer** — Real-time strike output panel with auto-scroll
- **Toast Notifications** — Color-coded green/red/purple, auto-dismiss 5s
- **Accessibility** — ARIA labels, `:focus-visible`, skip-to-content, `prefers-reduced-motion`
- **Responsive** — 3 breakpoints, slide-out drawers, 44px touch targets

---

## ◈ Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite (CRT shaders, dark theme) |
| Backend | FastAPI + Python (async orchestration) |
| Intelligence | LocalAI / GPT-4 (Neural reasoning layer) |
| Tooling | Parrot OS / Kali Linux toolset |

---

## ◈ Quick Start

```bash
git clone https://github.com/NullAITech/NullAI-HexStrike-AI-Terminal.git
cd NullAI-HexStrike-AI-Terminal

# Initialize backend
chmod +x setup-tools.sh && ./setup-tools.sh

# Launch Neural Core (LocalAI)
chmod +x setup-localai.sh && ./setup-localai.sh

# Start UI
chmod +x setup-ui.sh && ./setup-ui.sh
```

UI opens at `http://localhost:5173`, API at `http://localhost:8000`, LocalAI at `http://localhost:8090`.

---

## ◈ Usage

1. **Set Target** — Enter IP/domain in `TARGET_VECTOR` bar
2. **Select Vector** — Single tool or Sovereign Playbook for automated chaining
3. **Execute Strike** — Watch real-time neural analysis
4. **Auto-Pilot** — Toggle autopilot at 80% compromise threshold
5. **Export** — MD/JSON/CSV report download

---

## ◈ Tool Categories (11 groups)

| Category | Count | Tools |
|----------|-------|-------|
| Exploit | 48 | metasploit, sqlmap, hydra, nikto, etc. |
| Web | 32 | gobuster, ffuf, wapiti, xsstrike, nuclei, etc. |
| Recon | 30 | nmap, masscan, amass, subfinder, rustscan, etc. |
| Post-Exploit | 14 | bettercap, sliver, mimikatz, etc. |
| OSINT | 9 | theharvester, shodan, recondev, dnsenum, etc. |
| Documentation | 6 | Rogue_Article, docs, etc. |
| Neural | 5 | garak, llmfuzzer, vigil, etc. |
| Password | 5 | hashcat, john, cewl, etc. |
| Wordlist | 3 | rockyou, seclists, etc. |
| Container | 2 | trivy, kubescape, etc. |
| Cloud | 2 | pacu, scoutsuite, etc. |

Each tool has: `usefulness` (1-10), `difficulty` (beginner/intermediate/advanced), `tags` (4-5 keywords), `category_order` (1-11).

---

## ◈ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ping` | Target reachability check |
| GET | `/api/session/list` | List saved sessions |
| POST | `/api/session/save` | Save target session |
| POST | `/api/session/load` | Load target session |
| POST | `/api/portscan` | Port scanner (nmap) |
| POST | `/api/strike` | Execute tool strike |
| GET | `/api/templates` | Command templates CRUD |
| GET | `/api/fingerprint` | Target fingerprinting |
| POST | `/api/report/generate` | Generate HTML report |
| GET | `/api/report/download` | Download report |
| GET | `/api/export-json` | Export as JSON |
| GET | `/api/export-csv` | Export as CSV |

---

## ◈ Model Context Protocol (MCP) Server

HexStrike features a native **Model Context Protocol (MCP)** JSON-RPC 2.0 stdio server, allowing Claude Desktop, Cursor, Hermes Agent, OpenCode, and AGY to directly orchestrate red team operations, query the 156+ tool arsenal, generate verified commands, and conduct non-destructive socket sweeps.

### Claude Desktop / Cursor Configuration

Add to your `claude_desktop_config.json` or Cursor MCP settings:

```json
{
  "mcpServers": {
    "hexstrike": {
      "command": "python3",
      "args": [
        "/media/neo/f2fdda77-178b-4603-ae80-c7aa4cd97908/zoth-micro-repos/NullAI-HexStrike-AI-Terminal/mcp_server.py"
      ]
    }
  }
}
```

### Exposed MCP Tools

- `hexstrike_list_tools`: Search or filter 156+ offensive tools by category, tag, and minimum usefulness score.
- `hexstrike_generate_cmd`: Generate canonical CLI command syntax for a tool against a target with safety guardrails.
- `hexstrike_port_scan`: Run high-speed TCP socket sweeps against targets or local loopback (127.0.0.1).
- `hexstrike_target_intel`: Retrieve stored target intelligence, command history, and findings.
- `hexstrike_generate_report`: Generate sovereign markdown assessment reports.

---

## ◈ Command Line Interface (CLI)

The `cli.py` binary provides a standalone, scriptable interface for humans and AI agents:

```bash
# List tools in the arsenal (filterable by category, tag, score)
python3 cli.py tools --category Recon
python3 cli.py tools --tag sqli --json

# Generate offensive command syntax
python3 cli.py cmd nmap 192.168.1.1
python3 cli.py cmd sqlmap https://test.local --json

# Run rapid loopback socket port sweep
python3 cli.py scan 127.0.0.1 --ports 80,443,3000,8000,8788,11434

# Generate comprehensive markdown assessment report
python3 cli.py report target.internal

# Run Model Context Protocol (MCP) server
python3 cli.py mcp
```

---

## ◈ Testing & Verification

Run the automated test suite with pytest:

```bash
pytest tests/ -v
```

---

## ◈ Sovereign Invariants

- **Zero-Egress by Default**: All tool execution, target intelligence, and reporting stay strictly confined to the local host (`~/.hexstrike/`). No cloud phone-home or third-party telemetry.
- **Enclave Confinement**: Default network reconnaissance and sockets target `127.0.0.1` and configured internal networks.
- **Universal Interoperability**: Dual-compatible with humans (rich CLI tables & CRT web terminal) and autonomous agents (JSON-RPC 2.0 MCP & `--json` flags).

---

## License

MIT License — see [LICENSE](LICENSE) for details.

**STATUS**: `Sovereign` | **KERNEL**: `Stable` | **INTELLIGENCE**: `Active`

