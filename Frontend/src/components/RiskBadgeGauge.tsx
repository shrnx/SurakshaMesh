"use client";

import { motion } from 'framer-motion';
import { Shield, AlertTriangle, AlertCircle } from 'lucide-react';

interface RiskBadgeGaugeProps {
  riskLevel: 'safe' | 'warning' | 'critical';
}

const riskConfig = {
  safe: {
    color: 'from-blue-500 to-teal-500',
    bgColor: 'bg-blue-500',
    icon: Shield,
    label: 'SAFE',
    message: 'All systems normal',
    percentage: 95,
    borderColor: 'border-blue-500',
    glowColor: 'shadow-blue-500/50',
  },
  warning: {
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500',
    icon: AlertTriangle,
    label: 'WARNING',
    message: 'Elevated risk detected',
    percentage: 60,
    borderColor: 'border-amber-500',
    glowColor: 'shadow-amber-500/50',
  },
  critical: {
    color: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-500',
    icon: AlertCircle,
    label: 'CRITICAL',
    message: 'Immediate action required',
    percentage: 25,
    borderColor: 'border-red-500',
    glowColor: 'shadow-red-500/50',
  },
};

export default function RiskBadgeGauge({ riskLevel }: RiskBadgeGaugeProps) {
  const config = riskConfig[riskLevel];
  const Icon = config.icon;

  return (
    <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 overflow-hidden">
      {/* Breathing background effect */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-5`}
        animate={{
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{
          duration: riskLevel === 'critical' ? 1 : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Gauge Circle */}
          <div className="relative">
            <motion.div
              className={`w-40 h-40 rounded-full border-8 ${config.borderColor} flex items-center justify-center relative ${config.glowColor}`}
              animate={{
                boxShadow: [
                  `0 0 20px ${config.glowColor}`,
                  `0 0 40px ${config.glowColor}`,
                  `0 0 20px ${config.glowColor}`,
                ],
                scale: riskLevel === 'critical' ? [1, 1.05, 1] : 1,
              }}
              transition={{
                duration: riskLevel === 'critical' ? 0.8 : 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ boxShadow: '0 0 30px rgba(0,0,0,0.3)' }}
            >
              {/* Pulse ring effect */}
              {riskLevel === 'critical' && (
                <motion.div
                  className={`absolute inset-0 rounded-full border-4 ${config.borderColor}`}
                  animate={{
                    scale: [1, 1.4, 1.4],
                    opacity: [0.8, 0, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              )}

              <motion.div
                className={`${config.bgColor} w-32 h-32 rounded-full flex items-center justify-center`}
                animate={{
                  scale: riskLevel === 'warning' ? [1, 1.08, 1] : 1,
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Icon className="w-16 h-16 text-white" />
              </motion.div>
            </motion.div>

            {/* Percentage indicator */}
            <motion.div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-full px-4 py-1 text-sm font-mono font-semibold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {config.percentage}%
            </motion.div>
          </div>

          {/* Status Info */}
          <div className="flex-1 text-center md:text-left">
            <motion.div
              className={`inline-block px-4 py-2 rounded-lg ${config.bgColor} text-white font-bold text-2xl mb-4`}
              animate={{
                opacity: riskLevel === 'critical' ? [1, 0.7, 1] : 1,
              }}
              transition={{
                duration: 0.6,
                repeat: riskLevel === 'critical' ? Infinity : 0,
                ease: 'easeInOut',
              }}
            >
              {config.label}
            </motion.div>

            <h3 className="text-3xl font-bold mb-2">{config.message}</h3>
            <p className="text-slate-400 mb-6">
              {riskLevel === 'safe' && 'Continue monitoring. All safety parameters within normal range.'}
              {riskLevel === 'warning' && 'Proceed with caution. Environmental or health factors require attention.'}
              {riskLevel === 'critical' && 'Stop work immediately. Evacuate to safe zone and await assistance.'}
            </p>

            {/* Risk factors */}
            <div className="flex flex-wrap gap-2">
              {riskLevel === 'safe' && (
                <>
                  <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-sm text-blue-400">
                    PPE Compliant
                  </span>
                  <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-sm text-blue-400">
                    Vitals Normal
                  </span>
                  <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-sm text-blue-400">
                    Safe Zone
                  </span>
                </>
              )}
              {riskLevel === 'warning' && (
                <>
                  <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-sm text-amber-400">
                    Elevated Heart Rate
                  </span>
                  <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-sm text-amber-400">
                    High Temperature
                  </span>
                </>
              )}
              {riskLevel === 'critical' && (
                <>
                  <span className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full text-sm text-red-400 animate-pulse">
                    No Helmet Detected
                  </span>
                  <span className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full text-sm text-red-400 animate-pulse">
                    Gas Leak Alert
                  </span>
                  <span className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full text-sm text-red-400 animate-pulse">
                    Restricted Zone
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
