"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Thermometer, Activity, Droplets } from 'lucide-react';

type TabType = 'heart' | 'temp' | 'activity' | 'hydration';

interface HealthMetric {
  id: TabType;
  label: string;
  icon: React.ElementType;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  details: { label: string; value: string }[];
  trend: number[];
}

const healthData: HealthMetric[] = [
  {
    id: 'heart',
    label: 'Heart Rate',
    icon: Heart,
    value: '88',
    unit: 'BPM',
    status: 'warning',
    details: [
      { label: 'Resting HR', value: '72 BPM' },
      { label: 'Max HR Today', value: '142 BPM' },
      { label: 'Avg HR (24h)', value: '78 BPM' },
      { label: 'Variability', value: 'Moderate' },
    ],
    trend: [72, 75, 78, 82, 85, 88, 92, 88, 84, 88],
  },
  {
    id: 'temp',
    label: 'Body Temperature',
    icon: Thermometer,
    value: '38.2',
    unit: '°C',
    status: 'warning',
    details: [
      { label: 'Normal Range', value: '36.5-37.5°C' },
      { label: 'Current Trend', value: 'Rising' },
      { label: 'Ambient Temp', value: '42°C' },
      { label: 'Humidity', value: '68%' },
    ],
    trend: [36.8, 37.0, 37.2, 37.5, 37.8, 38.0, 38.2, 38.1, 38.2, 38.2],
  },
  {
    id: 'activity',
    label: 'Activity Level',
    icon: Activity,
    value: '6,842',
    unit: 'steps',
    status: 'normal',
    details: [
      { label: 'Daily Goal', value: '8,000 steps' },
      { label: 'Calories Burned', value: '420 kcal' },
      { label: 'Active Time', value: '4h 23m' },
      { label: 'Rest Breaks', value: '3 taken' },
    ],
    trend: [1200, 2100, 3400, 4200, 5100, 5800, 6200, 6500, 6700, 6842],
  },
  {
    id: 'hydration',
    label: 'Hydration',
    icon: Droplets,
    value: '1.2',
    unit: 'L',
    status: 'critical',
    details: [
      { label: 'Daily Goal', value: '3.0 L' },
      { label: 'Last Intake', value: '2h 15m ago' },
      { label: 'Sweat Rate', value: 'High' },
      { label: 'Recommendation', value: 'Drink water now' },
    ],
    trend: [0, 0.3, 0.5, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.2],
  },
];

export default function HealthTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('heart');
  const activeMetric = healthData.find((m) => m.id === activeTab)!;

  const statusColors = {
    normal: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/50',
      text: 'text-green-400',
      dot: 'bg-green-500',
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/50',
      text: 'text-amber-400',
      dot: 'bg-amber-500',
    },
    critical: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/50',
      text: 'text-red-400',
      dot: 'bg-red-500',
    },
  };

  const colors = statusColors[activeMetric.status];

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden">
      {/* Tab Headers */}
      <div className="flex border-b border-slate-700 overflow-x-auto">
        {healthData.map((metric) => {
          const Icon = metric.icon;
          const isActive = activeTab === metric.id;
          const metricColors = statusColors[metric.status];

          return (
            <button
              key={metric.id}
              onClick={() => setActiveTab(metric.id)}
              className={`flex-1 min-w-[140px] px-6 py-4 transition-all relative ${
                isActive ? 'bg-slate-700/50' : 'hover:bg-slate-700/30'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              
              <div className="flex items-center justify-center gap-2 mb-1">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <div className={`w-2 h-2 rounded-full ${metricColors.dot}`} />
              </div>
              <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>
                {metric.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6"
      >
        {/* Main Metric Display */}
        <div className={`border ${colors.border} ${colors.bg} rounded-xl p-6 mb-6`}>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm mb-2">{activeMetric.label}</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${colors.text}`}>
                  {activeMetric.value}
                </span>
                <span className="text-2xl text-slate-400 font-mono">
                  {activeMetric.unit}
                </span>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg ${colors.bg} ${colors.text} border ${colors.border} font-semibold text-sm uppercase`}>
              {activeMetric.status}
            </div>
          </div>

          {/* Mini trend chart */}
          <div className="flex items-end gap-1 h-16">
            {activeMetric.trend.map((value, index) => {
              const maxValue = Math.max(...activeMetric.trend);
              const height = (value / maxValue) * 100;
              return (
                <motion.div
                  key={index}
                  className={`flex-1 ${colors.dot} rounded-t`}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                />
              );
            })}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          {activeMetric.details.map((detail, index) => (
            <motion.div
              key={detail.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-700/30 rounded-lg p-4"
            >
              <p className="text-slate-400 text-sm mb-1">{detail.label}</p>
              <p className="text-white font-semibold font-mono">{detail.value}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
