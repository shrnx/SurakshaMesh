// src/scripts/seed_workers_bulk.js
// Usage: node src/scripts/seed_workers_bulk.js
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import mongoose from 'mongoose';
import Worker from '../models/workers.model.js';
import { DB_NAME } from "../constants.js";

const MONGO_BASE = process.env.MONGODB_URI;
if (!MONGO_BASE) {
  console.error('Missing MONGODB_URI in environment (.env?)');
  process.exit(1);
}
const MONGO = `${MONGO_BASE.replace(/\/+$/, '')}/${DB_NAME}`; // avoid double slashes

// Small helpers to generate random values
const firstNames = ['Raj', 'Ramesh', 'Sanjay', 'Amit', 'Deepak', 'Sunil', 'Ankit', 'Neeraj', 'Arjun', 'Ravi', 'Vikas', 'Karan', 'Sidharth', 'Manish', 'Aditya', 'Vijay', 'Prakash', 'Rahul', 'Santosh', 'Harish'];
const lastNames = ['Kumar','Sharma','Verma','Singh','Patel','Joshi','Gupta','Mehta','Reddy','Nair','Bose','Chaudhary','Kapoor','Agarwal','Ganguly','Das','Swamy','Khan','Rao','Iyer'];
const roles = ['Operator', 'Supervisor', 'Engineer', 'Technician', 'Inspector'];
const shifts = ['A', 'B', 'C'];

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function randomName() { return `${pick(firstNames)} ${pick(lastNames)}`; }
function randomExperience(age) {
  const maxExp = Math.max(0, age - 18);
  return Math.min(maxExp, randInt(0, Math.min(20, maxExp)));
}

async function main() {
  console.log('Connecting to MongoDB:', MONGO);
  try {
    await mongoose.connect(MONGO, { /* options if needed */ });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message || err);
    process.exit(1);
  }

  const ops = [];
  for (let i = 1; i <= 100; i++) {
    const workerId = `EMP-${String(i).padStart(3,'0')}`;
    const age = randInt(20, 60);
    const role = Math.random() < 0.8 ? pick(roles) : 'Operator';
    const shift = pick(shifts);
    const experience = randomExperience(age);
    const pastIncidents = randInt(0, 5);
    const name = randomName();
    const contactNum = String(randInt(6000000000, 9999999999)); // ensure string
    const meta = {
      department: Math.random() < 0.5 ? 'Production' : 'Maintenance',
      locationZone: Math.random() < 0.6 ? 'Furnace-A' : (Math.random()<0.5 ? 'Assembly' : 'Chemical'),
      contact: `+91${contactNum}`,
      tags: [ role.toLowerCase(), shift === 'A' ? 'morning' : (shift === 'B' ? 'evening' : 'night') ]
    };

    ops.push({
      updateOne: {
        filter: { workerId },
        update: {
          $set: {
            workerId,
            name,
            age,
            shift,
            role,
            experience,
            pastIncidents,
            meta
          }
        },
        upsert: true
      }
    });
  }

  try {
    console.log('Seeding 100 workers (upsert)...');
    const res = await Worker.bulkWrite(ops, { ordered: false });

    // normalized output depending on driver
    const inserted = res.upsertedCount ?? res.nUpserted ?? (res.upserted ? res.upserted.length : 0);
    const modified = res.modifiedCount ?? res.nModified ?? 0;
    console.log('Bulk write result:', { upserted: inserted, modified });

    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB.');
    } catch(e) {
      console.warn('Error while disconnecting:', e);
    }
    // If you must force exit for environments like bun, uncomment below:
    // process.exit(0);
  }
}

main().catch(err=>{
  console.error('Fatal seed error', err);
  process.exit(1);
});
