"use client";

import { motion } from 'framer-motion';
import { Shield, Users, BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import ParticleBackground from '@/components/ParticleBackground';
import DustBackground from '@/components/DustBackground';
import LiveFusionMonitor from '@/components/LiveFusionMonitor';
import TechnologyStack from '@/components/TechnologyStack';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
      <DustBackground />
      <ParticleBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <motion.header
          className="container mx-auto px-6 py-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold">
                <span className="text-white">SurakshaMesh</span>
                <span className="text-blue-500"> X</span>
              </h1>
            </div>
            <div className="text-sm font-mono text-teal-400">
              Predictive Safety Platform
            </div>
          </div>
        </motion.header>

        {/* New Hero Section */}
        <div className="container mx-auto px-6 py-16">
          {/* Headline */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}>

            <h2 className="text-5xl md:text-6xl font-bold text-white">
              Predictive Safety Intelligence.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400">
                See Danger Before It Sees You.
              </span>
            </h2>
          </motion.div>

          {/* Live Fusion Monitor - The "Crazy" Animation */}
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}>

            <LiveFusionMonitor />
          </motion.div>

          {/* Navigation Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-20 items-stretch">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }} className="!w-[473px] !h-[298px]">

              <Link href="/worker">
                <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-blue-500 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 !w-[478px] !h-[306px]" />
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-white">WORKER PWA</h3>
                    <p className="text-slate-400 mb-6">
                      Personal safety monitor with real-time risk assessment, health tracking, and instant SOS alerts.
                    </p>
                    <div className="flex items-center gap-2 text-blue-400 font-medium group-hover:gap-4 transition-all">
                      Open Dashboard
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/10 rounded-tl-full transform translate-x-16 translate-y-16 group-hover:translate-x-8 group-hover:translate-y-8 transition-transform duration-500" />
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}>

              <Link href="/dashboard">
                <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-teal-400 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-400/20 cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-teal-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <BarChart3 className="w-7 h-7 text-slate-900" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-white">SUPERVISOR DASHBOARD</h3>
                    <p className="text-slate-400 mb-6">
                      Command center with live CCTV feeds, 3D heatmaps, AI anomaly detection, and blockchain audit trails.
                    </p>
                    <div className="flex items-center gap-2 text-teal-400 font-medium group-hover:gap-4 transition-all">
                      Open Dashboard
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-teal-400/10 rounded-tl-full transform translate-x-16 translate-y-16 group-hover:translate-x-8 group-hover:translate-y-8 transition-transform duration-500" />
                </div>
              </Link>
            </motion.div>
          </div>

          {/* New Technology Stack Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="mb-20">

            <TechnologyStack />
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          className="container mx-auto px-6 py-12 border-t border-slate-800 mt-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}>

          <div className="text-center text-slate-500 text-sm">
            <p>&copy; 2024 SurakshaMesh X - Powered by AI, IoT & Blockchain</p>
          </div>
        </motion.footer>
      </div>
    </div>);

}