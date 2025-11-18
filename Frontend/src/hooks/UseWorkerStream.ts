"use client";

import { useEffect, useRef, useState } from "react";

// Unified worker type
export type WorkerRow = {
  _id: string;
  workerId: string;
  name?: string;
  role?: string;
  location?: string | null;
  heartRate?: number | null;
  status?: "safe" | "warning" | "critical";
  lastUpdate?: string;
  risk?: number | null;
  simulated?: boolean | null;
  uwc?: any | null;
};

export interface WorkerStreamUpdate {
  type: string;
  workerId?: string;
  id?: string;
  _id?: string;
  risk?: number | null;
  simulated?: boolean;
  uwc?: {
    badgeTelemetry?: {
      hr?: number;
      location?: { zone?: string };
    };
  };
}

function riskToStatus(risk: number | null | undefined): WorkerRow["status"] {
  if (risk == null) return "safe";
  if (risk >= 0.7) return "critical";
  if (risk >= 0.4) return "warning";
  return "safe";
}

export function useWorkerStream(wsUrl: string) {
  const [workers, setWorkers] = useState<Record<string, WorkerRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef({ tries: 0, timer: null as number | null });

  useEffect(() => {
    let mounted = true;

    function connect() {
      console.log("🔌 Connecting to WebSocket:", wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("🟢 WS Connected");
        reconnectRef.current.tries = 0;
        setLoading(false);
        // IMPORTANT: no subscription needed → backend will broadcast everything
      };

      ws.onmessage = (event) => {
        try {
          const msg: WorkerStreamUpdate = JSON.parse(event.data);

          const rawId = msg.workerId ?? msg.id ?? msg._id;
          if (!rawId) return;

          const workerId = String(rawId);

          // Only handle updates for uwc_update messages
          if (!msg || (!msg.risk && !msg.uwc)) return;

          setWorkers((prev) => {
            const existing = prev[workerId] ?? {
              _id: workerId,
              workerId,
              name: workerId,
              role: "Worker",
            };

            const risk = msg.risk ?? existing.risk ?? 0;

            return {
              ...prev,
              [workerId]: {
                ...existing,
                risk,
                status: riskToStatus(risk),
                simulated: msg.simulated ?? existing.simulated,
                uwc: msg.uwc ?? existing.uwc,
                heartRate:
                  msg.uwc?.badgeTelemetry?.hr ?? existing.heartRate ?? null,
                location:
                  msg.uwc?.badgeTelemetry?.location?.zone ??
                  existing.location ??
                  "unknown",
                lastUpdate: new Date().toLocaleTimeString(),
              },
            };
          });
        } catch (err) {
          console.warn("WS parse error:", err);
        }
      };

      ws.onclose = () => {
        if (!mounted) return;
        console.warn("🔴 WS Disconnected");

        const tries = ++reconnectRef.current.tries;
        const delay = Math.min(2000 * tries, 15000);

        reconnectRef.current.timer = window.setTimeout(connect, delay);
      };

      ws.onerror = (err) => {
        console.error("⚠️ WS Error:", err);
      };
    }

    connect();

    return () => {
      mounted = false;
      if (reconnectRef.current.timer) clearTimeout(reconnectRef.current.timer);
      wsRef.current?.close();
    };
  }, [wsUrl]);

  return { workers: Object.values(workers), loading, error };
}
