import asyncio
import json
import uvicorn
import pandas as pd
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from sklearn.ensemble import RandomForestClassifier
from fastapi.middleware.cors import CORSMiddleware

# --- 1. TRAIN THE AI MODEL ON STARTUP ---
print("🧠 INITIALIZING SURAKSHAMESH AI ENGINE...")
print("   ...Generating Synthetic Industrial Dataset...")

# Create fake data for training
# Features: HR, SpO2, CO, Noise, Seismic(Vib), Dust, Accel
safe_data = pd.DataFrame({
    'hr': np.random.randint(60, 100, 500),
    'spo2': np.random.randint(95, 100, 500),
    'co': np.random.randint(0, 20, 500),
    'vib': np.random.uniform(0.0, 0.1, 500),
    'acc': np.random.uniform(0.9, 1.1, 500),
    'risk': 0 # Safe
})

danger_data = pd.DataFrame({
    'hr': np.random.randint(100, 160, 500),
    'spo2': np.random.randint(80, 94, 500),
    'co': np.random.randint(21, 100, 500),
    'vib': np.random.uniform(0.2, 2.0, 500), # Seismic event
    'acc': np.random.uniform(1.5, 5.0, 500), # Impact
    'risk': 1 # Danger
})

train_data = pd.concat([safe_data, danger_data])
X = train_data[['hr', 'spo2', 'co', 'vib', 'acc']]
y = train_data['risk']

model = RandomForestClassifier(n_estimators=50)
model.fit(X, y)
print("✅ AI MODEL TRAINED & READY.")

# --- 2. WEBSOCKET SERVER ---
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.websocket("/ws/brain")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🔵 SIMULATOR CONNECTED")
    
    try:
        while True:
            # A. RECEIVE DATA
            data_text = await websocket.receive_text()
            data = json.loads(data_text)
            
            if data.get('type') == 'telemetry':
                # B. PREDICT RISK
                # Extract features in exact order
                input_vector = [[
                    data['hr'], 
                    data['spo2'], 
                    data['co'], 
                    data['vib'], 
                    data['acc']
                ]]
                
                # Run Inference
                risk_prob = model.predict_proba(input_vector)[0][1] * 100
                risk_score = int(risk_prob)
                
                # Determine Reason
                reason = "Normal Operations"
                if risk_score > 50:
                    if data['vib'] > 0.2: reason = "Seismic Activity"
                    elif data['co'] > 30: reason = "Toxic Gas"
                    elif data['acc'] > 2.0: reason = "Man Down / Impact"
                    elif data['hr'] > 120: reason = "High Stress"

                print(f"🔍 Analyzing: {input_vector} -> Risk: {risk_score}% ({reason})")

                # C. SEND RESPONSE
                response = {
                    "type": "ai_prediction",
                    "risk": risk_score,
                    "message": reason,
                    "timestamp": pd.Timestamp.now().isoformat()
                }
                await websocket.send_json(response)
                
    except WebSocketDisconnect:
        print("🔴 SIMULATOR DISCONNECTED")
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)