// src/controllers/telemetry.controller.js
import { v4 as uuidv4 } from 'uuid';
import { Logs } from '../models/Logs.model.js';
import { signPayload } from '../services/signing.js';
import { pushTelemetry, pushVision, pushScada } from '../engine/fusionEngine.js';

/**
 * Helpers to normalize incoming payloads to the internal expected shape:
 * Internal badge shape we expect in buffers:
 * {
 *   workerId: 'EMP-104',
 *   vitals: { hr, spo2, skinTemp, ... },
 *   location: { x, y, zone? },
 *   fallDetected: bool,
 *   sosActive: bool,
 *   raw: { ...original payload... }
 * }
 *
 * Internal vision shape:
 * {
 *   cameraId,
 *   workerId,            // optional
 *   ppe: { helmet:bool, vest:bool, gloves:bool, boots:bool, goggles:bool }
 *   isCompliant: bool,
 *   missingItems: [],
 *   allFoundItems: [],
 *   raw: { ...original payload... }
 * }
 */

function normalizeBadgePayload(incoming) {
  // If incoming already matches old format (has location.vitals), handle that too.
  const payload = {};

  // workerId may be top-level or named id
  payload.workerId = incoming.workerId || incoming.id || incoming.empId || incoming.worker || null;

  // vitals may be in several forms: top-level hr/spo2/skinTemp or nested in 'vitals'
  payload.vitals = incoming.vitals || {
    hr: incoming.hr ?? null,
    spo2: incoming.spo2 ?? null,
    skinTemp: incoming.skinTemp ?? incoming.temp ?? null
  };

  // location may be provided as {x,y} or {location:{x,y}} or {zone:...}
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

  // if incoming already has ppe object, use it; else try to infer from isCompliant/missingItems/allFoundItems
  if (incoming.ppe) {
    p.ppe = {
      helmet: incoming.ppe.helmet ?? null,
      vest: incoming.ppe.vest ?? null,
      gloves: incoming.ppe.gloves ?? null,
      boots: incoming.ppe.boots ?? null,
      goggles: incoming.ppe.goggles ?? null
    };
  } else if (incoming.isCompliant !== undefined || incoming.missingItems) {
    // convert missingItems -> ppe booleans (best-effort)
    const missing = incoming.missingItems || [];
    p.ppe = {
      helmet: missing.indexOf('hardhat') === -1 && missing.indexOf('helmet') === -1,
      vest: missing.indexOf('vest') === -1,
      gloves: missing.indexOf('gloves') === -1,
      boots: missing.indexOf('boots') === -1,
      goggles: missing.indexOf('goggles') === -1
    };
  } else {
    // fallback: keep ppe nulls
    p.ppe = { helmet: null, vest: null, gloves: null, boots: null, goggles: null };
  }

  p.isCompliant = incoming.isCompliant ?? null;
  p.missingItems = incoming.missingItems ?? [];
  p.allFoundItems = incoming.allFoundItems ?? [];
  p.raw = incoming;
  return p;
}

/* --- handlers --- */

async function handleBadge(req, res) {
  const incoming = req.body;
  // normalize
  const payload = normalizeBadgePayload(incoming);

  if (!payload.workerId) {
    return res.status(400).json({ error: 'workerId required in payload (field may be workerId/empId/id)' });
  }

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

async function handleVision(req, res) {
  const incoming = req.body;
  const payload = normalizeVisionPayload(incoming);

  if (!payload.cameraId && !payload.workerId) {
    // allow camera-only events (no worker) but require a cameraId
    return res.status(400).json({ error: 'cameraId or workerId required' });
  }

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

    // If vision maps to a worker, push directly to worker buffer; otherwise broadcast camera event via pushVision
    if (payload.workerId) {
      await pushVision(payload.cameraId, payload); // pushVision handles payload.workerId mapping
    } else {
      await pushVision(payload.cameraId, payload);
    }

    return res.status(202).json({ status: 'accepted', eventId });
  } catch (err) {
    console.error('handleVision error', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}

async function handleScada(req, res) {
  const payload = req.body;
  if (!payload || !payload.zone) return res.status(400).json({ error: 'zone required' });

  const eventId = uuidv4();
  const sign = signPayload(payload);

  try {
    await Logs.create({
      eventId,
      eventType: 'scada',
      payload,
      signature: sign.signature,
      signer: sign.signer
    });

    await pushScada(payload.zone, payload);

    return res.status(202).json({ status: 'accepted', eventId });
  } catch (err) {
    console.error('handleScada error', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}

export { handleBadge, handleVision, handleScada };