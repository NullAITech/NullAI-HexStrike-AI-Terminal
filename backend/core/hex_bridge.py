import requests
import json
from hex_config import CONFIG

class HexBridge:
    def __init__(self):
        self.hex_url = CONFIG["HEXSTRIKE_URL"]
        self.ai_url = CONFIG["LOCALAI_URL"]
        # Use a session for better connection stability on Parrot
        self.session = requests.Session()

    # In backend/core/hex_bridge.py

    def execute_and_analyze(self, tool, target):
        cmd_map = {
            # OSINT
            "emailharvester": f"emailharvester -d {target}",
            "sublist3r": f"sublist3r -d {target}",
            "photon": f"photon -u http://{target} --regex",
            
            # Web
            "nikto": f"nikto -h {target}",
            "whatweb": f"whatweb -a 3 {target}",
            "gobuster": f"gobuster dir -u http://{target} -w /usr/share/wordlists/dirb/common.txt",
            
            # Infrastructure
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
            "joomscan": f"joomscan -u http://{target}",
            "gobuster": f"gobuster dir -u http://{target} -w /usr/share/wordlists/dirb/common.txt",
            "wafw00f": f"wafw00f {target}",
            "davtest": f"davtest -url http://{target}",
            "searchsploit": f"searchsploit {target}"
        }
        

        # Default to simple tool + target if not in map
        cmd = cmd_map.get(tool.lower(), f"{tool} {target}")

        try:
            # Execute via HexStrike Engine
            tool_resp = self.session.post(f"{self.hex_url}/command", json={"command": cmd}, timeout=310).json()
            output = tool_resp.get("output", tool_resp.get("stdout", "No output."))

            # Analyze with LocalAI Core
            ai_analysis = self.ask_local_ai(tool, output)

            return {"output": output, "analysis": ai_analysis}
        except Exception as e:
            return {"error": str(e)}

    def ask_local_ai(self, tool, tool_output):
        # We use 'localhost' explicitly as curl did, or '127.0.0.1'
        url = f"{self.ai_url}/chat/completions"
        payload = {
            "model": "gpt-4",
            "messages": [{"role": "user", "content": f"Analyze: {tool_output[:3000]}"}],
            "max_tokens": 1150
        }

        try:
            response = self.session.post(url, json=payload, timeout=600)
            
            # DEBUG: See what we actually got
            print(f"--- DEBUG LOCALAI RESPONSE ---")
            print(f"Status: {response.status_code}")
            print(f"Body: '{response.text}'") 
            
            if not response.text.strip():
                return "AI Core returned an empty string. CPU might be throttled."

            return response.json()['choices'][0]['message']['content']
        except Exception as e:
            return f"Intelligence Error: {str(e)}"