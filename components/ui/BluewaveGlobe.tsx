"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import GlobeDot from "./GlobeDot";
import CountryCard from "./CountryCard";
import { cacheManager, CACHE_TTL } from "@/lib/cacheManager";

// ─── Types ─────────────────────────────────────────────────
interface CountryDot {
  lat: number;
  lon: number;
  name: string;
  flag: string;
  bwCount: number;
}

interface SelectedDot {
  country: CountryDot;
  worldPos: THREE.Vector3;
}

interface CardScreen {
  dotX: number;
  dotY: number;
}

// ─── Constants ──────────────────────────────────────────────
const AUTO_SPIN_SPEED = 0.05;   // rad/s
const RESUME_DELAY_MS = 2000;   // ms after drag/close before resume
const LERP_SPEED = 0.025;  // snap-back smoothness
const DRAG_SENSITIVITY = 0.005;  // pointer delta → rotation delta

// ─── Inner scene ────────────────────────────────────────────
function GlobeScene({
  onLoaded,
  onDotClick,
  isCardOpenRef,   // ← ref shared from parent; avoids closure staleness
  scheduleResumeRef,
}: {
  onLoaded?: () => void;
  onDotClick: (dot: CountryDot, worldPos: THREE.Vector3) => void;
  isCardOpenRef: React.MutableRefObject<boolean>;
  scheduleResumeRef: React.MutableRefObject<(() => void) | null>;
}) {
  const { gl } = useThree();

  const [borders, setBorders] = useState<THREE.Group | null>(null);
  const globeRef = useRef<THREE.Group>(null!);
  const logoRef = useRef<THREE.Mesh>(null!);
  const [countryDots, setCountryDots] = useState<CountryDot[]>([]);

  // ── Rotation refs ──
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAutoSpinning = useRef(true);
  const isReturning = useRef(false);

  // ── scheduleResume ──
  const scheduleResume = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    isReturning.current = false;
    isAutoSpinning.current = false;
    resumeTimer.current = setTimeout(() => {
      isReturning.current = true;
    }, RESUME_DELAY_MS);
  }, []);

  // Expose to parent
  useEffect(() => {
    scheduleResumeRef.current = scheduleResume;
  }, [scheduleResume, scheduleResumeRef]);

  const stopAutoSpin = useCallback(() => {
    isAutoSpinning.current = false;
    isReturning.current = false;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  // ── Fetch country dots ──
  useEffect(() => {
    const load = async () => {
      try {
        const cacheKey = "/api/countries";
        const cached = cacheManager.get<CountryDot[]>(cacheKey);
        if (cached) { setCountryDots(cached); return; }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/countries`);
        const data = await res.json();

        const dots: CountryDot[] = (data as any[]).map((c) => ({
          lat: c.lat,
          lon: c.lon,
          name: c.name || c.code || "Unknown",
          flag: c.flag || "🌍",
          bwCount: c.bw_count ?? 0,
        }));

        setCountryDots(dots);
        cacheManager.set(cacheKey, dots, CACHE_TTL.COUNTRIES);
      } catch (e) {
        console.error("Failed to load country dots", e);
      }
    };
    load();
  }, []);

  // ── Load borders ──
  useEffect(() => {
    let isMounted = true;
    const loadBorders = async () => {
      const res = await fetch(`/data/countries.geojson`);
      const geoData = await res.json();
      const group = new THREE.Group();

      const lineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color("#00e6ff"), transparent: true, opacity: 2.0,
      });
      const glowMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color("#00e6ff"), transparent: true, opacity: 0.5,
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

      const features = geoData.features as any[];
      let index = 0;
      const CHUNK = 12;

      const processChunks = () => {
        if (!isMounted) return;
        const end = Math.min(index + CHUNK, features.length);
        for (; index < end; index++) {
          const f = features[index];
          const g = f.geometry;
          if (!g) continue;
          if (g.type === "Polygon")
            for (const ring of g.coordinates as [number, number][][]) addRing(ring);
          else if (g.type === "MultiPolygon")
            for (const poly of g.coordinates as [number, number][][][])
              for (const ring of poly) addRing(ring);
        }
        if (index < features.length) requestAnimationFrame(processChunks);
        else { setBorders(group); onLoaded?.(); }
      };
      processChunks();
    };

    loadBorders();
    return () => { isMounted = false; };
  }, []);

  // ── Static logo ──
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const texture = loader.load("/logo-bluewave.png");
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.12, 64),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
    );
    mesh.position.set(0, 0, 0);
    logoRef.current = mesh;
  }, []);

  // ── Pointer drag ──
  useEffect(() => {
    const canvas = gl.domElement;

    const onDown = (e: PointerEvent) => {
      // Block drag when card is open
      if (isCardOpenRef.current) return;
      isDragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      stopAutoSpin();
      canvas.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!isDragging.current || !globeRef.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };

      globeRef.current.rotation.y += dx * DRAG_SENSITIVITY;
      globeRef.current.rotation.x += dy * DRAG_SENSITIVITY;
      // Clamp X so globe never flips upside-down
      globeRef.current.rotation.x = THREE.MathUtils.clamp(
        globeRef.current.rotation.x, -Math.PI * 0.45, Math.PI * 0.45
      );
    };

    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      // Only schedule resume if no card is open
      if (!isCardOpenRef.current) scheduleResume();
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [gl, stopAutoSpin, scheduleResume, isCardOpenRef]);

  // ── Per-frame loop ──
  useFrame((_, delta) => {
    if (!globeRef.current) return;

    // Hard freeze while card is open — no rotation at all
    if (isCardOpenRef.current) return;

    if (isReturning.current) {
      // Lerp X back to flat, spin Y normally
      globeRef.current.rotation.x = THREE.MathUtils.lerp(
        globeRef.current.rotation.x, 0, LERP_SPEED
      );
      globeRef.current.rotation.y += delta * AUTO_SPIN_SPEED;

      if (Math.abs(globeRef.current.rotation.x) < 0.005) {
        globeRef.current.rotation.x = 0;
        isReturning.current = false;
        isAutoSpinning.current = true;
      }
    } else if (isAutoSpinning.current) {
      globeRef.current.rotation.y += delta * AUTO_SPIN_SPEED;
    }
  });

  // ── lat/lon → 3-D ──
  const latLonToVec3 = (lat: number, lon: number, r = 1.21) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  };

  return (
    <>
      <group ref={globeRef} position={[0, 0, 0]}>
        {borders && <primitive object={borders} />}
        {countryDots.map((c, i) => (
          <GlobeDot
            key={i}
            position={latLonToVec3(c.lat, c.lon)}
            countryName={c.name}
            flag={c.flag}
            bwCount={c.bwCount}
            onClick={(worldPos) => onDotClick(c, worldPos)}
          />
        ))}
      </group>
      {logoRef.current && <primitive object={logoRef.current} />}
    </>
  );
}

// ─── Outer component ─────────────────────────────────────────
export default function BluewaveGlobe({ onLoaded }: { onLoaded?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<SelectedDot | null>(null);
  const [cardScreen, setCardScreen] = useState<CardScreen | null>(null);

  // Shared refs — readable inside the fiber loop without stale closures
  const isCardOpenRef = useRef(false);
  const scheduleResumeRef = useRef<(() => void) | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);

  // Keep isCardOpenRef in sync with React state
  useEffect(() => {
    isCardOpenRef.current = selected !== null;
  }, [selected]);

  // 3D world pos → 2D screen px
  const project3Dto2D = useCallback(
    (worldPos: THREE.Vector3): CardScreen | null => {
      if (!containerRef.current || !cameraRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const proj = worldPos.clone().project(cameraRef.current);
      return {
        dotX: ((proj.x + 1) / 2) * rect.width,
        dotY: ((-proj.y + 1) / 2) * rect.height,
      };
    },
    []
  );

  const handleDotClick = useCallback(
    (dot: CountryDot, worldPos: THREE.Vector3) => {
      setSelected({ country: dot, worldPos });
      const coords = project3Dto2D(worldPos);
      setCardScreen(coords);
    },
    [project3Dto2D]
  );

  const handleClose = useCallback(() => {
    setSelected(null);
    setCardScreen(null);
    // Start 2-second countdown then resume rotation
    scheduleResumeRef.current?.();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw", height: "100vh",
        position: "absolute", top: 0, left: 0,
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 60 }}
        style={{ touchAction: "none" }}
        onCreated={({ camera }) => { cameraRef.current = camera; }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[3, 3, 3]} intensity={1.2} />
        <Stars radius={120} depth={100} count={10000} factor={3} saturation={0} fade speed={0.15} />

        <GlobeScene
          onLoaded={onLoaded}
          onDotClick={handleDotClick}
          isCardOpenRef={isCardOpenRef}
          scheduleResumeRef={scheduleResumeRef}
        />
      </Canvas>

      {/* 2-D overlay */}
      {selected && cardScreen && (
        <CountryCard
          countryName={selected.country.name}
          flag={selected.country.flag}
          dotX={cardScreen.dotX}
          dotY={cardScreen.dotY}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
