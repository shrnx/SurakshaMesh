"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Heart, Thermometer, Activity, Phone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import RiskBadgeGauge from '@/components/RiskBadgeGauge';
import LiveAdvisory from '@/components/LiveAdvisory';
import HealthTabs from '@/components/HealthTabs';
import SOSButton from '@/components/SOSButton';

export default function WorkerPage() {
  const [riskLevel, setRiskLevel] = useState<'safe' | 'warning' | 'critical'>('warning');
  const [geminiReport, setGeminiReport] = useState<string | null>(null);
  const [isLoadingGemini, setIsLoadingGemini] = useState<boolean>(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);

  const fetchGeminiReport = async () => {
    // Rate limiting: Prevent requests more than once every 3 seconds
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < 3000) {
      setGeminiError(`Please wait ${Math.ceil((3000 - timeSinceLastRequest) / 1000)} seconds before making another request.`);
      return;
    }

    setIsLoadingGemini(true);
    setGeminiReport(null); // Clear previous report
    setGeminiError(null); // Clear previous error
    setLastRequestTime(now);

    // --- HARDCODED WORKER DATA FOR DEMO ---
    // This data will be sent to the backend for Gemini's analysis.
    // Adjust these values as needed for different demo scenarios.
    const workerHealthData = {
      workerId: "405", 
      name: "Ramesh K.",
      age: 34,
      vitals: {
        heartRate: 95, 
        bodyTemperature: 37.2, 
        bloodPressure: "120/80"
      },
      environment: {
        zone: "Zone 3: Storage",
        temperature: 30, 
        humidity: 60
      },
      riskScore: 35, 
      recentIncidents: ["none"] // Example: "minor headache", "brief dizziness"
    };
    // --- END HARDCODED WORKER DATA ---

    try {
      const response = await fetch('/api/gemini-health-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workerHealthData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch Gemini report');
      }

      const data = await response.json();
      setGeminiReport(data.report);
    } catch (error: any) { // Explicitly type error as 'any' for simpler handling
      console.error('Error fetching Gemini report:', error);
      setGeminiError(error.message || "Error generating report. Please check server logs.");
    } finally {
      setIsLoadingGemini(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-24">
      {/* Header */}
      <motion.header
        className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-bold">Worker Monitor</h1>
            </div>
            <div className="text-sm font-mono text-teal-400">
              ID: WRK-2847
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Risk Badge Gauge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <RiskBadgeGauge riskLevel={riskLevel} />
        </motion.div>

        {/* Live Advisory */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <LiveAdvisory riskLevel={riskLevel} />
        </motion.div>

        {/* Health Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <HealthTabs />
        </motion.div>

        {/* ... existing JSX for worker name, vitals, etc. ... */}

        <div className="mt-8 p-4 bg-gray-800 rounded-lg shadow-md border border-blue-600">
          <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M6.293 6.293a1 1 0 011.414 0L10 8.586l2.293-2.293a1 1 0 111.414 1.414L11.414 10l2.293 2.293a1 1 0 01-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 01-1.414-1.414L8.586 10 6.293 7.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg> {/* Simple AI icon */}
            OpenAI AI Health Advisor
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Consult OpenAI for an AI-powered assessment of your current health status based on available data.
          </p>
          <button
            onClick={fetchGeminiReport}
            disabled={isLoadingGemini}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoadingGemini ? 'Consulting AI...' : 'Get AI Health Advisory'}
          </button>

          {geminiReport && (
            <div className="mt-4 p-4 bg-gray-700 rounded-md text-sm text-gray-200 whitespace-pre-wrap border border-blue-500">
              <h4 className="font-bold mb-2 text-blue-300">AI Assessment:</h4>
              {geminiReport}
            </div>
          )}

          {geminiError && (
            <div className="mt-4 p-4 bg-red-800 rounded-md text-sm text-white border border-red-500">
              <h4 className="font-bold mb-2">Error:</h4>
              {geminiError}
              <p className="mt-2 text-xs">Please ensure `OPENAI_API_KEY` is set in `.env.local` and restart the server.</p>
            </div>
          )}
        </div>

        {/* ... rest of your PWA JSX .. */}

        {/* Debug Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Debug: Change Risk Level</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setRiskLevel('safe')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                riskLevel === 'safe'
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Safe
            </button>
            <button
              onClick={() => setRiskLevel('warning')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                riskLevel === 'warning'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Warning
            </button>
            <button
              onClick={() => setRiskLevel('critical')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                riskLevel === 'critical'
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Critical
            </button>
          </div>
        </motion.div>
      </div>

      {/* Floating SOS Button */}
      <SOSButton />
    </div>
  );
}
