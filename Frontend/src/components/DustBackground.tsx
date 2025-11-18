"use client";

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

function DustParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 800;

  // Create particle positions and velocities
  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Random positions in 3D space
      positions[i3] = (Math.random() - 0.5) * 20;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 20;

      // Very slow random velocities
      velocities[i3] = (Math.random() - 0.5) * 0.01;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
    }

    return { positions, velocities };
  }, []);

  // Animate particles
  useFrame(() => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Update positions with velocities
      positions[i3] += velocities[i3];
      positions[i3 + 1] += velocities[i3 + 1];
      positions[i3 + 2] += velocities[i3 + 2];

      // Wrap around boundaries
      if (Math.abs(positions[i3]) > 10) positions[i3] *= -1;
      if (Math.abs(positions[i3 + 1]) > 10) positions[i3 + 1] *= -1;
      if (Math.abs(positions[i3 + 2]) > 10) positions[i3 + 2] *= -1;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#f5f5f0"
        sizeAttenuation
        transparent
        opacity={0.6}
      />
    </points>
  );
}

export default function DustBackground() {
  return (
    <div className="fixed top-0 left-0 w-screen h-screen z-0 opacity-[0.08] pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <DustParticles />
      </Canvas>
    </div>
  );
}
