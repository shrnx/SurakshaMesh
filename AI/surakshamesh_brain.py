"""
SurakshaMesh Brain - RAM ONLY Version (Crash-Proof)
"""
from datetime import datetime, timedelta
from typing import Dict, Any
import random

class SurakshaMeshBrain:
    def __init__(self):
        # IN-MEMORY STORAGE (No database file = No locks)
        self.incidents = []
        print("🧠 Brain initialized in RAM-ONLY mode (Super Fast)")

    def remember(self, worker_id: str, risk_score: int, zone: str):
        try:
            record = {
                "worker_id": worker_id,
                "timestamp": datetime.now(),
                "risk_score": risk_score,
                "zone": zone
            }
            self.incidents.append(record)
            print(f"🧠 Memory Updated: {worker_id} | Risk: {risk_score} | Total Records: {len(self.incidents)}")
        except Exception as e:
            print(f"❗ Logic Error: {e}")

    def get_insights(self, worker_id: str) -> Dict[str, Any]:
        # Filter list in memory
        worker_incidents = [i for i in self.incidents if i["worker_id"] == worker_id]
        
        total = len(worker_incidents)
        avg = 0
        if total > 0:
            avg = sum(i["risk_score"] for i in worker_incidents) / total

        return {
            "worker_id": worker_id,
            "total_incidents": total,
            "avg_risk": round(avg, 1),
            "prediction": self.predict_next_incident(worker_id)
        }

    def predict_next_incident(self, worker_id: str) -> Dict[str, Any]:
        worker_incidents = [i for i in self.incidents if i["worker_id"] == worker_id]
        
        if len(worker_incidents) < 2:
            return {
                "prediction": "LOW",
                "confidence": 90, 
                "recommendation": "Keep monitoring",
                "time_until_hours": 8.0
            }

        # Simple Demo Logic
        last_risk = worker_incidents[-1]["risk_score"]
        
        if last_risk > 80:
            return {
                "prediction": "CRITICAL",
                "confidence": 98,
                "recommendation": "IMMEDIATE EVACUATION",
                "time_until_hours": 0.1
            }
        else:
             return {
                "prediction": "MEDIUM",
                "confidence": 75,
                "recommendation": "Schedule Break",
                "time_until_hours": 4.5
            }

    def autonomous_actions(self, context: Dict, risk_score: int):
        actions = []
        # Deterministic Actions for Demo
        if risk_score >= 80:
            actions.append("🚨 TRIGGERED: Plant Alarm (Zone 4)")
            actions.append("📱 SENT: SMS to Supervisor (+91-98...)")
            actions.append("🛑 ACTION: Machine Auto-Stop Signal Sent")
        elif risk_score >= 50:
            actions.append("⚠️ WARNING: Haptic Feedback sent to Worker")
            actions.append("👁️ LOG: CCTV Bookmark Created")
        else:
            actions.append("✅ LOG: Routine Safety Check")
            
        return actions

brain = SurakshaMeshBrain()