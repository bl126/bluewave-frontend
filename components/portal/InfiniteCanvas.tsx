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

export default function InfiniteCanvas({
  children,
  zoom,
  setZoom,
  pan,
  setPan,
}: InfiniteCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const startPan = useRef({ x: 0, y: 0 });

  // Handle zooming with mouse wheel
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
      // Play soft whoosh zoom feedback
      spaceAudio.playWhoosh();
      setZoom(newZoom);
    }
  };

  // Start canvas panning
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only pan if clicking the empty background (not a node/card)
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains("space-bg")) {
      setIsPanning(true);
      startPan.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      containerRef.current?.setPointerCapture(e.pointerId);
    }
  };

  // Track panning
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPan.current.x,
      y: e.clientY - startPan.current.y,
    });
  };

  // End panning
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
      {/* Immersive Star Background layer */}
      <div
        className="space-bg absolute inset-[-1000px] pointer-events-none opacity-40 bg-repeat"
        style={{
          backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Cg fill=%22%23FFF%22 fill-opacity=%220.3%22%3E%3Ccircle cx=%225%22 cy=%225%22 r=%221%22/%3E%3Ccircle cx=%2245%22 cy=%2225%22 r=%220.8%22/%3E%3Ccircle cx=%2265%22 cy=%2255%22 r=%221.2%22/%3E%3Ccircle cx=%2225%22 cy=%2265%22 r=%220.5%22/%3E%3C/g%3E%3C/svg%3E')",
          transform: `translate(${pan.x * 0.15}px, ${pan.y * 0.15}px)`,
          transition: "transform 0.1s ease-out",
        }}
      />

      {/* Nebula parallax back layer */}
      <div
        className="space-bg absolute inset-0 pointer-events-none opacity-30 blur-[60px]"
        style={{
          background: "radial-gradient(circle at 30% 40%, rgba(59, 130, 246, 0.15) 0%, transparent 60%), radial-gradient(circle at 70% 60%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)",
          transform: `translate(${pan.x * 0.05}px, ${pan.y * 0.05}px)`,
        }}
      />

      {/* The Floating Canvas (Transformed Viewport) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: isPanning ? "none" : "transform 0.15s ease-out",
        }}
      >
        {/* Pointer events enabled on children to allow dragging/clicks */}
        <div className="absolute inset-0 pointer-events-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
