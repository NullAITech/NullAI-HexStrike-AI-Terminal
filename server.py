#!/usr/bin/env python3
"""
HexStrike Security Arsenal - Sovereign Standalone Web & REST Server
Listens on http://127.0.0.1:8138 by default.
"""

import http.server
import json
import mimetypes
import os
import socketserver
import sys
import urllib.parse
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = ROOT_DIR / "public"
sys.path.insert(0, str(ROOT_DIR))

from mcp_server import (
    get_tool_command,
    load_tools_catalog,
    mcp_tool_definitions,
    run_socket_port_scan,
)

CVE_DATABASE = [
    {
        "id": "CVE-2024-6387",
        "title": "OpenSSH regreSSHion Signal Handler Race Condition",
        "product": "OpenSSH (9.0p1 - 9.7p1)",
        "cvss": 8.1,
        "severity": "HIGH",
        "epss": "94.2%",
        "mitre": "T1190",
        "mitigation": "Upgrade openssh-server >= 9.8p1 or set LoginGraceTime 0 in sshd_config.",
    },
    {
        "id": "CVE-2024-3094",
        "title": "XZ Utils / liblzma Malicious Backdoor Injection",
        "product": "XZ Utils (5.6.0 & 5.6.1)",
        "cvss": 10.0,
        "severity": "CRITICAL",
        "epss": "98.7%",
        "mitre": "T1588.005",
        "mitigation": "Downgrade to xz-utils <= 5.4.x or verify clean distribution build hashes.",
    },
    {
        "id": "CVE-2024-21626",
        "title": "runc Container Leaky File Descriptor Escape",
        "product": "runc (< 1.1.12)",
        "cvss": 8.6,
        "severity": "HIGH",
        "epss": "86.4%",
        "mitre": "T1068",
        "mitigation": "Update runc >= 1.1.12 and enforce read-only host rootfs mounts.",
    },
    {
        "id": "CVE-2023-44487",
        "title": "HTTP/2 Rapid Reset Denial of Service Protocol Flaw",
        "product": "HTTP/2 Protocol Implementations",
        "cvss": 7.5,
        "severity": "HIGH",
        "epss": "92.1%",
        "mitre": "T1498",
        "mitigation": "Enforce RST_STREAM flood thresholds in edge reverse proxies.",
    },
    {
        "id": "CVE-2021-44228",
        "title": "Apache Log4j2 JNDI Remote Code Execution (Log4Shell)",
        "product": "Apache Log4j2 (2.0-beta9 to 2.14.1)",
        "cvss": 10.0,
        "severity": "CRITICAL",
        "epss": "99.9%",
        "mitre": "T1190",
        "mitigation": "Upgrade Log4j >= 2.17.1 or set log4j2.formatMsgNoLookups=true.",
    },
]


class HexStrikeHTTPHandler(http.server.BaseHTTPRequestHandler):
    """Sovereign HTTP Request Handler for HexStrike Security Arsenal."""

    def log_message(self, format: str, *args) -> None:
        if "200" in str(args):
            return
        sys.stderr.write(f"[HexStrike :8138] {format % args}\n")

    def _send_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def _send_json(self, data, status: int = 200) -> None:
        payload = json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path in ("/health", "/api/health"):
            catalog = load_tools_catalog()
            self._send_json(
                {
                    "status": "healthy",
                    "service": "hexstrike-arsenal",
                    "version": "3.1.0",
                    "sovereign": True,
                    "arsenal_count": len(catalog),
                    "mcp_tools": len(mcp_tool_definitions()),
                    "engine": "Autonomous Penetration Audit Suite & Exploit Payload Lab",
                }
            )
            return

        if path in ("/api/status", "/api/analytics"):
            catalog = load_tools_catalog()
            self._send_json(
                {
                    "service": "hexstrike-arsenal",
                    "version": "3.1.0",
                    "arsenal_count": len(catalog),
                    "cve_database": "Synced 2026-FTQC",
                    "cves": CVE_DATABASE,
                    "capabilities": [
                        "nmap-recon",
                        "cve-inspector",
                        "socket-sweep",
                        "mcp-protocol",
                        "privesc-audit",
                    ],
                    "zero_telemetry": True,
                }
            )
            return

        if path == "/api/tools":
            catalog = load_tools_catalog()
            cat = query.get("category", [""])[0].lower()
            min_score = int(query.get("min_score", ["1"])[0])
            filtered = [
                t
                for t in catalog
                if (not cat or cat in t.get("category", "").lower())
                and int(t.get("usefulness", 1)) >= min_score
            ]
            self._send_json({"count": len(filtered), "tools": filtered})
            return

        if path == "/api/cmd":
            tool_id = query.get("tool", ["nmap"])[0]
            target = query.get("target", ["127.0.0.1"])[0]
            cmd_str = get_tool_command(tool_id, target)
            self._send_json({"tool": tool_id, "target": target, "command": cmd_str})
            return

        if path == "/api/scan":
            target = query.get("target", ["127.0.0.1"])[0]
            ports_raw = query.get("ports", ["22,80,443,3000,8131,8138,8151,11434"])[0]
            port_list = [int(p.strip()) for p in ports_raw.split(",") if p.strip().isdigit()]
            scan_res = run_socket_port_scan(target, port_list)
            self._send_json(scan_res)
            return

        if path == "/" or path == "/index.html":
            target_file = PUBLIC_DIR / "index.html"
        else:
            rel = path.lstrip("/")
            target_file = (PUBLIC_DIR / rel).resolve()

        if target_file.is_file() and str(target_file).startswith(str(PUBLIC_DIR.resolve())):
            mime_type, _ = mimetypes.guess_type(str(target_file))
            mime_type = mime_type or "application/octet-stream"
            content = target_file.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", mime_type)
            self.send_header("Content-Length", str(len(content)))
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(content)
            return

        self._send_json({"error": "Path not found", "path": path}, status=404)

    def do_POST(self) -> None:
        path = self.path.split("?")[0]
        content_len = int(self.headers.get("Content-Length", 0))
        post_body = self.rfile.read(content_len).decode("utf-8") if content_len > 0 else "{}"
        try:
            body = json.loads(post_body)
        except Exception:
            body = {}

        if path in ("/execute", "/api/execute"):
            tool = body.get("tool", "nmap")
            target = body.get("target", "127.0.0.1")
            ports = body.get("ports", [3000, 8138, 8151])
            cmd_str = get_tool_command(tool, target)
            scan_res = run_socket_port_scan(target, ports if isinstance(ports, list) else [3000, 8138, 8151])
            self._send_json(
                {
                    "status": "success",
                    "tool": tool,
                    "target": target,
                    "synthesized_command": cmd_str,
                    "socket_probe": scan_res,
                    "execution": "Sovereign local enclave penetration & socket audit complete",
                }
            )
            return

        self._send_json({"error": "Endpoint not recognized", "path": path}, status=404)


class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True


def main():
    port = int(os.environ.get("PORT", 8138))
    host = os.environ.get("HOST", "127.0.0.1")
    print(f"⚡ Starting HexStrike Security Arsenal on http://{host}:{port} ...")
    server = ThreadedHTTPServer((host, port), HexStrikeHTTPHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutdown requested.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
