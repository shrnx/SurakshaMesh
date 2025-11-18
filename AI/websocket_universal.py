import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# --- UNIVERSAL DATA MODEL ---
class UniversalSensorData(BaseModel):
    sensor_id: str
    sensor_type: str  # "GAS", "ACOUSTIC", "THERMAL", "DUST", "SEISMIC"
    zone: str
    value: float      # The raw number (e.g., 45.5)
    unit: str         # "ppm", "dB", "°C", "PM2.5"
    status: str       # "NORMAL", "WARNING", "CRITICAL"
    prediction: str   # "Stable", "Failure in 20m", "Explosion Risk"

active_connections = []

async def broadcast(message: dict):
    for connection in active_connections:
        try:
            await connection.send_json(message)
        except:
            pass

@app.websocket("/ws/brain")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text() # Keep-alive
    except:
        active_connections.remove(websocket)

# --- UNIVERSAL INGESTION ENDPOINT ---
@app.post("/telemetry/universal")
async def receive_sensor_data(data: UniversalSensorData):
    print(f"📡 {data.sensor_type} [{data.zone}]: {data.value}{data.unit} -> {data.prediction}")
    
    # 1. Forward to Dashboard (Digital Twin)
    await broadcast({
        "type": "sensor_update",
        "data": data.dict()
    })

    # 2. Handle CRITICAL Predictions (The "Smart" Part)
    if data.status == "CRITICAL":
        await broadcast({
            "type": "environmental_alert",
            "title": f"🚨 {data.sensor_type} CRITICAL",
            "message": f"{data.prediction} in {data.zone}. Evacuate immediately.",
            "zone": data.zone
        })
        
    return {"status": "logged"}

if __name__ == "__main__":
    print("🚀 Universal Brain v5.0 Online on Port 8002")
    uvicorn.run(app, host="0.0.0.0", port=8002)