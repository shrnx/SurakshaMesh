// src/debug/wsEmitter.js
// Simple helper to emit simulated uwc_update messages periodically for test

import { broadcast } from '../ws/wsServer.js';

let timers = {};

function makeUwc(workerId) {
  const hr = Math.floor(60 + Math.random() * 40);
  const ppe = { helmet: true, vest: true, gloves: Math.random()>0.3, boots: true, goggles: Math.random()>0.4 };
  const presentCount = Object.values(ppe).filter(Boolean).length;
  const complianceScore = presentCount / 5;
  const uwc = {
    workerId,
    timestamp: new Date().toISOString(),
    badgeTelemetry: { hr, spo2: 98, skinTemp: 36.5, location: { x: 5, y: 6, zone: 'default-zone' }, fallDetected: false, sosActive: false },
    visionTelemetry: { isCompliant: complianceScore === 1, ppeCompliant: complianceScore === 1, complianceScore, ppe, missingItems: [], allFoundItems: [] },
    scadaContext: { ambientGasPpm: 30, zoneTemp: 30, zoneAlarmActive: false },
    workerProfile: { shiftDurationHours: 8, pastIncidentCount: 0, age: 28, fatigueScore: 0.2 }
  };

  // simple risk mapping (0..1)
  const hrFactor = Math.min(1, Math.max(0, (uwc.badgeTelemetry.hr - 70) / 60));
  const shiftFactor = 0; // not used here
  const fatigue = Math.min(1, hrFactor);
  const risk = Math.round(((fatigue * 0.5) + (1 - uwc.visionTelemetry.complianceScore) * 0.5) * 1000) / 1000;
  return { uwc, risk };
}

export function startSim(workerId, interval = 1500) {
  if (timers[workerId]) return false;
  timers[workerId] = setInterval(() => {
    const { uwc, risk } = makeUwc(workerId);
    broadcast({ type: 'uwc_update', workerId, risk, simulated: true, uwc });
  }, interval);
  return true;
}

export function stopSim(workerId) {
  if (!timers[workerId]) return false;
  clearInterval(timers[workerId]);
  delete timers[workerId];
  return true;
}

export function stopAll() {
  Object.keys(timers).forEach(k => stopSim(k));
}
