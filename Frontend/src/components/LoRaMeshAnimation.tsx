"use client";

import { useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";

// --- START OF COMPONENT ---
export default function LoRaMeshAnimation() {
  const line1Animation = useAnimation();
  const line2Animation = useAnimation();
  const line3Animation = useAnimation();
  const popupAnimation = useAnimation();

  // --- Animation Sequence ---
  useEffect(() => {
    let isCancelled = false;

    const sequence = async () => {
      // This infinite loop makes it repeat
      while (!isCancelled) {
        // Reset all animations to be invisible
        await Promise.all([
          line1Animation.start({
            pathLength: 0,
            opacity: 0,
            transition: { duration: 0 }
          }),
          line2Animation.start({
            pathLength: 0,
            opacity: 0,
            transition: { duration: 0 }
          }),
          line3Animation.start({
            pathLength: 0,
            opacity: 0,
            transition: { duration: 0 }
          }),
          popupAnimation.start({
            opacity: 0,
            scale: 0.8,
            transition: { duration: 0 }
          })
        ]);

        if (isCancelled) break;

        // Pause before starting
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (isCancelled) break;

        // Step 1: Animate Line 1 (A to B)
        await line1Animation.start({
          pathLength: 1,
          opacity: 1,
          transition: { duration: 1.0, ease: "linear" }
        });

        if (isCancelled) break;

        // Step 2: Animate Line 2 (B to C)
        await line2Animation.start({
          pathLength: 1,
          opacity: 1,
          transition: { duration: 1.0, ease: "linear" }
        });

        if (isCancelled) break;

        // Step 3: Animate Line 3 (C to Gateway)
        await line3Animation.start({
          pathLength: 1,
          opacity: 1,
          transition: { duration: 1.0, ease: "linear" }
        });

        if (isCancelled) break;

        // Step 4: Show Popup
        await popupAnimation.start({
          opacity: 1,
          scale: 1,
          transition: { duration: 0.3, ease: "easeOut" }
        });

        if (isCancelled) break;

        // Step 5: Pause with popup visible
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    };

    sequence();

    // Cleanup
    return () => {
      isCancelled = true;
    };
  }, [line1Animation, line2Animation, line3Animation, popupAnimation]);

  // --- JSX RENDER ---
  return (
    <div className="relative w-full max-w-3xl mx-auto h-[500px] bg-gray-900 border border-gray-700 rounded-lg p-8 overflow-hidden">
      
      {/* 1. VISIBLE GRID LINES */}
      {/* Horizontal Line */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-700 opacity-50 z-0"></div>
      {/* Vertical Line */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-700 opacity-50 z-0"></div>

      {/* 2. ZONE TITLES */}
      <div className="absolute top-4 left-4 text-gray-500 font-mono text-sm">Zone 1: Dead Zone</div>
      <div className="absolute top-4 right-4 text-gray-500 font-mono text-sm">Zone 2: Relay Area</div>
      <div className="absolute bottom-4 left-4 text-gray-500 font-mono text-sm">Zone 3: Relay Area</div>
      <div className="absolute bottom-4 right-4 text-gray-500 font-mono text-sm">Zone 4: Gateway</div>

      {/* 3. NODES (People) - Hardcoded Positions */}
      {/* Node 1: Worker A */}
      <div className="absolute z-10 p-2 text-center" style={{ top: '70%', left: '15%', transform: 'translate(-50%, -50%)' }}>
        <div className="w-12 h-12 rounded-full bg-cyan-800 flex items-center justify-center text-gray-200 text-xs font-bold" style={{ boxShadow: '0 0 15px 3px #22d3ee' }}>SOS</div>
        <div className="mt-2 text-gray-300 text-sm">Worker A</div>
      </div>

      {/* Node 2: Worker B */}
      <div className="absolute z-10 p-2 text-center" style={{ top: '40%', left: '45%', transform: 'translate(-50%, -50%)' }}>
        <div className="w-12 h-12 rounded-full bg-cyan-800 flex items-center justify-center text-gray-200 text-xs font-bold" style={{ boxShadow: '0 0 15px 3px #22d3ee' }}></div>
        <div className="mt-2 text-gray-300 text-sm">Worker B</div>
      </div>

      {/* Node 3: Worker C */}
      <div className="absolute z-10 p-2 text-center" style={{ top: '20%', left: '75%', transform: 'translate(-50%, -50%)' }}>
        <div className="w-12 h-12 rounded-full bg-cyan-800 flex items-center justify-center text-gray-200 text-xs font-bold" style={{ boxShadow: '0 0 15px 3px #22d3ee' }}></div>
        <div className="mt-2 text-gray-300 text-sm">Worker C</div>
      </div>

      {/* Node 4: Gateway */}
      <div className="absolute z-10 p-2 text-center" style={{ top: '10%', left: '90%', transform: 'translate(-50%, -50%)' }}>
        <div className="w-12 h-12 rounded-full bg-cyan-800 flex items-center justify-center text-gray-200 text-xs font-bold" style={{ boxShadow: '0 0 15px 3px #22d3ee' }}>GW</div>
        <div className="mt-2 text-gray-300 text-sm">Gateway</div>
      </div>

      {/* 4. SVG OVERLAY FOR LINES - This is the critical part */}
      <svg className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
        {/* Line 1: A to B (Hardcoded Path) */}
        <motion.path
          d="M 120 350 Q 180 275, 360 200"
          fill="none"
          stroke="#22d3ee" // Cyan-400
          strokeWidth="4"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 5px #22d3ee)' }}
          animate={line1Animation}
          initial={{ pathLength: 0, opacity: 0 }}
        />

        {/* Line 2: B to C (Hardcoded Path) */}
        <motion.path
          d="M 360 200 Q 480 150, 600 100"
          fill="none"
          stroke="#22d3ee" // Cyan-400
          strokeWidth="4"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 5px #22d3ee)' }}
          animate={line2Animation}
          initial={{ pathLength: 0, opacity: 0 }}
        />

        {/* Line 3: C to Gateway (Hardcoded Path) */}
        <motion.path
          d="M 600 100 Q 660 75, 720 50"
          fill="none"
          stroke="#22d3ee" // Cyan-400
          strokeWidth="4"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 5px #22d3ee)' }}
          animate={line3Animation}
          initial={{ pathLength: 0, opacity: 0 }}
        />
      </svg>

      {/* 5. POPUP MESSAGE */}
      <AnimatePresence>
        <motion.div
          className="absolute z-20 p-4 bg-green-500 text-white font-bold rounded-lg text-lg"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          animate={popupAnimation}
          initial={{ opacity: 0, scale: 0.8 }}
        >
          SOS DELIVERED
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
// --- END OF COMPONENT ---
