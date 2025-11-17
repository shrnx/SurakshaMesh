// src/engine/fusionEngine.js
// Fusion engine: merges badge + vision + internal SCADA mock + worker profile,
// sends to AK (inference), persists UWC, creates incidents, and broadcasts updates.

import dotenv from 'dotenv';
dotenv.config({ path: process.env.DOTENV_PATH || '.env' });

import UWC from '../models/UWC.model.js';
import { Incident } from '../models/Incident.model.js';
import Worker from "../models/workers.model.js";
import { getRiskScore as getRiskScoreFromAK } from '../services/inferenceClient.js';
import { anchorHash } from '../services/blockchain.js';
import { broadcast } from '../ws/wsServer.js';

const MAX_RECENT_MS = parseInt(process.env.FUSION_MAX_RECENT_MS || '5000', 10);
const MERGE_INTERVAL_MS = parseInt(process.env.MERGE_INTERVAL_MS || '2000', 10);
const THRESHOLD = parseFloat(process.env.RISK_ALERT_THRESHOLD ?? '0.7');
const DEBUG_DUMP_UWC = (process.env.FUSION_DEBUG_DUMP_UWC || 'false').toLowerCase() === 'true';
const DEBUG_AK_LOG = (process.env.FUSION_DEBUG_AK_LOG || 'true').toLowerCase() === 'true';

const buffers = {};
const lastRisk = {};
globalThis.__lastUWC = null;

function ensureWorkerBuffer(workerId) {
  if (!buffers[workerId]) buffers[workerId] = { badge: [], vision: [] };
  return buffers[workerId];
}
function lastPayload(entry) { if (!entry) return {}; return entry.payload || entry; }
function toInt(v, fallback = 0) { if (v === null || v === undefined) return fallback; const n = Number(v); return Number.isFinite(n) ? Math.trunc(n) : fallback; }
function toFloat(v, fallback = 0.0) { if (v === null || v === undefined) return fallback; const n = Number(v); return Number.isFinite(n) ? n : fallback; }
function toBool(v, fallback = false) { if (typeof v === 'boolean') return v; if (v === 'true' || v === '1' || v === 1) return true; if (v === 'false' || v === '0' || v === 0) return false; return fallback; }
function safeForBroadcast(obj) { try { return JSON.parse(JSON.stringify(obj)); } catch (e) { return { _note: 'unserializable' }; } }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// SCADA mock / normalizer
function getMockScadaFor(zone) {
  const mode = (process.env.SCADA_MODE || 'B').toUpperCase();
  let gas_ppm = 20;
  let zone_temp = 30;

  if (mode === 'C') {
    gas_ppm = 42; zone_temp = 35;
  } else if (mode === 'A') {
    gas_ppm = Math.floor(10 + Math.random() * 120);
    zone_temp = parseFloat((25 + Math.random() * 30).toFixed(1));
  } else {
    const z = String(zone || '').toLowerCase();
    if (z.includes('furnace')) {
      gas_ppm = Math.floor(50 + Math.random() * 40);
      zone_temp = Math.floor(40 + Math.random() * 20);
    } else if (z.includes('chemical')) {
      gas_ppm = Math.floor(40 + Math.random() * 30);
      zone_temp = Math.floor(28 + Math.random() * 10);
    } else {
      gas_ppm = Math.floor(10 + Math.random() * 40);
      zone_temp = Math.floor(25 + Math.random() * 8);
    }
  }

  const zoneAlarmActive = gas_ppm > 50 || zone_temp > 45;
  return { ambientGasPpm: toInt(gas_ppm, 0), zoneTemp: toFloat(zone_temp, 0.0), zoneAlarmActive: Boolean(zoneAlarmActive) };
}
function normalizeScada(scadaRaw = {}) {
  const ambientGasPpm = scadaRaw.ambientGasPpm ?? scadaRaw.gas_ppm ?? scadaRaw.gasPpm ?? scadaRaw.data?.ambientGasPpm ?? 0;
  const zoneTemp = scadaRaw.zoneTemp ?? scadaRaw.temp ?? scadaRaw.temperature ?? scadaRaw.data?.zoneTemp ?? 0;
  const zoneAlarmActive = scadaRaw.zoneAlarmActive ?? scadaRaw.zoneAlarm ?? scadaRaw.alarmActive ?? false;
  return { ambientGasPpm: toInt(ambientGasPpm, 0), zoneTemp: toFloat(zoneTemp, 0.0), zoneAlarmActive: Boolean(zoneAlarmActive) };
}

// Build UWC from buffers
async function buildUWCObjectFromBuffers(workerId) {
  const b = ensureWorkerBuffer(workerId);
  const lastBadgeEntry = b.badge.length ? b.badge[b.badge.length - 1] : null;
  const lastVisionEntry = b.vision.length ? b.vision[b.vision.length - 1] : null;

  const now = Date.now();
  const lastBadgeTs = lastBadgeEntry ? lastBadgeEntry.ts : 0;
  const lastVisionTs = lastVisionEntry ? lastVisionEntry.ts : 0;

  const hasRecentBadge = (typeof lastBadgeTs === 'number' && lastBadgeTs > 0) && ((now - lastBadgeTs) <= MAX_RECENT_MS);
  const hasRecentVision = (typeof lastVisionTs === 'number' && lastVisionTs > 0) && ((now - lastVisionTs) <= MAX_RECENT_MS);

  if (!(hasRecentBadge && hasRecentVision)) {
    return { ok: false, reason: 'insufficient_recent_inputs', meta: { hasRecentBadge, hasRecentVision } };
  }

  const badgeTelemetryRaw = lastPayload(lastBadgeEntry) || {};
  const visionTelemetryRaw = lastPayload(lastVisionEntry) || {};

  const zone =
    (badgeTelemetryRaw.location && badgeTelemetryRaw.location.zone) ||
    (visionTelemetryRaw.location && visionTelemetryRaw.location.zone) ||
    (badgeTelemetryRaw.location && (badgeTelemetryRaw.location.x || badgeTelemetryRaw.location.y) ? 'default-zone' : 'default-zone');

  const scadaContext = normalizeScada(getMockScadaFor(zone));

  let workerProfile = null;
  try {
    workerProfile = await Worker.findOne({ workerId }).lean();
  } catch (err) {
    console.warn('fusion: worker lookup failed for', workerId, err?.message || err);
    workerProfile = null;
  }

  const rawBadge = badgeTelemetryRaw || {};
  const rawVitals = rawBadge.vitals || {};

  const badge_hr = toInt(rawVitals.hr ?? rawBadge.hr, 0);
  const badge_spo2 = toInt(rawVitals.spo2 ?? rawBadge.spo2, 0);
  const badge_skin = toFloat(rawVitals.skinTemp ?? rawBadge.skinTemp ?? rawBadge.temp ?? 0.0, 0.0);

  const rawLoc = rawBadge.location || {};
  const loc_x = toFloat(rawLoc.x, 0.0);
  const loc_y = toFloat(rawLoc.y, 0.0);
  const loc_zone = rawLoc.zone ?? zone ?? 'unknown';

  const badgeTelemetry = {
    hr: badge_hr,
    spo2: badge_spo2,
    skinTemp: badge_skin,
    location: { x: loc_x, y: loc_y, zone: loc_zone },
    fallDetected: toBool(rawBadge.fallDetected ?? rawBadge.fall ?? false, false),
    sosActive: toBool(rawBadge.sosActive ?? rawBadge.sos ?? false, false)
  };

  const ppeObj = (visionTelemetryRaw && typeof visionTelemetryRaw.ppe === 'object') ? visionTelemetryRaw.ppe : {};
  const ppeKeys = ['helmet', 'vest', 'gloves', 'boots', 'goggles'];
  const presentCount = ppeKeys.reduce((acc, k) => acc + (ppeObj[k] === true ? 1 : 0), 0);
  const complianceScore = ppeKeys.length ? presentCount / ppeKeys.length : 0;
  const ppeCompliant = (typeof visionTelemetryRaw.isCompliant === 'boolean') ? visionTelemetryRaw.isCompliant : (presentCount === ppeKeys.length);

  const visionTelemetry = {
    isCompliant: (visionTelemetryRaw && typeof visionTelemetryRaw.isCompliant === 'boolean') ? visionTelemetryRaw.isCompliant : null,
    ppeCompliant: Boolean(ppeCompliant),
    complianceScore: Number(complianceScore),
    missingItems: Array.isArray(visionTelemetryRaw?.missingItems) ? visionTelemetryRaw.missingItems : [],
    allFoundItems: Array.isArray(visionTelemetryRaw?.allFoundItems) ? visionTelemetryRaw.allFoundItems : [],
    ppe: ppeObj
  };

  const shiftDurationHours = toFloat(workerProfile?.shiftDurationHours ?? workerProfile?.shiftHours ?? 8.0, 8.0);
  const pastIncidentCount = toInt(workerProfile?.pastIncidents ?? workerProfile?.pastIncidentCount ?? 0, 0);
  const ageInt = toInt(workerProfile?.age, 0);

  const hr = badgeTelemetry.hr ?? 0;
  const hrFactor = Math.min(1, Math.max(0, (hr - 70) / 60));
  const shiftFactor = Math.min(1, Math.max(0, (shiftDurationHours - 6) / 6));
  const fatigueScore = Math.min(1, (hrFactor + shiftFactor) / 2);

  const workerProfileSafe = {
    shiftDurationHours,
    pastIncidentCount,
    age: ageInt,
    fatigueScore
  };

  const uwc = {
    workerId,
    timestamp: new Date().toISOString(),
    ts: Date.now(),
    badgeTelemetry,
    visionTelemetry,
    scadaContext,
    workerProfile: workerProfileSafe
  };

  return { ok: true, uwc, meta: { hasRecentBadge, hasRecentVision } };
}

// Safe wrapper that consumes inferenceClient's { risk, simulated } or legacy numeric
async function safeGetRiskScoreObject(uwc) {
  try {
    const res = await getRiskScoreFromAK(uwc);
    // If inferenceClient returns a plain number
    if (typeof res === 'number' && Number.isFinite(res)) {
      if (DEBUG_AK_LOG) console.debug('fusion: AK returned numeric risk', res);
      return { risk: Number(res), simulated: false, meta: null };
    }
    // If inferenceClient returns an object { risk, simulated, ... }
    if (res && typeof res === 'object' && res.risk !== undefined) {
      const r = Number(res.risk);
      if (!Number.isFinite(r)) {
        // non-finite inside object -> throw to go to fallback
        throw new Error('non-finite risk from AK: ' + String(res));
      }
      return { risk: r, simulated: !!res.simulated, meta: res };
    }
    // Unexpected shape -> try to coerce if possible
    const coerced = Number(res);
    if (Number.isFinite(coerced)) {
      return { risk: coerced, simulated: false, meta: null };
    }
    throw new Error('unexpected response shape from inferenceClient: ' + String(res));
  } catch (err) {
    console.error('fusion: safeGetRiskScoreObject error', err?.message || err);
    // If inferenceClient implements simulation, it should have returned earlier.
    // Here, fallback to a safe simulated result and mark simulated true.
    return { risk: 0.0, simulated: true, error: err?.message || String(err) };
  }
}

// Merge and scoring loop
async function mergeAndScore() {
  const workerIds = Object.keys(buffers);
  if (!workerIds.length) return;

  for (const workerId of workerIds) {
    let built;
    try {
      built = await buildUWCObjectFromBuffers(workerId);
    } catch (err) {
      console.error('fusion: buildUWCObjectFromBuffers error for', workerId, err?.stack || err);
      buffers[workerId] = { badge: [], vision: [] };
      continue;
    }

    if (!built.ok) {
      if (DEBUG_DUMP_UWC) console.debug('fusion: skipping worker due to insufficient inputs', workerId, built.meta);
      continue;
    }

    const uwc = built.uwc;
    globalThis.__lastUWC = uwc;
    if (DEBUG_DUMP_UWC) console.debug('fusion: built UWC for', workerId, JSON.stringify(uwc));

    try {
      let uwcDoc = null;
      try {
        uwcDoc = await UWC.create({ workerId, ...uwc });
      } catch (dbErr) {
        console.error('fusion: failed to persist UWC create for', workerId, dbErr?.message || dbErr);
        uwcDoc = null;
      }

      const { risk, simulated, meta } = await safeGetRiskScoreObject(uwc);

      if (uwcDoc) {
        try {
          uwcDoc.riskScore = risk;
          uwcDoc.inferenceSimulated = !!simulated;
          await uwcDoc.save();
        } catch (dbErr) {
          console.error('fusion: failed to save risk into UWC doc for', workerId, dbErr?.message || dbErr);
        }
      }

      const prev = lastRisk[workerId] ?? null;
      const shouldBroadcast = prev === null || Math.abs(prev - risk) > 0.03 || (prev < THRESHOLD && risk >= THRESHOLD);
      if (shouldBroadcast) {
        lastRisk[workerId] = risk;
        broadcast({
          type: 'uwc_update',
          workerId,
          risk,
          simulated: !!simulated,
          uwc: safeForBroadcast(uwcDoc ? (uwcDoc.toObject ? uwcDoc.toObject() : uwcDoc) : uwc)
        });
      }

      // Only create incident if inference was NOT simulated
      if (!simulated && risk >= THRESHOLD) {
        try {
          const incident = await Incident.create({
            uwcId: uwcDoc ? uwcDoc._id : null,
            workerId,
            type: 'high_risk',
            severity: Number(risk),
            status: 'open',
            createdAt: new Date()
          });

          try {
            const anchorResult = await anchorHash(String(incident._id));
            incident.blockchainHash = anchorResult.txHash || anchorResult.simulated || null;
            incident.anchorStatus = anchorResult.status || 'simulated';
            await incident.save();

            broadcast({ type: 'incident_created', incident: safeForBroadcast(incident.toObject ? incident.toObject() : incident) });
            broadcast({ type: 'incident_anchored', incidentId: incident._id, anchor: anchorResult });
          } catch (anchorErr) {
            console.error('fusion: anchorHash failed for incident', incident._id, anchorErr?.stack || anchorErr);
            broadcast({ type: 'incident_created', incident: safeForBroadcast(incident.toObject ? incident.toObject() : incident) });
          }
        } catch (incidentErr) {
          console.error('fusion: failed to create incident for', workerId, incidentErr?.stack || incidentErr);
        }
      } else if (simulated && risk >= THRESHOLD) {
        console.warn(`fusion: simulated AK result for worker=${workerId} risk=${risk} (no incident created)`);
      }
    } catch (err) {
      console.error('mergeAndScore error for worker', workerId, err?.stack || err);
    } finally {
      buffers[workerId] = { badge: [], vision: [] };
    }
  }
}

// debug helper
export async function mergeOnce() {
  await mergeAndScore();
}

// start interval (once)
if (!globalThis.__fusionIntervalStarted) {
  globalThis.__fusionIntervalStarted = true;
  setInterval(() => {
    mergeAndScore().catch(err => console.error('fusion error', err));
  }, MERGE_INTERVAL_MS);
}

// pushers with logging
export function pushTelemetry(workerId, data) {
  try {
    const b = ensureWorkerBuffer(workerId);
    const entry = { ts: Date.now(), payload: data };
    b.badge.push(entry);
    console.debug(`[fusion] pushTelemetry worker=${workerId} ts=${entry.ts} badgeCount=${b.badge.length} visionCount=${b.vision.length}`);
  } catch (err) {
    console.error('fusion pushTelemetry error', err?.message || err);
  }
}

export function pushVision(cameraId, payload) {
  try {
    if (payload && payload.workerId) {
      const b = ensureWorkerBuffer(payload.workerId);
      const entry = { ts: Date.now(), payload };
      b.vision.push(entry);
      console.debug(`[fusion] pushVision worker=${payload.workerId} camera=${cameraId} ts=${entry.ts} badgeCount=${b.badge.length} visionCount=${b.vision.length}`);
    } else {
      broadcast({ type: 'vision_event', payload: safeForBroadcast(payload) });
      console.debug('[fusion] pushVision broadcast (camera-only) camera=', cameraId);
    }
  } catch (err) {
    console.error('fusion pushVision error', err?.message || err);
  }
}

export function getBuffers() {
  const snap = {};
  for (const k of Object.keys(buffers)) snap[k] = { badge: buffers[k].badge.slice(), vision: buffers[k].vision.slice() };
  return snap;
}

export async function buildUWC(workerId) { return buildUWCObjectFromBuffers(workerId); }
export async function mergeOnceForWorker(workerId, opts = {}) { if (opts && opts.dryRun) return buildUWCObjectFromBuffers(workerId); await mergeAndScore(); return { ok: true, meta: { merged: true } }; }

export default { pushTelemetry, pushVision, mergeOnce, buildUWC, mergeOnceForWorker, getBuffers };
