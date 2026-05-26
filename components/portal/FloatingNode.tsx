"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { spaceAudio } from "./SpaceAudio";

export interface NodeItem {
  id: string;
  type: "node" | "card";
  x: number;
  y: number;
  artUrl?: string;
  artName?: string;
  ownerName?: string;
  likes: number;
  comments: { id: string; user: string; text: string; replies?: { id: string; user: string; text: string }[] }[];
  isTransforming?: boolean;
}

interface FloatingNodeProps {
  item: NodeItem;
  onTapNode: (item: NodeItem) => void;
  onTapCard: (item: NodeItem) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

export default function FloatingNode({
  item,
  onTapNode,
  onTapCard,
  onUpdatePosition,
}: FloatingNodeProps) {
  const controls = useAnimation();
  const [rotation, setRotation] = useState(0);
  const [isSolving, setIsSolving] = useState(false);
  const [showCard, setShowCard] = useState(item.type === "card");
  
  const nodeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const floatDelay = useRef(Math.random() * 2);
  const floatSpeed = useRef(4 + Math.random() * 2);
  const driftAmount = useRef(8 + Math.random() * 10);
  
  const sparks = useRef<Spark[]>([]);

  // Trigger Transformation block assembly
  useEffect(() => {
    if (item.type === "card" && !showCard) {
      setIsSolving(true);
      let count = 0;
      const interval = setInterval(() => {
        spaceAudio.playClick(350 + count * 60);
        count++;
        if (count > 10) {
          clearInterval(interval);
          setShowCard(true);
          setIsSolving(false);
          spaceAudio.playClick(850); // confirm chime
        }
      }, 95);
    }
  }, [item.type, showCard]);

  // Gentle floating animation
  useEffect(() => {
    controls.start({
      y: [0, driftAmount.current, -driftAmount.current, 0],
      rotate: [rotation, rotation + 4, rotation - 4, rotation],
      transition: {
        duration: floatSpeed.current,
        repeat: Infinity,
        ease: "easeInOut",
        delay: floatDelay.current,
      },
    });
  }, [controls, rotation]);

  // Star Node Particle Spark generator (Drawing Image 2 style particle cloud)
  useEffect(() => {
    if (showCard || isSolving) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;

    const spawnSpark = () => {
      const angle = Math.random() * 2 * Math.PI;
      const speed = Math.random() * 0.7 + 0.2;
      const size = Math.random() * 2 + 0.5;
      
      const colors = [
        "rgba(253, 224, 71, 1)", // Gold
        "rgba(249, 115, 22, 1)", // Orange
        "rgba(255, 255, 255, 1)", // White
        "rgba(254, 240, 138, 1)" // Pale yellow
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];

      return {
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        alpha: 1,
        decay: Math.random() * 0.015 + 0.01
      };
    };

    // Pre-populate sparks
    for (let i = 0; i < 40; i++) {
      const s = spawnSpark();
      // stagger initial spark ages
      s.x += s.vx * 30 * Math.random();
      s.y += s.vy * 30 * Math.random();
      s.alpha = Math.random();
      sparks.current.push(s);
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Update and draw sparkles (Image 2 dust particles)
      sparks.current.forEach((s, idx) => {
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparks.current[idx] = spawnSpark();
        } else {
          ctx.save();
          ctx.globalAlpha = s.alpha;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, 2 * Math.PI);
          ctx.fillStyle = s.color;
          ctx.shadowBlur = 6;
          ctx.shadowColor = s.color;
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw Glowing white core (Solid white circle with glowing aura)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255, 255, 255, 1)";
      ctx.shadowBlur = 18;
      ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
      ctx.fill();
      ctx.restore();

      animFrame = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [showCard, isSolving]);

  const handleDragEnd = (event: any, info: any) => {
    const newX = item.x + info.offset.x;
    const newY = item.y + info.offset.y;
    onUpdatePosition(item.id, newX, newY);
    setRotation((Math.random() - 0.5) * 10);
  };

  return (
    <motion.div
      ref={nodeRef}
      drag
      dragMomentum={true}
      dragTransition={{ bounceStiffness: 100, bounceDamping: 10 }}
      onDragEnd={handleDragEnd}
      style={{ left: item.x, top: item.y }}
      animate={controls}
      className="absolute cursor-grab active:cursor-grabbing select-none"
    >
      {/* 1. UPGRADED STAR NODE CORE (Glow white orb, no text, image 2 particles) */}
      {!showCard && !isSolving && (
        <div
          onClick={() => onTapNode(item)}
          className="relative w-24 h-24 flex items-center justify-center -translate-x-[33%] -translate-y-[33%]"
        >
          <canvas
            ref={canvasRef}
            width={96}
            height={96}
            className="absolute inset-0 pointer-events-none"
          />
        </div>
      )}

      {/* 2. SOLVING MATRIX BLOCKS TRANSFORMATION */}
      {isSolving && (
        <div className="w-[140px] h-[190px] relative grid grid-cols-4 grid-rows-5 gap-1 p-1 bg-black/40 border border-cyan-500/30 rounded-lg overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => {
            const randomDelay = Math.random() * 0.8;
            return (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0, rotateY: 180 }}
                animate={{ scale: 1, opacity: 0.8, rotateY: 0 }}
                transition={{
                  duration: 0.4,
                  delay: randomDelay,
                  ease: "easeOut",
                }}
                className="bg-cyan-500/40 border border-cyan-400/60 rounded-[2px]"
              />
            );
          })}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-mono text-cyan-400 animate-pulse tracking-widest uppercase">
              SOLVING...
            </span>
          </div>
        </div>
      )}

      {/* 3. NFT CARD (Floating Glassmorphism Card) */}
      {showCard && !isSolving && (
        <motion.div
          onClick={() => onTapCard(item)}
          whileHover={{ scale: 1.05, rotateY: 5, rotateX: -5 }}
          className="w-[140px] h-[190px] rounded-xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/20 hover:border-cyan-500/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col p-2.5 transition-all duration-300"
        >
          {/* Glowing highlight */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

          {/* NFT Image */}
          <div className="w-full h-[110px] bg-neutral-900 rounded-lg overflow-hidden relative border border-white/10">
            {item.artUrl ? (
              <img
                src={item.artUrl}
                alt={item.artName}
                className="w-full h-full object-cover pointer-events-none"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-cyan-950/20 text-cyan-400/40 font-mono text-[10px]">
                NO ART
              </div>
            )}
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[8px] text-white/80 font-mono border border-white/5">
              @{item.ownerName || "owner"}
            </div>
          </div>

          {/* Metadata info */}
          <div className="flex-1 flex flex-col justify-end pt-1">
            <h4 className="text-[11px] font-bold text-white tracking-wide truncate">
              {item.artName || "Untitled"}
            </h4>
            <div className="flex items-center justify-between text-[9px] text-white/55 font-mono pt-1 border-t border-white/5">
              <span>❤️ {item.likes}</span>
              <span>💬 {item.comments.length}</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
