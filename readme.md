# **SurakshaMesh – Industrial Worker Safety Intelligence Platform**
### *Real-Time Telemetry • Vision AI • SCADA Fusion • AI Risk Scoring • Blockchain Anchoring • Live WebSocket Dashboard*

---

## 📌 Overview

**SurakshaMesh** is a fully integrated industrial safety intelligence system that unifies:

- **Telemetry Badge (wearables)**
- **CCTV Vision AI (PPE detection, fall detection, silhouette analysis)**
- **LoRa Mesh Location**
- **SCADA Sensors (gas, thermal, dust, acoustic, seismic)**
- **Worker Fatigue Model**
- **AI Risk Engine (AK server)**
- **Blockchain Anchoring for incidents**
- **Live Streaming via WebSockets**
- **Mock Data Streaming via SSE**

The system computes a real-time **Risk Score (0–1)** that continuously updates based on worker behavior, physiological signals, and environmental hazards.

---

# 🧱 System Architecture

```
Telemetry Badge ───────┐
                        ▼
Vision AI (PPE/Fall) ───┐
                        ▼
────────────── Fusion Engine ───────────────
- Merge Badge + Vision
- Add SCADA sensor data
- Add Worker Profile
- Compute Fatigue Score
- Build UWC (Unified Worker Context)
- Call AK AI Inference Model
- Normalize risk (0–100 ⇒ 0–1)
- Broadcast to Dashboard via WebSocket
-----------------------------------------
                        ▼
AK AI Inference Model (Risk Score)
                        ▼
WebSocket Broadcast (uwc_update)
                        ▼
Supervisor Dashboard (Next.js)
                        ▼
Blockchain Anchoring (Incident Hash)
```

---

# ⚙️ Tech Stack

### **Backend**
- Node.js (ESM)
- Express.js
- MongoDB + Mongoose
- WebSocket (`ws`)
- SSE (Server-Sent Events)
- ethers.js (blockchain)
- dotenv

### **Frontend**
- Next.js 14
- Tailwind CSS
- Framer Motion
- WebSocket client
- Lucide icons

### **Sensors & AI**
- Telemetry Badge
- LoRa Mesh
- PPE Vision AI
- SCADA Data
- Fatigue Model
- AK Risk Inference (0–100 normalized to 0–1)

---

# 📦 Installation

## 1. Clone repository
```bash
git clone https://github.com/your-org/surakshamesh.git
cd surakshamesh
```

## 2. Install backend deps
```bash
npm install
# or
bun install
```

## 3. Create `.env`
```env
PORT=8000
MONGODB_URI=<your mongo uri>

AK_INFERENCE_URL=https://your-ak-url.ngrok-free.app/predict

CORS_ORIGIN=*

MERGE_INTERVAL_MS=2000
FUSION_MAX_RECENT_MS=5000

RISK_ALERT_THRESHOLD=0.7
BROADCAST_SIMULATED=true
```

## 4. Seed workers
```bash
npm run seed:workers
```

## 5. Start backend
### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

---

# 📡 Telemetry Endpoints

## 1️⃣ Badge Telemetry  
```
POST /telemetry/badge
```

Example body:
```json
{
  "workerId": "EMP-104",
  "hr": 82,
  "spo2": 98,
  "skinTemp": 36.5,
  "location": { "x": 10, "y": 5, "zone": "Core" },
  "fallDetected": false,
  "sosActive": false
}
```

---

## 2️⃣ Vision Telemetry  
```
POST /telemetry/vision
```

Example body:
```json
{
  "workerId": "EMP-104",
  "ppe": { "helmet": true, "vest": false },
  "isCompliant": false,
  "missingItems": ["vest"]
}
```

---

# 🤖 UWC Fusion Engine (Badge + Vision + SCADA + Profile)

Fusion runs **every 2 seconds**:
1. Ensures recent badge & vision inputs  
2. Adds SCADA environmental context  
3. Adds worker profile (age, shift hours, past incidents)  
4. Computes fatigue score  
5. Builds full UWC object  
6. Sends to AK model  
7. Normalizes risk (AI returns 0–100 ⇒ we divide by 100)  
8. Broadcasts the update via WebSocket  

---

# 📡 WebSocket Streaming

## WebSocket endpoint:
```
ws://localhost:8000/ws
```

## Client example:
```js
const ws = new WebSocket("ws://localhost:8000/ws");

ws.onmessage = (msg) => {
  console.log("Update:", JSON.parse(msg.data));
};
```

## Output example sent to frontend:
```json
{
  "type": "uwc_update",
  "workerId": "EMP-104",
  "risk": 0.23,
  "simulated": false,
  "uwc": {
    "badgeTelemetry": { "hr": 78, "spo2": 97 },
    "visionTelemetry": { "isCompliant": true },
    "scadaContext": { "ambientGasPpm": 14 },
    "workerProfile": { "fatigueScore": 0.28 }
  }
}
```

---

# 📡 Live Sensor Streaming (SSE)

### Start stream:
```
GET /debug/stream
```

### Example stream output:
```json
{
  "ts":"2025-11-18T08:00:12.553Z",
  "rows":[
    { "type":"THERMAL", "value":33.2, "trend":"Rising Trend" },
    { "type":"DUST", "value":72.3, "trend":"Stable" },
    { "type":"SEISMIC", "value":2.5, "trend":"Restless" }
  ]
}
```

### Stop:
```
POST /debug/mock/stop?clientId=abc123
```

---

# 🔗 Blockchain Anchoring Flow

1. High-risk incident detected  
2. Incident created in MongoDB  
3. Hash generated  
4. Anchored via ethers.js  
5. Hash & tx stored back  
6. Broadcasted:
```json
{
  "type": "incident_created",
  "incident": { ... }
}
```

---

# 🧪 Testing

### WebSocket test
```bash
wscat -c ws://localhost:8000/ws
```

### SSE test
```bash
curl -N http://localhost:8000/debug/mock/stream
```

---

# 🛰 Offline Mode

If AK server is unreachable:
- fallback local heuristic model assigns safe default risk  
- still broadcasts with `"simulated": true`  
- incidents not created for simulated data  
- system syncs when AK returns  

---

# 🖥 Frontend Setup (Next.js)

Install:
```bash
npm install
npm run dev
```

`.env.local`:
```
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

---

# 🚀 Deployment

### Backend:
- Deploy on Railway / Render / EC2 / Docker
- Set environment variables
- Expose WebSocket endpount `/ws`

### Frontend:
- Deploy Next.js on Vercel or Cloudflare Pages

---

# 🏆 Why This Project Stands Out

- **True real-time multi-sensor safety intelligence**
- **ML + IoT fusion on edge**
- **Risk model normalized & explainable**
- **Blockchain-backed audit trail**
- **Offline fallback logic**
- **Production-grade WebSocket streaming**
- **Fully modular & extensible**

---

# 📜 License
MIT © 2025 SurakshaMesh Team
