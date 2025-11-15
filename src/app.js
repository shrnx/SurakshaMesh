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

// Routes Import
import { Logs } from './models/Logs.model.js';

// Routes Declaration
app.get('/dev/seed', async (req, res) => {
  await Logs.create({ eventId: 'seed-' + Date.now(), eventType: 'seed' });
  res.send('seeded');
});

export default app