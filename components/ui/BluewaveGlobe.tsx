"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, PerspectiveCamera } from "@react-three/drei";
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
import * as THREE_CORE from "three";

// Enable Three.js caching globally
if (typeof window !== "undefined") {
  THREE_CORE.Cache.enabled = true;
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

// ─── Inner scene ────────────────────────────────────────────
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
  const { theme } = useTheme();

  const [borders, setBorders] = useState<THREE.Group | null>(null);
  const globeRef = useRef<THREE.Group>(null!);
  const logoRef = useRef<THREE.Mesh>(null!);
  const [countryDots, setCountryDots] = useState<CountryDot[]>([]);
  
  // Theme-aware colors — real Earth palette
  const colors = useMemo(() => {
    switch (theme) {
      case "light":
        return {
          ocean: "#1a6fa0",    // Real ocean blue
          land: "#5a8a4a",     // Real land green
          border: "#1a1a1a",   // Dark borders — visible on light globe
          glow: "#555555",     // Subtle secondary border lines
          ambient: 1.4,
          point: 0.8,
          stars: 0,
          atmosphereOpacity: 0 // No edge glow
        };
      case "dim":
        return {
          ocean: "#0d3d5f",    // Deeper ocean for dim environment
          land: "#2d5c3f",     // Deeper land for dim environment
          border: "#00F6FF",
          glow: "#00F6FF",
          ambient: 0.9,
          point: 1.0,
          stars: 0.6,
          atmosphereOpacity: 0 // No edge glow
        };
      default: // night
        return {
          ocean: "#061422",    // Near-black deep ocean for space feel
          land: "#0c200e",     // Near-black deep land for space feel
          border: "#00F6FF",
          glow: "#00F6FF",
          ambient: 0.4,
          point: 1.5,
          stars: 1.0,
          atmosphereOpacity: 0 // No edge glow
        };
    }
  }, [theme]);

  // ── Texture Loading (resilient: fails silently, falls back to solid color) ──
  const [dayMap, setDayMap] = useState<THREE.Texture | null>(null);
  const [nightMap, setNightMap] = useState<THREE.Texture | null>(null);
  const [cloudsMap, setCloudsMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const maxAniso = gl.capabilities.getMaxAnisotropy();

    const loadTex = (url: string, setter: (t: THREE.Texture) => void) => {
      loader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = maxAniso;
          setter(tex);
        },
        undefined,
        (err) => console.warn(`[Globe] Texture load failed (using fallback color): ${url}`, err)
      );
    };

    // Local textures — served from /public/textures/ (no external CDN dependency)
    loadTex("/textures/earth-blue-marble.jpg", setDayMap);
    loadTex("/textures/earth-night.jpg", setNightMap);
    loadTex("/textures/earth-clouds.png", setCloudsMap);
  }, [gl]);

  const globeMaterial = useMemo(() => {
    const isDark = theme === "original" || theme === "dim";
    // Graceful fallback: use solid color if textures haven't loaded yet
    if (isDark) {
      return (
        <meshStandardMaterial
          map={nightMap ?? undefined}
          color={nightMap ? undefined : colors.ocean}
          emissive={new THREE.Color("#ffcf8b")}
          emissiveIntensity={nightMap ? 0.8 : 0}
          emissiveMap={nightMap ?? undefined}
          roughness={0.8}
          metalness={0.1}
        />
      );
    }
    return (
      <meshStandardMaterial
        map={dayMap ?? undefined}
        color={dayMap ? undefined : colors.ocean}
        roughness={0.8}
        metalness={0.1}
      />
    );
  }, [theme, dayMap, nightMap, colors.ocean]);

  // Rotation refs
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAutoSpinning = useRef(true);
  const isReturning = useRef(false);
  const cloudsRef = useRef<THREE.Mesh>(null!);

  // ── scheduleResume ──
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
      try {
        const res = await fetch(`/data/countries.geojson`);
        const geoData = await res.json();
        const group = new THREE.Group();

        const lineMaterial = new THREE.LineBasicMaterial({
          color: new THREE.Color(colors.border), transparent: true, opacity: 0.8,
        });
        const glowMaterial = new THREE.LineBasicMaterial({
          color: new THREE.Color(colors.glow), transparent: true, opacity: 0.3,
        });

        const R = GLOBE_RADIUS + 0.005; // Slightly above surface
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
          glowLine.scale.multiplyScalar(1.002);
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
      } catch (e) {
        console.error("Globe Borders Load Error:", e);
      }
    };

    loadBorders();
    return () => { isMounted = false; };
  }, [colors.border, colors.glow]);

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

  useFrame((_, delta) => {
    // Rotate clouds slightly faster than earth for realism
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.02;
    }

    if (!globeRef.current) return;
    if (isCardOpenRef.current) return;

    if (isReturning.current) {
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
      <ambientLight intensity={colors.ambient} />
      {/* Sun Light */}
      <directionalLight 
        position={[5, 3, 5]} 
        intensity={theme === 'light' ? 2.5 : 1.5} 
        color={theme === 'light' ? "#ffffff" : "#fff5e6"}
      />
      {/* Back Glow */}
      <pointLight 
        position={[-5, -3, -5]} 
        intensity={theme === 'light' ? 0.5 : 1.2} 
        color={theme === 'light' ? "#ffffff" : "#00f6ff"} 
      />

      <group ref={globeRef} position={[0, 0, 0]}>
        {/* The Globe Sphere — Real Earth Textures */}
        <mesh receiveShadow castShadow>
          <sphereGeometry args={[GLOBE_RADIUS, 128, 128]} />
          {globeMaterial}
        </mesh>

        {/* Cloud Layer — only rendered once texture is loaded */}
        {cloudsMap && (
          <mesh ref={cloudsRef}>
            <sphereGeometry args={[GLOBE_RADIUS + 0.015, 64, 64]} />
            <meshStandardMaterial
              map={cloudsMap}
              transparent={true}
              opacity={0.4}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Atmosphere Glow */}
        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS * 1.04, 64, 64]} />
          <meshPhongMaterial
            color={theme === 'light' ? "#aaddff" : "#00f6ff"}
            transparent={true}
            opacity={0.15}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Borders Layer (Subtle) */}
        {borders && (
          <primitive object={borders} />
        )}

        {/* Country Dots Layer */}
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

// ─── Scene Background — sets Canvas clear color per theme ────
function SceneBackground() {
  const { gl } = useThree();
  const { theme } = useTheme();

  useEffect(() => {
    switch (theme) {
      case 'light':
        gl.setClearColor(new THREE.Color('#ffffff'), 1);
        break;
      case 'dim':
        gl.setClearColor(new THREE.Color('#17212B'), 1);
        break;
      default: // night
        gl.setClearColor(new THREE.Color('#000000'), 1);
        break;
    }
  }, [theme, gl]);

  return null;
}

// ─── Outer component ─────────────────────────────────────────
export default function BluewaveGlobe({ onLoaded }: { onLoaded?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<SelectedDot | null>(null);
  const [cardScreen, setCardScreen] = useState<CardScreen | null>(null);
  const { theme } = useTheme();

  const isCardOpenRef = useRef(false);
  const scheduleResumeRef = useRef<(() => void) | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);

  useEffect(() => {
    isCardOpenRef.current = selected !== null;
  }, [selected]);

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
        shadows
      >
        {/* Theme-aware canvas background */}
        <SceneBackground />

        {/* Stars in Night/Dim mode */}
        {(theme === 'original' || theme === 'dim') && (
          <Stars
            radius={120}
            depth={100}
            count={7000}
            factor={4}
            saturation={0}
            fade
            speed={0.5}
          />
        )}

        <Suspense fallback={null}>
          <GlobeScene
            onLoaded={onLoaded}
            onDotClick={handleDotClick}
            isCardOpenRef={isCardOpenRef}
            scheduleResumeRef={scheduleResumeRef}
          />
        </Suspense>
      </Canvas>

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
