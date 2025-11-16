import express from 'express';
import {
  getWorkersList,
  getLatestUwc,
  listIncidents,
  workerHistory
} from '../controllers/dashboard.controller.js';

const router = express.Router();

// Workers (list)
router.get('/workers', getWorkersList);

// Latest UWC for worker
router.get('/uwc/:workerId/latest', getLatestUwc);

// Incidents list (filter by status=open|acked|all)
router.get('/incidents', listIncidents);

// Historical incidents per worker
router.get('/history/:workerId', workerHistory);

export default router;