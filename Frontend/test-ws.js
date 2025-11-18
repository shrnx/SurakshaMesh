const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8000 });
console.log("🟢 Mock WS server running on ws://localhost:8000/ws");

wss.on("connection", (ws) => {
  console.log("🔌 Client connected");
  ws.onopen = () => {
  reconnectRef.current.tries = 0;
  console.log("🟢 WS connected");
  for (const id of workersToSubscribe) {
    const msg = { type: "subscribe", workerId: id };
    console.log("➡️ Sending subscribe:", msg);
    ws.send(JSON.stringify(msg));
  }
};


  ws.on("message", (msg) => {
    console.log("📩 Received from client:", msg.toString());
  });

  setInterval(() => {
    const payload = {
      type: "uwc_update",
      workerId: "EMP-405",
      risk: Math.random(),
      simulated: false,
      uwc: {
        badgeTelemetry: {
          hr: 60 + Math.floor(Math.random() * 30),
          location: { zone: "Sector-X" }
        }
      }
    };

    ws.send(JSON.stringify(payload));
    console.log("📤 Sent update:", payload);
  }, 3000);
});
