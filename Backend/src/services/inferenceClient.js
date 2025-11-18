// src/services/inferenceClient.js
// src/services/inferenceClient.js
import axios from 'axios';

const AK_TIMEOUT_MS = parseInt(process.env.AK_TIMEOUT_MS || '3000', 10);
const AK_RETRIES = parseInt(process.env.AK_RETRIES || '2', 10);
const SIMULATE_ON_ERROR = (process.env.SIMULATE_AK_ON_ERROR || 'true').toLowerCase() === 'true';
const SIMULATED_RISK = parseFloat(process.env.SIMULATED_AK_RISK ?? '0.55');
const DEBUG_AK_LOG = (process.env.FUSION_DEBUG_AK_LOG || 'true').toLowerCase() === 'true';
const AK_URL = process.env.AK_INFERENCE_URL

function shallowClone(obj) {
  try { return JSON.parse(JSON.stringify(obj)); } catch (e) { return { ...obj }; }
}
function boolOrFalse(v) {
  if (typeof v === 'boolean') return v;
  if (v === '1' || v === 1) return true;
  if (v === '0' || v === 0) return false;
  if (v === 'true' || v === 'True') return true;
  if (v === 'false' || v === 'False') return false;
  return false;
}
function numberOrDefault(v, fallbackVal = 0.0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallbackVal;
}

/** Build very defensive, maximally compatible visionTelemetry and payload */
function buildAkCompatiblePayload(uwc) {
  const p = shallowClone(uwc);
  p.badgeTelemetry = p.badgeTelemetry || {};
  p.badgeTelemetry.hr = numberOrDefault(p.badgeTelemetry.hr, 0);
  p.badgeTelemetry.spo2 = numberOrDefault(p.badgeTelemetry.spo2, 0);
  p.badgeTelemetry.skinTemp = numberOrDefault(p.badgeTelemetry.skinTemp, 0.0);
  p.badgeTelemetry.fallDetected = boolOrFalse(p.badgeTelemetry.fallDetected);
  p.badgeTelemetry.sosActive = boolOrFalse(p.badgeTelemetry.sosActive);
  p.badgeTelemetry.location = p.badgeTelemetry.location || { x: 0, y: 0, zone: 'unknown' };
  p.badgeTelemetry.location.x = numberOrDefault(p.badgeTelemetry.location.x, 0);
  p.badgeTelemetry.location.y = numberOrDefault(p.badgeTelemetry.location.y, 0);
  p.badgeTelemetry.location.zone = p.badgeTelemetry.location.zone || 'unknown';

  p.visionTelemetry = p.visionTelemetry || {};
  // canonicalize booleans for ppe items
  p.visionTelemetry.ppe = p.visionTelemetry.ppe || {};
  const ppeKeys = ['helmet','vest','gloves','boots','goggles'];
  for (const k of ppeKeys) p.visionTelemetry.ppe[k] = boolOrFalse(p.visionTelemetry.ppe[k]);

  // core fields
  p.visionTelemetry.ppeCompliant = (typeof p.visionTelemetry.ppeCompliant === 'boolean') ? p.visionTelemetry.ppeCompliant : ppeKeys.every(k => p.visionTelemetry.ppe[k] === true);
  p.visionTelemetry.isCompliant = (typeof p.visionTelemetry.isCompliant === 'boolean') ? p.visionTelemetry.isCompliant : p.visionTelemetry.ppeCompliant;
  p.visionTelemetry.complianceScore = (typeof p.visionTelemetry.complianceScore === 'number' && Number.isFinite(p.visionTelemetry.complianceScore)) ? p.visionTelemetry.complianceScore : (ppeKeys.reduce((acc,k)=>acc+(p.visionTelemetry.ppe[k]?1:0),0)/ppeKeys.length);

  p.visionTelemetry.missingItems = Array.isArray(p.visionTelemetry.missingItems) ? p.visionTelemetry.missingItems : [];
  p.visionTelemetry.allFoundItems = Array.isArray(p.visionTelemetry.allFoundItems) ? p.visionTelemetry.allFoundItems : [];

  // Add many aliases / variants (camel, snake, title, lowercase)
  const v = p.visionTelemetry;
  v.ppe_compliant = v.ppeCompliant;
  v.is_compliant = v.isCompliant;
  v.compliance_score = v.complianceScore;
  v.missing_items = v.missingItems;
  v.all_found_items = v.allFoundItems;
  // different casings
  v.PPECompliant = v.ppeCompliant;
  v.PpeCompliant = v.ppeCompliant;
  v.ppecompliant = v.ppeCompliant;
  v.ppe_compliant_bool = v.ppeCompliant;

  // Duplicate the key-values to top-level prefixed fields (some servers parse alternate fields)
  p.vision_ppeCompliant = v.ppeCompliant;
  p.vision_ppe_compliant = v.ppe_compliant;
  p.vision_isCompliant = v.isCompliant;
  p.vision_complianceScore = v.complianceScore;
  p.vision_compliance_score = v.compliance_score;
  p.vision_ppe = v.ppe;
  p.vision_missingItems = v.missingItems;
  p.vision_allFoundItems = v.allFoundItems;

  // Also include a JSON string of visionTelemetry in case server expects string field
  try { p.visionTelemetry_json = JSON.stringify(v); } catch (e) { p.visionTelemetry_json = null; }

  // SCADA and workerProfile normalization
  p.scadaContext = p.scadaContext || {};
  p.scadaContext.ambientGasPpm = numberOrDefault(p.scadaContext.ambientGasPpm, 0);
  p.scadaContext.zoneTemp = numberOrDefault(p.scadaContext.zoneTemp, 0);
  p.scadaContext.zoneAlarmActive = boolOrFalse(p.scadaContext.zoneAlarmActive);

  p.workerProfile = p.workerProfile || {};
  p.workerProfile.shiftDurationHours = numberOrDefault(p.workerProfile.shiftDurationHours, 8.0);
  p.workerProfile.pastIncidentCount = numberOrDefault(p.workerProfile.pastIncidentCount ?? p.workerProfile.pastIncidents, 0);
  p.workerProfile.age = numberOrDefault(p.workerProfile.age, 0);
  p.workerProfile.fatigueScore = numberOrDefault(p.workerProfile.fatigueScore, 0.0);

  return p;
}

/* the rest of the file is same as previous: it posts payloadToSend (using axios), validates JSON response and returns {risk, simulated}.
   ... */


/** Extract numeric risk from AK JSON */
function extractRiskFromBody(body) {
  if (body === null || body === undefined) throw new Error('empty response body');
  if (typeof body === 'number') {
    if (!Number.isFinite(body)) throw new Error('non-finite numeric response');
    return Number(body);
  }
  if (typeof body === 'object') {
    if (body.risk !== undefined) {
      const r = Number(body.risk);
      if (!Number.isFinite(r)) throw new Error('non-finite "risk"');
      return r;
    }
    const vals = Object.values(body);
    for (const v of vals) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
    throw new Error('response JSON did not contain numeric risk');
  }
  throw new Error('unexpected response type');
}

/** Main exported function: reads AK URL at runtime and posts a compatibility payload */
export async function getRiskScore(uwc) {
  // If no AK URL, optionally simulate
  if (!AK_URL) {
    const msg = 'AK_INFERENCE_URL not configured';
    console.warn('[inferenceClient] ' + msg);
    if (SIMULATE_ON_ERROR) {
      console.warn('[inferenceClient] returning simulated risk due to missing AK_URL:', SIMULATED_RISK);
      const sim = Number(SIMULATED_RISK);
      const simNormalized = Number.isFinite(sim) ? Math.max(0, Math.min(1, sim > 1 ? sim / 100 : sim)) : 0.55;
      return { risk: simNormalized, simulated: true, note: msg };
    }
    throw new Error(msg);
  }

  const payload = uwc;
  let lastErr = null;

  for (let attempt = 1; attempt <= AK_RETRIES + 1; attempt++) {
    try {
      if (DEBUG_AK_LOG) console.debug('[inferenceClient] POST ->', AK_URL, 'payload keys:', Object.keys(payload));
      const resp = await axios.post(AK_URL, payload, {
        timeout: AK_TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' },
        validateStatus: null
      });

      if (DEBUG_AK_LOG) console.debug('[inferenceClient] AK responded status', resp.status);

      if (resp.status < 200 || resp.status >= 300) {
        const bodyText = (typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data)).slice(0, 2000);
        console.warn('[inferenceClient] AK responded not ok', resp.status);
        if (DEBUG_AK_LOG) console.warn('[inferenceClient] AK response body:', bodyText);
        throw new Error(`AK responded ${resp.status}`);
      }

      const ct = (resp.headers['content-type'] || '').toLowerCase();
      if (!ct.includes('application/json')) {
        if (DEBUG_AK_LOG) {
          console.warn('[inferenceClient] AK returned non-JSON content-type:', ct);
          console.warn('[inferenceClient] AK response body (truncated):', typeof resp.data === 'string' ? resp.data.slice(0,2000) : JSON.stringify(resp.data).slice(0,2000));
        }
        throw new Error('AK returned non-JSON response');
      }

      // extract numeric risk from body (this function exists above in the file)
      const body = resp.data;
      let riskRaw = extractRiskFromBody(body); // may throw if not numeric or unexpected
      let risk = Number(riskRaw);

      if (!Number.isFinite(risk)) {
        throw new Error('non-finite numeric risk from AK');
      }

      // NORMALIZE: if AK returns 1..100 scale, convert to 0..1
      if (risk > 1) {
        if (DEBUG_AK_LOG) console.debug('[inferenceClient] AK returned risk >1, normalizing by /100');
        risk = risk / 100.0;
      }

      // clamp to [0,1]
      risk = Math.max(0, Math.min(1, risk));

      if (DEBUG_AK_LOG) console.debug('[inferenceClient] AK returned risk (normalized 0..1):', risk);
      return { risk, simulated: false };
    } catch (err) {
      lastErr = err;
      console.warn('[inferenceClient] attempt', attempt, 'failed:', err?.message || err);
      if (attempt <= AK_RETRIES) {
        const backoff = 200 * attempt;
        if (DEBUG_AK_LOG) console.debug(`[inferenceClient] retrying in ${backoff}ms`);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      console.error('[inferenceClient] all attempts failed:', lastErr?.message || lastErr);
      if (SIMULATE_ON_ERROR) {
        console.warn('[inferenceClient] returning simulated risk due to AK failure:', SIMULATED_RISK);
        const sim = Number(SIMULATED_RISK);
        const simNormalized = Number.isFinite(sim) ? Math.max(0, Math.min(1, sim > 1 ? sim / 100 : sim)) : 0.55;
        return { risk: simNormalized, simulated: true, error: lastErr?.message || String(lastErr) };
      }
      throw lastErr;
    }
  }

  // fallback (shouldn't be reached)
  if (SIMULATE_ON_ERROR) {
    const sim = Number(SIMULATED_RISK);
    const simNormalized = Number.isFinite(sim) ? Math.max(0, Math.min(1, sim > 1 ? sim / 100 : sim)) : 0.55;
    return { risk: simNormalized, simulated: true };
  }
  throw new Error('inferenceClient unexpected flow');
}

export default { getRiskScore };
