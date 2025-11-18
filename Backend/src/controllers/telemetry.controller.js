// src/controllers/telemetry.controller.js
import { v4 as uuidv4 } from 'uuid';
import { Logs } from '../models/Logs.model.js';
import ScadaSchema from "../models/scada.model.js";
import { signPayload } from '../services/signing.js';
import { pushTelemetry, pushVision } from '../engine/fusionEngine.js';

/* Normalizers (badge & vision) — unchanged from your previous file */
function normalizeBadgePayload(incoming) {
  const payload = {};
  payload.workerId = incoming.workerId || incoming.id || incoming.empId || incoming.worker || null;
  payload.vitals = incoming.vitals || {
    hr: incoming.hr ?? null,
    spo2: incoming.spo2 ?? null,
    skinTemp: incoming.skinTemp ?? incoming.temp ?? null
  };
  if (incoming.location) {
    payload.location = incoming.location;
  } else {
    payload.location = {};
    if (incoming.x !== undefined) payload.location.x = incoming.x;
    if (incoming.y !== undefined) payload.location.y = incoming.y;
    if (incoming.zone) payload.location.zone = incoming.zone;
  }
  payload.fallDetected = incoming.fallDetected ?? incoming.fall ?? false;
  payload.sosActive = incoming.sosActive ?? incoming.sos ?? false;
  payload.raw = incoming;
  return payload;
}

function normalizeVisionPayload(incoming) {
  const p = {};
  p.cameraId = incoming.cameraId || incoming.camId || incoming.camera || null;
  p.workerId = incoming.workerId || incoming.matchedWorkerId || incoming.empId || null;
  if (incoming.ppe) {
    p.ppe = {
      helmet: incoming.ppe.helmet ?? null,
      vest: incoming.ppe.vest ?? null,
      gloves: incoming.ppe.gloves ?? null,
      boots: incoming.ppe.boots ?? null,
      goggles: incoming.ppe.goggles ?? null
    };
  } else if (incoming.isCompliant !== undefined || incoming.missingItems) {
    const missing = incoming.missingItems || [];
    p.ppe = {
      helmet: missing.indexOf('hardhat') === -1 && missing.indexOf('helmet') === -1,
      vest: missing.indexOf('vest') === -1,
      gloves: missing.indexOf('gloves') === -1,
      boots: missing.indexOf('boots') === -1,
      goggles: missing.indexOf('goggles') === -1
    };
  } else {
    p.ppe = { helmet: null, vest: null, gloves: null, boots: null, goggles: null };
  }
  p.isCompliant = incoming.isCompliant ?? null;
  p.missingItems = incoming.missingItems ?? [];
  p.allFoundItems = incoming.allFoundItems ?? [];
  p.raw = incoming;
  return p;
}

/* --- handlers --- */

export async function handleBadge(req, res) {
  const incoming = req.body;
  const payload = normalizeBadgePayload(incoming);

  if (!payload.workerId) return res.status(400).json({ error: 'workerId required in payload' });

  const eventId = uuidv4();
  const sign = signPayload(payload);

  try {
    await Logs.create({
      eventId,
      eventType: 'badge',
      payload,
      signature: sign.signature,
      signer: sign.signer
    });

    // push normalized payload into fusion buffer under workerId
    await pushTelemetry(payload.workerId, payload);

    return res.status(202).json({ status: 'accepted', eventId });
  } catch (err) {
    console.error('handleBadge error', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}

export async function handleVision(req, res) {
  const incoming = req.body;
  const payload = normalizeVisionPayload(incoming);

  if (!payload.cameraId && !payload.workerId) return res.status(400).json({ error: 'cameraId or workerId required' });

  const eventId = uuidv4();
  const sign = signPayload(payload);

  try {
    await Logs.create({
      eventId,
      eventType: 'vision',
      payload,
      signature: sign.signature,
      signer: sign.signer
    });

    // push to fusion (pushVision maps workerId internally)
    await pushVision(payload.cameraId, payload);

    return res.status(202).json({ status: 'accepted', eventId });
  } catch (err) {
    console.error('handleVision error', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}

/**
 * handleScada:
 * - Persist incoming SCADA to a scada collection for audit/history.
 * - Also create signed log entry for audit.
 * - Do NOT push into fusion buffers (fusion uses internal SCADA mock).
 */
export async function handleScada(req, res) {
  const incoming = req.body;
  if (!incoming || (!incoming.zone && incoming.zone !== 0)) return res.status(400).json({ error: 'zone required' });

  const payload = {
    zone: incoming.zone,
    data: incoming, // store full payload under data
    ts: new Date().toISOString()
  };

  const eventId = uuidv4();
  const sign = signPayload(payload);

  try {
    // store in scada collection
    await ScadaSchema.create(payload);

    // also store as signed log for audit
    await Logs.create({
      eventId,
      eventType: 'scada',
      payload,
      signature: sign.signature,
      signer: sign.signer
    });

    // we do NOT push into fusion; fusion generates its own mock scada
    return res.status(202).json({ status: 'accepted', eventId });
  } catch (err) {
    console.error('handleScada error', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}
