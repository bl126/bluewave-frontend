"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, useTexture } from "@react-three/drei";
import * as THREE from "three";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  Suspense
} from "react";
import GlobeDot from "./GlobeDot";
import CountryCard from "./CountryCard";
import { cacheManager, CACHE_TTL } from "@/lib/cacheManager";
import { useTheme } from "@/contexts/ThemeContext";

// Enable Three.js caching globally
if (typeof window !== "undefined") {
  THREE.Cache.enabled = true;
}

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
const GLOBE_RADIUS = 1.2;

// ─── Fallback Globe (Shown while textures load) ──────────────────
function FallbackGlobe({ colors, isDark }: { colors: any, isDark: boolean }) {
  return (
    <mesh receiveShadow castShadow>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <meshStandardMaterial
        color={colors.ocean}
        emissive={new THREE.Color(isDark ? "#ffcf8b" : "#000000")}
        emissiveIntensity={0}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

// ─── Textured Globe Component (Suspends until textures load) ──────
function TexturedGlobe({ 
  isDark, colors, globeRef, cloudsRef, onDotClick, countryDots, borders, logoRef 
}: any) {
  const { theme: contextTheme, mounted } = useTheme();
  // ⚡ IMMEDIATE THEME DETECTION: Read directly from DOM if not yet hydrated
  // to prevent "Night Mode" flicker on first render.
  const theme = !mounted && typeof document !== 'undefined'
    ? (document.documentElement.getAttribute("data-theme") as any) || contextTheme
    : contextTheme;

  // We use the prop 'isDark' passed from parent GlobeScene which is now synchronized

  // useTexture suspends the component until all assets are loaded
  const [dayMap, nightMap, cloudsMap] = useTexture([
    "/textures/earth-night.jpg", // Force night map
    "/textures/earth-night.jpg",
    "/textures/earth-clouds.png"
  ]);

  // Configure textures
  useEffect(() => {
    [dayMap, nightMap, cloudsMap].forEach(tex => {
      if (tex) tex.colorSpace = THREE.SRGBColorSpace;
    });
  }, [dayMap, nightMap, cloudsMap]);

  const latLonToVec3 = (lat: number, lon: number, r = GLOBE_RADIUS + 0.01) => {
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
        {/* The Globe Sphere — Real Earth Textures */}
        <mesh receiveShadow castShadow>
          <sphereGeometry args={[GLOBE_RADIUS, 128, 128]} />
          <meshStandardMaterial
            map={nightMap}
            color="#ffffff" 
            emissive={new THREE.Color("#ffcf8b")}
            emissiveIntensity={theme === 'dim' ? 0.35 : 0.8}
            emissiveMap={nightMap}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>

        {/* Cloud Layer */}
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[GLOBE_RADIUS + 0.015, 64, 64]} />
          <meshStandardMaterial
            map={cloudsMap}
            transparent={true}
            opacity={0.4}
            depthWrite={false}
          />
        </mesh>
        {/* Borders Layer (Subtle) */}
        {borders && (
          <primitive object={borders} />
        )}
        {/* Country Dots Layer */}
        {countryDots.map((c: any, i: number) => (
          <GlobeDot
            key={i}
            position={latLonToVec3(c.lat, c.lon)}
            countryName={c.name}
            flag={c.flag}
            bwCount={c.bwCount}
            onClick={(worldPos: any) => onDotClick(c, worldPos)}
          />
        ))}
      </group>
      {logoRef.current && <primitive object={logoRef.current} />}
    </>
  );
}

// ─── Inner Scene logic (Lighting, Interaction, Animation) ────────
function GlobeScene({
  onLoaded,
  onDotClick,
  isCardOpenRef,
  scheduleResumeRef,
}: {
  onLoaded?: () => void;
  onDotClick: (dot: CountryDot, worldPos: THREE.Vector3) => void;
  isCardOpenRef: React.MutableRefObject<boolean>;
  scheduleResumeRef: React.MutableRefObject<(() => void) | null>;
}) {
  const { gl } = useThree();
  const { theme: contextTheme, mounted } = useTheme();

  // ⚡ IMMEDIATE THEME DETECTION: Read directly from DOM if not yet hydrated
  const theme = !mounted && typeof document !== 'undefined'
    ? (document.documentElement.getAttribute("data-theme") as any) || contextTheme
    : contextTheme;

  const [borders, setBorders] = useState<THREE.Group | null>(null);
  const globeRef = useRef<THREE.Group>(null!);
  const logoRef = useRef<THREE.Mesh>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);
  const [countryDots, setCountryDots] = useState<CountryDot[]>([]);
  
  const isDark = theme === "original" || theme === "dim";

  const colors = useMemo(() => {
    switch (theme) {
      case "dim":
        return { ocean: "#0d3d5f", border: "#00F6FF", glow: "#00F6FF", ambient: 0.6 };
      default: // original
        return { ocean: "#061422", border: "#00F6FF", glow: "#00F6FF", ambient: 0.4 };
    }
  }, [theme]);

  // Rotation & Drag Logic
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAutoSpinning = useRef(true);
  const isReturning = useRef(false);

  const scheduleResume = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    isReturning.current = false;
    isAutoSpinning.current = false;
    resumeTimer.current = setTimeout(() => {
      isReturning.current = true;
    }, RESUME_DELAY_MS);
  }, []);

  useEffect(() => {
    scheduleResumeRef.current = scheduleResume;
  }, [scheduleResume, scheduleResumeRef]);

  const stopAutoSpin = useCallback(() => {
    isAutoSpinning.current = false;
    isReturning.current = false;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  // Pointer drag events
  useEffect(() => {
    const canvas = gl.domElement;
    const onDown = (e: PointerEvent) => {
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
      globeRef.current.rotation.x = THREE.MathUtils.clamp(
        globeRef.current.rotation.x, -Math.PI * 0.45, Math.PI * 0.45
      );
    };
    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
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

  // Animation Loop
  useFrame((_, delta) => {
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.02;
    if (!globeRef.current || isCardOpenRef.current) return;

    if (isReturning.current) {
      globeRef.current.rotation.x = THREE.MathUtils.lerp(globeRef.current.rotation.x, 0, LERP_SPEED);
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

  // Data Loading (Dots & Borders)
  useEffect(() => {
    const load = async () => {
      try {
        const cacheKey = "/api/countries";
        const cached = cacheManager.get<CountryDot[]>(cacheKey);
        if (cached) { setCountryDots(cached); return; }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/countries`);
        const data = await res.json();
        const dots = (data as any[]).map((c) => ({
          lat: c.lat, lon: c.lon, name: c.name || c.code || "Unknown", flag: c.flag || "🌍", bwCount: c.bw_count ?? 0,
        }));
        setCountryDots(dots);
        cacheManager.set(cacheKey, dots, CACHE_TTL.COUNTRIES);
      } catch (e) { console.error("Failed to load dots", e); }
    };
    load();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadBorders = async () => {
      try {
        const res = await fetch(`/data/countries.geojson`);
        const geoData = await res.json();
        const group = new THREE.Group();
        const lineMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(colors.border), transparent: true, opacity: 0.8 });
        const glowMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(colors.glow), transparent: true, opacity: 0.3 });
        const R = GLOBE_RADIUS + 0.005;
        const toVec3 = ([lng, lat]: [number, number]) => {
          const lambda = (lng * Math.PI) / 180;
          const phi = (lat * Math.PI) / 180;
          return new THREE.Vector3(R * Math.cos(phi) * Math.cos(lambda), R * Math.sin(phi), -R * Math.cos(phi) * Math.sin(lambda));
        };
        const addRing = (coords: [number, number][]) => {
          const pts = coords.map(toVec3);
          if (pts.length < 2) return;
          const geom = new THREE.BufferGeometry().setFromPoints(pts);
          const line = new THREE.LineLoop(geom, lineMaterial);
          const glowLine = line.clone();
          glowLine.scale.multiplyScalar(1.002);
          glowLine.material = glowMaterial;
          group.add(glowLine); group.add(line);
        };
        const features = geoData.features as any[];
        let index = 0;
        const processChunks = () => {
          if (!isMounted) return;
          const end = Math.min(index + 12, features.length);
          for (; index < end; index++) {
            const g = features[index].geometry;
            if (!g) continue;
            if (g.type === "Polygon") for (const ring of g.coordinates) addRing(ring);
            else if (g.type === "MultiPolygon") for (const poly of g.coordinates) for (const ring of poly) addRing(ring);
          }
          if (index < features.length) requestAnimationFrame(processChunks);
          else { setBorders(group); onLoaded?.(); }
        };
        processChunks();
      } catch (e) { console.error("Borders error", e); }
    };
    loadBorders();
    return () => { isMounted = false; };
  }, [colors.border, colors.glow, onLoaded]);

  // Logo
  useEffect(() => {
    const texture = new THREE.TextureLoader().load("/logo-bluewave.png");
    texture.colorSpace = THREE.SRGBColorSpace;
    logoRef.current = new THREE.Mesh(new THREE.CircleGeometry(0.12, 64), new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide }));
  }, []);

  return (
    <>
      <ambientLight intensity={colors.ambient} />
      <directionalLight position={[5, 3, 5]} intensity={theme === 'dim' ? 1.8 : 1.5} color="#fff5e6" />
      <pointLight position={[-5, -3, -5]} intensity={theme === 'dim' ? 0.8 : 1.2} color="#00f6ff" />

      <Suspense fallback={<FallbackGlobe colors={colors} isDark={isDark} />}>
        <TexturedGlobe 
          isDark={isDark} colors={colors} globeRef={globeRef} cloudsRef={cloudsRef} 
          onDotClick={onDotClick} countryDots={countryDots} borders={borders} logoRef={logoRef} 
        />
      </Suspense>
    </>
  );
}

// ─── Scene Background Handler ──────────────────────────────────
function SceneBackground() {
  const { gl } = useThree();
  const { theme } = useTheme();
  useEffect(() => {
    const colorMap = { dim: '#17212B', original: '#000000' };
    gl.setClearColor(new THREE.Color(colorMap[theme] || '#000000'), 1);
  }, [theme, gl]);
  return null;
}

// ─── Camera Reference Tracker ──────────────────────────────
function CameraTracker({ cameraRef }: { cameraRef: React.MutableRefObject<THREE.Camera | null> }) {
  const { camera } = useThree();
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera, cameraRef]);
  return null;
}

// ─── Main Export ───────────────────────────────────────────────
export default function BluewaveGlobe({ onLoaded }: { onLoaded?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<SelectedDot | null>(null);
  const [cardScreen, setCardScreen] = useState<CardScreen | null>(null);
  const { theme } = useTheme();

  const isCardOpenRef = useRef(false);
  const scheduleResumeRef = useRef<(() => void) | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);

  useEffect(() => { isCardOpenRef.current = selected !== null; }, [selected]);

  const project3Dto2D = useCallback((worldPos: THREE.Vector3): CardScreen | null => {
    if (!containerRef.current || !cameraRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const proj = worldPos.clone().project(cameraRef.current);
    
    // Convert NDC to screen pixels
    return { 
      dotX: ((proj.x + 1) / 2) * rect.width, 
      dotY: ((-proj.y + 1) / 2) * rect.height 
    };
  }, []);

  const handleDotClick = useCallback((dot: CountryDot, worldPos: THREE.Vector3) => {
    const coords = project3Dto2D(worldPos);
    if (coords && !isNaN(coords.dotX) && !isNaN(coords.dotY)) {
      setSelected({ country: dot, worldPos });
      setCardScreen(coords);
    } else {
      setSelected(null);
    }
  }, [project3Dto2D]);

  return (
    <div ref={containerRef} className="fullscreen-fixed">
      <Canvas camera={{ position: [0, 0, 3.5], fov: 60 }} shadows>
        <CameraTracker cameraRef={cameraRef} />
        <SceneBackground />
        <Stars radius={120} count={7000} speed={0.5} fade />
        <Suspense fallback={null}>
          <GlobeScene onLoaded={onLoaded} onDotClick={handleDotClick} isCardOpenRef={isCardOpenRef} scheduleResumeRef={scheduleResumeRef} />
        </Suspense>
      </Canvas>

      {selected && cardScreen && (
        <CountryCard 
          countryName={selected.country.name} flag={selected.country.flag} 
          dotX={cardScreen.dotX} dotY={cardScreen.dotY} onClose={() => setSelected(null)} 
        />
      )}
    </div>
  );
}
