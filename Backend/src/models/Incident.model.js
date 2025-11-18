import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema({
  uwcId: { type: mongoose.Types.ObjectId, ref: 'UWC' },
  workerId: String,
  type: String,
  severity: Number,
  status: { type: String, default: 'open' }, // open, acked, closed
  ackBy: String,
  ackAt: Date,
  createdAt: { type: Date, default: Date.now },
  blockchainHash: String,
  anchorStatus: { type: String, default: 'pending' } // pending, anchored, failed
});

export const Incident = mongoose.model("Incident", incidentSchema);