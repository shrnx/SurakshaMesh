// src/routes/telemetry.routes.js
import express from 'express';
import { handleBadge, handleVision, handleScada } from '../controllers/telemetry.controller.js';
import {Incident} from '../models/Incident.model.js';
import { mergeOnce } from '../engine/fusionEngine.js';
import { broadcast } from '../ws/wsServer.js';

const router = express.Router();

// telemetry ingestion endpoints (controllers handle validation & logging)
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

// incidents list
router.get('/incidents', async (req, res) => {
  try {
    const list = await Incident.find().sort({ createdAt: -1 }).limit(50);
    res.json(list);
  } catch (err) {
    console.error('get incidents failed', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

// ack an incident
router.post('/incidents/:id/ack', async (req, res) => {
  const id = req.params.id;
  const { ackBy } = req.body;

  try {
    const inc = await Incident.findById(id);
    if (!inc) return res.status(404).json({ error: 'not found' });

    inc.status = 'acked';
    inc.ackBy = ackBy || 'supervisor';
    inc.ackAt = new Date();
    await inc.save();

    // broadcast ack via WS
    try {
      if (typeof broadcast === 'function') {
        broadcast({ type: 'incident_ack', incidentId: id, ackBy: inc.ackBy, ackAt: inc.ackAt });
      }
    } catch (bErr) {
      console.warn('broadcast ack failed', bErr);
    }

    res.json({ status: 'acked' });
  } catch (err) {
    console.error('ack incident failed', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

// DEBUG: trigger a single merge+score run (safe for local testing only)
router.post('/debug/merge', async (req, res) => {
  try {
    await mergeOnce();
    return res.json({ status: 'merge_triggered' });
  } catch (err) {
    console.error('debug merge error', err);
    return res.status(500).json({ error: 'merge_failed', detail: String(err) });
  }
});

export default router;
