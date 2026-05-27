"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─────────────────────────────────────────────
 *  3D Artwork Node
 *
 *  Glowing, pulsing, subtly-orbiting sphere
 *  embedded inside the galaxy.
 *  Empty nodes → cyan glow.
 *  Filled nodes (with art) → warm gold glow.
 *  Click triggers parent callback.
 * ───────────────────────────────────────────── */

interface ArtworkNode3DProps {
  id: string;
  type: "node" | "card";
  position: [number, number, number];
  onClick: () => void;
}

export default function ArtworkNode3D({
  id,
  type,
  position,
  onClick,
}: ArtworkNode3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Randomised orbit offset so each node drifts uniquely
  const orbitData = useMemo(() => ({
    orbitRadius: 0.15 + Math.random() * 0.25,
    orbitSpeed:  0.2  + Math.random() * 0.3,
    phaseOffset: Math.random() * Math.PI * 2,
    pulseSpeed:  1.5  + Math.random() * 1.0,
    pulsePhase:  Math.random() * Math.PI * 2,
  }), []);

  // Color based on fill state
  const isEmpty = type === "node";
  const baseColor  = isEmpty ? new THREE.Color(0.1, 0.85, 0.9)  : new THREE.Color(1.0, 0.75, 0.25);
  const glowColor  = isEmpty ? new THREE.Color(0.05, 0.6, 0.7)  : new THREE.Color(0.9, 0.55, 0.1);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (meshRef.current) {
      // Subtle orbit drift
      const ox = Math.sin(t * orbitData.orbitSpeed + orbitData.phaseOffset) * orbitData.orbitRadius;
      const oy = Math.cos(t * orbitData.orbitSpeed * 0.7 + orbitData.phaseOffset) * orbitData.orbitRadius * 0.5;
      meshRef.current.position.set(
        position[0] + ox,
        position[1] + oy,
        position[2]
      );

      // Pulse scale
      const pulse = 1 + Math.sin(t * orbitData.pulseSpeed + orbitData.pulsePhase) * 0.15;
      const s = (hovered ? 1.4 : 1.0) * pulse;
      meshRef.current.scale.setScalar(s);
    }

    if (glowRef.current && meshRef.current) {
      glowRef.current.position.copy(meshRef.current.position);
      const glowPulse = 1.8 + Math.sin(t * orbitData.pulseSpeed * 0.6 + orbitData.pulsePhase) * 0.4;
      glowRef.current.scale.setScalar((hovered ? 2.2 : 1.6) * glowPulse);
    }
  });

  return (
    <group>
      {/* Outer glow sphere (additive) */}
      <mesh ref={glowRef} position={position}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Core sphere */}
      <mesh
        ref={meshRef}
        position={position}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={hovered ? 1.0 : 0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
