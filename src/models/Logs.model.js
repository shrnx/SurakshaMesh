// Stores signed event logs

import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  eventId: { type: String, required: true, index: true },
  eventType: String,
  payload: Object,
  signature: String,
  signer: String,
  ts: { type: Date, default: Date.now }
});

export const Logs = mongoose.model("Logs", logSchema);