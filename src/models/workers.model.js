// src/models/Worker.model.js
import mongoose from 'mongoose';

const WorkerSchema = new mongoose.Schema({
  workerId: { type: String, unique: true, required: true, index: true },
  name: String,
  age: Number,
  shift: String,
  role: String,
  experience: Number,
  pastIncidents: { type: Number, default: 0 },
  meta: Object
}, { timestamps: true });

// safe default export (prevents OverwriteModelError when files hot-reload)
export default mongoose.models.Worker || mongoose.model('Worker', WorkerSchema);
