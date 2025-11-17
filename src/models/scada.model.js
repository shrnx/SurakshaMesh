import mongoose from 'mongoose';

const ScadaSchema = new mongoose.Schema({
  zone: { type: String, index: true },
  data: Object,
  ts: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

export default mongoose.model('Scada', ScadaSchema);
