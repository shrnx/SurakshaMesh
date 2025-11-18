// src/debug/mockPerClient.js
import express from 'express';
import crypto from 'crypto';

const router = express.Router();

/**
 * Per-client SSE mock stream controller
 * - GET  /stream                -> opens SSE, returns clientId in first data frame and starts per-client generator
 * - POST /stop?clientId=...     -> stops and closes that client's stream
 * - GET  /status?clientId=...   -> returns running state for that client (or global summary if no clientId)
 * - GET  /snapshot              -> one-shot snapshot for polling
 *
 * Each client gets its own timer. Closing the connection (client disconnect) will also clear the timer.
 *
 * NOTE: CORS headers set to '*' for dev ease; tighten for production.
 */

// ------------------ Mock data generator ------------------
function genSensorEntry(type, zone) {
  const now = new Date().toISOString();
  switch (type) {
    case 'THERMAL': {
      const base = 36 + Math.random() * 6; // 36-42
      return {
        type: 'THERMAL',
        label: 'THERMAL',
        value: Number(base.toFixed(2)),
        unit: '°C',
        zone: zone || 'Core',
        trend: Math.random() < 0.3 ? 'Rising Trend (+5m)' : 'Stable Trend',
        ts: now
      };
    }
    case 'DUST': {
      const base = 20 + Math.random() * 120; // µg/m3
      return {
        type: 'DUST',
        label: 'DUST',
        value: Number(base.toFixed(1)),
        unit: 'µg/m³',
        zone: zone || 'Exit-B',
        trend: 'Stable Trend',
        ts: now
      };
    }
    case 'GAS': {
      const base = 5 + Math.random() * 40;
      return {
        type: 'GAS',
        label: 'GAS',
        value: Number(base.toFixed(2)),
        unit: 'ppm',
        zone: zone || 'Furnace',
        trend: Math.random() < 0.2 ? 'Rising Trend (+5m)' : 'Stable Trend',
        ts: now
      };
    }
    case 'SEISMIC': {
      const base = Math.random() * 0.1;
      return {
        type: 'SEISMIC',
        label: 'SEISMIC',
        value: Number(base.toFixed(2)),
        unit: 'g',
        zone: zone || 'Wall-N',
        trend: 'Stable Trend',
        ts: now
      };
    }
    case 'ACOUSTIC': {
      const base = 20 + Math.random() * 50;
      return {
        type: 'ACOUSTIC',
        label: 'ACOUSTIC',
        value: Number(base.toFixed(2)),
        unit: 'dB',
        zone: zone || 'Gen-Room',
        trend: 'Stable Trend',
        ts: now
      };
    }
    default:
      return {
        type: 'GENERIC',
        label: 'GENERIC',
        value: 0,
        unit: '',
        zone: zone || 'unknown',
        trend: 'Stable Trend',
        ts: now
      };
  }
}

export function generateMockSnapshot(opts = {}) {
  const zones = opts.zones || ['Core', 'Exit-B', 'Furnace', 'Wall-N', 'Gen-Room'];
  const types = opts.types || ['THERMAL','THERMAL','DUST','THERMAL','GAS','THERMAL','SEISMIC','ACOUSTIC','GAS'];
  const snap = types.map((t, i) => genSensorEntry(t, zones[i % zones.length]));
  return { ts: new Date().toISOString(), rows: snap };
}

// ------------------ Controller state --------------------
const clients = new Map(); // clientId -> { res, timer, interval, createdAt, ip }

// helper to create random client id
function newClientId() {
  return crypto.randomBytes(6).toString('hex');
}

// helper to start generator for one client
function startClientGenerator(clientId, intervalMs = 1500, opts = {}) {
  const client = clients.get(clientId);
  if (!client) return false;
  if (client.timer) clearInterval(client.timer);

  const send = () => {
    try {
      const payload = generateMockSnapshot(opts);
      client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (e) {
      // on write error force-close
      try { client.res.end(); } catch (e2) {}
      stopClientGenerator(clientId);
    }
  };

  // send first immediately
  send();
  client.timer = setInterval(send, intervalMs);
  client.interval = intervalMs;
  return true;
}

function stopClientGenerator(clientId) {
  const client = clients.get(clientId);
  if (!client) return false;
  if (client.timer) {
    clearInterval(client.timer);
    client.timer = null;
  }
  // close SSE response if still open
  try {
    client.res.write(`event: stopped\ndata: ${JSON.stringify({ clientId, stoppedAt: new Date().toISOString() })}\n\n`);
  } catch (e) {}
  try { client.res.end(); } catch (e) {}
  clients.delete(clientId);
  return true;
}

// ------------------ SSE connect (per-client) ------------------
router.get('/stream', (req, res) => {
  // set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // new client
  const clientId = newClientId();
  const ip = req.socket.remoteAddress || req.ip || 'unknown';
  const client = { id: clientId, res, timer: null, interval: null, createdAt: new Date().toISOString(), ip };
  clients.set(clientId, client);

  console.log(`[mockPerClient] SSE client connected id=${clientId} ip=${ip} total=${clients.size}`);

  // send initial message with clientId so front-end can call stop
  const welcome = { type: 'welcome', clientId, ts: new Date().toISOString(), message: 'per-client generator started' };
  res.write(`data: ${JSON.stringify(welcome)}\n\n`);

  // set a default interval (can be overridden via query param)
  const intervalMs = parseInt(req.query.interval || '1500', 10) || 1500;

  // If client wants specific zones/types, pass them via query (simple JSON encoded), e.g. ?zones=A,B&types=THERMAL,GAS
  const zones = req.query.zones ? String(req.query.zones).split(',') : undefined;
  const types = req.query.types ? String(req.query.types).split(',') : undefined;
  const opts = {};
  if (zones) opts.zones = zones;
  if (types) opts.types = types;

  // start the per-client generator
  startClientGenerator(clientId, intervalMs, opts);

  // cleanup on client disconnect
  req.on('close', () => {
    // If timer still running, stop and remove client
    if (clients.has(clientId)) {
      console.log(`[mockPerClient] SSE client disconnected id=${clientId} (cleanup)`);
      stopClientGenerator(clientId);
    }
  });
});

// ------------------ One-shot snapshot --------------------
router.get('/snapshot', (req, res) => {
  res.json(generateMockSnapshot());
});

// ------------------ Stop specific client --------------------
router.post('/stop', express.json(), (req, res) => {
  const clientId = req.query.clientId || req.body?.clientId;
  if (!clientId) return res.status(400).json({ ok: false, error: 'clientId required (query or JSON body)' });
  const ok = stopClientGenerator(clientId);
  if (!ok) return res.status(404).json({ ok: false, error: 'clientId not found or already stopped' });
  return res.json({ ok: true, stopped: true, clientId });
});

// ------------------ Status --------------------
router.get('/status', (req, res) => {
  const clientId = req.query.clientId;
  if (clientId) {
    const c = clients.get(clientId);
    if (!c) return res.status(404).json({ ok: false, error: 'clientId not found' });
    return res.json({ ok: true, clientId, running: !!c.timer, interval: c.interval, createdAt: c.createdAt, ip: c.ip });
  }
  // global summary
  const summary = {
    totalClients: clients.size,
    clients: Array.from(clients.values()).map(c => ({ clientId: c.id, running: !!c.timer, interval: c.interval, ip: c.ip, createdAt: c.createdAt }))
  };
  return res.json(summary);
});

export default router;
