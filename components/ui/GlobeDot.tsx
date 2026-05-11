"use client";
import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useTheme } from "@/contexts/ThemeContext";

interface GlobeDotProps {
  position: THREE.Vector3;
  countryName: string;
  flag: string;
  bwCount: number;
  onClick: (pos: THREE.Vector3) => void;
}

export default function GlobeDot({
  position,
  countryName,
  flag,
  bwCount,
  onClick,
}: GlobeDotProps) {
  const { theme } = useTheme();
  const rippleRef = useRef<THREE.Mesh>(null);
  const grainsRef = useRef<THREE.Points>(null);

  const colors = useMemo(() => {
    switch (theme) {
      case "light":
        return {
          base: "#FFFFFF",
          emissive: "#FFFFFF",
          ripple: "#FFFFFF",
          particles: "#FFFFFF",
          intensity: 3
        };
      case "dim":
        return {
          base: "#00e6ff",
          emissive: "#00e6ff",
          ripple: "#00e6ff",
          particles: "#00e6ff",
          intensity: 2
        };
      default:
        return {
          base: "#00e6ff",
          emissive: "#00e6ff",
          ripple: "#00e6ff",
          particles: "#00e6ff",
          intensity: 3
        };
    }
  }, [theme]);

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
      const arr = grainsRef.current.geometry.attributes.position
        .array as Float32Array;
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
      {/* Clickable core dot — slightly enlarged hit area */}
      <mesh
        onPointerDown={(e) => {
          e.stopPropagation();
          onClick(e.point);
        }}
      >
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial
          color={colors.base}
          emissive={colors.emissive}
          emissiveIntensity={colors.intensity}
          toneMapped={false}
          transparent
          opacity={0}
        />
      </mesh>

      {/* Visible glowing dot */}
      <mesh>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial
          color={colors.base}
          emissive={colors.emissive}
          emissiveIntensity={colors.intensity}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={rippleRef}>
        <ringGeometry args={[0.04, 0.06, 32]} />
        <meshBasicMaterial
          color={colors.ripple}
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
          color={colors.particles}
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={theme === 'light' ? THREE.NormalBlending : THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
