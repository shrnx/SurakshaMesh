// src/routes/telemetry.routes.js
import express from 'express';
import { handleBadge, handleVision, handleScada } from '../controllers/telemetry.controller.js';
import { Incident } from '../models/Incident.model.js';
import { buildUWC, mergeOnceForWorker } from '../engine/fusionEngine.js';

const router = express.Router();

// Ingestion endpoints (controllers already persist logs & push to fusion buffers)
router.post('/badge', async (req, res) => {
  try {
    await handleBadge(req, res);
  } catch (err) {
    console.error('handleBadge failed', err);
    res.status(500).send({ error: 'internal server error' });
  }
});

router.post('/vision', async (req, res) => {
  try {
    await handleVision(req, res);
  } catch (err) {
    console.error('handleVision failed', err);
    res.status(500).send({ error: 'internal server error' });
  }
});

router.post('/scada', async (req, res) => {
  try {
    await handleScada(req, res);
  } catch (err) {
    console.error('handleScada failed', err);
    res.status(500).send({ error: 'internal server error' });
  }
});

// Incident endpoints
router.get('/incidents', async (req, res) => {
  try {
    const list = await Incident.find().sort({ createdAt: -1 }).limit(50);
    res.send(list);
  } catch (err) {
    console.error('get incidents failed', err);
    res.status(500).send({ error: 'internal server error' });
  }
});

router.post('/incidents/:id/ack', async (req, res) => {
  const id = req.params.id;
  const { ackBy } = req.body;
  try {
    const inc = await Incident.findById(id);
    if (!inc) return res.status(404).send({ error: 'not found' });

    inc.status = 'acked';
    inc.ackBy = ackBy || 'supervisor';
    inc.ackAt = new Date();
    await inc.save();

    // broadcast ack if wsServer exports broadcast (optional)
    // import { broadcast } from '../ws/wsServer.js' and call broadcast({ type: 'incident_ack', incidentId: id, ackBy: inc.ackBy, ackAt: inc.ackAt });

    res.send({ status: 'acked' });
  } catch (err) {
    console.error('ack incident failed', err);
    res.status(500).send({ error: 'internal server error' });
  }
});

/* ---------- Debug routes (preview UWC, dry-run merge) ---------- */

// Preview UWC for a worker (no persistence, no inference)
router.get('/debug/uwc/:workerId', async (req, res) => {
  const workerId = req.params.workerId;
  try {
    const built = await buildUWC(workerId);
    if (!built.ok) return res.status(400).json(built);
    return res.json({ ok: true, uwc: built.uwc, meta: built.meta });
  } catch (err) {
    console.error('debug uwc failed', err);
    return res.status(500).json({ ok: false, error: 'internal' });
  }
});

// Force dry-run merge for a worker (builds UWC but does NOT persist or call AK)
router.post('/debug/merge/:workerId', async (req, res) => {
  const workerId = req.params.workerId;
  const force = req.query.force === '1' || req.body.force === true;
  try {
    const result = await mergeOnceForWorker(workerId, { dryRun: true, force });
    return res.json(result);
  } catch (err) {
    console.error('debug merge failed', err);
    return res.status(500).json({ ok: false, error: 'internal' });
  }
});

export default router;
