// src/controllers/worker.controller.js
import Worker from '../models/Worker.model.js';

export async function createWorker(req, res) {
  try {
    const { workerId, name, role, meta } = req.body;
    if (!workerId) return res.status(400).json({ error: 'workerId required' });
    const existing = await Worker.findOne({ workerId }).lean();
    if (existing) return res.status(409).json({ error: 'worker_exists' });
    const w = await Worker.create({ workerId, name, role, meta });
    return res.status(201).json(w);
  } catch (err) {
    console.error('createWorker error', err);
    return res.status(500).json({ error: 'internal' });
  }
}

export async function listWorkers(req, res) {
  try {
    const q = {};
    const limit = Number(req.query.limit || 100);
    const skip = Number(req.query.skip || 0);
    const workers = await Worker.find(q).sort({ workerId: 1 }).skip(skip).limit(limit).lean();
    return res.json({ count: workers.length, workers });
  } catch (err) {
    console.error('listWorkers error', err);
    return res.status(500).json({ error: 'internal' });
  }
}

export async function getWorker(req, res) {
  try {
    const { id } = req.params;
    const w = await Worker.findById(id).lean();
    if (!w) return res.status(404).json({ error: 'not_found' });
    return res.json(w);
  } catch (err) {
    console.error('getWorker error', err);
    return res.status(500).json({ error: 'internal' });
  }
}

export async function updateWorker(req, res) {
  try {
    const { id } = req.params;
    const update = {};
    const { name, role, meta } = req.body;
    if (name !== undefined) update.name = name;
    if (role !== undefined) update.role = role;
    if (meta !== undefined) update.meta = meta;
    const w = await Worker.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!w) return res.status(404).json({ error: 'not_found' });
    return res.json(w);
  } catch (err) {
    console.error('updateWorker error', err);
    return res.status(500).json({ error: 'internal' });
  }
}

export async function deleteWorker(req, res) {
  try {
    const { id } = req.params;
    const w = await Worker.findByIdAndDelete(id).lean();
    if (!w) return res.status(404).json({ error: 'not_found' });
    return res.json({ status: 'deleted', workerId: w.workerId });
  } catch (err) {
    console.error('deleteWorker error', err);
    return res.status(500).json({ error: 'internal' });
  }
}
