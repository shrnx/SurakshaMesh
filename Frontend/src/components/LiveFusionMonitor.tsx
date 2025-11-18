"use client";

import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DotState {
  id: number;
  color: 'safe' | 'warning' | 'critical';
}

export default function LiveFusionMonitor() {
  const [dots, setDots] = useState<DotState[]>(() => 
    Array.from({ length: 50 }, (_, i) => ({ id: i, color: 'safe' }))
  );

  useEffect(() => {
    const animationLoop = setInterval(() => {
      // Step 1: Reset all dots to safe
      setDots(Array.from({ length: 50 }, (_, i) => ({ id: i, color: 'safe' })));

      // Step 2: After 500ms, randomly select 5-10 dots and turn them warning
      setTimeout(() => {
        const warningCount = Math.floor(Math.random() * 6) + 5; // 5-10
        const warningIndices = new Set<number>();
        while (warningIndices.size < warningCount) {
          warningIndices.add(Math.floor(Math.random() * 50));
        }
        
        setDots(prev => prev.map(dot => ({
          ...dot,
          color: warningIndices.has(dot.id) ? 'warning' : 'safe'
        })));

        // Step 3: After another 800ms, from warning dots, select 2-3 and turn them critical
        setTimeout(() => {
          const warningDots = Array.from(warningIndices);
          const criticalCount = Math.floor(Math.random() * 2) + 2; // 2-3
          const criticalIndices = new Set<number>();
          while (criticalIndices.size < criticalCount && criticalIndices.size < warningDots.length) {
            criticalIndices.add(warningDots[Math.floor(Math.random() * warningDots.length)]);
          }

          setDots(prev => prev.map(dot => ({
            ...dot,
            color: criticalIndices.has(dot.id) ? 'critical' : dot.color
          })));
        }, 800);
      }, 500);
    }, 4000); // 4-second loop synced with engine pulse

    return () => clearInterval(animationLoop);
  }, []);

  return (
    <motion.div
      className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-8 overflow-hidden mt-16"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-teal-400/10 to-amber-400/10 opacity-50" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center min-h-[400px]">
        {/* LEFT: Data Streams */}
        <div className="space-y-6">
          <h3 className="text-xs font-mono text-slate-400 mb-6 tracking-wider">DATA INPUTS</h3>
          
          {/* Wearable Sensors Stream */}
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-sm font-mono text-teal-400">WEARABLE SENSORS</span>
            </div>
            {/* Particle stream */}
            <div className="absolute left-0 top-1/2 w-full h-px overflow-visible">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={`teal-${i}`}
                  className="absolute w-2 h-2 rounded-full bg-teal-400"
                  style={{ left: 0 }}
                  animate={{
                    x: [0, 200, 400],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.4,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              ))}
            </div>
          </div>

          {/* YOLO CCTV Stream */}
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-mono text-blue-500">YOLO CCTV</span>
            </div>
            {/* Particle stream */}
            <div className="absolute left-0 top-1/2 w-full h-px overflow-visible">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={`blue-${i}`}
                  className="absolute w-2 h-2 rounded-full bg-blue-500"
                  style={{ left: 0 }}
                  animate={{
                    x: [0, 200, 400],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.4 + 0.2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              ))}
            </div>
          </div>

          {/* SCADA Feeds Stream */}
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm font-mono text-amber-400">SCADA FEEDS</span>
            </div>
            {/* Particle stream */}
            <div className="absolute left-0 top-1/2 w-full h-px overflow-visible">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={`amber-${i}`}
                  className="absolute w-2 h-2 rounded-full bg-amber-400"
                  style={{ left: 0 }}
                  animate={{
                    x: [0, 200, 400],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.4 + 0.4,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: Fusion Engine */}
        <div className="flex flex-col items-center justify-center">
          <motion.div
            className="relative"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-teal-400 to-amber-400 opacity-30 blur-2xl"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            {/* Core orb */}
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center shadow-2xl shadow-blue-500/50">
              <Cpu className="w-16 h-16 text-white" />
            </div>
          </motion.div>
          
          <p className="text-xs font-mono text-slate-300 mt-6 text-center tracking-wider">
            HYBRID INTELLIGENCE<br />ENGINE
          </p>
        </div>

        {/* RIGHT: Live Worker Grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono text-slate-400 mb-2 tracking-widest uppercase">PLANT-WIDE MONITORING</h3>
          <h3 className="text-xs font-mono text-slate-400 mb-6 tracking-wider">LIVE RISK OUTPUT</h3>
          
          <div className="grid grid-cols-10 gap-2">
            {dots.map((dot) => (
              <motion.div
                key={dot.id}
                className={`w-3 h-3 rounded-full ${
                  dot.color === 'safe' ? 'bg-blue-500' :
                  dot.color === 'warning' ? 'bg-amber-400' :
                  'bg-red-600'
                }`}
                animate={dot.color === 'critical' ? {
                  scale: [1, 1.2, 1],
                } : {}}
                transition={dot.color === 'critical' ? {
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : {
                  duration: 0.5
                }}
              />
            ))}
          </div>
          
          <div className="mt-4 text-xs font-mono text-slate-400 text-center">
            <p>Monitoring 50 workers</p>
            <p className="text-teal-400 mt-1">System active • Real-time analysis</p>
          </div>
        </div>
      </div>

      {/* Title badge */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-full">
        <p className="text-xs font-mono text-teal-400 tracking-wider">LIVE FUSION MONITOR</p>
      </div>
    </motion.div>
  );
}