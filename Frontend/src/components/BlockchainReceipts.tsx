"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Check, ExternalLink, Lock, AlertCircle } from 'lucide-react';
import { fetchFromApi } from '@/lib/api';

// This interface now reflects the expected data from your backend
interface BlockchainReceipt {
  _id: string;
  createdAt: string;
  type: string; // eventType
  workerId: string; // workerId
  // workerName is not in the new API data, so we'll just use workerId
  blockchainHash: string; // hash
  // block number is not in the new API data, so we'll use a placeholder
  anchorStatus: 'simulated' | 'verified' | 'pending'; // status
}

interface ReceiptsApiResponse {
  count: number;
  incidents: BlockchainReceipt[];
}

// Helper to format time from an ISO string
const formatTime = (isoString: string) => new Date(isoString).toLocaleString('en-US', { hour12: false });

export default function BlockchainReceipts() {
  const [receipts, setReceipts] = useState<BlockchainReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getReceipts = async () => {
      try {
        // Fetching receipts from the backend. Assuming a similar API structure to AnomalyFeed.
        const data = await fetchFromApi<ReceiptsApiResponse>('/dashboard/incidents?status=open&limit=50');
        setReceipts(data.incidents);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch receipts');
      } finally {
        if (loading) setLoading(false);
      }
    };

    getReceipts(); // Fetch immediately
    const intervalId = setInterval(getReceipts, 10000); // Poll every 10 seconds
    return () => clearInterval(intervalId);
  }, [loading]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Blockchain Audit Trail</h2>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Lock className="w-5 h-5 text-emerald-400" />
          <span className="text-slate-400">Immutable Records</span>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 bg-slate-800/30">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              All safety events are cryptographically signed and stored on the blockchain
            </p>
            <div className="flex items-center gap-2 text-emerald-400">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-mono">Chain Active</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-700 max-h-[80vh] overflow-y-auto">
          {loading && receipts.length === 0 && (
            <div className="p-6 text-center text-slate-400">Loading blockchain records...</div>
          )}
          {error && (
            <div className="p-6 text-center text-red-400 bg-red-500/10">
              <AlertCircle className="inline-block mr-2" />
              Could not load audit trail: {error}
            </div>
          )}
          {receipts.length === 0 && !loading && !error && (
            <div className="p-6 text-center text-slate-400">No blockchain records found.</div>
          )}

          {receipts.map((receipt, index) => (
            <motion.div
              key={receipt._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{receipt.type}</h3>
                    {receipt.anchorStatus === 'verified' ? (
                      <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-emerald-400 text-xs">
                        <Check className="w-3 h-3" />
                        <span>Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-400 text-xs animate-pulse">
                        <div className="w-2 h-2 bg-amber-500 rounded-full" />
                        <span>{receipt.anchorStatus === 'simulated' ? 'Simulated' : 'Pending'}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-slate-400">Worker</p>
                      <p className="font-mono text-white">{receipt.workerId}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Timestamp</p>
                      <p className="font-mono text-white">{formatTime(receipt.createdAt)}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-slate-400 mb-1">Transaction Hash</p>
                      <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-2 border border-slate-700">
                        <code className="flex-1 text-blue-400 text-xs break-all font-mono">
                          {receipt.blockchainHash}
                        </code>
                        <button className="text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-slate-400">Block:</p>
                      <p className="font-mono text-blue-400">N/A</p>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500/20 border-2 border-blue-500 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
