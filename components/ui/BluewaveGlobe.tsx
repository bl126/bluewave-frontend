"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useRef, useState, useMemo } from "react";
import GlobeDot from "./GlobeDot";

function GlobeScene({ onLoaded }: { onLoaded?: () => void }) {
  const [borders, setBorders] = useState<THREE.Group | null>(null);
  const globeRef = useRef<THREE.Group>(null!);
  const logoRef = useRef<THREE.Mesh>(null!);

  const [countryDots, setCountryDots] = useState<{ lat: number; lon: number }[]>([]);

// Fetch all unique countries from backend
useEffect(() => {
  const loadCountries = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/countries`);
      const data = await res.json();
      setCountryDots(data);
    } catch (e) {
      console.error("Failed to load country dots", e);
    }
  };

  loadCountries();
}, []);


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
      const res = await fetch(`/data/countries.geojson`);
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
      if (isMounted) {
        setBorders(group);
        onLoaded?.(); // ✅ tell landing page we’re done loading
      }
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

        {countryDots.map((c, i) => {
          const pos = latLonToVec3(c.lat, c.lon);
          return <GlobeDot key={i} position={pos} />;
        })}
      </group>

      {/* 🪙 Static Bluewave logo */}
      {logoRef.current && <primitive object={logoRef.current} />}
    </>
  );
}

export default function BluewaveGlobe({ onLoaded }: { onLoaded?: () => void }) {
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

        <GlobeScene onLoaded={onLoaded} />
      </Canvas>
    </div>
  );
}
