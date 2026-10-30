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
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = ROOT_DIR / "public"

class HexStrikeHTTPHandler(http.server.BaseHTTPRequestHandler):
    """Sovereign HTTP Request Handler for HexStrike Security Arsenal."""

    def log_message(self, format: str, *args) -> None:
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
        path = self.path.split("?")[0]

        if path in ("/health", "/api/health"):
            self._send_json({
                "status": "healthy",
                "service": "hexstrike-arsenal",
                "version": "3.1.0",
                "sovereign": True,
                "engine": "Autonomous Penetration Audit Suite & Exploit Payload Lab"
            })
            return

        if path in ("/api/status", "/api/analytics"):
            self._send_json({
                "service": "hexstrike-arsenal",
                "version": "3.1.0",
                "active_strikes": 0,
                "cve_database": "Synced 2026-FTQC",
                "capabilities": [
                    "nmap-recon",
                    "cve-inspector",
                    "payload-entropy",
                    "exploit-synthesis",
                    "privesc-audit"
                ],
                "zero_telemetry": True
            })
            return

        # Serve static assets from public/
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
            tool = body.get("tool", "recon")
            target = body.get("target", "127.0.0.1")
            self._send_json({
                "status": "success",
                "tool": tool,
                "target": target,
                "execution": "Sovereign local enclave simulated audit complete",
                "findings": [
                    {"port": 8138, "service": "http", "state": "open", "risk": "LOW (Localhost Only)"}
                ]
            })
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
