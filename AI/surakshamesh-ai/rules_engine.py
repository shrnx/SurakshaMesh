#
# File: rules_engine.py
#
# This file contains the non-ML, "common sense" logic.
# It checks for deterministic, high-risk "hazard chains"
# and generates the correct advisory.
#

from schemas import UnifiedWorkerContext # We re-use our schema
from typing import Optional, Tuple, Dict, Any

# --- 1. The Advisory Mapping ---
# This function maps a risk score to a specific action.
def get_advisory_and_risk(risk_score: int) -> Dict[str, Any]:
    """
    Maps a final risk score to a Hinglish advisory and a risk level.
    """
    if risk_score > 90:
        return {
            "riskScore": risk_score,
            "advisory": "Turant evacuate karo, emergency!",
            "level": "CRITICAL"
        }
    elif 81 <= risk_score <= 90:
        return {
            "riskScore": risk_score,
            "advisory": "Zone chhodo, supervisor ko bolo",
            "level": "HIGH"
        }
    elif 61 <= risk_score <= 80:
        return {
            "riskScore": risk_score,
            "advisory": "Paani piyo, 5 min break lo",
            "level": "WARNING"
        }
    elif 41 <= risk_score <= 60:
        return {
            "riskScore": risk_score,
            "advisory": "Thoda alert raho, safe zone mein raho",
            "level": "CAUTION"
        }
    else: # 0-40
        return {
            "riskScore": risk_score,
            "advisory": "Sab theek hai, safe raho",
            "level": "SAFE"
        }


# --- 2. The Hazard-Chain Rule Engine ---
# This is the "common sense" expert system.
def run_hazard_chain_rules(context: UnifiedWorkerContext) -> Optional[Dict[str, Any]]:
    """
    Checks for deterministic, high-risk "facts" that
    override the ML model.
    
    Returns a dict with (riskScore, reason) if a rule is triggered,
    otherwise returns None.
    """
    
    # Get sensor values for easy access
    badge = context.badgeTelemetry
    scada = context.scadaContext
    vision = context.visionTelemetry
    profile = context.workerProfile

    # --- RULE 1: CRITICAL - Worker Down (SOS or Fall) ---
    # This is the highest priority. Risk = 100.
    if badge.sosActive:
        return {
            "riskScore": 100,
            "reason": "SOS Button Activated",
            "modelUsed": "Rule_Engine_v1"
        }
    if badge.fallDetected:
        return {
            "riskScore": 100,
            "reason": "Fall Detected",
            "modelUsed": "Rule_Engine_v1"
        }

    # --- RULE 2: HIGH - Critical Gas Leak ---
    # (High gas + high temp + worker present)
    if scada.ambientGasPpm > 75 and scada.zoneTemp > 40:
        return {
            "riskScore": 95,
            "reason": "Critical Gas + High Temp in Zone",
            "modelUsed": "Rule_Engine_v1"
        }

    # --- RULE 3: HIGH - Hypoxia/Heat Stroke Risk ---
    # (High HR + High Temp + Long Shift)
    if badge.hr > 130 and badge.skinTemp > 38.5 and profile.shiftDurationHours > 6:
        return {
            "riskScore": 90,
            "reason": "Heat Stroke Risk (High HR + Temp + Long Shift)",
            "modelUsed": "Rule_Engine_v1"
        }

    # --- RULE 4: CAUTION - Fatigue + PPE Violation ---
    if profile.fatigueScore > 0.7 and not vision.ppeCompliant:
        return {
            "riskScore": 75,
            "reason": "Fatigue + PPE Violation",
            "modelUsed": "Rule_Engine_v1"
        }

    # --- No rules triggered ---
    # If we get here, no high-priority "facts" were found,
    # so we should trust the ML model's prediction.
    return None