import requests
import json
import os
import subprocess
import asyncio
from datetime import datetime
from hex_config import CONFIG

# Path for target intelligence storage
INTEL_PATH = os.path.expanduser("~/.hexstrike/intel.json")

class HexBridge:
    def __init__(self):
        self.hex_url = CONFIG["HEXSTRIKE_URL"]
        self.ai_url = CONFIG["LOCALAI_URL"]
        self.session = requests.Session()
        self._ensure_intel_dir()

    def _ensure_intel_dir(self):
        os.makedirs(os.path.dirname(INTEL_PATH), exist_ok=True)
        if not os.path.exists(INTEL_PATH):
            with open(INTEL_PATH, "w") as f:
                json.dump({}, f)

    def _get_target_intel(self, target):
        try:
            with open(INTEL_PATH, "r") as f:
                data = json.load(f)
                return data.get(target, {"history": [], "findings": {}})
        except Exception:
            return {"history": [], "findings": {}}

    def _save_target_intel(self, target, history_entry, findings=None):
        try:
            with open(INTEL_PATH, "r") as f:
                data = json.load(f)
            
            if target not in data:
                data[target] = {"history": [], "findings": {}}
            
            data[target]["history"].append(history_entry)
            if findings:
                data[target]["findings"].update(findings)
                
            with open(INTEL_PATH, "w") as f:
                json.dump(data, f, indent=4)
        except Exception as e:
            print(f"Intel save error: {e}")

    def get_cmd(self, tool, target):
        cmd_map = {
            "emailharvester": f"emailharvester -d {target}",
            "sublist3r": f"sublist3r -d {target}",
            "photon": f"photon -u http://{target} --regex",
            "nikto": f"nikto -h {target}",
            "whatweb": f"whatweb -a 3 {target}",
            "gobuster": f"gobuster dir -u http://{target} -w /usr/share/wordlists/dirb/common.txt",
            "sqlmap": f"sqlmap -u {target} --batch --banner",
            "snmpwalk": f"snmpwalk -c public -v2c {target}",
            "searchsploit": f"searchsploit {target}",
            "nmap": f"nmap -sV -sC {target}",
            "dmitry": f"dmitry -winsepf {target} -o /tmp/dmitry.txt",
            "dnsenum": f"dnsenum {target}",
            "amass": f"amass enum -d {target}",
            "fierce": f"fierce --domain {target}",
            "wapiti": f"wapiti -u http://{target} --flush-session -f txt",
            "commix": f"commix --url http://{target} --batch",
            "wpscan": f"wpscan --url http://{target} --no-update",
            "joomscan": f"joomscan -u {target}",
            "wafw00f": f"wafw00f {target}",
            "davtest": f"davtest -url http://{target}",
            "garak": f"garak --target_url {target}",
            "llmfuzzer": f"llmfuzzer --url {target}",
            "vigil": f"vigil scan {target}",
            "iatelligence": f"iatelligence scan {target}",
            "hydra": f"hydra -L /usr/share/wordlists/metasploit/namelist.txt -P /usr/share/wordlists/rockyou.txt {target} ssh",
            "dirb": f"dirb http://{target}",
            "metasploit": f"msfconsole -q -x 'use auxiliary/scanner/portscan/tcp; set RHOSTS {target}; run; exit'",
            "bettercap": f"bettercap -iface eth0 -eval 'net.probe on; set net.probe.throttle 10; net.recon on'",
            "aircrack-ng": f"aircrack-ng {target}",
            "hashcat": f"hashcat -m 0 {target} /usr/share/wordlists/rockyou.txt",
            "john": f"john --wordlist=/usr/share/wordlists/rockyou.txt {target}",
            "portscan": f"nmap -Pn -T4 -p 1-1000 {target}",
            # Cloud tools
            "pacu": f"pacu --target {target}",
            "scoutsuite": f"scout --target {target}",
            "cloudsploit": f"cloudsploit --target {target}",
            "prowler": f"prowler --target {target}",
            # Container tools
            "kubescape": f"kubescape scan {target}",
            "falco": f"falco --target {target}",
            "trivy": f"trivy image {target}",
            "kube-hunter": f"kube-hunter --target {target}",
            # Web fuzzing
            "xsstrike": f"xsstrike -u {target}",
            "nucleimapper": f"nuclei -u {target} -templates /usr/share/nuclei/templates/",
            "jaeles": f"jaeles scan -u {target}",
            "ffuf": f"ffuf -u {target} -w /usr/share/wordlists/dirb/common.txt",
            # OSINT
            "recondev": f"recondev --target {target}",
            "shodan": f"shodan search {target}",
            "theharvester": f"theharvester -d {target} -b all",
            # Church of Malware
            "cloudTOWN": f"python3 cloudTOWN/main.py --target {target}",
            "PEN_toolkit": f"pen --target {target}",
            "Cerberus": f"cerberus --target {target}",
            "ROGUE": f"rogue --target {target}"
        }
        return cmd_map.get(tool.lower(), tool)

    async def execute_stream(self, tool_or_list, target):
        tools = tool_or_list if isinstance(tool_or_list, list) else [tool_or_list]
        full_chain_output = ""
        
        for tool in tools:
            cmd = self.get_cmd(tool, target)
            
            # FIX: Remove literal \n from system messages to prevent UI glitches
            yield f"SYSTEM: [{datetime.now().strftime('%H:%M:%S')}] Initializing strike vector: {tool}..."
            yield f"SYSTEM: Dispatching {tool}..."

            try:
                try:
                    tool_resp = self.session.post(f"{self.hex_url}/command", json={"command": cmd}, timeout=1).json()
                    yield f"ENGINE: Response received from HexStrike Engine"
                    output = tool_resp.get("output", tool_resp.get("stdout", "No output.")) + "\n"
                    yield output
                except:
                    yield "SYSTEM: Engine offline. Falling back to Local Shell Execution..."
                    process = await asyncio.create_subprocess_shell(
                        cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.STDOUT
                    )
                    tool_output = ""
                    while True:
                        line = await process.stdout.readline()
                        if not line:
                            break
                        decoded_line = line.decode()
                        tool_output += decoded_line
                        yield decoded_line
                    await process.wait()
                    yield f"SYSTEM: Local execution of {tool} completed with exit code {process.returncode}"
                    output = tool_output

                history_entry = {
                    "timestamp": datetime.now().isoformat(),
                    "tool": tool,
                    "output": output[-5000:]
                }
                self._save_target_intel(target, history_entry)
                full_chain_output += f"\n--- {tool} output ---\n{output}"

            except Exception as e:
                yield f"ERROR: Strike {tool} failed: {str(e)}"

        yield "SYSTEM: Triggering Neural Intelligence Analysis for the complete chain..."
        ai_analysis = self.ask_local_ai_with_context(tools[0] if len(tools)==1 else "Playbook", target, full_chain_output) 
        yield f"AI_ANALYSIS: {ai_analysis}"

    def ask_local_ai_with_context(self, tool, target, current_output):
        intel = self._get_target_intel(target)
        history_context = "\n".join([f"[{h['timestamp']}] {h['tool']}: {h['output'][:200]}..." for h in intel["history"][-3:]])

        url = f"{self.ai_url}/chat/completions"
        prompt = (
            f"You are the HexStrike Intelligence Core. Target: {target}\n"
            f"Target History (Last 3 strikes):\n{history_context}\n\n"
            f"Current Tool/Chain: {tool}\n"
            f"Current Output:\n{current_output[:3000]}\n\n"
            "CRITICAL TASK: Analyze the results and output your response in this EXACT format:\n"
            "1. SUMMARY: (A brief high-level overview of findings)\n"
            "2. VULNERABILITY MATRIX:\n"
            "   - [SEVERITY] | CVE/ID | Vulnerability | Impact | Remediation\n"
            "3. MITRE ATT&CK TACTIC MAPPING:\n"
            "   - [Tactic] | Technique | Description | Evidence in output\n"
            "4. CVE SUGGESTIONS:\n"
            "   - [CVE-ID] | Product | Version | Description | CVSS Score\n"
            "5. NEXT VECTOR: (The exact next tool and target to run for compromise)\n"
            "6. STATUS: (Sovereign / Compromised / Hardened)"
        )
        
        payload = {
            "model": "gpt-4",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 1150
        }
        try:
            response = self.session.post(url, json=payload, timeout=30)
            if not response.text.strip():
                return "Intelligence Core returned an empty string."
            return response.json()['choices'][0]['message']['content']
        except Exception as e:
            return f"Intelligence Error: {str(e)}"

    async def execute_and_analyze(self, tool_or_list, target):
        full_output = []
        async for chunk in self.execute_stream(tool_or_list, target):
            full_output.append(chunk)
        output_text = "".join(full_output)
        analysis = "No analysis available"
        if "AI_ANALYSIS: " in output_text:
            analysis = output_text.split("AI_ANALYSIS: ")[-1].strip()
        return {"output": output_text, "analysis": analysis}
