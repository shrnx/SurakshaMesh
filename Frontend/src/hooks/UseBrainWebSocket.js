// File: src/hooks/useBrainWebSocket.js
"use client";
import { useEffect, useRef, useState } from 'react';

export function useBrainWebSocket(url) {
  const [workerInsights, setWorkerInsights] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [latestIncident, setLatestIncident] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(' Brain connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'initial_insights') {
        console.log(' Received initial brain insights');
        setWorkerInsights(data.workers);
      }

      if (data.type === 'prediction_update') {
        console.log(' Prediction update received');
        // Update specific worker insight
        setWorkerInsights(prev =>
          prev.map(w =>
            w.id === data.worker_id
              ? { ...w, insights: data.insights }
              : w
          )
        );
      }

      if (data.type === 'incident_recorded') {
        console.log(' New incident recorded');
        setLatestIncident({
          worker_id: data.worker_id,
          risk: data.risk,
          zone: data.zone,
          message: data.message,
          timestamp: new Date().toISOString()
        });
        // Clear after 5 seconds
        setTimeout(() => setLatestIncident(null), 5000);
      }
    };

    ws.onerror = (error) => {
      console.error(' Brain WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log(' Brain disconnected');
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [url]);

  const requestPrediction = (workerId) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'get_prediction',
        worker_id: workerId
      }));
    }
  };

  const simulateIncident = (workerId, risk, zone) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'simulate_incident',
        worker_id: workerId,
        risk: risk,
        zone: zone
      }));
    }
  };

  return {
    workerInsights,
    isConnected,
    latestIncident,
    requestPrediction,
    simulateIncident
  };
}