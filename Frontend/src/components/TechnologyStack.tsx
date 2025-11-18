"use client";

import { motion } from 'framer-motion';
import { Camera, Radio, Network, Shield } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface TechCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  modalTitle: string;
  modalContent: string;
}

const techStack: TechCard[] = [
  {
    id: 'ai-vision',
    icon: <Camera className="w-12 h-12" />,
    title: 'AI Vision',
    description: 'Real-time PPE detection using YOLOv11n on edge devices.',
    modalTitle: 'AI Vision (YOLOv11n)',
    modalContent: "Our system connects to any USB or plant CCTV camera feed. A Raspberry Pi runs a highly-optimized YOLOv11n model that processes the video at 8-10 FPS. It detects 5 types of PPE (helmet, vest, gloves, boots, goggles). If a violation is detected, it instantly sends an alert to the fusion engine, which increases that worker's risk score.",
  },
  {
    id: 'smart-wearables',
    icon: <Radio className="w-12 h-12" />,
    title: 'Smart Wearables',
    description: 'ESP32-powered badges with LoRa for vital signs monitoring.',
    modalTitle: 'Worker Smart Badge (ESP32 + LoRa)',
    modalContent: "Each worker wears a badge built on an ESP32 chip with a LoRa module for long-range, offline communication. It has built-in sensors to stream live vitals: a MAX30102 for heart rate/SpO2, a DHT22 for skin temperature/humidity, and an ADXL345 accelerometer for fall detection. It also includes a manual SOS button. All this data is fused to calculate the worker's physical state.",
  },
  {
    id: 'scada-integration',
    icon: <Network className="w-12 h-12" />,
    title: 'SCADA Integration',
    description: 'Direct connection to plant sensors via OPC-UA protocol.',
    modalTitle: 'Plant Infrastructure Integration (OPC-UA)',
    modalContent: "SurakshaMesh X connects directly to the plant's existing SCADA system. Our Node.js backend uses the node-opcua library to subscribe to critical sensor tags. This allows us to get real-time data on environmental hazards like ambient gas (MQ-2, MQ-135) or high-temperature zones (PT100). This data provides the context for a worker's risk (e.g., high heart rate + high gas levels = critical alert).",
  },
  {
    id: 'blockchain',
    icon: <Shield className="w-12 h-12" />,
    title: 'Blockchain Audit',
    description: 'Immutable incident logging on Polygon for accountability.',
    modalTitle: 'Blockchain Accountability (Polygon)',
    modalContent: "When a high-risk incident (risk > 80) is triggered, our backend uses ethers.js to call a smart contract on the Polygon testnet. This logs an immutable, tamper-proof record of the incident. When a supervisor clicks 'Acknowledge' on their dashboard, a second transaction is sent, logging the response time. This solves the problem of manipulated safety logs and creates a legal-grade audit trail.",
  },
];

export default function TechnologyStack() {
  const [selectedTech, setSelectedTech] = useState<TechCard | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (tech: TechCard) => {
    setSelectedTech(tech);
    setIsModalOpen(true);
  };

  return (
    <div className="relative py-20">
      {/* Headline */}
      <motion.h2
        className="text-4xl md:text-5xl font-bold text-center mb-16 text-white"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        Our Core Technology
      </motion.h2>

      {/* 2x2 Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 px-6">
        {techStack.map((tech, index) => (
          <motion.button
            key={tech.id}
            onClick={() => handleCardClick(tech)}
            className="group relative bg-slate-800 rounded-2xl p-8 text-left transition-all duration-300 border-2 border-transparent hover:border-blue-500 cursor-pointer"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            {/* Icon */}
            <div className="text-teal-400 mb-4">
              {tech.icon}
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-white mb-3">
              {tech.title}
            </h3>

            {/* Description */}
            <p className="text-slate-400 text-base">
              {tech.description}
            </p>

            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute inset-0 rounded-2xl shadow-xl shadow-blue-500/20" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white mb-4">
              {selectedTech?.modalTitle}
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-base leading-relaxed">
              {selectedTech?.modalContent}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}