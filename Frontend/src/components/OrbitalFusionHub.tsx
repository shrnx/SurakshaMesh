"use client";

import { motion } from 'framer-motion';
import { Cpu, Camera, Watch, Radio, Link2 } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface NodeData {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  modalTitle: string;
  modalDescription: string;
}

const nodes: NodeData[] = [
  {
    id: 'cctv',
    icon: <Camera className="w-6 h-6" />,
    label: 'CCTV Feed',
    color: '#3b82f6',
    modalTitle: 'AI Vision',
    modalDescription: "Our AI spots PPE violations (like missing helmets or vests) in real-time from any camera feed.",
  },
  {
    id: 'wearables',
    icon: <Watch className="w-6 h-6" />,
    label: 'Wearables',
    color: '#14b8a6',
    modalTitle: 'Smart Wearables',
    modalDescription: "Badges track worker vitals (like high HR or a sudden fall) and their exact location.",
  },
  {
    id: 'scada',
    icon: <Radio className="w-6 h-6" />,
    label: 'SCADA',
    color: '#fbbf24',
    modalTitle: 'Plant Sensors',
    modalDescription: "We detect environmental hazards (like gas leaks or high-temp zones) directly from your plant's machinery.",
  },
  {
    id: 'blockchain',
    icon: <Link2 className="w-6 h-6" />,
    label: 'Blockchain',
    color: '#a78bfa',
    modalTitle: 'Blockchain Audit',
    modalDescription: "We log every alert and supervisor response as an immutable record. This creates 100% accountability.",
  },
];

export default function OrbitalFusionHub() {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleNodeClick = (node: NodeData) => {
    setSelectedNode(node);
    setIsModalOpen(true);
  };

  return (
    <div className="relative py-20">
      {/* Headline */}
      <motion.h2
        className="text-4xl md:text-5xl font-bold text-center mb-20 text-white"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        Our Technology.{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400">
          Simplified.
        </span>
      </motion.h2>

      {/* Orbital Container */}
      <div className="relative w-full max-w-4xl mx-auto aspect-square">
        {/* Central Hub */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            className="relative"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-teal-400 to-amber-400 opacity-40 blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            {/* Core orb */}
            <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex flex-col items-center justify-center shadow-2xl shadow-blue-500/50 border-4 border-blue-400/30">
              <Cpu className="w-16 h-16 text-white mb-2" />
              <span className="text-xs font-mono text-white/90 text-center px-2 leading-tight">
                HYBRID<br/>INTELLIGENCE<br/>ENGINE
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Orbiting Nodes */}
        {nodes.map((node, index) => {
          const angle = (index * 90) * (Math.PI / 180); // 90 degrees apart
          const radius = 280; // Distance from center

          return (
            <motion.div
              key={node.id}
              className="absolute top-1/2 left-1/2"
              style={{
                x: '-50%',
                y: '-50%',
              }}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
              animate={{
                x: [
                  `calc(-50% + ${Math.cos(angle) * radius}px)`,
                  `calc(-50% + ${Math.cos(angle + Math.PI * 2) * radius}px)`,
                ],
                y: [
                  `calc(-50% + ${Math.sin(angle) * radius}px)`,
                  `calc(-50% + ${Math.sin(angle + Math.PI * 2) * radius}px)`,
                ],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
                delay: 0,
              }}
            >
              <motion.button
                onClick={() => handleNodeClick(node)}
                className="relative group cursor-pointer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Node glow */}
                <div
                  className="absolute inset-0 rounded-full blur-xl opacity-60"
                  style={{ backgroundColor: node.color }}
                />
                
                {/* Node container */}
                <div
                  className="relative w-24 h-24 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-300 group-hover:border-4"
                  style={{
                    backgroundColor: node.color,
                    borderColor: node.color,
                  }}
                >
                  <div className="text-white">
                    {node.icon}
                  </div>
                  <span className="text-xs font-mono text-white mt-1 px-1 text-center leading-tight">
                    {node.label.split(' ').map((word, i) => (
                      <span key={i}>
                        {word}
                        {i < node.label.split(' ').length - 1 && <br />}
                      </span>
                    ))}
                  </span>
                </div>

                {/* Pulse effect on hover */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 opacity-0 group-hover:opacity-100"
                  style={{ borderColor: node.color }}
                  animate={{
                    scale: [1, 1.3, 1.3],
                    opacity: [0.5, 0, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                />
              </motion.button>
            </motion.div>
          );
        })}

        {/* Orbital ring (decorative) */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full border border-slate-700/30 pointer-events-none"
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
        />
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              {selectedNode?.modalTitle}
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-base mt-4">
              {selectedNode?.modalDescription}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
