"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Camera, Shield, Activity, Database, Zap } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  icon: React.ElementType;
  x: number;
  y: number;
  color: string;
  description: string;
  details: string;
}

const nodes: Node[] = [
  {
    id: 'ai',
    label: 'AI Vision',
    icon: Brain,
    x: 50,
    y: 20,
    color: 'bg-blue-500',
    description: 'YOLO Object Detection',
    details: 'Real-time detection of safety violations, PPE compliance, and hazardous conditions using advanced computer vision models.'
  },
  {
    id: 'cctv',
    label: 'CCTV Feed',
    icon: Camera,
    x: 20,
    y: 50,
    color: 'bg-teal-400',
    description: 'Multi-Camera Surveillance',
    details: 'Live streaming from multiple cameras across the site with intelligent frame analysis and alert triggering.'
  },
  {
    id: 'iot',
    label: 'IoT Sensors',
    icon: Activity,
    x: 80,
    y: 50,
    color: 'bg-purple-500',
    description: 'Environmental Monitoring',
    details: 'Heart rate, temperature, gas levels, and motion sensors provide continuous health and safety data.'
  },
  {
    id: 'blockchain',
    label: 'Blockchain',
    icon: Shield,
    x: 50,
    y: 80,
    color: 'bg-emerald-500',
    description: 'Immutable Audit Trail',
    details: 'Every safety event is cryptographically recorded for compliance, investigation, and transparent accountability.'
  },
  {
    id: 'engine',
    label: 'Fusion Engine',
    icon: Zap,
    x: 50,
    y: 50,
    color: 'bg-amber-500',
    description: 'Predictive Analytics Core',
    details: 'Combines all data streams to predict risks, generate alerts, and provide actionable safety recommendations.'
  },
  {
    id: 'database',
    label: 'Data Lake',
    icon: Database,
    x: 50,
    y: 110,
    color: 'bg-cyan-500',
    description: 'Historical Analytics',
    details: 'Stores and analyzes patterns to improve prediction accuracy and identify systemic safety issues.'
  }
];

const connections = [
  { from: 'ai', to: 'engine' },
  { from: 'cctv', to: 'engine' },
  { from: 'iot', to: 'engine' },
  { from: 'engine', to: 'blockchain' },
  { from: 'engine', to: 'database' },
];

export default function FusionEngineDiagram() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  return (
    <div className="relative w-full h-[500px] bg-slate-800/50 rounded-2xl border border-slate-700 backdrop-blur-sm overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {connections.map((conn, idx) => {
          const fromNode = nodes.find(n => n.id === conn.from);
          const toNode = nodes.find(n => n.id === conn.to);
          if (!fromNode || !toNode) return null;
          
          return (
            <motion.line
              key={idx}
              x1={`${fromNode.x}%`}
              y1={`${fromNode.y}%`}
              x2={`${toNode.x}%`}
              y2={`${toNode.y}%`}
              stroke="url(#lineGradient)"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, delay: idx * 0.2 }}
            />
          );
        })}
      </svg>

      {nodes.map((node, idx) => {
        const Icon = node.icon;
        return (
          <motion.button
            key={node.id}
            className={`absolute ${node.color} rounded-full p-4 shadow-lg hover:shadow-2xl transition-all cursor-pointer hover:scale-110 active:scale-95 border-2 border-white/20`}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10
            }}
            onClick={() => setSelectedNode(node)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: idx * 0.15 }}
            whileHover={{ scale: 1.15 }}
          >
            <Icon className="w-6 h-6 text-white" />
            <motion.div
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-medium text-white whitespace-nowrap"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 + 0.3 }}
            >
              {node.label}
            </motion.div>
          </motion.button>
        );
      })}

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedNode(null)}
          >
            <motion.div
              className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-lg w-full relative"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedNode(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className={`${selectedNode.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-4`}>
                <selectedNode.icon className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">{selectedNode.label}</h3>
              <p className="text-teal-400 font-medium mb-4">{selectedNode.description}</p>
              <p className="text-slate-300 leading-relaxed">{selectedNode.details}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
