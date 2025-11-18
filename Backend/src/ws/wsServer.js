// ws/wsServer.js
// Fully patched WebSocket server with safe subscribe handling, logging, and broadcast filters

import WebSocket, { WebSocketServer } from "ws";

// Config
const DEFAULT_PATH = "/ws";
const MAX_PAYLOAD_BYTES = parseInt(process.env.WS_MAX_PAYLOAD_BYTES || "65536", 10);
const PING_INTERVAL_MS = parseInt(process.env.WS_PING_INTERVAL_MS || "20000", 10);
const CLIENT_PONG_TIMEOUT_MS = parseInt(process.env.WS_PONG_TIMEOUT_MS || "30000", 10);

let wss = null;
const clients = new Set(); // { ws, id, subscribedWorkers: Set, isAlive, meta }
let pingTimer = null;

// ---------------------------------------------------------------------
// Utility: Create client wrapper
// ---------------------------------------------------------------------
function makeClientWrapper(ws, req) {
  const cw = {
    ws,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    subscribedWorkers: new Set(),
    isAlive: true,
    meta: {
      ip: req.socket.remoteAddress,
      ua: req.headers["user-agent"] || null,
      connectedAt: new Date(),
    },
  };
  return cw;
}

// ---------------------------------------------------------------------
// Utility: Safe send
// ---------------------------------------------------------------------
function safeSend(ws, obj) {
  try {
    const s = JSON.stringify(obj);
    if (Buffer.byteLength(s, "utf8") > MAX_PAYLOAD_BYTES) {
      console.warn("ws: message truncated because it exceeded payload size");
      ws.send(JSON.stringify({ type: "error", message: "payload_too_large" }));
      return;
    }
    ws.send(s);
  } catch (e) {
    console.warn("ws: safeSend failed", e?.message || e);
  }
}

// ---------------------------------------------------------------------
// Handle incoming messages from one client
// ---------------------------------------------------------------------
function handleClientMessage(wrapper, raw) {
  const { ws } = wrapper;

  let parsed = null;
  try {
    parsed = JSON.parse(raw.toString());
  } catch (e) {
    safeSend(ws, { type: "error", message: "invalid_json" });
    return;
  }

  console.debug("ws: incoming message", {
    from: wrapper.meta.ip,
    parsed,
  });

  const type = parsed.type;
  if (!type) {
    safeSend(ws, { type: "error", message: "missing_type" });
    return;
  }

  switch (type) {
    case "subscribe": {
      const { workerId } = parsed;
      if (!workerId)
        return safeSend(ws, { type: "error", message: "workerId required" });

      wrapper.subscribedWorkers.add(workerId);

      safeSend(ws, {
        type: "subscribed",
        workerId,
        ts: new Date().toISOString(),
      });

      console.debug(
        `ws: ${wrapper.meta.ip} subscribed to ${workerId}`
      );
      break;
    }

    case "unsubscribe": {
      const { workerId } = parsed;
      if (!workerId)
        return safeSend(ws, { type: "error", message: "workerId required" });

      wrapper.subscribedWorkers.delete(workerId);

      safeSend(ws, {
        type: "unsubscribed",
        workerId,
        ts: new Date().toISOString(),
      });

      console.debug(
        `ws: ${wrapper.meta.ip} unsubscribed from ${workerId}`
      );
      break;
    }

    case "ping": {
      safeSend(ws, { type: "pong", ts: new Date().toISOString() });
      break;
    }

    case "echo": {
      safeSend(ws, { type: "echo", data: parsed.data ?? null });
      break;
    }

    default:
      safeSend(ws, { type: "error", message: "unknown_type" });
  }
}

// ---------------------------------------------------------------------
// Broadcast message to matching subscribers
// ---------------------------------------------------------------------
export function broadcast(obj) {
  if (!wss) return;
  const msg = JSON.stringify(obj);

  for (const cw of clients) {
    try {
      if (cw.ws.readyState === WebSocket.OPEN) {
        // Filter if workerId present AND client has specific subscriptions
        if (obj.workerId && cw.subscribedWorkers.size > 0) {
          if (!cw.subscribedWorkers.has(obj.workerId)) continue;
        }

        cw.ws.send(msg);

        console.debug(
          `ws: broadcast -> client=${cw.id}, ip=${cw.meta.ip}, workerId=${obj.workerId ?? "ALL"}`
        );
      }
    } catch (e) {
      console.warn("ws broadcast error", e?.message || e);
    }
  }
}

// ---------------------------------------------------------------------
// Send to one worker
// ---------------------------------------------------------------------
export function sendToWorker(workerId, obj) {
  if (!wss) return;

  const msg = JSON.stringify(obj);

  for (const cw of clients) {
    try {
      if (
        cw.ws.readyState === WebSocket.OPEN &&
        cw.subscribedWorkers.has(workerId)
      ) {
        cw.ws.send(msg);

        console.debug(
          `ws: sendToWorker -> ${workerId} -> client=${cw.id}, ip=${cw.meta.ip}`
        );
      }
    } catch (e) {
      console.warn("ws sendToWorker error", e?.message || e);
    }
  }
}

// ---------------------------------------------------------------------
// Heartbeat Ping Loop
// ---------------------------------------------------------------------
function startPingLoop() {
  if (pingTimer) return;

  pingTimer = setInterval(() => {
    for (const cw of clients) {
      try {
        if (!cw.isAlive) {
          console.debug(
            "ws: client unresponsive, terminating",
            cw.meta.ip,
            cw.id
          );
          cw.ws.terminate();
          clients.delete(cw);
          continue;
        }

        cw.isAlive = false;
        cw.ws.ping();
      } catch (e) {
        console.warn("ws ping error", e?.message || e);
      }
    }
  }, PING_INTERVAL_MS);
}

function stopPingLoop() {
  if (!pingTimer) return;
  clearInterval(pingTimer);
  pingTimer = null;
}

// ---------------------------------------------------------------------
// Start WebSocket server
// ---------------------------------------------------------------------
export function startWsServer(httpServer) {
  if (!httpServer) {
    wss = new WebSocketServer({ port: 8081, path: DEFAULT_PATH });
    console.log("WebSocket server started on ws://localhost:8081/ws");
  } else {
    wss = new WebSocketServer({ server: httpServer, path: DEFAULT_PATH });
    console.log(
      `WebSocket server attached to HTTP server at ${DEFAULT_PATH}`
    );
  }

  wss.on("connection", (ws, req) => {
    const cw = makeClientWrapper(ws, req);
    clients.add(cw);

    console.log(
      `WS client connected ${cw.meta.ip}, id=${cw.id}`
    );

    // Welcome message
    safeSend(ws, { type: "welcome", id: cw.id, ts: new Date().toISOString() });

    ws.on("message", (msg) => handleClientMessage(cw, msg));

    ws.on("pong", () => {
      cw.isAlive = true;
    });

    ws.on("close", (code, reason) => {
      console.debug(
        `WS client disconnected ${cw.meta.ip}, id=${cw.id}, code=${code}`
      );
      clients.delete(cw);
    });

    ws.on("error", (err) => {
      console.warn(
        `WS client error ${cw.meta.ip}, id=${cw.id},`,
        err?.message || err
      );
    });
  });

  wss.on("error", (err) => {
    console.error("WSS error", err);
  });

  startPingLoop();
}

// ---------------------------------------------------------------------
// Stop WebSocket server
// ---------------------------------------------------------------------
export function stopWsServer() {
  try {
    stopPingLoop();
    for (const cw of clients) {
      try {
        cw.ws.close(1001, "server_shutdown");
      } catch (e) {}
    }
    if (wss) wss.close();
    wss = null;
  } catch (e) {
    console.warn("stopWsServer error", e?.message || e);
  }
}