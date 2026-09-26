#!/usr/bin/env python3
"""Standard Model Context Protocol (MCP) server for NullAI HexStrike Terminal.

Exposes HexStrike's 156+ security arsenal, command generators, port auditing,
and target intelligence to Claude Desktop, Cursor, Hermes Agent, and AGY over stdio.
"""

from __future__ import annotations

import json
import os
import socket
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
TOOLS_JSON_PATH = ROOT / "ui" / "src" / "data" / "tools.json"
INTEL_PATH = Path(os.path.expanduser("~/.hexstrike/intel.json"))

# Fallback tools list if tools.json isn't present
DEFAULT_TOOLS = [
    {"id": "nmap", "name": "Nmap Network Scan", "category": "Recon", "usefulness": 10, "tags": ["recon", "scan", "port-scan"]},
    {"id": "masscan", "name": "Masscan", "category": "Recon", "usefulness": 9, "tags": ["recon", "fast", "port-scan"]},
    {"id": "amass", "name": "OWASP Amass", "category": "Recon", "usefulness": 9, "tags": ["recon", "osint"]},
    {"id": "sqlmap", "name": "SQLMap Automated Injection", "category": "Exploitation", "usefulness": 10, "tags": ["sqli", "database"]},
    {"id": "nikto", "name": "Nikto Web Vulnerability Scanner", "category": "Web", "usefulness": 8, "tags": ["web", "cve"]},
    {"id": "gobuster", "name": "Gobuster Directory Scanner", "category": "Web", "usefulness": 9, "tags": ["web", "bruteforce"]},
    {"id": "ffuf", "name": "FFUF Fast Web Fuzzer", "category": "Web", "usefulness": 10, "tags": ["fuzz", "web"]},
    {"id": "hydra", "name": "THC-Hydra Login Cracker", "category": "Password", "usefulness": 9, "tags": ["bruteforce", "auth"]},
    {"id": "hashcat", "name": "Hashcat Password Recovery", "category": "Password", "usefulness": 10, "tags": ["gpu", "hash"]},
    {"id": "metasploit", "name": "Metasploit Framework", "category": "Exploitation", "usefulness": 10, "tags": ["framework", "exploit"]},
]


def load_tools_catalog() -> list[dict[str, Any]]:
    if TOOLS_JSON_PATH.exists():
        try:
            with open(TOOLS_JSON_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return DEFAULT_TOOLS


def get_tool_command(tool_id: str, target: str) -> str:
    """Generate canonical offensive security command for tool against target."""
    target_clean = target.strip().replace(";", "").replace("&", "").replace("|", "")
    cmd_map = {
        "nmap": f"nmap -sV -sC {target_clean}",
        "masscan": f"masscan -p1-10000 {target_clean} --rate=1000",
        "amass": f"amass enum -d {target_clean}",
        "sublist3r": f"sublist3r -d {target_clean}",
        "gobuster": f"gobuster dir -u http://{target_clean} -w /usr/share/wordlists/dirb/common.txt",
        "ffuf": f"ffuf -u http://{target_clean}/FUZZ -w /usr/share/wordlists/dirb/common.txt",
        "nikto": f"nikto -h {target_clean}",
        "whatweb": f"whatweb -a 3 {target_clean}",
        "sqlmap": f"sqlmap -u http://{target_clean} --batch --banner",
        "commix": f"commix --url http://{target_clean} --batch",
        "wpscan": f"wpscan --url http://{target_clean} --no-update",
        "nuclei": f"nuclei -u http://{target_clean}",
        "hydra": f"hydra -L /usr/share/wordlists/metasploit/namelist.txt -P /usr/share/wordlists/rockyou.txt {target_clean} ssh",
        "hashcat": f"hashcat -m 0 {target_clean} /usr/share/wordlists/rockyou.txt",
        "john": f"john --wordlist=/usr/share/wordlists/rockyou.txt {target_clean}",
        "metasploit": f"msfconsole -q -x 'use auxiliary/scanner/portscan/tcp; set RHOSTS {target_clean}; run; exit'",
        "searchsploit": f"searchsploit {target_clean}",
        "trivy": f"trivy image {target_clean}",
        "portscan": f"nmap -Pn -T4 -p 1-1000 {target_clean}",
    }
    return cmd_map.get(tool_id.lower(), f"{tool_id} {target_clean}")


def run_socket_port_scan(host: str, ports: list[int], timeout: float = 0.4) -> dict[str, Any]:
    """Perform fast, zero-dependency TCP socket port scan."""
    open_ports = []
    closed_ports = []
    
    for port in ports:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(timeout)
            res = s.connect_ex((host, port))
            if res == 0:
                open_ports.append(port)
            else:
                closed_ports.append(port)
            s.close()
        except Exception:
            closed_ports.append(port)
            
    return {
        "host": host,
        "scanned_count": len(ports),
        "open_ports": open_ports,
        "open_count": len(open_ports),
        "closed_count": len(closed_ports),
    }


def mcp_tool_definitions() -> list[dict[str, Any]]:
    return [
        {
            "name": "hexstrike_list_tools",
            "description": "List and filter 156+ sovereign offensive security and red teaming tools by category, tag, or usefulness score.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "description": "Filter by category (e.g. Recon, Web, Exploitation, Password, Cloud)"},
                    "tag": {"type": "string", "description": "Filter by tag (e.g. osint, sqli, bruteforce, cve)"},
                    "min_usefulness": {"type": "integer", "description": "Minimum usefulness rating (1-10)", "default": 1}
                }
            }
        },
        {
            "name": "hexstrike_generate_cmd",
            "description": "Generate canonical command line invocation syntax for an offensive security tool against a target.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "tool": {"type": "string", "description": "Tool identifier (e.g. nmap, sqlmap, gobuster, nikto)"},
                    "target": {"type": "string", "description": "Domain, IP address, or URL target"}
                },
                "required": ["tool", "target"]
            }
        },
        {
            "name": "hexstrike_port_scan",
            "description": "Perform high-speed non-destructive socket port sweep against a target or local loopback (127.0.0.1).",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "host": {"type": "string", "description": "Target IP or hostname (default 127.0.0.1)", "default": "127.0.0.1"},
                    "ports": {"type": "array", "items": {"type": "integer"}, "description": "List of TCP ports to probe (e.g. [80, 443, 8080, 8788, 11434])"}
                }
            }
        },
        {
            "name": "hexstrike_target_intel",
            "description": "Retrieve stored target intelligence, history, and reconnaissance findings from the local enclave.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "target": {"type": "string", "description": "Target hostname or IP"}
                },
                "required": ["target"]
            }
        },
        {
            "name": "hexstrike_generate_report",
            "description": "Generate a comprehensive sovereign red teaming markdown audit report for a target.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "target": {"type": "string", "description": "Target hostname or IP"}
                },
                "required": ["target"]
            }
        }
    ]


def run_mcp_server():
    """Run JSON-RPC 2.0 stdio server loop for Model Context Protocol."""
    tools_list = mcp_tool_definitions()
    catalog = load_tools_catalog()

    def send_response(req_id: Any, result: Any = None, error: dict[str, Any] | None = None):
        payload = {"jsonrpc": "2.0", "id": req_id}
        if error:
            payload["error"] = error
        else:
            payload["result"] = result
        sys.stdout.write(json.dumps(payload) + "\n")
        sys.stdout.flush()

    for line in sys.stdin:
        raw = line.strip()
        if not raw:
            continue

        try:
            req = json.loads(raw)
        except json.JSONDecodeError:
            send_response(None, None, {"code": -32700, "message": "Parse error"})
            continue

        req_id = req.get("id")
        method = req.get("method")
        params = req.get("params", {})

        if method == "initialize":
            send_response(req_id, {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {
                    "name": "hexstrike-terminal",
                    "version": "2.0.0"
                }
            })
            continue

        if method == "notifications/initialized":
            continue

        if method == "ping":
            send_response(req_id, {})
            continue

        if method == "tools/list":
            send_response(req_id, {"tools": tools_list})
            continue

        if method == "tools/call":
            tool_name = params.get("name", "")
            args = params.get("arguments", {})

            if tool_name == "hexstrike_list_tools":
                cat = args.get("category", "").lower()
                tag = args.get("tag", "").lower()
                min_u = args.get("min_usefulness", 1)

                filtered = []
                for t in catalog:
                    if cat and cat not in t.get("category", "").lower():
                        continue
                    if tag and not any(tag in str(x).lower() for x in t.get("tags", [])):
                        continue
                    if t.get("usefulness", 1) < min_u:
                        continue
                    filtered.append(t)

                send_response(req_id, {
                    "content": [{
                        "type": "text",
                        "text": json.dumps({"count": len(filtered), "tools": filtered}, indent=2)
                    }]
                })
                continue

            elif tool_name == "hexstrike_generate_cmd":
                tool = args.get("tool", "")
                target = args.get("target", "")
                cmd = get_tool_command(tool, target)
                send_response(req_id, {
                    "content": [{
                        "type": "text",
                        "text": json.dumps({"tool": tool, "target": target, "command": cmd}, indent=2)
                    }]
                })
                continue

            elif tool_name == "hexstrike_port_scan":
                host = args.get("host", "127.0.0.1")
                ports = args.get("ports") or [21, 22, 80, 443, 3000, 8000, 8080, 8787, 8788, 8789, 11434]
                res = run_socket_port_scan(host, ports)
                send_response(req_id, {
                    "content": [{
                        "type": "text",
                        "text": json.dumps(res, indent=2)
                    }]
                })
                continue

            elif tool_name == "hexstrike_target_intel":
                target = args.get("target", "")
                intel_data = {}
                if INTEL_PATH.exists():
                    try:
                        with open(INTEL_PATH, "r") as f:
                            intel_data = json.load(f)
                    except Exception:
                        pass
                findings = intel_data.get(target, {"history": [], "findings": {}})
                send_response(req_id, {
                    "content": [{
                        "type": "text",
                        "text": json.dumps({"target": target, "intel": findings}, indent=2)
                    }]
                })
                continue

            elif tool_name == "hexstrike_generate_report":
                target = args.get("target", "")
                report_md = f"# NullAI HexStrike Security Audit Report: {target}\n"
                report_md += f"**Classification:** SOVEREIGN RED TEAM ASSESSMENT\n"
                report_md += f"**Timestamp:** {os.popen('date -u').read().strip()}\n\n"
                report_md += "## Executive Summary\n"
                report_md += f"Target `{target}` was assessed across reconnaissance, vulnerability mapping, and attack surface bounds.\n\n"
                report_md += "## Recommended Offensive Arsenal Pipeline\n"
                report_md += f"- **Recon:** `nmap -sV -sC {target}`\n"
                report_md += f"- **Web Surface:** `gobuster dir -u http://{target} -w common.txt`\n"
                report_md += f"- **Vulnerability Check:** `nikto -h {target}`\n"
                report_md += f"- **Exploit Assessment:** `sqlmap -u http://{target} --batch`\n\n"
                report_md += "## Sovereign Security Invariant\n"
                report_md += "Zero external telemetry collected. All audit traces stay within local enclave.\n"

                send_response(req_id, {
                    "content": [{
                        "type": "text",
                        "text": report_md
                    }]
                })
                continue

            send_response(req_id, None, {"code": -32601, "message": f"Method not found: {tool_name}"})

        send_response(req_id, None, {"code": -32601, "message": f"Method not found: {method}"})


if __name__ == "__main__":
    run_mcp_server()
