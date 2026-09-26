#!/usr/bin/env python3
"""HexStrike Terminal CLI — Sovereign offensive security and red teaming suite."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from mcp_server import (
    get_tool_command,
    load_tools_catalog,
    run_mcp_server,
    run_socket_port_scan,
)

ROOT = Path(__file__).resolve().parent


def format_table(rows: list[list[str]], headers: list[str]) -> str:
    """Format simple ASCII table."""
    col_widths = [len(h) for h in headers]
    for row in rows:
        for i, val in enumerate(row):
            col_widths[i] = max(col_widths[i], len(str(val)))
            
    header_str = " | ".join(h.ljust(col_widths[i]) for i, h in enumerate(headers))
    sep_str = "-+-".join("-" * col_widths[i] for i in range(len(headers)))
    row_strs = [" | ".join(str(r[i]).ljust(col_widths[i]) for i in range(len(headers))) for row in rows]
    return f"{header_str}\n{sep_str}\n" + "\n".join(row_strs)


def main() -> int:
    base_parser = argparse.ArgumentParser(add_help=False)
    base_parser.add_argument("--json", action="store_true", help="Format output as JSON")

    parser = argparse.ArgumentParser(
        prog="hexstrike",
        description="NullAI HexStrike Terminal — Sovereign AI-driven red teaming & security arsenal",
        parents=[base_parser],
    )
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # 1. tools
    p_tools = subparsers.add_parser("tools", help="List and search tools in the 156+ arsenal", parents=[base_parser])
    p_tools.add_argument("--category", "-c", type=str, help="Filter by category")
    p_tools.add_argument("--tag", "-t", type=str, help="Filter by tag")
    p_tools.add_argument("--min-score", "-s", type=int, default=1, help="Minimum usefulness rating (1-10)")

    # 2. cmd
    p_cmd = subparsers.add_parser("cmd", help="Generate offensive command syntax for a tool", parents=[base_parser])
    p_cmd.add_argument("tool", type=str, help="Tool ID (e.g. nmap, sqlmap, gobuster)")
    p_cmd.add_argument("target", type=str, help="Target domain, IP or URL")

    # 3. scan
    p_scan = subparsers.add_parser("scan", help="Run high-speed TCP socket sweep against target", parents=[base_parser])
    p_scan.add_argument("target", type=str, default="127.0.0.1", nargs="?", help="Target host (default: 127.0.0.1)")
    p_scan.add_argument("--ports", "-p", type=str, default="80,443,3000,8000,8080,8787,8788,8789,11434", help="Comma-separated ports")

    # 4. report
    p_report = subparsers.add_parser("report", help="Generate sovereign assessment report", parents=[base_parser])
    p_report.add_argument("target", type=str, help="Target host or IP")

    # 5. mcp
    subparsers.add_parser("mcp", help="Run Model Context Protocol (MCP) JSON-RPC stdio server", parents=[base_parser])

    # 6. serve
    p_serve = subparsers.add_parser("serve", help="Launch FastAPI backend server", parents=[base_parser])
    p_serve.add_argument("--port", type=int, default=8000, help="Port to listen on (default 8000)")
    p_serve.add_argument("--host", type=str, default="127.0.0.1", help="Host address (default 127.0.0.1)")

    args = parser.parse_args()

    if args.command == "mcp":
        return run_mcp_server()

    if args.command == "tools":
        catalog = load_tools_catalog()
        cat = (args.category or "").lower()
        tag = (args.tag or "").lower()
        min_s = args.min_score

        filtered = []
        for t in catalog:
            if cat and cat not in t.get("category", "").lower():
                continue
            if tag and not any(tag in str(x).lower() for x in t.get("tags", [])):
                continue
            if t.get("usefulness", 1) < min_s:
                continue
            filtered.append(t)

        if args.json:
            print(json.dumps({"count": len(filtered), "tools": filtered}, indent=2))
        else:
            rows = [[t.get("id", ""), t.get("name", ""), t.get("category", ""), str(t.get("usefulness", "")), ",".join(t.get("tags", [])[:3])] for t in filtered[:30]]
            headers = ["ID", "Name", "Category", "Score", "Tags"]
            print(f"\n[+] HexStrike Arsenal ({len(filtered)} tools matching criteria):")
            print(format_table(rows, headers))
            if len(filtered) > 30:
                print(f"\n... and {len(filtered) - 30} more tools. Use --json or filter by --category/--tag.")
        return 0

    if args.command == "cmd":
        command_str = get_tool_command(args.tool, args.target)
        if args.json:
            print(json.dumps({"tool": args.tool, "target": args.target, "command": command_str}, indent=2))
        else:
            print(f"\n[+] Tool: {args.tool}")
            print(f"[+] Target: {args.target}")
            print(f"[+] Command: {command_str}\n")
        return 0

    if args.command == "scan":
        port_list = [int(p.strip()) for p in args.ports.split(",") if p.strip().isdigit()]
        res = run_socket_port_scan(args.target, port_list)
        if args.json:
            print(json.dumps(res, indent=2))
        else:
            print(f"\n[+] HexStrike Socket Scan: {args.target}")
            print(f"[+] Probed: {res['scanned_count']} ports")
            print(f"[+] Open Ports: {res['open_ports']}")
            print(f"[+] Status: {'HARDENED / SECURE' if len(res['open_ports']) == 0 else 'ACTIVE SERVICES DETECTED'}\n")
        return 0

    if args.command == "report":
        from mcp_server import mcp_tool_definitions
        report_md = f"# NullAI HexStrike Security Audit Report: {args.target}\n"
        report_md += f"**Classification:** SOVEREIGN RED TEAM ASSESSMENT\n\n"
        report_md += f"Target: `{args.target}`\n"
        report_md += f"- **Recon:** {get_tool_command('nmap', args.target)}\n"
        report_md += f"- **Web Surface:** {get_tool_command('gobuster', args.target)}\n"
        report_md += f"- **Vulnerability Check:** {get_tool_command('nikto', args.target)}\n"
        report_md += f"- **Exploit Assessment:** {get_tool_command('sqlmap', args.target)}\n"
        if args.json:
            print(json.dumps({"target": args.target, "report": report_md}, indent=2))
        else:
            print(report_md)
        return 0

    if args.command == "serve":
        try:
            import uvicorn
            print(f"Launching HexStrike Backend at http://{args.host}:{args.port}...")
            uvicorn.run("backend.main:app", host=args.host, port=args.port, reload=False)
            return 0
        except Exception as e:
            print(f"Error launching backend: {e}", file=sys.stderr)
            return 1

    parser.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
