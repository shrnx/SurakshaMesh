// Stores Unified Worker Context snapshots

import mongoose from "mongoose";

const uwcSchema = new mongoose.Schema({
  workerId: { type: String, required: true, index: true },
  ts: { type: Date, default: Date.now },
  location: Object,
  vitals: Object,
  ppe: Object,
  scada: Object,
  vision: Object,
  riskScore: Number,
  modelVersion: String
}, { timestamps: true });

export const UWC = mongoose.model("UWC", uwcSchema)