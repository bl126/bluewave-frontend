"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef } from "react";

/**
 * Fullscreen drifting, glowing starfield
 * - Drifts independently of globe
 * - Visible behind all content
 * - Twinkles dynamically
 */
function AnimatedStars() {
  const ref = useRef<THREE.Points>(null!);
  const count = 2500;

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const opacities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 600;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 600;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 600;
      opacities[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("opacity", new THREE.BufferAttribute(opacities, 1));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const op = ref.current.geometry.attributes.opacity as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      pos.array[i * 3 + 2] += 0.05; // faster drift for visible motion
      if (pos.array[i * 3 + 2] > 300) pos.array[i * 3 + 2] = -300;

      op.array[i] = 0.5 + 0.5 * Math.sin(t * 2 + i * 0.15); // twinkle
    }

    pos.needsUpdate = true;
    op.needsUpdate = true;
  });

  const material = new THREE.PointsMaterial({
    size: 1.1, // more visible
    color: new THREE.Color("#00ffff"),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.9,
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}

export default function BackgroundStars() {
  return (
    <div
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
      style={{
        background: "transparent",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        gl={{ alpha: true, antialias: true }}
      >
        <AnimatedStars />
      </Canvas>
    </div>
  );
}
