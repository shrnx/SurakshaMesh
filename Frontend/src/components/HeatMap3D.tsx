"use client";

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Map } from 'lucide-react';

interface Worker {
  id: string;
  name: string;
  position: [number, number, number];
  status: 'safe' | 'warning' | 'critical';
}

const workers: Worker[] = [
  { id: 'WRK-2847', name: 'Rajesh', position: [2, 0.5, 1], status: 'warning' },
  { id: 'WRK-1923', name: 'Amit', position: [-2, 0.5, -1], status: 'safe' },
  { id: 'WRK-3456', name: 'Priya', position: [1, 0.5, -2], status: 'critical' },
  { id: 'WRK-4782', name: 'Suresh', position: [-1, 0.5, 2], status: 'safe' },
  { id: 'WRK-5621', name: 'Vikram', position: [3, 0.5, -1], status: 'warning' },
  { id: 'WRK-6843', name: 'Anjali', position: [-3, 0.5, 0], status: 'safe' },
];

const statusColors = {
  safe: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444',
};

function WorkerAvatar({ worker }: { worker: Worker }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = worker.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime;
      ringRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.1);
    }
  });

  return (
    <group position={worker.position}>
      {/* Sonar ping effect */}
      <SonarPing color={statusColors[worker.status]} />
      
      {/* Worker sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          color={statusColors[worker.status]}
          emissive={statusColors[worker.status]}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Rotating ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.05, 16, 32]} />
        <meshStandardMaterial
          color={statusColors[worker.status]}
          emissive={statusColors[worker.status]}
          emissiveIntensity={0.3}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Worker label */}
      <Text
        position={[0, 1, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {worker.name}
      </Text>
    </group>
  );
}

function SonarPing({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + (state.clock.elapsedTime % 2);
      meshRef.current.scale.setScalar(scale);
      meshRef.current.material.opacity = Math.max(0, 1 - (state.clock.elapsedTime % 2) / 2);
    }
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.4, 0.5, 32]} />
      <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial
        color="#1e293b"
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

function GridHelper() {
  return <gridHelper args={[20, 20, '#334155', '#1e293b']} position={[0, 0, 0]} />;
}

export default function HeatMap3D() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Map className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">3D Worker Heatmap</h2>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-slate-400">Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full" />
            <span className="text-slate-400">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-slate-400">Critical</span>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden"
        style={{ height: '600px' }}
      >
        <Canvas
          camera={{ position: [8, 8, 8], fov: 60 }}
          shadows
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} castShadow />
          <pointLight position={[-10, 10, -10]} intensity={0.5} />

          <Floor />
          <GridHelper />

          {workers.map((worker) => (
            <WorkerAvatar key={worker.id} worker={worker} />
          ))}

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2}
            minDistance={5}
            maxDistance={20}
          />
        </Canvas>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Total Workers</p>
          <p className="text-3xl font-bold font-mono">{workers.length}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Active Zones</p>
          <p className="text-3xl font-bold font-mono">4</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Avg Response Time</p>
          <p className="text-3xl font-bold font-mono">1.2s</p>
        </div>
      </div>
    </div>
  );
}
