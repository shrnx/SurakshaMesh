"use client";

import { useBrainWebSocket } from '@/hooks/UseBrainWebSocket';

export default function SecondBrainPanel() {
  const { workerInsights, isConnected, latestIncident } = useBrainWebSocket('ws://localhost:8002/ws/brain');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <h2 className="text-2xl font-bold text-white">Second Brain AI</h2>
        </div>
        <div className={`px-4 py-2 rounded-lg text-sm font-mono ${
          isConnected 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {isConnected ? '● ONLINE' : '● OFFLINE'}
        </div>
      </div>

      {/* Latest Incident Alert */}
      {latestIncident && (
        <div className="bg-orange-500/20 border-2 border-orange-500 rounded-lg p-4 animate-pulse">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <h3 className="text-lg font-bold text-orange-400">New Incident Detected</h3>
          </div>
          <p className="text-white text-sm mb-1">{latestIncident.message}</p>
          <p className="text-gray-400 text-xs">
            Worker ID: {latestIncident.worker_id} | Risk: {latestIncident.risk}% | Zone: {latestIncident.zone}
          </p>
        </div>
      )}

      {/* Worker Insights Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workerInsights.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">
            <p>No worker insights available</p>
            <p className="text-sm mt-2">Waiting for brain connection...</p>
          </div>
        ) : (
          workerInsights.map((worker) => (
            <div
              key={worker.id}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 hover:border-cyan-400 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white">{worker.name}</h3>
                <div className={`px-2 py-1 rounded text-xs font-mono ${
                  worker.risk >= 70 ? 'bg-red-500/20 text-red-400' :
                  worker.risk >= 40 ? 'bg-orange-500/20 text-orange-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {worker.risk || 0}% Risk
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>ID:</span>
                  <span className="font-mono text-white">{worker.id}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Zone:</span>
                  <span className="font-mono text-white">{worker.zone}</span>
                </div>
                
                {worker.insights && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Total Incidents:</span>
                      <span className="font-mono text-white">{worker.insights.total_incidents || 0}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Avg Risk:</span>
                      <span className="font-mono text-white">{worker.insights.avg_risk || 0}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

