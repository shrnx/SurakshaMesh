import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { startWsServer } from './ws/wsServer.js'; // new: attaches to http server

const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/suraksha';

async function start() {
  try {
    // 1) DB connect
    await connectDB(MONGO_URI);
    console.log('MongoDB connected');

    // 2) Create HTTP server from express app (required to attach WS)
    const server = http.createServer(app);

    // 3) Start WebSocket server attached to the same HTTP server
    startWsServer(server);

    // 4) Start HTTP server
    server.listen(PORT, () => {
      console.log(`HTTP server listening on http://localhost:${PORT}`);
      console.log(`WebSocket endpoint available on same host (ws://localhost:${PORT})`);
    });

    // graceful shutdown
    process.on('SIGINT', () => {
      console.log('Shutting down...');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
}

start();
