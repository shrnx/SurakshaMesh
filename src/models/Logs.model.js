// Stores signed event logs

import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  eventId: String,
  eventType: String,
  payload: Object,
  signature: String,
  signer: String
}, { timestamps: true });

export const Logs = mongoose.model("Logs", logSchema);