import express, { urlencoded } from 'express'
const app = express();

import cors from 'cors'
import cookieParser from 'cookie-parser';

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({
    limit: "16kb"
}));

app.use(urlencoded({
    extended: true,
    limit: "16kb"
}));

app.use(express.static("public"))

app.use(cookieParser())

// Health check
app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'ok', ts: new Date().toISOString() });
});

// Routes Import
import telemetryRoutes from "./routes/telemetry.routes.js"
import dashboardRoutes from './routes/dashboard.routes.js';


//Routes Declaration
app.use('/telemetry', telemetryRoutes);
app.use('/dashboard', dashboardRoutes);

// Fallback 404 for unknown API routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});


export default app