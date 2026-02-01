from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from core.hex_bridge import HexBridge

app = FastAPI()
bridge = HexBridge()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class StrikeRequest(BaseModel):
    tool: str
    target: str

@app.post("/execute")
async def execute(req: StrikeRequest):
    return bridge.execute_and_analyze(req.tool, req.target)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)