// Calls inference server; stubbed to safe default if unavailable.

import axios from "axios";

const URL = process.env.INFERENCE_URL;

async function getRiskScore(uwc) {
  try {
    // AK expects features or UWC; adapt as needed
    const resp = await axios.post(URL, { uwc });
    if (resp && resp.data && typeof resp.data.risk === 'number') {
      return resp.data.risk;
    }
    // fallback heuristic
    return fallbackRisk(uwc);
  } catch (e) {
    // On error, return a safe fallback (deterministic heuristic)
    return fallbackRisk(uwc);
  }
}

function fallbackRisk(uwc) {
  // Example Use Case
  // Very simple heuristic: if scada gas high and missing PPE => high risk
  const gas = (uwc.scada && uwc.scada.gas_ppm) || 0;
  const missingPPE = uwc.ppe && (uwc.ppe.helmet === false || uwc.ppe.vest === false);
  let score = 0.05;
  if (gas > 50) score += 0.5;
  if (missingPPE) score += 0.4;
  if (uwc.vitals && uwc.vitals.hr && uwc.vitals.hr > 130) score += 0.2;
  return Math.min(1, score);
}

module.exports = { getRiskScore };
