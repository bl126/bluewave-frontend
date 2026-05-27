"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─────────────────────────────────────────────
 *  Volumetric Nebula Cloud System
 *
 *  Multiple semi-transparent shader planes
 *  with 3D simplex-noise alpha masking.
 *  Each cloud drifts independently for
 *  atmospheric depth.
 * ───────────────────────────────────────────── */

// ──── 3D Simplex Noise (Ashima Arts / Ian McEwan) ────
const NOISE_GLSL = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

// ──── Nebula Vertex Shader ────
const nebulaVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

// ──── Nebula Fragment Shader ────
const nebulaFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3  uColor;
  uniform float uOpacity;
  uniform float uNoiseScale;
  uniform float uDriftSpeed;

  varying vec2 vUv;
  varying vec3 vWorldPos;

  ${NOISE_GLSL}

  void main() {
    // Layered fractal noise (fBm)
    vec3 st = vec3(vUv * uNoiseScale, uTime * uDriftSpeed);

    float n = 0.0;
    n += 0.5  * snoise(st * 1.0);
    n += 0.25 * snoise(st * 2.1 + 3.3);
    n += 0.125* snoise(st * 4.3 + 7.7);
    n = n * 0.5 + 0.5;                       // remap 0-1
    n = smoothstep(0.28, 0.72, n);            // contrast

    // Radial edge fade — elliptical
    vec2 centered = vUv - 0.5;
    float edgeDist = length(centered * vec2(1.0, 1.3));
    float edgeFade = 1.0 - smoothstep(0.25, 0.5, edgeDist);

    float alpha = n * edgeFade * uOpacity;

    // Subtle inner glow toward center
    float coreGlow = exp(-edgeDist * 3.0) * 0.15;
    vec3 finalColor = uColor + coreGlow;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// ──── Cloud Configuration ────
interface CloudConfig {
  position: [number, number, number];
  rotation: [number, number, number];
  scale:    [number, number, number];
  color:    [number, number, number];
  opacity:  number;
  noiseScale: number;
  driftSpeed: number;
}

const CLOUDS: CloudConfig[] = [
  // Large green nebula behind galaxy
  { position: [0, 0, -6],   rotation: [0, 0, 0],           scale: [45, 45, 1], color: [0.05, 0.55, 0.25], opacity: 0.22, noiseScale: 2.8, driftSpeed: 0.012 },
  // Cyan wisps offset left
  { position: [-12, 3, -4], rotation: [0.1, 0.3, 0.2],     scale: [30, 28, 1], color: [0.08, 0.45, 0.5],  opacity: 0.18, noiseScale: 3.2, driftSpeed: 0.018 },
  // Deep green haze right
  { position: [14, -2, -8], rotation: [-0.15, -0.2, 0.1],  scale: [35, 30, 1], color: [0.04, 0.42, 0.18], opacity: 0.16, noiseScale: 2.5, driftSpeed: 0.009 },
  // Foreground subtle mist
  { position: [5, 5, 4],    rotation: [0.3, 0.1, -0.1],    scale: [25, 20, 1], color: [0.06, 0.5, 0.35],  opacity: 0.10, noiseScale: 4.0, driftSpeed: 0.022 },
  // Dark core cloud
  { position: [0, -1, -2],  rotation: [0.05, 0, 0],        scale: [20, 18, 1], color: [0.02, 0.15, 0.08], opacity: 0.28, noiseScale: 3.5, driftSpeed: 0.007 },
];

// ──── Single Nebula Plane ────
function NebulaPlane({ config }: { config: CloudConfig }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   nebulaVert,
    fragmentShader: nebulaFrag,
    uniforms: {
      uTime:       { value: 0 },
      uColor:      { value: new THREE.Color(...config.color) },
      uOpacity:    { value: config.opacity },
      uNoiseScale: { value: config.noiseScale },
      uDriftSpeed: { value: config.driftSpeed },
    },
    transparent: true,
    depthWrite:  false,
    side:        THREE.DoubleSide,
    blending:    THREE.NormalBlending,
  }), [config]);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh
      position={config.position}
      rotation={config.rotation}
      scale={config.scale}
    >
      <planeGeometry args={[1, 1, 1, 1]} />
      <primitive object={material} ref={matRef} attach="material" />
    </mesh>
  );
}

// ──── Exported Component ────
export default function NebulaCloud() {
  return (
    <group>
      {CLOUDS.map((cloud, i) => (
        <NebulaPlane key={i} config={cloud} />
      ))}
    </group>
  );
}
