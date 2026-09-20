from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
from pydantic import BaseModel
from core.hex_bridge import HexBridge
import asyncio
import subprocess
import json
import os
import socket
import tempfile
import datetime
from datetime import datetime as dt
from pathlib import Path

INTEL_PATH = Path(os.path.expanduser("~/.hexstrike/intel.json"))


def _load_intel():
    if INTEL_PATH.exists():
        try:
            return json.load(open(INTEL_PATH))
        except Exception:
            return {}
    return {}

app = FastAPI()
bridge = HexBridge()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Paths
STRIKE_PATH = os.path.expanduser("~/.hexstrike/strikes.json")
SESSION_PATH = os.path.expanduser("~/.hexstrike/sessions.json")

def _ensure_dirs():
    os.makedirs(os.path.dirname(STRIKE_PATH), exist_ok=True)
    os.makedirs(os.path.dirname(SESSION_PATH), exist_ok=True)

def _load_json(path, default=None):
    try:
        with open(path) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return default or {}

def _save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2, default=str)

class StrikeRequest(BaseModel):
    tool: str
    target: str

class SessionSaveRequest(BaseModel):
    name: str
    target: str
    tool_logs: list = []
    ai_logs: list = []
    settings: dict = {}
    compromise_level: int = 0
    tool_history: list = []

class ScheduleStrikeRequest(BaseModel):
    tool: str
    target: str
    schedule_time: str  # ISO timestamp
    notes: str = ""

class PortscanRequest(BaseModel):
    host: str
    ports: str = "1-1000"
    deep: bool = False

class ShareRequest(BaseModel):
    target: str
    session_name: str = ""
    recipients: list = []

@app.post("/execute")
async def execute(req: StrikeRequest):
    # Now calls the async version of the bridge
    return await bridge.execute_and_analyze(req.tool, req.target)

@app.get("/target-intel")
async def get_target_intel(target: str):
    return bridge._get_target_intel(target)

@app.get("/export-report")
async def export_report(target: str):
    intel = bridge._get_target_intel(target)
    if not intel or not intel["history"]:
        return {"error": "No intelligence found for target."}

    report = f"# HexStrike Sovereign Report: {target}\n"
    report += f"**Generated:** {dt.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    report += "---\n\n"

    # Target info
    report += "## Target Information\n\n"
    report += f"- **Target:** `{target}`\n"
    if intel.get("dns"):
        report += f"- **DNS:** {intel['dns']}\n"
    if intel.get("whois"):
        report += f"- **WHOIS:** {intel['whois']}\n"
    report += "\n"

    # Summary stats
    total_strikes = len(intel["history"])
    tools_used = set(h["tool"] for h in intel["history"])
    report += "## Summary\n\n"
    report += f"- **Total Strikes:** {total_strikes}\n"
    report += f"- **Tools Used:** {', '.join(sorted(tools_used))}\n"
    report += f"- **Findings:** {len(intel.get('findings', {}))}\n\n"

    # Strike history with full logs
    report += "## Strike History\n\n"
    for i, h in enumerate(intel["history"], 1):
        report += f"### {i}. {h['tool']} — `{h['timestamp']}`\n\n"
        report += f"**Status:** {h.get('status', 'UNKNOWN')}\n\n"
        report += f"**Output:**\n```\n{h.get('output', 'N/A')}\n```\n\n"

    # AI findings
    if intel.get("findings"):
        report += "## AI Findings\n\n"
        for fk, fv in intel["findings"].items():
            report += f"- **{fk}:** {fv}\n"
        report += "\n"

    report += "---\n*HexStrike AI — Classified — For Authorized Use Only*"

    return {"report": report}

@app.get("/execute-stream")
async def execute_stream(tool: str, target: str):
    async def event_generator():
        async for chunk in bridge.execute_stream(tool, target):
            yield f"data: {chunk}\n\n"
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/ping")
async def ping_target(host: str):
    import subprocess
    try:
        result = subprocess.run(["ping", "-c", "2", "-W", "2", host], capture_output=True, text=True, timeout=10)
        reachable = result.returncode == 0
        return {"host": host, "reachable": reachable, "output": (result.stdout or result.stderr)[-500:]}
    except Exception as e:
        return {"host": host, "reachable": False, "error": str(e)}

@app.post("/api/session/save")
async def save_session(req: SessionSaveRequest):
    import json, os
    session_path = os.path.expanduser("~/.hexstrike/sessions.json")
    os.makedirs(os.path.dirname(session_path), exist_ok=True)
    sessions = {}
    if os.path.exists(session_path):
        with open(session_path) as f:
            sessions = json.load(f)
    sessions[req.name] = {
        "target": req.target,
        "tool_logs": req.tool_logs[-200:],
        "ai_logs": req.ai_logs[-200:],
        "settings": req.settings,
        "compromise_level": req.compromise_level,
        "tool_history": req.tool_history[-50:],
        "saved_at": dt.now().isoformat(),
    }
    with open(session_path, "w") as f:
        json.dump(sessions, f, indent=2)
    return {"status": "saved", "name": req.name}

@app.get("/api/session/load")
async def load_session(name: str):
    import json, os
    session_path = os.path.expanduser("~/.hexstrike/sessions.json")
    if not os.path.exists(session_path):
        return {"error": "No sessions found"}
    with open(session_path) as f:
        sessions = json.load(f)
    return sessions.get(name, {"error": f"Session '{name}' not found"})

@app.get("/api/session/list")
async def list_sessions():
    import json, os
    session_path = os.path.expanduser("~/.hexstrike/sessions.json")
    if not os.path.exists(session_path):
        return {"sessions": {}}
    with open(session_path) as f:
        sessions = json.load(f)
    return {"sessions": sessions}

@app.delete("/api/session/delete")
async def delete_session(name: str):
    import json, os
    session_path = os.path.expanduser("~/.hexstrike/sessions.json")
    if not os.path.exists(session_path):
        return {"error": "No sessions found"}
    with open(session_path) as f:
        sessions = json.load(f)
    if name in sessions:
        del sessions[name]
        with open(session_path, "w") as f:
            json.dump(sessions, f, indent=2)
        return {"status": "deleted", "name": name}
    return {"error": f"Session '{name}' not found"}

@app.get("/api/export-json")
async def export_json(target: str):
    intel = bridge._get_target_intel(target)
    if not intel or not intel["history"]:
        return {"error": "No intelligence found for target."}
    return intel

@app.get("/api/export-csv")
async def export_csv(target: str):
    intel = bridge._get_target_intel(target)
    if not intel or not intel["history"]:
        return {"error": "No intelligence found for target."}
    import csv, io
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["timestamp", "tool", "status", "output"])
    for h in intel["history"]:
        writer.writerow([h["timestamp"], h["tool"], h["status"], h["output"][:200]])
    return {"csv": output.getvalue()}

@app.get("/api/portscan")
async def portscan(host: str, ports: str = "1-1000"):
    import subprocess
    try:
        result = subprocess.run(
            ["nmap", "-Pn", "-T4", "-p", ports, host],
            capture_output=True, text=True, timeout=60
        )
        return {"host": host, "ports": ports, "output": result.stdout[-3000:] or result.stderr[-3000:]}
    except Exception as e:
        return {"host": host, "error": str(e)}

# ============================================================================
# NEW ENDPOINTS
# ============================================================================

@app.post("/api/strike/schedule")
async def schedule_strike(req: ScheduleStrikeRequest):
    """Schedule a strike with timestamp stored in JSON file."""
    _ensure_dirs()
    strikes = _load_json(STRIKE_PATH, {})
    strike_id = f"strike_{len(strikes) + 1}_{int(dt.now().timestamp())}"
    strikes[strike_id] = {
        "id": strike_id,
        "tool": req.tool,
        "target": req.target,
        "schedule_time": req.schedule_time,
        "notes": req.notes,
        "created_at": dt.now().isoformat(),
        "status": "scheduled",
    }
    _save_json(STRIKE_PATH, strikes)
    return {"status": "scheduled", "strike_id": strike_id, "strike": strikes[strike_id]}

@app.get("/api/strike/history")
async def strike_history(target: str):
    """Return all strike history for a target."""
    strikes = _load_json(STRIKE_PATH, {})
    target_strikes = [
        {"id": sid, **s}
        for sid, s in strikes.items()
        if s.get("target") == target
    ]
    target_strikes.sort(key=lambda x: x.get("created_at", ""))
    return {"target": target, "count": len(target_strikes), "strikes": target_strikes}

@app.get("/api/target/info")
async def target_info(target: str):
    """Return WHOIS/DNS info for a target."""
    result = {
        "target": target,
        "dns": {},
        "whois": {},
        "fetched_at": dt.now().isoformat(),
    }
    # DNS lookup
    try:
        addr_info = socket.getaddrinfo(target, None)
        ips = list(set(a[4][0] for a in addr_info if a[0] == socket.AF_INET))
        result["dns"]["ips"] = ips
        result["dns"]["resolved"] = True
    except socket.gaierror as e:
        result["dns"]["error"] = str(e)
        result["dns"]["resolved"] = False
    # Reverse DNS for each IP
    if result["dns"].get("ips"):
        result["dns"]["reverse"] = {}
        for ip in result["dns"]["ips"]:
            try:
                rev = socket.gethostbyaddr(ip)
                result["dns"]["reverse"][ip] = rev[0]
            except socket.herror:
                result["dns"]["reverse"][ip] = "unknown"
    # WHOIS via subprocess
    try:
        proc = await asyncio.create_subprocess_exec(
            "whois", target,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate(timeout=15)
        if proc.returncode == 0:
            output = stdout.decode("utf-8", errors="replace")
            result["whois"]["raw"] = output[:5000]
            # Parse key fields
            for line in output.splitlines():
                line_lower = line.lower()
                if "domain name:" in line_lower:
                    result["whois"]["domain"] = line.split(":", 1)[1].strip()
                elif "registrar:" in line_lower:
                    result["whois"]["registrar"] = line.split(":", 1)[1].strip()
                elif "creation date:" in line_lower:
                    result["whois"]["created"] = line.split(":", 1)[1].strip()
                elif "expiry date:" in line_lower or "expiration date:" in line_lower:
                    result["whois"]["expires"] = line.split(":", 1)[1].strip()
                elif "name server:" in line_lower:
                    ns = line.split(":", 1)[1].strip()
                    result["whois"].setdefault("name_servers", []).append(ns)
        else:
            result["whois"]["error"] = stderr.decode("utf-8", errors="replace")[:500]
    except FileNotFoundError:
        result["whois"]["error"] = "whois command not available"
    except asyncio.TimeoutError:
        result["whois"]["error"] = "WHOIS lookup timed out"
    except Exception as e:
        result["whois"]["error"] = str(e)
    return result

@app.post("/api/collaborate/share")
async def collaborate_share(req: ShareRequest):
    """Share target session as JSON file."""
    _ensure_dirs()
    sessions = _load_json(SESSION_PATH, {})
    session_name = req.session_name or f"shared_{req.target}_{int(dt.now().timestamp())}"
    share_data = {
        "session_name": session_name,
        "target": req.target,
        "shared_at": dt.now().isoformat(),
        "recipients": req.recipients,
        "intel": bridge._get_target_intel(req.target),
    }
    # Save to shared directory
    share_dir = os.path.expanduser("~/.hexstrike/shared")
    os.makedirs(share_dir, exist_ok=True)
    share_path = os.path.join(share_dir, f"{session_name}.json")
    _save_json(share_path, share_data)
    # Also register in sessions
    sessions[session_name] = {
        "target": req.target,
        "shared_at": share_data["shared_at"],
        "path": share_path,
        "recipients": req.recipients,
    }
    _save_json(SESSION_PATH, sessions)
    return {"status": "shared", "session_name": session_name, "path": share_path, "recipients": req.recipients}

@app.get("/api/health")
async def health():
    """Return backend status."""
    return {
        "status": "online",
        "backend": "hexstrike",
        "version": "2.0.0",
        "timestamp": dt.now().isoformat(),
        "features": [
            "strike-schedule",
            "strike-history",
            "target-info",
            "collaborate-share",
            "deep-portscan",
        ],
    }

@app.post("/api/portscan/deep")
async def deep_portscan(req: PortscanRequest):
    """Full nmap -sV -sC -O deep scan."""
    if req.deep:
        cmd = ["nmap", "-sV", "-sC", "-O", "-Pn", "-T4", "-p", req.ports, req.host]
    else:
        cmd = ["nmap", "-sV", "-sC", "-Pn", "-T4", "-p", req.ports, req.host]
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate(timeout=300)
        output = stdout.decode("utf-8", errors="replace")
        err = stderr.decode("utf-8", errors="replace")
        return {
            "host": req.host,
            "ports": req.ports,
            "deep": req.deep,
            "command": " ".join(cmd),
            "output": output,
            "stderr": err,
            "exit_code": proc.returncode,
        }
    except asyncio.TimeoutError:
        return {"host": req.host, "error": "Deep scan timed out after 300s"}
    except FileNotFoundError:
        return {"host": req.host, "error": "nmap not installed"}
    except Exception as e:
        return {"host": req.host, "error": str(e)}


# Analytics & Report endpoints
INTEL_PATH = Path(os.path.expanduser("~/.hexstrike/intel.json"))
REPORTS_DIR = Path(tempfile.gettempdir()) / "hexstrike_reports"


@app.get("/api/analytics")
async def analytics():
    intel = _load_intel()
    total_strikes = 0
    tool_hits = {}
    target_counts = {}
    timestamps = []
    for target, data in intel.items():
        history = data.get("history", [])
        target_counts[target] = len(history)
        total_strikes += len(history)
        for entry in history:
            tool = entry.get("tool", "unknown")
            tool_hits[tool] = tool_hits.get(tool, 0) + 1
            ts = entry.get("timestamp", "")
            if ts:
                timestamps.append(ts)
    tool_success = {}
    for target, data in intel.items():
        for entry in data.get("history", []):
            tool = entry.get("tool", "unknown")
            output = entry.get("output", "")
            if tool not in tool_success:
                tool_success[tool] = {"success": 0, "total": 0}
            tool_success[tool]["total"] += 1
            if len(output) > 50:
                tool_success[tool]["success"] += 1
    success_by_tool = {tool: round(d["success"]/d["total"]*100,1) if d["total"] else 0 for tool,d in tool_success.items()}
    avg_compromise_time = None
    if len(timestamps) >= 2:
        try:
            parsed = sorted([datetime.fromisoformat(t) for t in timestamps])
            span = (parsed[-1] - parsed[0]).total_seconds()
            avg_compromise_time = round(span / len(parsed), 1)
        except Exception:
            avg_compromise_time = None
    top_targets = sorted(target_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    return JSONResponse({"total_strikes": total_strikes, "success_rate_by_tool": success_by_tool, "avg_compromise_time_seconds": avg_compromise_time, "top_targets": [{"target": t, "strikes": c} for t,c in top_targets], "unique_tools": len(tool_hits), "unique_targets": len(intel)})


@app.post("/api/report/generate")
async def generate_report(request: Request):
    intel = _load_intel()
    body = await request.json()
    target_filter = body.get("target") if isinstance(body, dict) else None
    targets = {target_filter: intel[target_filter]} if target_filter and target_filter in intel else intel
    rows = []
    for t, data in targets.items():
        for h in data.get("history", []):
            rows.append({"target": t, "timestamp": h.get("timestamp", ""), "tool": h.get("tool", ""), "output_preview": h.get("output", "")[:300]})
    total = len(rows)
    tools_used = set(r["tool"] for r in rows)
    top_t = sorted([(t, len(d.get("history", []))) for t,d in targets.items()], key=lambda x: x[1], reverse=True)[:5]
    findings = []
    for t, data in targets.items():
        for fk, fv in data.get("findings", {}).items():
            findings.append({"target": t, "finding": fk, "detail": str(fv)[:200]})
    html = f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>HexStrike Report</title><style>*{{margin:0;padding:0;box-sizing:border-box}}body{{background:#0a0a0a;color:#00ff41;font-family:'Courier New',monospace;padding:40px}}h1{{color:#ff0040;text-shadow:0 0 10px #ff0040;margin-bottom:20px}}h2{{color:#00ffff;margin:20px 0 10px;border-bottom:1px solid #333;padding-bottom:6px}}.stat-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:16px 0}}.stat-card{{background:#111;border:1px solid #333;padding:14px;border-radius:4px}}.stat-card .val{{font-size:1.8rem;color:#ff0040}}.stat-card .label{{font-size:0.7rem;color:#888;text-transform:uppercase}}table{{width:100%;border-collapse:collapse;margin:12px 0}}th,td{{padding:8px 10px;border:1px solid #222;text-align:left;font-size:0.8rem}}th{{background:#1a1a1a;color:#00ffff}}tr:hover{{background:#111}}.finding{{background:#1a0a0a;border-left:3px solid #ff0040;padding:8px 12px;margin:6px 0}}.footer{{margin-top:40px;font-size:0.65rem;color:#555;text-align:center}}</style></head><body><h1>&#9666; HEXSTRIKE REPORT</h1><p>Generated: {datetime.now().isoformat()}</p><div class="stat-grid"><div class="stat-card"><div class="val">{total}</div><div class="label">Total Strikes</div></div><div class="stat-card"><div class="val">{len(tools_used)}</div><div class="label">Tools Used</div></div><div class="stat-card"><div class="val">{len(targets)}</div><div class="label">Targets</div></div><div class="stat-card"><div class="val">{len(findings)}</div><div class="label">Findings</div></div></div><h2>Top Targets</h2><table><tr><th>Target</th><th>Strike Count</th></tr>{chr(10).join(f"<tr><td>{t}</td><td>{c}</td></tr>" for t,c in top_t)}</table><h2>Strike History</h2><table><tr><th>Target</th><th>Time</th><th>Tool</th><th>Output</th></tr>{chr(10).join(f"<tr><td>{r['target']}</td><td>{r['timestamp']}</td><td>{r['tool']}</td><td style='max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' title='{r['output_preview']}'>{r['output_preview']}</td></tr>" for r in rows[:200])}</table><h2>AI Findings</h2>{chr(10).join(f'<div class="finding"><strong>{f["finding"]}</strong> — {f["detail"]}</div>' for f in findings[:50]) if findings else '<p style="color:#555">No findings recorded.</p>'}<div class="footer">HexStrike AI — Classified — For Authorized Use Only</div></body></html>"""
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report_id = datetime.now().strftime("%Y%m%d%H%M%S")
    report_path = REPORTS_DIR / f"hexstrike_report_{report_id}.html"
    with open(report_path, "w") as f:
        f.write(html)
    return JSONResponse({"report_id": report_id, "format": "html", "path": str(report_path)})


@app.get("/api/report/download")
async def download_report(format: str = "html", id: str = None):
    if id:
        report_path = REPORTS_DIR / f"hexstrike_report_{id}.{format}"
    else:
        candidates = sorted(REPORTS_DIR.glob("hexstrike_report_*.*"), reverse=True)
        if not candidates:
            return JSONResponse({"error": "No report found. Generate one first."}, status_code=404)
        report_path = candidates[0]
    if not report_path.exists():
        return JSONResponse({"error": "Report not found"}, status_code=404)
    return FileResponse(report_path, media_type="text/html" if format == "html" else "application/pdf", filename=report_path.name)


# Command Templates API
TEMPLATES_PATH = Path(os.path.expanduser("~/.hexstrike/templates.json"))


def _load_templates():
    if TEMPLATES_PATH.exists():
        try:
            return json.load(open(TEMPLATES_PATH))
        except Exception:
            return []
    return []


def _save_templates(templates):
    TEMPLATES_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(TEMPLATES_PATH, "w") as f:
        json.dump(templates, f, indent=2)


@app.get("/api/templates")
async def list_templates():
    return JSONResponse(_load_templates())


@app.post("/api/templates")
async def create_template(req: dict):
    templates = _load_templates()
    template = {"id": f"tpl_{len(templates)+1}", "name": req.get("name", "Untitled"), "command": req.get("command", "")}
    templates.append(template)
    _save_templates(templates)
    return JSONResponse(template)


@app.delete("/api/templates/{template_id}")
async def delete_template(template_id: str):
    templates = _load_templates()
    templates = [t for t in templates if t.get("id") != template_id]
    _save_templates(templates)
    return JSONResponse({"deleted": True})


# Target Fingerprint API
@app.get("/api/fingerprint")
async def fingerprint(target: str):
    try:
        import aiohttp
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
            async with session.get(f"http://{target}", headers={"User-Agent": "Mozilla/5.0"}, ssl=False) as resp:
                headers = dict(resp.headers)
                server = headers.get("Server", "unknown")
                tech = []
                header_lower = {k.lower(): v for k, v in headers.items()}
                for tech_name, keywords in [("WordPress", ["wordpress"]), ("Apache", ["apache"]), ("nginx", ["nginx"]), ("IIS", ["iis"]), ("Tomcat", ["tomcat"]), ("Node.js", ["node"]), ("PHP", ["php"]), ("ASP.NET", ["asp.net"])]:
                    for kw in keywords:
                        combined = f"{server} {str(headers)}".lower()
                        if kw in combined:
                            tech.append(tech_name)
                            break
                security_headers = []
                for h in ["X-Frame-Options", "X-XSS-Protection", "Strict-Transport-Security", "Content-Security-Policy"]:
                    if h.lower() in header_lower:
                        security_headers.append(h)
                return JSONResponse({"target": target, "server": server, "technology": tech, "security_headers": security_headers, "headers": {k: v for k, v in headers.items() if k.lower() in ["server", "x-powered-by", "x-aspnet-version", "x-aura-version"]}})
    except Exception as e:
        return JSONResponse({"target": target, "error": str(e), "server": "unknown", "technology": [], "security_headers": []})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
