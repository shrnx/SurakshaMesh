"use client";

import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';

// Easy-to-find URL constant at the top of the file
const LIVE_CCTV_URL = "https://1bd1eabec630a7a82e7c1a1db0f04a38.serveo.net";

export default function CCTVGrid() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Camera className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">CCTV Surveillance</h2>
        </div>
      </div>

      {/* Info text */}
      <p className="text-slate-400 text-sm">
        Showing live feed from: {LIVE_CCTV_URL}. If stream is down, update the LIVE_CCTV_URL constant in the code.
      </p>

      {/* Live feed container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative bg-slate-800/50 backdrop-blur-sm border-2 border-slate-700 rounded-lg overflow-hidden"
      >
        <iframe
          src={LIVE_CCTV_URL}
          className="w-full h-[600px] rounded-lg border-2 border-gray-700"
          allow="camera; microphone"
          allowFullScreen
          title="Live CCTV Feed"
        />
      </motion.div>
    </div>
  );
}
