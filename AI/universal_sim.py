"""
SurakshaMesh X - Universal Sensor Array Simulator
Simulates: Gas, Acoustic, Thermal, Dust, and Seismic sensors with Predictive AI.
"""
import requests
import time
import random

BRAIN_URL = "http://localhost:8002/telemetry/universal"

# --- SENSOR DEFINITIONS ---
sensors = [
    { "id": "GAS-01", "type": "GAS", "zone": "Furnace-A", "unit": "ppm", "base": 15, "limit": 50 },
    { "id": "AUDIO-04", "type": "ACOUSTIC", "zone": "Generator-Room", "unit": "dB", "base": 65, "limit": 90 },
    { "id": "THERM-02", "type": "THERMAL", "zone": "Main-Tunnel", "unit": "°C", "base": 32, "limit": 45 },
    { "id": "DUST-09", "type": "DUST", "zone": "Excavation-B", "unit": "µg/m³", "base": 40, "limit": 150 },
    { "id": "VIB-01", "type": "SEISMIC", "zone": "Wall-North", "unit": "g", "base": 0.02, "limit": 1.5 }
]

# Internal state to track "drifting" values
sensor_state = {s["id"]: s["base"] for s in sensors}

print("📡 Universal Sensor Mesh Online. Monitoring 5 Environmental Parameters...")

while True:
    for s in sensors:
        # 1. Realistic Drift Logic (Brownian Motion)
        drift = random.uniform(-1.5, 1.8) # Slightly upward bias for tension
        sensor_state[s["id"]] += drift
        
        # Clamp values so they don't go negative or insane (unless we want them to)
        current_val = max(0, round(sensor_state[s["id"]], 2))
        
        # 2. Determine Status & Prediction
        limit = s["limit"]
        status = "NORMAL"
        prediction = "Stable trend"
        
        # --- SCENARIO: 5% Chance of "Pre-Failure" Spike ---
        if random.random() < 0.05: 
            current_val += (limit * 0.4) # Sudden jump
            status = "WARNING"
            prediction = f"⚠️ Rising Trend: Limit breach in <10m"
        
        # --- CRITICAL THRESHOLD CHECK ---
        if current_val > limit:
            status = "CRITICAL"
            if s["type"] == "GAS":
                prediction = "🚨 GAS LEAK DETECTED - EXPLOSION RISK"
            elif s["type"] == "ACOUSTIC":
                prediction = "🚨 BEARING FAILURE IMMINENT"
            elif s["type"] == "SEISMIC":
                prediction = "🚨 STRUCTURAL COLLAPSE PREDICTED"
            else:
                prediction = f"🚨 CRITICAL LEVEL ({current_val}{s['unit']})"

        # 3. Send to Brain
        payload = {
            "sensor_id": s["id"],
            "sensor_type": s["type"],
            "zone": s["zone"],
            "value": current_val,
            "unit": s["unit"],
            "status": status,
            "prediction": prediction
        }

        try:
            requests.post(BRAIN_URL, json=payload, timeout=0.5)
            
            # Print pretty log for your terminal demo
            icon = "🟢" if status == "NORMAL" else "🔴" if status == "CRITICAL" else "🟡"
            print(f"{icon} {s['type']} [{s['zone']}]: {current_val} {s['unit']} | {prediction}")
            
        except:
            print("❌ Brain Offline")

    time.sleep(1.5) # Fast updates