"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, MapPin, Clock } from 'lucide-react';

export default function SOSButton() {
  const [isPressed, setIsPressed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleSOSPress = () => {
    setIsPressed(true);
    setCountdown(3);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          // Trigger actual SOS alert
          alert('SOS ALERT TRIGGERED! Emergency services notified.');
          setIsPressed(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancel = () => {
    setIsPressed(false);
    setCountdown(null);
  };

  return (
    <>
      {/* SOS Button */}
      <motion.div
        className="fixed bottom-8 right-8 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
      >
        <motion.button
          onClick={handleSOSPress}
          disabled={isPressed}
          className={`w-20 h-20 rounded-full shadow-2xl flex items-center justify-center text-white font-bold text-lg relative overflow-hidden ${
            isPressed ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
          }`}
          whileHover={!isPressed ? { scale: 1.1 } : {}}
          whileTap={!isPressed ? { scale: 0.95 } : {}}
          animate={{
            boxShadow: isPressed
              ? '0 0 60px rgba(239, 68, 68, 0.8)'
              : '0 10px 40px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Pulse effect */}
          {!isPressed && (
            <>
              <motion.div
                className="absolute inset-0 bg-red-500 rounded-full"
                animate={{
                  scale: [1, 1.5, 1.5],
                  opacity: [0.8, 0, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
              <motion.div
                className="absolute inset-0 bg-red-500 rounded-full"
                animate={{
                  scale: [1, 1.5, 1.5],
                  opacity: [0.8, 0, 0],
                }}
                transition={{
                  duration: 2,
                  delay: 1,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            </>
          )}

          <div className="relative z-10 flex flex-col items-center">
            <Phone className="w-8 h-8" />
            <span className="text-xs mt-1">SOS</span>
          </div>
        </motion.button>
      </motion.div>

      {/* SOS Modal */}
      <AnimatePresence>
        {isPressed && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-800 border-2 border-red-500 rounded-2xl p-8 max-w-md w-full relative"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
            >
              <button
                onClick={handleCancel}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Countdown Circle */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-32 h-32 mb-4">
                  <motion.div
                    className="absolute inset-0 border-8 border-red-500 rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.span
                      className="text-6xl font-bold text-red-500"
                      key={countdown}
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {countdown}
                    </motion.span>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-red-500 mb-2">
                  EMERGENCY SOS ACTIVATED
                </h3>
                <p className="text-slate-300 text-center mb-6">
                  Alert will be sent to supervisors and emergency services in {countdown} seconds
                </p>
              </div>

              {/* Alert Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-slate-400">Location</p>
                    <p className="text-white font-mono">Zone-B, Sector 7, Floor 3</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-slate-400">Time</p>
                    <p className="text-white font-mono">{new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>

              {/* Cancel Button */}
              <button
                onClick={handleCancel}
                className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel Alert
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
