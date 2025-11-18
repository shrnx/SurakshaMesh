"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Shield, TrendingUp } from 'lucide-react';
import { fetchFromApi } from '@/lib/api';

// This interface now matches the backend's Incident model
interface Anomaly {
  _id: string;
  createdAt: string; // ISO date string
  severity: number | 'critical' | 'warning' | 'safe';
  type: string; // Changed from title to type to match API
  description: string;
  workerId?: string;
}

interface IncidentsApiResponse {
  count: number;
  incidents: Anomaly[];
}

// Helper to format time from an ISO string
const formatTime = (isoString: string) => new Date(isoString).toLocaleTimeString('en-US', { hour12: false });

// Helper to convert numerical severity from the API to a string category
const getSeverityCategory = (severity: Anomaly['severity']): 'critical' | 'warning' | 'safe' => {
  if (typeof severity === 'string') {
    return severity;
  }
  if (severity > 0.7) return 'critical';
  if (severity > 0.4) return 'warning';
  return 'safe';
};


const anomalyConfig = {
  critical: {
    icon: AlertCircle,
    bg: 'bg-red-500/10',
    border: 'border-red-500/50',
    text: 'text-red-400',
    iconBg: 'bg-red-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
    iconBg: 'bg-amber-500',
  },
  safe: {
    icon: Shield,
    bg: 'bg-green-500/10',
    border: 'border-green-500/50',
    text: 'text-green-400',
    iconBg: 'bg-green-500',
  },
};

export default function AnomalyFeed({ fullView = false }: { fullView?: boolean }) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getIncidents = async () => {
      try {
        // Fetch 'open' incidents for the live feed, limited to 50 as requested.
        const data = await fetchFromApi<IncidentsApiResponse>('/dashboard/incidents?status=open&limit=50');
        setAnomalies(data.incidents);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch incidents');
      } finally {
        if (loading) setLoading(false); // Only set loading to false on the first fetch
      }
    };

    getIncidents(); // Fetch immediately

    // Then, poll for new data every 5 seconds
    const intervalId = setInterval(getIncidents, 5000);
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [loading]); // The dependency array ensures this effect runs once

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-700 bg-slate-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold">Live Anomaly Feed</h3>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-slate-400 font-mono">Real-time</span>
          </div>
        </div>
      </div>

      <div
        className={`divide-y divide-slate-700/50 ${fullView ? '' : 'max-h-[600px]'} overflow-y-auto custom-scrollbar`}
      >
        {loading && anomalies.length === 0 && <div className="p-4 text-center text-slate-400">Loading feed...</div>}
        {error && (
          <div className="p-4 text-center text-red-400 bg-red-500/10">
            <AlertCircle className="inline-block mr-2" />
            Could not load feed: {error}
          </div>
        )}
        {anomalies.length === 0 && !loading && !error && (
          <div className="p-4 text-center text-slate-400">No open incidents.</div>
        )}

        {anomalies.map((anomaly, index) => {
          const severityCategory = getSeverityCategory(anomaly.severity);
          const config = anomalyConfig[severityCategory];
          // Gracefully handle anomalies with unknown severity to prevent crashes
          if (!config) {
            console.warn("Skipping anomaly with unknown severity:", anomaly);
            return null;
          }

          const Icon = config.icon;

          return (
            <motion.div
              key={anomaly._id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`${config.iconBg} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={`font-semibold ${config.text} capitalize`}>
                      {severityCategory}
                    </h4>
                    <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
                      {formatTime(anomaly.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm text-slate-400 mb-2">{anomaly.description}</p>

                  {anomaly.workerId && (
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${config.bg} border ${config.border} text-xs font-mono`}>
                      <span className={config.text}>{anomaly.workerId}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}
