"use client";
import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";

export default function GlobeDot({ position }: { position: THREE.Vector3 }) {
  const rippleRef = useRef<THREE.Mesh>(null);
  const grainsRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const arr = new Float32Array(10 * 3);
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] = (Math.random() - 0.5) * 0.05;
      arr[i + 1] = (Math.random() - 0.5) * 0.05;
      arr[i + 2] = (Math.random() - 0.5) * 0.05;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (rippleRef.current) {
      rippleRef.current.scale.x += delta * 0.4;
      rippleRef.current.scale.y += delta * 0.4;

      const mat = rippleRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity -= delta * 0.2;

      if (mat.opacity <= 0) {
        rippleRef.current.scale.set(1, 1, 1);
        mat.opacity = 0.6;
      }
    }

    if (grainsRef.current) {
      const arr = grainsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] += (Math.random() - 0.5) * delta * 0.05;
        arr[i + 1] += (Math.random() - 0.5) * delta * 0.05;
        arr[i + 2] += (Math.random() - 0.5) * delta * 0.05;
      }
      grainsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial
          color="#00e6ff"
          emissive="#00e6ff"
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={rippleRef}>
        <ringGeometry args={[0.04, 0.06, 32]} />
        <meshBasicMaterial
          color="#00e6ff"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      <points ref={grainsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particles, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.008}
          color="#00e6ff"
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
