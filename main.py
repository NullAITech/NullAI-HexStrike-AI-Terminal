"""HexStrike API — analytics, report generation, and download."""
import json
import os
import tempfile
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

INTEL_PATH = Path(os.path.expanduser("~/.hexstrike/intel.json"))
REPORTS_DIR = Path(tempfile.gettempdir()) / "hexstrike_reports"


def _load_intel():
    if INTEL_PATH.exists():
        with open(INTEL_PATH) as f:
            return json.load(f)
    return {}


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

    # Success rate by tool — entries with output >50 chars count as success
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

    success_by_tool = {
        tool: round(data["success"] / data["total"] * 100, 1) if data["total"] else 0
        for tool, data in tool_success.items()
    }

    # Avg compromise time — time span between first and last strike / total strikes
    avg_compromise_time = None
    if len(timestamps) >= 2:
        try:
            parsed = sorted([datetime.fromisoformat(t) for t in timestamps])
            span = (parsed[-1] - parsed[0]).total_seconds()
            avg_compromise_time = round(span / len(parsed), 1)
        except Exception:
            avg_compromise_time = None

    top_targets = sorted(target_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    return JSONResponse({
        "total_strikes": total_strikes,
        "success_rate_by_tool": success_by_tool,
        "avg_compromise_time_seconds": avg_compromise_time,
        "top_targets": [{"target": t, "strikes": c} for t, c in top_targets],
        "unique_tools": len(tool_hits),
        "unique_targets": len(intel),
    })


@app.post("/api/report/generate")
async def generate_report(request: Request):
    intel = _load_intel()
    body = await request.json()
    target_filter = body.get("target") if isinstance(body, dict) else None

    targets = {target_filter: intel[target_filter]} if target_filter and target_filter in intel else intel

    rows = []
    for t, data in targets.items():
        for h in data.get("history", []):
            rows.append({
                "target": t,
                "timestamp": h.get("timestamp", ""),
                "tool": h.get("tool", ""),
                "output_preview": h.get("output", "")[:300],
            })

    total = len(rows)
    tools_used = set(r["tool"] for r in rows)
    top_t = sorted(
        [(t, len(d.get("history", []))) for t, d in targets.items()],
        key=lambda x: x[1], reverse=True
    )[:5]

    findings = []
    for t, data in targets.items():
        for fk, fv in data.get("findings", {}).items():
            findings.append({"target": t, "finding": fk, "detail": str(fv)[:200]})

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>HexStrike Report — {datetime.now().strftime('%Y-%m-%d %H:%M')}</title>
<style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ background:#0a0a0a; color:#00ff41; font-family:'Courier New',monospace; padding:40px; }}
  h1 {{ color:#ff0040; text-shadow:0 0 10px #ff0040; margin-bottom:20px; }}
  h2 {{ color:#00ffff; margin:20px 0 10px; border-bottom:1px solid #333; padding-bottom:6px; }}
  .stat-grid {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin:16px 0; }}
  .stat-card {{ background:#111; border:1px solid #333; padding:14px; border-radius:4px; }}
  .stat-card .val {{ font-size:1.8rem; color:#ff0040; }}
  .stat-card .label {{ font-size:0.7rem; color:#888; text-transform:uppercase; }}
  table {{ width:100%; border-collapse:collapse; margin:12px 0; }}
  th, td {{ padding:8px 10px; border:1px solid #222; text-align:left; font-size:0.8rem; }}
  th {{ background:#1a1a1a; color:#00ffff; }}
  tr:hover {{ background:#111; }}
  .finding {{ background:#1a0a0a; border-left:3px solid #ff0040; padding:8px 12px; margin:6px 0; }}
  .footer {{ margin-top:40px; font-size:0.65rem; color:#555; text-align:center; }}
</style>
</head>
<body>
<h1>&#9666; HEXSTRIKE REPORT</h1>
<p>Generated: {datetime.now().isoformat()}</p>

<div class="stat-grid">
  <div class="stat-card"><div class="val">{total}</div><div class="label">Total Strikes</div></div>
  <div class="stat-card"><div class="val">{len(tools_used)}</div><div class="label">Tools Used</div></div>
  <div class="stat-card"><div class="val">{len(targets)}</div><div class="label">Targets</div></div>
  <div class="stat-card"><div class="val">{len(findings)}</div><div class="label">Findings</div></div>
</div>

<h2>Top Targets</h2>
<table>
<tr><th>Target</th><th>Strike Count</th></tr>
{chr(10).join(f"<tr><td>{t}</td><td>{c}</td></tr>" for t, c in top_t)}
</table>

<h2>Strike History</h2>
<table>
<tr><th>Target</th><th>Time</th><th>Tool</th><th>Output</th></tr>
{chr(10).join(f"<tr><td>{r['target']}</td><td>{r['timestamp']}</td><td>{r['tool']}</td><td style='max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' title='{r['output_preview']}'>{r['output_preview']}</td></tr>" for r in rows[:200])}
</table>

<h2>AI Findings</h2>
{chr(10).join(f'<div class="finding"><strong>{f["finding"]}</strong> — {f["detail"]}</div>' for f in findings[:50]) if findings else '<p style="color:#555">No findings recorded.</p>'}

<div class="footer">HexStrike AI — Classified — For Authorized Use Only</div>
</body>
</html>"""

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

    return FileResponse(
        report_path,
        media_type="text/html" if format == "html" else "application/pdf",
        filename=report_path.name,
    )