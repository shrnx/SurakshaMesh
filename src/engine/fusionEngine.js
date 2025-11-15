// src/engine/fusionEngine.js
import {UWC} from '../models/UWC.model.js';
import { Incident } from '../models/Incident.model.js';
import { getRiskScore } from '../services/inferenceClient.js';
import { anchorHash } from '../services/blockchain.js';
import { broadcast } from '../ws/wsServer.js';

const buffers = {}; // per-worker buffer structure: { badge:[], vision:[], scada:[] }
const MERGE_INTERVAL_MS = 2000;
const THRESHOLD = parseFloat(process.env.RISK_ALERT_THRESHOLD || 0.7);

function ensureWorkerBuffer(workerId) {
  if (!buffers[workerId]) {
    buffers[workerId] = { badge: [], vision: [], scada: [] };
  }
  return buffers[workerId];
}

// pushTelemetry expects raw payload (badge event)
export function pushTelemetry(workerId, data) {
  const b = ensureWorkerBuffer(workerId);
  b.badge.push({ ts: Date.now(), payload: data });
}

// pushVision accepts (cameraId, payload). If payload contains workerId, map to that worker.
export function pushVision(cameraId, payload) {
  if (payload.workerId) {
    // store vision as the raw payload under the vision buffer for that worker
    const b = ensureWorkerBuffer(payload.workerId);
    b.vision.push({ ts: Date.now(), payload });
  } else {
    broadcast({ type: 'vision_event', payload });
  }
}

// pushScada stores the raw scada payload (not wrapped) for every worker (demo simplification)
export function pushScada(zone, payload) {
  // store payload along with zone metadata but keep actual scada payload in .payload
  Object.keys(buffers).forEach(workerId => {
    ensureWorkerBuffer(workerId).scada.push({ ts: Date.now(), zone, payload });
  });
}

// internal: safe getter returns the raw payload or empty object
function lastPayload(entry) {
  if (!entry) return {};
  if (entry.payload) return entry.payload;
  // if entry itself is the payload (older variants), return it
  return entry;
}

async function mergeAndScore() {
  const workerIds = Object.keys(buffers);
  if (!workerIds.length) return; // nothing to do

  for (const workerId of workerIds) {
    const b = buffers[workerId];

    const lastBadgeEntry = b.badge.length ? b.badge[b.badge.length - 1] : null;
    const lastVisionEntry = b.vision.length ? b.vision[b.vision.length - 1] : null;
    const lastScadaEntry = b.scada.length ? b.scada[b.scada.length - 1] : null;

    const lastBadge = lastPayload(lastBadgeEntry);
    const lastVision = lastPayload(lastVisionEntry);
    // lastScadaEntry is { zone, payload, ts } — we want the payload object
    const lastScada = lastScadaEntry ? (lastScadaEntry.payload || lastScadaEntry) : {};

    const uwc = {
      workerId,
      ts: new Date(),
      location: lastBadge.location || {},
      vitals: lastBadge.vitals || {},
      ppe: lastVision.ppe || {},
      scada: lastScada || {},
      vision: lastVision || {}
    };

    try {
      // persist UWC
      const uwcDoc = await UWC.create({ ...uwc });

      // call inference (AK or fallback)
      const risk = await getRiskScore(uwc);
      uwcDoc.riskScore = risk;
      await uwcDoc.save();

      // broadcast UWC update
      broadcast({ type: 'uwc_update', workerId, risk, uwcId: uwcDoc._id });

      // incident creation if high risk
      if (risk >= THRESHOLD) {
        const incident = await Incident.create({
          uwcId: uwcDoc._id,
          workerId,
          type: 'high_risk',
          severity: Number(risk),
          status: 'open'
        });

        broadcast({ type: 'incident_created', incident });

        // optional anchoring (simulated by default)
        const anchorResult = await anchorHash(String(uwcDoc._id));
        incident.blockchainHash = anchorResult.txHash || anchorResult.tx || anchorResult.simulated || null;
        incident.anchorStatus = anchorResult.status || 'simulated';
        await incident.save();

        broadcast({ type: 'incident_anchored', incidentId: incident._id, anchor: anchorResult });
      }
    } catch (err) {
      console.error('mergeAndScore error for worker', workerId, err);
    }

    // clear buffers (we consumed these entries)
    buffers[workerId] = { badge: [], vision: [], scada: [] };
  }
}

// export a helper to trigger a single merge (useful for debug)
export async function mergeOnce() {
  await mergeAndScore();
}

// start interval (fire-and-forget)
setInterval(() => {
  mergeAndScore().catch(err => console.error('fusion error', err));
}, MERGE_INTERVAL_MS);

export default {
  pushTelemetry,
  pushVision,
  pushScada,
  mergeOnce
};
