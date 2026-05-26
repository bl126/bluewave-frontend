"use client";

import React, { useRef, useState, useEffect } from "react";
import { spaceAudio } from "./SpaceAudio";

interface InfiniteCanvasProps {
  children: React.ReactNode;
  zoom: number;
  setZoom: (zoom: number) => void;
  pan: { x: number; y: number };
  setPan: (pan: { x: number; y: number }) => void;
}

interface StarParticle {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  color: string;
}

export default function InfiniteCanvas({
  children,
  zoom,
  setZoom,
  pan,
  setPan,
}: InfiniteCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const startPan = useRef({ x: 0, y: 0 });

  // Galaxy vortex particles state
  const particles = useRef<StarParticle[]>([]);

  // Initialize galaxy particles (spiral arms matching reference image 1)
  useEffect(() => {
    const temp: StarParticle[] = [];
    const count = 800; // dense vortex
    const arms = 3;

    for (let i = 0; i < count; i++) {
      const armIndex = i % arms;
      const angleOffset = (armIndex * 2 * Math.PI) / arms;
      const radius = Math.random() * 350 + 10;
      // Spiral arm math: angle increases as radius increases
      const angle = angleOffset + (radius * 0.015) + (Math.random() - 0.5) * 0.4;
      const speed = 0.0005 + (1 / radius) * 0.08; // inner parts rotate faster
      const size = Math.random() * 1.5 + 0.5;

      // Golden, orange, white color palettes
      const colorRand = Math.random();
      let color = "rgba(253, 224, 71, 0.8)"; // Golden yellow
      if (colorRand > 0.7) {
        color = "rgba(249, 115, 22, 0.7)"; // Orange
      } else if (colorRand > 0.9) {
        color = "rgba(255, 255, 255, 0.9)"; // White star
      }

      temp.push({ angle, radius, speed, size, color });
    }
    particles.current = temp;
  }, []);

  // Draw loop for the galaxy vortex background
  useEffect(() => {
    let animFrame: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw distant starry grid background
      ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Rotating Galaxy Vortex (Image 1 style)
      ctx.save();
      // Apply subtle parallax pan offset to background galaxy
      ctx.translate(centerX + pan.x * 0.1, centerY + pan.y * 0.1);
      ctx.scale(zoom * 0.85 + 0.15, zoom * 0.85 + 0.15);

      particles.current.forEach((p) => {
        // Rotate particle angle
        p.angle += p.speed;
        
        // Polar coordinates
        const x = Math.cos(p.angle) * p.radius;
        const y = Math.sin(p.angle) * p.radius * 0.6; // slightly squashed for 3D depth tilt

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, 2 * Math.PI);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.fill();
      });
      ctx.restore();

      animFrame = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [pan, zoom]);

  // Handle Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newZoom = zoom;

    if (e.deltaY < 0) {
      newZoom = Math.min(newZoom * zoomFactor, 3);
    } else {
      newZoom = Math.max(newZoom / zoomFactor, 0.3);
    }

    if (newZoom !== zoom) {
      spaceAudio.playWhoosh();
      setZoom(newZoom);
    }
  };

  // Drag Panning
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains("space-bg-overlay")) {
      setIsPanning(true);
      startPan.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      containerRef.current?.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPan.current.x,
      y: e.clientY - startPan.current.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      containerRef.current?.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative w-screen h-screen overflow-hidden select-none bg-black cursor-grab active:cursor-grabbing"
    >
      {/* Background Canvas: Galaxy Vortex */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Parallax Nebula Clouds (Green/Cyan) - Moving independently and detached from direct camera pan */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
        {/* Deep Green Nebula Cloud 1 */}
        <div
          className="absolute w-[80vw] h-[80vw] rounded-full bg-emerald-800/10 blur-[130px] animate-[pulse_10s_infinite_alternate]"
          style={{
            top: "10%",
            left: "15%",
            // Cloud moves independently with very light parallax pan
            transform: `translate(${pan.x * 0.04}px, ${pan.y * 0.04}px)`,
          }}
        />
        {/* Deep Cyan Nebula Cloud 2 */}
        <div
          className="absolute w-[60vw] h-[60vw] rounded-full bg-cyan-900/10 blur-[150px] animate-[pulse_15s_infinite_alternate]"
          style={{
            bottom: "10%",
            right: "15%",
            transform: `translate(${pan.x * 0.06}px, ${pan.y * 0.06}px)`,
          }}
        />
      </div>

      {/* Transparent Click Interceptor to handle background pans */}
      <div className="space-bg-overlay absolute inset-0 z-[2] pointer-events-auto" />

      {/* Main Interactive Floating Viewport */}
      <div
        className="absolute inset-0 z-[3] pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: isPanning ? "none" : "transform 0.15s ease-out",
        }}
      >
        <div className="absolute inset-0 pointer-events-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
