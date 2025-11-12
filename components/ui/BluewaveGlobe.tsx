"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useRef, useState, useMemo } from "react";

function GlobeScene() {
  const [borders, setBorders] = useState<THREE.Group | null>(null);
  const globeRef = useRef<THREE.Group>(null!);
  const logoRef = useRef<THREE.Mesh>(null!);

  // --- STEP 1: Country data & coordinate converter ---
  const sampleCountries = [
    { name: "Nigeria", lat: 9.082, lon: 8.6753 },
    { name: "United States", lat: 37.0902, lon: -95.7129 },
    { name: "India", lat: 20.5937, lon: 78.9629 },
    { name: "Brazil", lat: -14.235, lon: -51.9253 },
  ];

  const latLonToVec3 = (lat: number, lon: number, radius = 1.21) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  };

  // --- STEP 2: Load country borders ---
  useEffect(() => {
    let isMounted = true;
    const loadBorders = async () => {
      const res = await fetch("/data/countries.geojson");
      const geoData = await res.json();

      const group = new THREE.Group();

      // brighter lines
      const lineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color("#00e6ff"),
        transparent: true,
        opacity: 2.0,
        linewidth: 2,
      });

      const glowMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color("#00e6ff"),
        transparent: true,
        opacity: 0.5,
      });

      const R = 1.2;
      const toVec3 = ([lng, lat]: [number, number]) => {
        const lambda = (lng * Math.PI) / 180;
        const phi = (lat * Math.PI) / 180;
        return new THREE.Vector3(
          R * Math.cos(phi) * Math.cos(lambda),
          R * Math.sin(phi),
          -R * Math.cos(phi) * Math.sin(lambda)
        );
      };

      const addRing = (coords: [number, number][]) => {
        const pts = coords.map(toVec3);
        if (pts.length < 2) return;
        const geom = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.LineLoop(geom, lineMaterial);
        const glowLine = line.clone();
        glowLine.scale.multiplyScalar(1.01);
        glowLine.material = glowMaterial;
        group.add(glowLine);
        group.add(line);
      };

      for (const f of geoData.features as any[]) {
        const g = f.geometry;
        if (!g) continue;
        if (g.type === "Polygon") {
          for (const ring of g.coordinates as [number, number][][]) addRing(ring);
        } else if (g.type === "MultiPolygon") {
          for (const poly of g.coordinates as [number, number][][][]) {
            for (const ring of poly) addRing(ring);
          }
        }
      }

      if (isMounted) setBorders(group);
    };

    loadBorders();
    return () => {
      isMounted = false;
    };
  }, []);

  // --- STEP 3: Static Bluewave logo ---
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load("/logo-bluewave.png");
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const geometry = new THREE.CircleGeometry(0.12, 64);
    const logoMesh = new THREE.Mesh(geometry, material);
    logoMesh.position.set(0, 0, 0);
    logoRef.current = logoMesh;
  }, []);

  // --- STEP 4: Globe auto rotation ---
  useFrame((_, delta) => {
    if (globeRef.current) globeRef.current.rotation.y += delta * 0.05;
  });

  // --- STEP 5: Dots with glowing ripples + slow moving grains ---
  return (
    <>
      <group ref={globeRef} position={[0, 0, 0]} scale={[1, 1, 1]}>
        {borders && <primitive object={borders} />}

        {sampleCountries.map((c, i) => {
          const pos = latLonToVec3(c.lat, c.lon);
          const rippleRef = useRef<THREE.Mesh>(null);
          const grainsRef = useRef<THREE.Points>(null);

          // Only 10 slow-moving grains
          const positions = useMemo(() => {
            const arr = new Float32Array(10 * 3);
            for (let j = 0; j < arr.length; j += 3) {
              arr[j] = (Math.random() - 0.5) * 0.05;
              arr[j + 1] = (Math.random() - 0.5) * 0.05;
              arr[j + 2] = (Math.random() - 0.5) * 0.05;
            }
            return arr;
          }, []);

          useFrame((_, delta) => {
            // ripple loop
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

            // particles drift to center slowly
            if (grainsRef.current) {
              const positions = grainsRef.current.geometry.attributes.position as THREE.BufferAttribute;
              const arr = positions.array as Float32Array;
              for (let j = 0; j < arr.length; j += 3) {
                const x = arr[j] + pos.x;
                const y = arr[j + 1] + pos.y;
                const z = arr[j + 2] + pos.z;
                const dir = new THREE.Vector3(-x, -y, -z).normalize().multiplyScalar(delta * 0.1);
                arr[j] += dir.x;
                arr[j + 1] += dir.y;
                arr[j + 2] += dir.z;
              }
              positions.needsUpdate = true;
            }
          });

          return (
            <group key={i} position={pos}>
              {/* glowing dot */}
              <mesh>
                <sphereGeometry args={[0.02, 16, 16]} />
                <meshStandardMaterial
                  color="#00e6ff"
                  emissive="#00e6ff"
                  emissiveIntensity={2.8}
                  toneMapped={false}
                />
              </mesh>

              {/* visible ripple */}
              <mesh ref={rippleRef}>
                <ringGeometry args={[0.04, 0.06, 64]} />
                <meshBasicMaterial
                  color="#00e6ff"
                  transparent
                  opacity={0.6}
                  side={THREE.DoubleSide}
                />
              </mesh>

              {/* 10 glowing grains drifting toward logo */}
              <points ref={grainsRef}>
                <bufferGeometry>
                  <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                </bufferGeometry>
                <pointsMaterial
                  size={0.01}
                  color="#00e6ff"
                  transparent
                  opacity={0.8}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </points>
            </group>
          );
        })}
      </group>

      {/* 🪙 Static Bluewave logo */}
      {logoRef.current && <primitive object={logoRef.current} />}
    </>
  );
}

export default function BluewaveGlobe() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "absolute",
        top: 0,
        left: 0,
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 60 }}
        style={{ touchAction: "none" }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[3, 3, 3]} intensity={1.2} />

        {/* 🌌 Moving starfield (drifting effect) */}
        <Stars
          radius={120}
          depth={100}
          count={10000}
          factor={3}
          saturation={0}
          fade
          speed={0.15}
        />

        <GlobeScene />
      </Canvas>
    </div>
  );
}
