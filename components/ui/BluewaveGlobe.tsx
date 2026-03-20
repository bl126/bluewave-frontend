"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import {
  useEffect,
  useRef,
  useState,
  useMemo,
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
  worldPos: THREE.Vector3; // 3-D position on globe surface
}

interface CardScreen {
  dotX: number;
  dotY: number;
  cardX: number;
  cardY: number;
}

// ─── Constants ──────────────────────────────────────────────
const AUTO_SPIN_SPEED = 0.05;     // rad/s — original rotation speed
const RESUME_DELAY_MS = 5000;     // ms before auto-rotation resumes
const LERP_SPEED = 0.025;         // smoothness of snap-back (lower = slower)
const DRAG_SENSITIVITY = 0.005;   // mouse/touch delta → rotation delta

// ─── Inner scene (lives inside <Canvas>) ────────────────────
function GlobeScene({
  onLoaded,
  onDotClick,
  selectedWorldPos,
}: {
  onLoaded?: () => void;
  onDotClick: (dot: CountryDot, worldPos: THREE.Vector3) => void;
  selectedWorldPos: THREE.Vector3 | null;
}) {
  const { camera, gl, size } = useThree();

  const [borders, setBorders] = useState<THREE.Group | null>(null);
  const globeRef = useRef<THREE.Group>(null!);
  const logoRef = useRef<THREE.Mesh>(null!);
  const [countryDots, setCountryDots] = useState<CountryDot[]>([]);

  // Rotation state
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAutoSpinning = useRef(true);
  const targetRotX = useRef(0);   // where we started (flat X)
  const targetRotY = useRef(0);   // accumulated auto-spin value
  const isReturning = useRef(false);

  // ── Fetch country dots with cache ──
  useEffect(() => {
    const load = async () => {
      try {
        const cacheKey = "/api/countries";
        const cached = cacheManager.get<CountryDot[]>(cacheKey);
        if (cached) {
          setCountryDots(cached);
          return;
        }
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/countries`
        );
        const data = await res.json();

        // Normalise field names coming from backend
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

  // ── Load country borders ──
  useEffect(() => {
    let isMounted = true;
    const loadBorders = async () => {
      const res = await fetch(`/data/countries.geojson`);
      const geoData = await res.json();
      const group = new THREE.Group();

      const lineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color("#00e6ff"),
        transparent: true,
        opacity: 2.0,
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

      const features = geoData.features as any[];
      let index = 0;
      const CHUNK_SIZE = 12;

      const processChunks = () => {
        if (!isMounted) return;
        const end = Math.min(index + CHUNK_SIZE, features.length);
        for (; index < end; index++) {
          const f = features[index];
          const g = f.geometry;
          if (!g) continue;
          if (g.type === "Polygon") {
            for (const ring of g.coordinates as [number, number][][])
              addRing(ring);
          } else if (g.type === "MultiPolygon") {
            for (const poly of g.coordinates as [number, number][][][])
              for (const ring of poly) addRing(ring);
          }
        }
        if (index < features.length) {
          requestAnimationFrame(processChunks);
        } else {
          setBorders(group);
          onLoaded?.();
        }
      };
      processChunks();
    };

    loadBorders();
    return () => {
      isMounted = false;
    };
  }, []);

  // ── Static Bluewave logo ──
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

  // ── Helpers to stop/restart spinning ──
  const stopAutoSpin = useCallback(() => {
    isAutoSpinning.current = false;
    isReturning.current = false;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  const scheduleResume = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      isReturning.current = true; // start lerp back
    }, RESUME_DELAY_MS);
  }, []);

  // Public handle: called by parent when card is closed
  // We expose this via a ref so BluewaveGlobe can call it
  (GlobeScene as any)._scheduleResume = scheduleResume;

  // ── Pointer drag events ──
  useEffect(() => {
    const canvas = gl.domElement;

    const onDown = (e: PointerEvent) => {
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

      // Clamp X to ±80° so globe doesn't flip upside-down
      globeRef.current.rotation.x = THREE.MathUtils.clamp(
        globeRef.current.rotation.x,
        -Math.PI * 0.45,
        Math.PI * 0.45
      );
    };

    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      scheduleResume();
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
  }, [gl, stopAutoSpin, scheduleResume]);

  // ── Per-frame animation ──
  useFrame((_, delta) => {
    if (!globeRef.current) return;

    if (isReturning.current) {
      // Lerp rotation.x back to 0 and resume auto-spin on Y
      globeRef.current.rotation.x = THREE.MathUtils.lerp(
        globeRef.current.rotation.x,
        0,
        LERP_SPEED
      );
      // Auto spin resumes immediately during return
      globeRef.current.rotation.y += delta * AUTO_SPIN_SPEED;
      targetRotY.current = globeRef.current.rotation.y;

      // Consider "returned" when X is nearly flat
      if (Math.abs(globeRef.current.rotation.x) < 0.005) {
        globeRef.current.rotation.x = 0;
        isReturning.current = false;
        isAutoSpinning.current = true;
      }
    } else if (isAutoSpinning.current) {
      globeRef.current.rotation.y += delta * AUTO_SPIN_SPEED;
      targetRotY.current = globeRef.current.rotation.y;
    }
  });

  // ── latLon → 3-D position ──
  const latLonToVec3 = (lat: number, lon: number, radius = 1.21) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  };

  return (
    <>
      <group ref={globeRef} position={[0, 0, 0]}>
        {borders && <primitive object={borders} />}

        {countryDots.map((c, i) => {
          const pos = latLonToVec3(c.lat, c.lon);
          return (
            <GlobeDot
              key={i}
              position={pos}
              countryName={c.name}
              flag={c.flag}
              bwCount={c.bwCount}
              onClick={(worldPos) => onDotClick(c, worldPos)}
            />
          );
        })}
      </group>

      {logoRef.current && <primitive object={logoRef.current} />}
    </>
  );
}

// ─── Outer component (manages canvas + 2-D overlay) ─────────
export default function BluewaveGlobe({
  onLoaded,
}: {
  onLoaded?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<SelectedDot | null>(null);
  const [cardScreen, setCardScreen] = useState<CardScreen | null>(null);
  const scheduleResumeRef = useRef<(() => void) | null>(null);

  // Project a world-space position to 2-D container pixels
  const project3Dto2D = useCallback(
    (worldPos: THREE.Vector3, camera: THREE.Camera): CardScreen | null => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();

      const proj = worldPos.clone().project(camera);
      const dotX = ((proj.x + 1) / 2) * rect.width;
      const dotY = ((-proj.y + 1) / 2) * rect.height;

      return {
        dotX,
        dotY,
        cardX: dotX,
        cardY: dotY,
      };
    },
    []
  );

  // Called from inside the Canvas via a forwarded function
  const handleDotClick = useCallback(
    (dot: CountryDot, worldPos: THREE.Vector3) => {
      setSelected({ country: dot, worldPos });
    },
    []
  );

  // We need the camera from inside the canvas — use a bridge component
  const [cameraRef, setCameraRef] = useState<THREE.Camera | null>(null);

  // Whenever selected or camera changes, reproject
  useEffect(() => {
    if (!selected || !cameraRef) return;

    // The worldPos is in globe-group local space; we need world space.
    // Since the globe is at origin, they're the same — but account for
    // globe group's current rotation by reading it each frame.
    // For the card anchor we snapshot it once on click (good enough).
    const coords = project3Dto2D(selected.worldPos, cameraRef);
    setCardScreen(coords);
  }, [selected, cameraRef, project3Dto2D]);

  const handleClose = useCallback(() => {
    setSelected(null);
    setCardScreen(null);
    // Trigger 5-second resume from inside the scene
    scheduleResumeRef.current?.();
  }, []);

  return (
    <div
      ref={containerRef}
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
        onCreated={({ camera }) => setCameraRef(camera)}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[3, 3, 3]} intensity={1.2} />

        <Stars
          radius={120}
          depth={100}
          count={10000}
          factor={3}
          saturation={0}
          fade
          speed={0.15}
        />

        <GlobeScene
          onLoaded={onLoaded}
          onDotClick={handleDotClick}
          selectedWorldPos={selected?.worldPos ?? null}
        />

        {/* Bridge: grab scheduleResume from inside the scene */}
        <ScheduleResumeBridge onReady={(fn) => (scheduleResumeRef.current = fn)} />
      </Canvas>

      {/* 2-D overlay: card + SVG line */}
      {selected && cardScreen && (
        <CountryCard
          countryName={selected.country.name}
          flag={selected.country.flag}
          bwCount={selected.country.bwCount}
          screenX={cardScreen.dotX}
          screenY={cardScreen.dotY}
          dotX={cardScreen.dotX}
          dotY={cardScreen.dotY}
          onClose={handleClose}
        />
      )}
    </div>
  );
}

// ─── Bridge: retrieves scheduleResume from GlobeScene ────────
function ScheduleResumeBridge({ onReady }: { onReady: (fn: () => void) => void }) {
  useEffect(() => {
    // GlobeScene attaches its scheduleResume to a static property
    // We pass it up to the parent via callback
    const check = setInterval(() => {
      const fn = (GlobeScene as any)._scheduleResume;
      if (fn) {
        onReady(fn);
        clearInterval(check);
      }
    }, 100);
    return () => clearInterval(check);
  }, [onReady]);
  return null;
}
