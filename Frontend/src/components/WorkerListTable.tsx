// components/WorkerListTable.tsx
"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { User, MapPin, AlertCircle } from "lucide-react";
import { useWorkerStream } from "@/hooks/UseWorkerStream";

const statusConfig = {
  safe: {
    bg: "bg-green-500/10",
    border: "border-green-500/50",
    text: "text-green-400",
    dot: "bg-green-500",
    label: "SAFE",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/50",
    text: "text-amber-400",
    dot: "bg-amber-500",
    label: "WARNING",
  },
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/50",
    text: "text-red-400",
    dot: "bg-red-500",
    label: "CRITICAL",
  },
};

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

export default function WorkerListTable() {
  // No more AUTOSUB_WORKERS, dynamic ingestion only
  const { workers: rows, loading, error } = useWorkerStream(WS_URL);

  // Sort by newest update (optional but makes real-time tables feel responsive)
  const sortedRows = [...rows].sort((a, b) => {
    if (!a.lastUpdate) return 1;
    if (!b.lastUpdate) return -1;
    return b.lastUpdate.localeCompare(a.lastUpdate);
  });

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold">Live Worker Status</h2>
          </div>
          <div className="flex items-center gap-2 text-sm font-mono text-teal-400">
            <div
              className={clsx(
                "w-2 h-2 rounded-full animate-pulse",
                sortedRows.length > 0 ? "bg-green-500" : "bg-gray-600"
              )}
            />
            {loading ? "..." : sortedRows.length} Active
          </div>
        </div>
      </div>

      {loading && sortedRows.length === 0 && (
        <div className="p-6 text-center text-slate-400">
          Loading worker data...
        </div>
      )}

      {error && (
        <div className="p-6 text-center text-red-400 bg-red-500/10">
          <AlertCircle className="inline-block mr-2" />
          Could not load data: {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/30">
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">
                Worker
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">
                Live Location
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">
                Risk Score
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">
                Last Update
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedRows.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-slate-400"
                >
                  Awaiting live worker data...
                </td>
              </tr>
            )}

            {sortedRows.map((worker, index) => {
              const config = statusConfig[worker.status ?? "safe"];
              const key = worker.workerId ?? worker._id ?? `worker-${index}`;

              return (
                <motion.tr
                  key={key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                >
                  {/* Worker Col */}
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">
                      {worker.name ?? worker.workerId}
                      <span className="text-sm font-mono text-slate-400 ml-2">
                        {worker.role ?? "Worker"}
                      </span>
                      <div className="text-xs text-slate-500 mt-1">
                        {worker.workerId}
                      </div>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">
                        {worker.location ?? "unknown"}
                      </span>
                    </div>
                  </td>

                  {/* Risk */}
                  <td className="px-6 py-4">
                    <div
                      className={clsx(
                        "flex items-center gap-2 font-mono font-semibold",
                        config.text
                      )}
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>{(worker.risk ?? 0).toFixed(3)}</span>
                      {worker.simulated === true && (
                        <span className="text-xs text-amber-300 ml-2">
                          (sim)
                        </span>
                      )}
                      {worker.simulated === false && (
                        <span className="text-xs text-green-300 ml-2">
                          (real)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div
                      className={clsx(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full border w-28 justify-center",
                        config.bg,
                        config.border
                      )}
                    >
                      <div
                        className={clsx(
                          "w-2 h-2 rounded-full",
                          config.dot,
                          worker.status === "critical" && "animate-pulse"
                        )}
                      />
                      <span className={clsx("text-sm font-semibold", config.text)}>
                        {config.label}
                      </span>
                    </div>
                  </td>

                  {/* Last Update */}
                  <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                    {worker.lastUpdate ?? "—"}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
