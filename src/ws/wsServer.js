const WebSocket = require('ws');

let wss = null;

function startWsServer(server) {
  // Accept either an existing HTTP server or create a standalone one
  if (server && server.listen) {
    // attach to HTTP server is left for future part; for now create a stand-alone server
  }
  wss = new WebSocket.Server({ port: 8081 });
  wss.on('connection', (ws) => {
    console.log('WS client connected');
    ws.send(JSON.stringify({ type: 'welcome', ts: new Date().toISOString() }));
  });
  console.log('WebSocket server started on ws://localhost:8081');
}

function broadcast(obj) {
  if (!wss) return;
  const msg = JSON.stringify(obj);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

module.exports = { startWsServer, broadcast };


// This part will use a standalone ws server on port 8081 so we can test quickly.Later attach ws to the same HTTP server or use socket.io and handle auth.