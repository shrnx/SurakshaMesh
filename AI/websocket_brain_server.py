import asyncio
import json
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from surakshamesh_brain import brain

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

active_connections = []

# Pre-defined workers for the demo
workers_db = [
    {"id": "WKR-2401-M", "name": "Rajesh Kumar", "zone": "Furnace-A", "risk": 85, "hr": 145, "spo2": 89},
    {"id": "WKR-2402-M", "name": "Amit Singh", "zone": "Assembly", "risk": 45, "hr": 85, "spo2": 97},
    {"id": "WKR-2403-F", "name": "Priya Sharma", "zone": "Storage", "risk": 25, "hr": 72, "spo2": 98},
]

@app.websocket("/ws/brain")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    print(f"🟢 Client connected. Total: {len(active_connections)}")
    
    try:
        # Send initial state immediately
        await send_full_update(websocket)

        while True:
            # Wait for message
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "simulate_incident":
                w_id = message.get("worker_id")
                risk = message.get("risk")
                zone = message.get("zone")
                
                print(f"⚡ Processing Incident: {w_id} (Risk: {risk})")
                
                # 1. OFFLOAD BLOCKING DB CALL TO THREAD (Prevents freezing)
                await asyncio.to_thread(brain.remember, w_id, int(risk), zone)
                
                # 2. Get Actions
                context = {"workerId": w_id}
                actions = brain.autonomous_actions(context, int(risk))
                
                # 3. Send confirmations
                await websocket.send_json({
                    "type": "incident_recorded",
                    "worker_id": w_id,
                    "risk": risk,
                    "actions": actions
                })
                
                # 4. Send updated predictions
                await send_full_update(websocket)

            elif message.get("type") == "get_prediction":
                 # Just refresh everyone
                 await send_full_update(websocket)

    except WebSocketDisconnect:
        active_connections.remove(websocket)
        print("🔴 Client disconnected")
    except Exception as e:
        print(f"❗ Server Error: {e}")
        if websocket in active_connections:
            active_connections.remove(websocket)

async def send_full_update(websocket: WebSocket):
    """Helper to gather all insights and send to client"""
    updated_workers = []
    for w in workers_db:
        # Offload insight calculation too
        insights = await asyncio.to_thread(brain.get_insights, w["id"])
        w_copy = w.copy()
        w_copy["insights"] = insights
        updated_workers.append(w_copy)
    
    await websocket.send_json({
        "type": "full_update",
        "workers": updated_workers
    })

if __name__ == "__main__":
    print("🚀 SurakshaMesh Brain Server running on port 8002")
    uvicorn.run(app, host="0.0.0.0", port=8002)