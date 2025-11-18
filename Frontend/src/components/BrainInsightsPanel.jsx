// File: src/components/BrainInsightsPanel.jsx
"use client";
import { useBrainWebSocket } from '@/hooks/UseBrainWebSocket';

export default function BrainInsightsPanel() {
  const { workerInsights, isConnected, latestIncident } = useBrainWebSocket('ws://localhost:8002/ws/brain');

  return (
    <>
      <div style={{
        position: 'absolute',
        top: 120,
        left: 20,
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '15px 20px',
        borderRadius: '10px',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '14px',
        maxWidth: '350px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 255, 136, 0.3)'
      }}>
        <div style={{
          marginBottom: 12,
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#00ff88'
        }}>
          Brain Insights
        </div>

        <div style={{
          marginBottom: 10,
          padding: '5px 10px',
          background: isConnected ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 68, 68, 0.2)',
          borderRadius: '5px',
          fontSize: '12px'
        }}>
          {isConnected ? ' Brain Online' : ' Brain Offline'}
        </div>

        {latestIncident && (
          <div style={{
            padding: '10px',
            background: 'rgba(255, 165, 0, 0.2)',
            borderRadius: '5px',
            marginBottom: '10px',
            borderLeft: '3px solid orange',
            animation: 'pulse 1s infinite'
          }}>
            <div style={{ fontWeight: 'bold', color: 'orange' }}>
              New Incident
            </div>
            <div style={{ fontSize: '12px' }}>
              {latestIncident.message}
            </div>
          </div>
        )}

        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {workerInsights.map((worker) => (
            <div
              key={worker.id}
              style={{
                marginBottom: '10px',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '5px',
                borderLeft: `3px solid ${
                  worker.risk >= 70 ? '#ff4444' :
                  worker.risk >= 40 ? '#ffa500' : '#00ff88'
                }`
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                {worker.name}
              </div>
              <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
                ID: {worker.id} | Zone: {worker.zone}
              </div>
              {worker.insights && (
                <div style={{ marginTop: '5px', fontSize: '12px' }}>
                  <div>Incidents: {worker.insights.total_incidents || 0}</div>
                  <div>Avg Risk: {worker.insights.avg_risk || 0}%</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* This style tag is for the pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </>
  );
}