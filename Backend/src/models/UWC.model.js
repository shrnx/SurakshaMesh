// Stores Unified Worker Context snapshots

import mongoose from "mongoose";

const uwcSchema = new mongoose.Schema({
  workerId: { type: String, required: true, index: true },
  timestamp: { type: String },
  badgeTelemetry: Object,
  visionTelemetry: Object,
  scadaContext: Object,
  workerProfile: Object,
  riskScore: Number,
  modelVersion: String
}, { timestamps: true });

export default mongoose.models.UWC || mongoose.model('UWC', uwcSchema);