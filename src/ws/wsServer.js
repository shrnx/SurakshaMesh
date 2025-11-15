import WebSocket, { WebSocketServer } from 'ws';

let wss = null;

export function startWsServer(httpServer) {
  if (!httpServer) {
    // fallback: create standalone server on 8081 if none provided
    wss = new WebSocketServer({ port: 8081 });
    console.log('WebSocket server started on ws://localhost:8081 (standalone)');
  } else {
    wss = new WebSocketServer({ server: httpServer, path: '/ws' });
    console.log('WebSocket server attached to HTTP server at /ws');
  }

  wss.on('connection', (ws, req) => {
    console.log('WS client connected', req.socket.remoteAddress);
    ws.send(JSON.stringify({ type: 'welcome', ts: new Date().toISOString() }));

    ws.on('message', (msg) => {
      // Basic echo for now; we'll expand auth & message types later
      try {
        const parsed = JSON.parse(msg.toString());
        // handle specific messages here (subscribe, ping, auth etc.)
        // For now, reply with ack
        ws.send(JSON.stringify({ type: 'ack', received: parsed, ts: new Date().toISOString() }));
      } catch (e) {
        ws.send(JSON.stringify({ type: 'error', message: 'invalid_json' }));
      }
    });

    ws.on('close', () => {
      console.log('WS client disconnected');
    });
  });

  wss.on('error', (err) => {
    console.error('WSS error', err);
  });
}

export function broadcast(obj) {
  if (!wss) return;
  const msg = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

// This part will use a standalone ws server on port 8081 so we can test quickly. Later attach ws to the same HTTP server or use socket.io and handle auth.