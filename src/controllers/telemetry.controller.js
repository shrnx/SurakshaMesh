// Handles incoming telemetry; stores raw and pushes to fusion buffer

import { v4 as uuidv4 } from 'uuid';
import { UWC } from '../models/UWC.model.js';
import { Logs } from '../models/Logs.model.js';
import { signPayload } from '../services/signing.js';
import { pushTelemetry, pushVision, pushScada } from '../engine/fusionEngine.js';

async function handleBadge(req, res) {
  const payload = req.body;
  if (!payload || !payload.workerId) return res.status(400).send({ error: 'workerId required' });

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

    // push to fusion buffer - pass the actual payload (fusionEngine expects payload)
    await pushTelemetry(payload.workerId, { type: 'badge', payload });

    return res.status(202).send({ status: 'accepted', eventId });
  } catch (err) {
    console.error('handleBadge error', err);
    return res.status(500).send({ error: 'internal server error' });
  }
}

async function handleVision(req, res) {
  const payload = req.body;
  if (!payload || !payload.cameraId) return res.status(400).send({ error: 'cameraId required' });

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

    // pushVision accepts (cameraId, payload)
    await pushVision(payload.cameraId, payload);

    return res.status(202).send({ status: 'accepted', eventId });
  } catch (err) {
    console.error('handleVision error', err);
    return res.status(500).send({ error: 'internal server error' });
  }
}

async function handleScada(req, res) {
  const payload = req.body;
  if (!payload || !payload.zone) return res.status(400).send({ error: 'zone required' });

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

    // pushScada accepts (zone, payload)
    await pushScada(payload.zone, payload);

    return res.status(202).send({ status: 'accepted', eventId });
  } catch (err) {
    console.error('handleScada error', err);
    return res.status(500).send({ error: 'internal server error' });
  }
}

export { handleBadge, handleVision, handleScada };
