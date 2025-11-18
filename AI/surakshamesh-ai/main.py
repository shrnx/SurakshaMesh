#
# File: main.py
#
# ENHANCED v3.1 Intelligence Engine with Progressive Risk Calculation
# - Fixes 0% risk for compliant workers
# - Adds realistic multi-factor risk assessment
# - Maintains 100% compatibility with Guru's backend
#
import uvicorn
import pandas as pd
import joblib
import datetime
from fastapi import FastAPI, HTTPException
from schemas import UnifiedWorkerContext, RiskResponse

# Import our custom rule engine functions
from rules_engine import run_hazard_chain_rules, get_advisory_and_risk

# --- 1. Load Model at Startup ---
try:
    model = joblib.load("xgboost_model.pkl")
    print("✅ XGBoost model 'xgboost_model.pkl' loaded successfully.")
except FileNotFoundError:
    print("❌ ERROR: Model file 'xgboost_model.pkl' not found.")
    print("Please run 'python3 train.py' first.")
    model = None
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

# These are the *exact* features our model was trained on
MODEL_FEATURES = [
    'hr',
    'spo2',
    'skinTemp',
    'ambientGasPpm',
    'zoneTemp',
    'ppeCompliant',
    'shiftDurationHours',
    'pastIncidentCount',
    'age'
]

# Create the FastAPI app instance
app = FastAPI(title="SurakshaMesh X Intelligence Engine v3.1 (ENHANCED)")

import traceback
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("\n" + "="*80)
    print("❌ EXCEPTION CAUGHT:")
    print("="*80)
    print(traceback.format_exc())
    print("="*80 + "\n")
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error": str(exc),
            "type": type(exc).__name__
        }
    )

# --- 2. The Root Endpoint ---
@app.get("/")
def read_root():
    return {"status": "SurakshaMesh AI Engine v3.1 is Online (Enhanced)"}

# --- 3. The Hybrid /predict Endpoint ---
@app.post("/predict", response_model=RiskResponse)
async def predict_risk(context: UnifiedWorkerContext):
    """
    Enhanced risk assessment with progressive multi-factor analysis
    """
    
    # --- A. Run the Rule Engine First ---
    rule_result = run_hazard_chain_rules(context)
    
    if rule_result:
        print(f"⚠️  Rule triggered for {context.workerId}: {rule_result['reason']}")
        advisory_data = get_advisory_and_risk(rule_result['riskScore'])
        
        return RiskResponse(
            workerId=context.workerId,
            risk=advisory_data['riskScore'],
            riskScore=advisory_data['riskScore'],
            confidence=100.0,
            topRiskFactors=[rule_result['reason']],
            advisoryHinglish=advisory_data['advisory'],
            modelUsed=rule_result['modelUsed'],
            timestamp=datetime.datetime.now().isoformat()
        )

    # --- B. Run the ML Model ---
    if model is None:
        raise HTTPException(status_code=500, detail="ML Model is not loaded.")

    try:
        # 1. Prepare input data
        ppe_compliant_value = int(context.visionTelemetry.isCompliant or False)
        
        input_data = {
            'hr': context.badgeTelemetry.hr or 72,
            'spo2': context.badgeTelemetry.spo2 or 99,
            'skinTemp': context.badgeTelemetry.skinTemp or 36.5,
            'ambientGasPpm': context.scadaContext.ambientGasPpm or 30,
            'zoneTemp': context.scadaContext.zoneTemp or 35,
            'ppeCompliant': ppe_compliant_value,
            'shiftDurationHours': context.workerProfile.shiftDurationHours or 6.5,
            'pastIncidentCount': context.workerProfile.pastIncidentCount or 0,
            'age': context.workerProfile.age or 28
        }
        
        input_df = pd.DataFrame([input_data], columns=MODEL_FEATURES)

        # 2. Get ML prediction
        prediction_prob = model.predict_proba(input_df)[0][1]
        ml_risk_score = int(prediction_prob * 100)
        
        # ============================================================
        # === ENHANCED: PROGRESSIVE RISK CALCULATION ===
        # ============================================================
        
        print(f"\n{'='*60}")
        print(f"🧠 RISK ASSESSMENT FOR {context.workerId}")
        print(f"{'='*60}")
        
        # Start with ML base prediction
        base_ml_risk = ml_risk_score
        print(f"📊 ML Base Risk: {base_ml_risk}%")
        
        # Initialize progressive factors
        progressive_bonus = 0
        risk_factors_detailed = []
        
        # --- Factor 1: PPE Compliance (CRITICAL FACTOR) ---
        if not input_data['ppeCompliant']:
            ppe_penalty = 45
            progressive_bonus += ppe_penalty
            risk_factors_detailed.append(f"PPE Violation (+{ppe_penalty}%)")
            print(f"  ⚠️  PPE Non-Compliant: +{ppe_penalty}%")
            
            # Add specific missing items if available
            if context.visionTelemetry.missingItems:
                missing_str = ", ".join(context.visionTelemetry.missingItems)
                risk_factors_detailed.append(f"Missing: {missing_str}")
        
        # --- Factor 2: Heart Rate Elevation (Stress/Exertion) ---
        if input_data['hr'] > 100:
            hr_excess = input_data['hr'] - 100
            hr_penalty = min((hr_excess // 5) * 5, 25)  # +5% per 5 bpm, max +25%
            progressive_bonus += hr_penalty
            risk_factors_detailed.append(f"Elevated HR: {input_data['hr']} bpm (+{hr_penalty}%)")
            print(f"  ⚠️  Elevated Heart Rate ({input_data['hr']} bpm): +{hr_penalty}%")
        
        # --- Factor 3: Temperature Elevation (Heat Stress) ---
        if input_data['skinTemp'] > 37.5:
            temp_excess = input_data['skinTemp'] - 37.5
            temp_penalty = int(temp_excess * 15)  # +15% per degree
            temp_penalty = min(temp_penalty, 30)  # Cap at +30%
            progressive_bonus += temp_penalty
            risk_factors_detailed.append(f"Heat Stress: {input_data['skinTemp']}°C (+{temp_penalty}%)")
            print(f"  ⚠️  Heat Stress ({input_data['skinTemp']}°C): +{temp_penalty}%")
        
        # --- Factor 4: Shift Duration (Fatigue Accumulation) ---
        if input_data['shiftDurationHours'] > 7:
            shift_excess = input_data['shiftDurationHours'] - 7
            fatigue_penalty = int(shift_excess * 6)  # +6% per hour over 7h
            fatigue_penalty = min(fatigue_penalty, 20)  # Cap at +20%
            progressive_bonus += fatigue_penalty
            risk_factors_detailed.append(f"Fatigue: {input_data['shiftDurationHours']}h shift (+{fatigue_penalty}%)")
            print(f"  ⚠️  Long Shift ({input_data['shiftDurationHours']}h): +{fatigue_penalty}%")
        
        # --- Factor 5: Environmental Hazards (Gas Levels) ---
        if input_data['ambientGasPpm'] > 45:
            gas_excess = input_data['ambientGasPpm'] - 45
            gas_penalty = min((gas_excess // 3) * 2, 20)  # +2% per 3 ppm, max +20%
            progressive_bonus += gas_penalty
            risk_factors_detailed.append(f"High Gas: {input_data['ambientGasPpm']} ppm (+{gas_penalty}%)")
            print(f"  ⚠️  High Gas Level ({input_data['ambientGasPpm']} ppm): +{gas_penalty}%")
        
        # --- Factor 6: Zone Temperature (Heat Zone) ---
        if input_data['zoneTemp'] > 40:
            zone_temp_excess = input_data['zoneTemp'] - 40
            zone_penalty = min(zone_temp_excess // 5 * 3, 15)  # +3% per 5°C, max +15%
            progressive_bonus += zone_penalty
            risk_factors_detailed.append(f"Hot Zone: {input_data['zoneTemp']}°C (+{zone_penalty}%)")
            print(f"  ⚠️  Hot Zone ({input_data['zoneTemp']}°C): +{zone_penalty}%")
        
        # --- Factor 7: SpO2 (Oxygen Saturation) ---
        if input_data['spo2'] < 95:
            o2_deficit = 95 - input_data['spo2']
            o2_penalty = o2_deficit * 3  # +3% per point below 95
            progressive_bonus += o2_penalty
            risk_factors_detailed.append(f"Low O2: {input_data['spo2']}% SpO2 (+{o2_penalty}%)")
            print(f"  ⚠️  Low Oxygen Saturation ({input_data['spo2']}%): +{o2_penalty}%")
        
        # --- Factor 8: Past Incidents (Worker History) ---
        if input_data['pastIncidentCount'] > 0:
            history_penalty = input_data['pastIncidentCount'] * 8  # +8% per incident
            history_penalty = min(history_penalty, 25)  # Cap at +25%
            progressive_bonus += history_penalty
            risk_factors_detailed.append(f"History: {input_data['pastIncidentCount']} past incidents (+{history_penalty}%)")
            print(f"  ⚠️  Past Incidents ({input_data['pastIncidentCount']}): +{history_penalty}%")
        
        # --- CALCULATE FINAL RISK SCORE ---
        # Weighted combination: 30% ML + 70% Progressive
        # (Progressive factors are more reliable for demo)
        weighted_ml = int(base_ml_risk * 0.3)
        weighted_progressive = int(progressive_bonus * 0.7)
        final_risk_score = weighted_ml + weighted_progressive
        
        # Apply minimum baseline (industrial environments always have some risk)
        if final_risk_score < 12 and input_data['ppeCompliant']:
            final_risk_score = 12
            print(f"  ℹ️  Applied baseline industrial risk: 12%")
        
        # Cap at 95 (reserve 100 for SOS)
        final_risk_score = min(final_risk_score, 95)
        
        print(f"\n📈 Progressive Factors: +{progressive_bonus}%")
        print(f"🔢 Weighted Calculation: ({base_ml_risk}×0.3) + ({progressive_bonus}×0.7) = {final_risk_score}%")
        print(f"{'='*60}\n")
        
        # ============================================================
        # === END PROGRESSIVE RISK CALCULATION ===
        # ============================================================
        
        ml_confidence = 100.0
        
        # 4. Generate Top Risk Factors for response
        # Use detailed factors if available, otherwise use legacy logic
        if risk_factors_detailed:
            factors = risk_factors_detailed[:3]  # Top 3 factors
        else:
            # Legacy factor generation
            factors = []
            if input_data['hr'] > 110: 
                factors.append(f"Elevated HR ({input_data['hr']} bpm)")
            if input_data['ambientGasPpm'] > 50: 
                factors.append(f"High Gas ({input_data['ambientGasPpm']} ppm)")
            if not input_data['ppeCompliant']: 
                factors.append("PPE Violation (Missing Item)")
            if input_data['shiftDurationHours'] > 8: 
                factors.append("Long Shift (Fatigue)")
            if not factors: 
                factors.append("Baseline industrial risk")
        
        # 5. Get the final advisory text (using FINAL risk score)
        advisory_data = get_advisory_and_risk(final_risk_score)
        
        print(f"✅ Final Risk Score for {context.workerId}: {final_risk_score}%")

        # 6. Build and return the final response
        return RiskResponse(
            workerId=context.workerId,
            risk=final_risk_score,              # Use final enhanced score
            riskScore=final_risk_score,         # Use final enhanced score
            confidence=ml_confidence,
            topRiskFactors=factors[:3],
            advisoryHinglish=advisory_data['advisory'],
            modelUsed="XGBoost_v1_Enhanced",
            timestamp=datetime.datetime.now().isoformat()
        )

    except Exception as e:
        print(f"❌ Error during prediction: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}")

# --- 4. Run the server ---
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)