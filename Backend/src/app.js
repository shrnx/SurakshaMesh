// src/app.js
import express, { urlencoded } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// routes and debug imports (keep imports at top)
import telemetryRoutes from './routes/telemetry.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import mockPerClientRoutes from './debug/mockPerClient.js'
import { startSim, stopSim } from "../src/debug/wsEmitter.js"

const app = express();

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

// JSON + URL-encoded bodies
app.use(express.json({ limit: '16kb' }));
app.use(urlencoded({ extended: true, limit: '16kb' }));

// static files
app.use(express.static('public'));

// cookies
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'ok', ts: new Date().toISOString() });
});

// Routes
app.use('/telemetry', telemetryRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/debug/mock', mockPerClientRoutes);

// Debug simulation endpoints (for dev only)
const dbg = express.Router();
dbg.post('/sim/start/:workerId', (req, res) => {
  const ok = startSim(req.params.workerId, parseInt(req.query.interval || '1500', 10));
  res.json({ ok, started: ok, workerId: req.params.workerId });
});
dbg.post('/sim/stop/:workerId', (req, res) => {
  const ok = stopSim(req.params.workerId);
  res.json({ ok, stopped: ok, workerId: req.params.workerId });
});
app.use('/debug', dbg);

// Fallback 404 for unknown API routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;