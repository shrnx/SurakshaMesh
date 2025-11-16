import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import { Worker } from '../src/models/workers.model.js'

const MONGO = process.env.MONGODB_URI || 'mongodb://localhost:27017/suraksha';

async function main() {
    await mongoose.connect(MONGO);
    const sample = [
        { workerId: 'ramesh-1', name: 'Ramesh', role: 'operator' },
        { workerId: 'suresh-2', name: 'Suresh', role: 'operator' },
        { workerId: 'rahul-3', name: 'Rahul', role: 'supervisor' }
    ];
    for (const w of sample) {
        await Worker.updateOne({ workerId: w.workerId }, { $set: w }, { upsert: true });
    }
    console.log('seeded workers');
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1) });
