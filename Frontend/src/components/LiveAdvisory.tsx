"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, AlertCircle, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LiveAdvisoryProps {
  riskLevel: 'safe' | 'warning' | 'critical';
}

const advisoryMessages = {
  safe: [
    { hi: 'आप सुरक्षित हैं', en: 'You are safe', icon: Shield },
    { hi: 'सभी पैरामीटर सामान्य हैं', en: 'All parameters are normal', icon: Shield },
    { hi: 'काम जारी रखें', en: 'Continue with your work', icon: Shield },
  ],
  warning: [
    { hi: 'सावधान रहें', en: 'Be cautious', icon: AlertCircle },
    { hi: 'उच्च तापमान का पता चला', en: 'High temperature detected', icon: AlertCircle },
    { hi: 'असामान्य हृदय गति', en: 'Abnormal heart rate', icon: AlertCircle },
  ],
  critical: [
    { hi: 'खतरा! हेलमेट नहीं पहना', en: 'Danger! No helmet detected', icon: AlertCircle },
    { hi: 'खतरनाक क्षेत्र', en: 'Hazardous area', icon: AlertCircle },
    { hi: 'गैस रिसाव का पता चला', en: 'Gas leak detected', icon: AlertCircle },
  ],
};

const bgColors = {
  safe: 'bg-blue-500/10 border-blue-500/50',
  warning: 'bg-amber-500/10 border-amber-500/50',
  critical: 'bg-red-500/10 border-red-500/50',
};

const textColors = {
  safe: 'text-blue-400',
  warning: 'text-amber-400',
  critical: 'text-red-400',
};

export default function LiveAdvisory({ riskLevel }: LiveAdvisoryProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const messages = advisoryMessages[riskLevel];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [messages.length, riskLevel]);

  const currentMessage = messages[currentMessageIndex];
  const Icon = currentMessage.icon;

  return (
    <div className={`border ${bgColors[riskLevel]} rounded-2xl p-6 backdrop-blur-sm`}>
      <div className="flex items-start gap-4">
        <motion.div
          animate={{
            scale: riskLevel === 'critical' ? [1, 1.2, 1] : 1,
          }}
          transition={{
            duration: 0.5,
            repeat: riskLevel === 'critical' ? Infinity : 0,
          }}
        >
          <Volume2 className={`w-6 h-6 ${textColors[riskLevel]}`} />
        </motion.div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold">Live Advisory</h3>
            <motion.div
              className={`w-2 h-2 rounded-full ${riskLevel === 'safe' ? 'bg-blue-500' : riskLevel === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}
              animate={{
                opacity: [1, 0.3, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-1 ${textColors[riskLevel]} flex-shrink-0`} />
                <div>
                  <p className={`text-xl font-semibold ${textColors[riskLevel]} mb-1`}>
                    {currentMessage.hi}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {currentMessage.en}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress indicator */}
          <div className="flex gap-2 mt-4">
            {messages.map((_, index) => (
              <motion.div
                key={index}
                className={`h-1 rounded-full flex-1 ${
                  index === currentMessageIndex
                    ? riskLevel === 'safe'
                      ? 'bg-blue-500'
                      : riskLevel === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                    : 'bg-slate-700'
                }`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: index === currentMessageIndex ? 1 : 0 }}
                transition={{ duration: index === currentMessageIndex ? 4 : 0.3 }}
                style={{ transformOrigin: 'left' }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
