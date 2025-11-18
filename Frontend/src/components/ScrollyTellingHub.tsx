"use client";

import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

// 3D Scene Components
function WorkerWithBoundingBox() {
  const boxRef = useRef<THREE.LineSegments>(null);
  
  useFrame((state) => {
    if (boxRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      boxRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      {/* Simple worker representation - cylinder for body, sphere for head */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 1, 16]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#f0abfc" />
      </mesh>
      
      {/* YOLO Bounding Box - animated red wireframe */}
      <lineSegments ref={boxRef}>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 2, 0.8)]} />
        <lineBasicMaterial color="#dc2626" linewidth={2} />
      </lineSegments>
    </group>
  );
}

function WearableBadge() {
  const heartRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (heartRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
      heartRef.current.scale.set(scale, scale, scale);
      const opacity = 0.6 + Math.sin(state.clock.elapsedTime * 3) * 0.4;
      (heartRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
  });

  return (
    <group>
      {/* ESP32 Badge - rectangular prism */}
      <mesh>
        <boxGeometry args={[1.2, 0.8, 0.1]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      
      {/* Green pulsing heart indicator */}
      <mesh ref={heartRef} position={[0, 0, 0.1]}>
        <circleGeometry args={[0.15, 16]} />
        <meshBasicMaterial color="#14b8a6" transparent />
      </mesh>
    </group>
  );
}

function BarGraph() {
  const bars = [
    { height: 1.5, color: '#14b8a6' },
    { height: 0.8, color: '#fbbf24' },
    { height: 1.2, color: '#14b8a6' },
    { height: 1.8, color: '#fbbf24' },
    { height: 1.0, color: '#14b8a6' },
  ];

  return (
    <group position={[-2, 0, 0]}>
      {bars.map((bar, i) => (
        <AnimatedBar key={i} height={bar.height} color={bar.color} position={[i * 1, bar.height / 2, 0]} delay={i * 0.2} />
      ))}
    </group>
  );
}

function AnimatedBar({ height, color, position, delay }: { height: number; color: string; position: [number, number, number]; delay: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2 - delay * 2) * 0.1;
      meshRef.current.scale.set(1, scale, 1);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.6, height, 0.6]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function HybridEngineIcon() {
  const sphereRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (sphereRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      sphereRef.current.scale.set(scale, scale, scale);
      sphereRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
    if (ring1Ref.current) ring1Ref.current.rotation.z = state.clock.elapsedTime;
    if (ring2Ref.current) ring2Ref.current.rotation.z = state.clock.elapsedTime * 0.8;
    if (ring3Ref.current) ring3Ref.current.rotation.z = state.clock.elapsedTime * 0.6;
  });

  return (
    <group>
      {/* Central sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial 
          color="#3b82f6" 
          emissive="#3b82f6"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Three orbiting rings - representing data streams */}
      <mesh ref={ring1Ref} rotation={[0, 0, 0]}>
        <torusGeometry args={[1.5, 0.05, 16, 32]} />
        <meshStandardMaterial color="#14b8a6" />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.5, 0.05, 16, 32]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <mesh ref={ring3Ref} rotation={[-Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.5, 0.05, 16, 32]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
    </group>
  );
}

function BlockchainCube() {
  const cubeRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (cubeRef.current) {
      cubeRef.current.rotation.x = state.clock.elapsedTime * 0.3;
      cubeRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <mesh ref={cubeRef}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial 
        color="#8b5cf6"
        wireframe={false}
        metalness={0.8}
        roughness={0.2}
      />
      {/* Inner glowing cube */}
      <mesh scale={[0.5, 0.5, 0.5]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial 
          color="#a78bfa"
          transparent
          opacity={0.6}
        />
      </mesh>
    </mesh>
  );
}

// Main 3D Scene Manager
function Scene3D({ activeScene }: { activeScene: number }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 5]} />
      <OrbitControls enableZoom={false} enablePan={false} />
      
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#14b8a6" />
      
      <group>
        {activeScene === 0 && <WorkerWithBoundingBox />}
        {activeScene === 1 && <WearableBadge />}
        {activeScene === 2 && <BarGraph />}
        {activeScene === 3 && <HybridEngineIcon />}
        {activeScene === 4 && <BlockchainCube />}
      </group>
    </>
  );
}

// Main Component
export default function ScrollyTellingHub() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeScene, setActiveScene] = useState(0);

  const contentBlocks = [
    {
      number: "1",
      title: "We See Everything",
      description: "Our AI vision scans for PPE compliance 24/7.",
    },
    {
      number: "2",
      title: "We Monitor Vitals",
      description: "Worker badges stream real-time HR, SpO2, and fall detection.",
    },
    {
      number: "3",
      title: "We Poll The Environment",
      description: "SCADA sensors report ambient gas, temperature, and machine status.",
    },
    {
      number: "4",
      title: "The Fusion Engine",
      description: "Our Hybrid AI combines these streams to predict danger before it happens.",
    },
    {
      number: "5",
      title: "Immutable Accountability",
      description: "Every alert and response is logged forever.",
    },
  ];

  return (
    <div ref={containerRef} className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN - Sticky 3D Canvas */}
        <div className="lg:sticky lg:top-0 h-screen flex items-center justify-center">
          <div className="w-full h-full bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden">
            <Canvas>
              <Scene3D activeScene={activeScene} />
            </Canvas>
          </div>
        </div>

        {/* RIGHT COLUMN - Scrolling Content */}
        <div className="space-y-[60vh]">
          {contentBlocks.map((block, index) => (
            <ScrollTriggerBlock
              key={index}
              index={index}
              block={block}
              onInView={() => setActiveScene(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Individual scroll-triggered content block
function ScrollTriggerBlock({ 
  index, 
  block, 
  onInView 
}: { 
  index: number; 
  block: { number: string; title: string; description: string };
  onInView: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          onInView();
        } else {
          setIsInView(false);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [onInView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: false, amount: 0.5 }}
      className={`p-8 rounded-2xl border transition-all duration-500 ${
        isInView 
          ? 'bg-slate-800/80 border-blue-500 shadow-2xl shadow-blue-500/20' 
          : 'bg-slate-800/30 border-slate-700'
      }`}
    >
      <div className="flex items-start gap-6">
        <div className={`text-5xl font-bold transition-colors duration-500 ${
          isInView ? 'text-teal-400' : 'text-slate-600'
        }`}>
          {block.number}
        </div>
        <div>
          <h3 className={`text-2xl font-bold mb-3 transition-colors duration-500 ${
            isInView ? 'text-white' : 'text-slate-400'
          }`}>
            {block.title}
          </h3>
          <p className={`text-lg transition-colors duration-500 ${
            isInView ? 'text-slate-300' : 'text-slate-500'
          }`}>
            {block.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}