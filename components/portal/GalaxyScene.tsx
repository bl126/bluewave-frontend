"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, RootState } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

import GalaxyParticles from "./GalaxyParticles";
import NebulaCloud from "./NebulaCloud";
import ArtworkNode3D from "./ArtworkNode3D";
import { NodeItem } from "./FloatingNode";

/* ─────────────────────────────────────────────
 *  Galaxy Scene — R3F Canvas wrapper
 *
 *  Cinematic 3D galaxy environment with:
 *  - GPU spiral galaxy particles
 *  - Volumetric nebula cloud system
 *  - Interactive 3D artwork star nodes
 *  - Post-processing bloom
 *  - Cinematic orbit camera with damped inertia
 * ───────────────────────────────────────────── */

interface GalaxySceneProps {
  items: NodeItem[];
  onNodeClick: (item: NodeItem) => void;
  onCardClick: (item: NodeItem) => void;
}

// Map 2D node positions into 3D galaxy spiral arm positions
function node3DPosition(index: number): [number, number, number] {
  const ARM_COUNT = 4;
  const armIdx = index % ARM_COUNT;
  const armBaseAngle = (armIdx / ARM_COUNT) * Math.PI * 2;
  const radius = 6 + index * 2.2;
  const spiralAngle = armBaseAngle + radius * 0.35;

  return [
    Math.cos(spiralAngle) * radius,
    (Math.random() - 0.5) * 0.3,
    Math.sin(spiralAngle) * radius,
  ];
}

// ──── Scene Contents (inside Canvas) ────
function SceneContents({ items, onNodeClick, onCardClick }: GalaxySceneProps) {
  const sceneGroupRef = useRef<THREE.Group>(null);

  // Pre-compute stable 3D positions for nodes
  const nodePositions = useMemo(() => {
    const positions: Record<string, [number, number, number]> = {};
    items.forEach((item, i) => {
      if (!positions[item.id]) {
        positions[item.id] = node3DPosition(i);
      }
    });
    return positions;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  // Extremely smooth, weightless sinusoidal drift/sway to make it feel like floating in zero gravity
  useFrame((state: RootState) => {
    const t = state.clock.elapsedTime;
    if (sceneGroupRef.current) {
      sceneGroupRef.current.position.y = Math.sin(t * 0.35) * 0.18;
      sceneGroupRef.current.position.x = Math.cos(t * 0.28) * 0.22;
      sceneGroupRef.current.position.z = Math.sin(t * 0.2) * 0.15;
      sceneGroupRef.current.rotation.y = Math.sin(t * 0.04) * 0.015;
      sceneGroupRef.current.rotation.x = Math.cos(t * 0.03) * 0.008;
    }
  });

  return (
    <>
      {/* Ambient lighting (subtle, stars are self-lit) */}
      <ambientLight intensity={0.03} />

      {/* Swaying Zero-Gravity Space group */}
      <group ref={sceneGroupRef}>
        {/* Galaxy star system */}
        <GalaxyParticles />

        {/* Volumetric nebula clouds */}
        <NebulaCloud />

        {/* Artwork star nodes */}
        {items.map((item) => (
          <ArtworkNode3D
            key={item.id}
            id={item.id}
            type={item.type}
            position={nodePositions[item.id] || [0, 0, 0]}
            onClick={() => {
              if (item.type === "card") {
                onCardClick(item);
              } else {
                onNodeClick(item);
              }
            }}
          />
        ))}
      </group>

      {/* Cinematic camera controls with low damping for high weightless momentum */}
      <OrbitControls
        enableDamping
        dampingFactor={0.018} // ultra-smooth momentum damping
        autoRotate
        autoRotateSpeed={0.08} // slower, more elegant rotation
        minDistance={4}
        maxDistance={60}
        enablePan
        panSpeed={0.4}
        rotateSpeed={0.35} // delicate, slow rotations
        zoomSpeed={0.45}   // smooth zoom transitions
        makeDefault
      />

      {/* Post-processing: Bloom for star glow */}
      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ──── Exported Component (Canvas wrapper) ────
export default function GalaxyScene({ items, onNodeClick, onCardClick }: GalaxySceneProps) {
  return (
    <div className="absolute inset-0 w-full h-full" style={{ background: "#000" }}>
      <Canvas
        camera={{
          fov: 55,
          near: 0.1,
          far: 200,
          position: [0, 12, 22],
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.9,
        }}
        dpr={[1, 2]}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#010104"]} />
        <fog attach="fog" args={["#010104", 35, 70]} />
        <Suspense fallback={null}>
          <SceneContents
            items={items}
            onNodeClick={onNodeClick}
            onCardClick={onCardClick}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
