import requests
import json
from hex_config import CONFIG

class HexBridge:
    def __init__(self):
        self.hex_url = CONFIG["HEXSTRIKE_URL"]
        self.ai_url = CONFIG["LOCALAI_URL"]
        # Use a session for better connection stability on Parrot
        self.session = requests.Session()

    def execute_and_analyze(self, tool, target):
        cmd = f"{tool} {target}"
        if tool == "sherlock":
            cmd = f"sherlock --print-found --folder /tmp {target}"

        try:
            # 1. Hit HexStrike
            tool_resp = self.session.post(f"{self.hex_url}/command", json={"command": cmd}, timeout=310).json()
            output = tool_resp.get("output", tool_resp.get("stdout", "No output."))

            # 2. Hit LocalAI
            ai_analysis = self.ask_local_ai(tool, output)

            return {"output": output, "analysis": ai_analysis}
        except Exception as e:
            return {"error": str(e)}

    def ask_local_ai(self, tool, tool_output):
        # We use 'localhost' explicitly as curl did, or '127.0.0.1'
        url = f"{self.ai_url}/chat/completions"
        payload = {
            "model": "gpt-4",
            "messages": [{"role": "user", "content": f"Analyze: {tool_output[:1000]}"}],
            "max_tokens": 150
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