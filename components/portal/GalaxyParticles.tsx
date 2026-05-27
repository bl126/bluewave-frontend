"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─────────────────────────────────────────────
 *  GPU-Instanced Spiral Galaxy Star System
 *
 *  80 000 stars distributed via logarithmic
 *  spiral arm math + dense galactic core.
 *  Orbital rotation is computed entirely on
 *  GPU via custom vertex shader.
 * ───────────────────────────────────────────── */

const STAR_COUNT = 80_000;
const ARM_COUNT = 4;
const GALAXY_RADIUS = 28;
const CORE_RATIO = 0.30; // 30 % of stars in the dense core
const DISK_THICKNESS = 0.45; // vertical spread factor

// ──── Star Temperature Palette ────
function starColor(t: number): [number, number, number] {
  if (t < 0.08) return [0.55, 0.65, 1.0];      // O/B blue-white (hot)
  if (t < 0.22) return [0.85, 0.9, 1.0];        // A white
  if (t < 0.50) return [1.0, 0.96, 0.84];       // F/G yellow-white
  if (t < 0.75) return [1.0, 0.82, 0.55];       // K orange
  return [1.0, 0.55, 0.35];                      // M red-orange (cool)
}

// ──── Galaxy Geometry Generator ────
function buildGalaxy() {
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors    = new Float32Array(STAR_COUNT * 3);
  const scales    = new Float32Array(STAR_COUNT);
  const radii     = new Float32Array(STAR_COUNT);
  const initAngle = new Float32Array(STAR_COUNT);
  const speed     = new Float32Array(STAR_COUNT);

  for (let i = 0; i < STAR_COUNT; i++) {
    const i3 = i * 3;
    const isCore = Math.random() < CORE_RATIO;

    let r: number, angle: number;

    if (isCore) {
      // Dense core — exponential radial falloff
      r = Math.pow(Math.random(), 2.5) * 4.5;
      angle = Math.random() * Math.PI * 2;
    } else {
      // Spiral arm placement
      const armIdx = Math.floor(Math.random() * ARM_COUNT);
      const armBaseAngle = (armIdx / ARM_COUNT) * Math.PI * 2;

      // Radius — weighted toward inner galaxy
      r = 2 + Math.pow(Math.random(), 0.6) * (GALAXY_RADIUS - 2);

      // Logarithmic spiral: angle increases with radius
      const spiralTightness = 0.35;
      const spiralAngle = armBaseAngle + r * spiralTightness;

      // Gaussian scatter perpendicular to arm
      const scatter = (Math.random() - 0.5) * 2.0 * Math.pow(r * 0.06, 0.8);
      angle = spiralAngle + scatter;
    }

    // Convert polar → cartesian (x, z plane)
    positions[i3]     = Math.cos(angle) * r;
    positions[i3 + 2] = Math.sin(angle) * r;

    // Thin disk vertical distribution (thinner at edges)
    const verticalSpread = DISK_THICKNESS * Math.max(0.2, 1 - r / GALAXY_RADIUS);
    positions[i3 + 1] = (Math.random() - 0.5) * verticalSpread * (isCore ? 1.5 : 1);

    // Orbital parameters
    radii[i]     = r;
    initAngle[i] = angle;
    speed[i]     = (0.015 + Math.random() * 0.005) / Math.max(r, 0.4); // Keplerian

    // Star temperature → color
    const temp = Math.random();
    const [cr, cg, cb] = starColor(temp);
    colors[i3]     = cr;
    colors[i3 + 1] = cg;
    colors[i3 + 2] = cb;

    // Size variance — core stars brighter
    scales[i] = (Math.random() * 0.7 + 0.3) * (isCore ? 1.6 : 1.0);
  }

  return { positions, colors, scales, radii, initAngle, speed };
}

// ──── GLSL: Vertex Shader ────
const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPointSize;

  attribute float aScale;
  attribute vec3  aColor;
  attribute float aRadius;
  attribute float aInitAngle;
  attribute float aSpeed;

  varying vec3  vColor;
  varying float vBrightness;

  void main() {
    // Compute orbital position on GPU
    float currentAngle = aInitAngle + uTime * aSpeed;

    vec3 pos;
    pos.x = cos(currentAngle) * aRadius;
    pos.y = position.y;                       // keep vertical
    pos.z = sin(currentAngle) * aRadius;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation
    gl_PointSize = uPointSize * aScale * (280.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 0.8, 48.0);

    vColor      = aColor;
    vBrightness = aScale;
  }
`;

// ──── GLSL: Fragment Shader ────
const fragmentShader = /* glsl */ `
  varying vec3  vColor;
  varying float vBrightness;

  void main() {
    vec2  center   = gl_PointCoord - vec2(0.5);
    float dist     = length(center);
    if (dist > 0.5) discard;

    // Bright core + soft glow halo
    float core = exp(-dist * 10.0);
    float glow = exp(-dist * 3.5);
    float strength = mix(glow, core, 0.45) * vBrightness;

    gl_FragColor = vec4(vColor * strength * 1.6, strength);
  }
`;

// ──── React Component ────
export default function GalaxyParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const { geometry, material } = useMemo(() => {
    const data = buildGalaxy();

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position",   new THREE.BufferAttribute(data.positions, 3));
    geo.setAttribute("aColor",     new THREE.BufferAttribute(data.colors,    3));
    geo.setAttribute("aScale",     new THREE.BufferAttribute(data.scales,    1));
    geo.setAttribute("aRadius",    new THREE.BufferAttribute(data.radii,     1));
    geo.setAttribute("aInitAngle", new THREE.BufferAttribute(data.initAngle, 1));
    geo.setAttribute("aSpeed",     new THREE.BufferAttribute(data.speed,     1));

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime:      { value: 0 },
        uPointSize: { value: 28 },
      },
      transparent:  true,
      depthWrite:   false,
      blending:     THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat };
  }, []);

  // Animate orbital rotation
  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={material} />
  );
}
