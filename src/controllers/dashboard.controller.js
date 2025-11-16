import { UWC } from '../models/UWC.model.js';
import { Incident } from '../models/Incident.model.js';
import { Worker } from '../models/workers.model.js';

/**
 * Return all workers with latest risk (optional pagination)
 * GET /dashboard/workers?limit=50
 */
export async function getWorkersList(req, res) {
    try {
        const limit = parseInt(req.query.limit || '100', 10);
        // If Worker collection empty, return sample placeholder
        const workers = await Worker.find().limit(limit).lean();
        return res.json({ count: workers.length, workers });
    } catch (err) {
        console.error('getWorkersList error', err);
        return res.status(500).json({ error: 'internal' });
    }
}

/**
 * GET /dashboard/uwc/:workerId/latest
 * Returns the latest UWC for a worker
 */
export async function getLatestUwc(req, res) {
    try {
        const { workerId } = req.params;
        const uwc = await UWC.findOne({ workerId }).sort({ ts: -1 }).lean();
        if (!uwc) return res.status(404).json({ error: 'not_found' });
        return res.json(uwc);
    } catch (err) {
        console.error('getLatestUwc error', err);
        return res.status(500).json({ error: 'internal' });
    }
}

/**
 * GET /dashboard/incidents?status=open
 * List incidents with optional status filter and limit
 */
export async function listIncidents(req, res) {
    try {
        const status = req.query.status; // open, acked, all
        const limit = parseInt(req.query.limit || '100', 10);
        const q = {};
        if (status && status !== 'all') q.status = status;
        const incidents = await Incident.find(q).sort({ createdAt: -1 }).limit(limit).lean();
        return res.json({ count: incidents.length, incidents });
    } catch (err) {
        console.error('listIncidents error', err);
        return res.status(500).json({ error: 'internal' });
    }
}

/**
 * GET /dashboard/history/:workerId?limit=50
 * Returns historical incidents for a worker
 */
export async function workerHistory(req, res) {
    try {
        const { workerId } = req.params;
        const limit = parseInt(req.query.limit || '50', 10);
        const incidents = await Incident.find({ workerId }).sort({ createdAt: -1 }).limit(limit).lean();
        return res.json({ count: incidents.length, incidents });
    } catch (err) {
        console.error('workerHistory error', err);
        return res.status(500).json({ error: 'internal' });
    }
}