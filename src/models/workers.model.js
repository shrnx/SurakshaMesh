import mongoose from "mongoose";

const workerSchema = new mongoose.Schema({
  workerId: { type: String, unique: true, required: true },
  name: String,
  role: String,
  meta: Object
}, { timestamps: true });

export const Worker = mongoose.model("Worker", workerSchema)