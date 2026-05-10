"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import GlobeDot from "./GlobeDot";
import CountryCard from "./CountryCard";
import { cacheManager, CACHE_TTL } from "@/lib/cacheManager";
import { useTheme } from "@/contexts/ThemeContext";

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
  
  // Theme-aware colors
  const colors = useMemo(() => {
    switch (theme) {
      case "light":
        return {
          ocean: "#050505",
          land: "#111111",
          border: "#222222",
          glow: "#ffffff",
          ambient: 0.8,
          point: 1.2,
          stars: 0,
          atmosphereOpacity: 0.4
        };
      case "dim":
        return {
          ocean: "#050A15",
          land: "#1E293B",
          border: "#00F6FF",
          glow: "#00F6FF",
          ambient: 0.7,
          point: 1.2,
          stars: 0.6,
          atmosphereOpacity: 0.15
        };
      default: // original
        return {
          ocean: "#000000",
          land: "#0D0D0D",
          border: "#00F6FF",
          glow: "#00F6FF",
          ambient: 0.4,
          point: 1.5,
          stars: 1.0,
          atmosphereOpacity: 0.15
        };
    }
  }, [theme]);

  // ── Texture Generation (The "Coat") ──
  const [worldTexture, setWorldTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const loadAndDraw = async () => {
      try {
        const res = await fetch(`/data/countries.geojson`);
        const geoData = await res.json();

        const canvas = document.createElement("canvas");
        canvas.width = 4096;
        canvas.height = 2048;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Fill Background (Oceans)
        ctx.fillStyle = colors.ocean;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Countries (Land "Coat")
        ctx.fillStyle = colors.land;
        
        const features = geoData.features as any[];
        features.forEach((f: any) => {
          const g = f.geometry;
          if (!g) return;
          
          const drawRing = (ring: [number, number][]) => {
            ctx.beginPath();
            ring.forEach(([lng, lat], i) => {
              const x = ((lng + 180) / 360) * canvas.width;
              const y = ((90 - lat) / 180) * canvas.height;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.fill();
          };

          if (g.type === "Polygon") {
            g.coordinates.forEach((ring: any) => drawRing(ring));
          } else if (g.type === "MultiPolygon") {
            g.coordinates.forEach((poly: any) => {
              poly.forEach((ring: any) => drawRing(ring));
            });
          }
        });

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        setWorldTexture(tex);
      } catch (e) {
        console.error("Globe Texture Load Error:", e);
      }
    };

    loadAndDraw();
  }, [colors.ocean, colors.land]);

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
      <pointLight position={[5, 5, 5]} intensity={colors.point} />
      {/* RIM Light to make the dark globe pop in Light Mode */}
      {theme === 'light' && (
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
      )}
      <pointLight position={[-10, 10, 10]} intensity={theme === 'light' ? 2 : 1.5} color={theme === 'light' ? "#ffffff" : "#00f6ff"} />

      <group ref={globeRef} position={[0, 0, 0]}>
        {/* The "Coated" Sphere (Oceans + Land) */}
        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS, 128, 128]} />
          {worldTexture ? (
             <meshStandardMaterial 
              map={worldTexture} 
              roughness={0.7} 
              metalness={0.1}
            />
          ) : (
            <meshStandardMaterial color={colors.ocean} />
          )}
        </mesh>

        {/* Borders Layer */}
        {borders && <primitive object={borders} />}
        
        {/* Atmosphere Glow */}
        <mesh scale={[1.02, 1.02, 1.02]}>
          <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
          <meshPhongMaterial
            color={colors.glow}
            transparent
            opacity={colors.atmosphereOpacity}
            side={THREE.BackSide}
            blending={theme === 'light' ? THREE.NormalBlending : THREE.AdditiveBlending}
          />
        </mesh>

        {/* Dots Layer */}
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
      >
        {theme !== 'light' && (
          <Stars 
            radius={120} 
            depth={100} 
            count={10000} 
            factor={3} 
            saturation={0} 
            fade 
            speed={0.15} 
          />
        )}

        <GlobeScene
          onLoaded={onLoaded}
          onDotClick={handleDotClick}
          isCardOpenRef={isCardOpenRef}
          scheduleResumeRef={scheduleResumeRef}
        />
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
