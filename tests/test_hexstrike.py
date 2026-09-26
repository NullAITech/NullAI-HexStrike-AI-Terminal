"""Unit and integration tests for NullAI HexStrike AI Terminal."""

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import pytest
from mcp_server import (
    get_tool_command,
    load_tools_catalog,
    mcp_tool_definitions,
    run_socket_port_scan,
)

ROOT = Path(__file__).resolve().parent.parent


def test_tools_catalog_loading():
    catalog = load_tools_catalog()
    assert isinstance(catalog, list)
    assert len(catalog) >= 10

    sample = catalog[0]
    assert "id" in sample
    assert "name" in sample
    assert "category" in sample
    assert "usefulness" in sample


def test_get_tool_command():
    nmap_cmd = get_tool_command("nmap", "127.0.0.1")
    assert "nmap" in nmap_cmd
    assert "127.0.0.1" in nmap_cmd

    sqlmap_cmd = get_tool_command("sqlmap", "example.com")
    assert "sqlmap" in sqlmap_cmd
    assert "example.com" in sqlmap_cmd

    custom_cmd = get_tool_command("unknown_tool", "10.0.0.1")
    assert "unknown_tool 10.0.0.1" == custom_cmd


def test_socket_port_scan():
    res = run_socket_port_scan("127.0.0.1", [99999, 99998], timeout=0.1)
    assert res["host"] == "127.0.0.1"
    assert res["scanned_count"] == 2
    assert isinstance(res["open_ports"], list)
    assert isinstance(res["closed_count"], int)


def test_mcp_tool_definitions():
    tools = mcp_tool_definitions()
    assert isinstance(tools, list)
    assert len(tools) >= 4
    names = [t["name"] for t in tools]
    assert "hexstrike_list_tools" in names
    assert "hexstrike_generate_cmd" in names
    assert "hexstrike_port_scan" in names
    assert "hexstrike_generate_report" in names


def test_mcp_stdio_server():
    """Verify MCP protocol over stdin/stdout."""
    proc = subprocess.Popen(
        [sys.executable, str(ROOT / "mcp_server.py")],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    try:
        # 1. Initialize
        init_req = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {"clientInfo": {"name": "test-client", "version": "1.0.0"}},
        }
        proc.stdin.write(json.dumps(init_req) + "\n")
        proc.stdin.flush()

        resp = json.loads(proc.stdout.readline())
        assert resp["id"] == 1
        assert resp["result"]["serverInfo"]["name"] == "hexstrike-terminal"

        # 2. tools/list
        list_req = {"jsonrpc": "2.0", "id": 2, "method": "tools/list"}
        proc.stdin.write(json.dumps(list_req) + "\n")
        proc.stdin.flush()

        resp2 = json.loads(proc.stdout.readline())
        assert resp2["id"] == 2
        assert len(resp2["result"]["tools"]) >= 4

        # 3. tools/call - hexstrike_generate_cmd
        call_req = {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "hexstrike_generate_cmd",
                "arguments": {"tool": "nmap", "target": "127.0.0.1"},
            },
        }
        proc.stdin.write(json.dumps(call_req) + "\n")
        proc.stdin.flush()

        resp3 = json.loads(proc.stdout.readline())
        assert resp3["id"] == 3
        content = json.loads(resp3["result"]["content"][0]["text"])
        assert content["tool"] == "nmap"
        assert "nmap -sV -sC 127.0.0.1" in content["command"]

    finally:
        proc.stdin.close()
        proc.terminate()
        proc.wait(timeout=3)


def test_cli_execution():
    # Test tools list CLI
    res = subprocess.run(
        [sys.executable, str(ROOT / "cli.py"), "tools", "--json"],
        capture_output=True,
        text=True,
    )
    assert res.returncode == 0
    data = json.loads(res.stdout)
    assert data["count"] > 0

    # Test cmd generation CLI
    res2 = subprocess.run(
        [sys.executable, str(ROOT / "cli.py"), "cmd", "sqlmap", "target.local", "--json"],
        capture_output=True,
        text=True,
    )
    assert res2.returncode == 0
    data2 = json.loads(res2.stdout)
    assert "sqlmap" in data2["command"]

    # Test report CLI
    res3 = subprocess.run(
        [sys.executable, str(ROOT / "cli.py"), "report", "test-server.org", "--json"],
        capture_output=True,
        text=True,
    )
    assert res3.returncode == 0
    data3 = json.loads(res3.stdout)
    assert "test-server.org" in data3["report"]
