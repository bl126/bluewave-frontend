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
  comments: { id: string; user: string; text: string }[];
  isTransforming?: boolean;
}

interface FloatingNodeProps {
  item: NodeItem;
  onTapNode: (item: NodeItem) => void;
  onTapCard: (item: NodeItem) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
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

  // Generate random static values for float variation
  const floatDelay = useRef(Math.random() * 2);
  const floatSpeed = useRef(3 + Math.random() * 2);
  const driftAmount = useRef(10 + Math.random() * 15);

  // Trigger transformation animation if item's type changes to 'card' and it is not already showing card
  useEffect(() => {
    if (item.type === "card" && !showCard) {
      setIsSolving(true);
      // Play puzzle assembly clicks
      let count = 0;
      const interval = setInterval(() => {
        spaceAudio.playClick(400 + count * 50);
        count++;
        if (count > 10) {
          clearInterval(interval);
          setShowCard(true);
          setIsSolving(false);
          spaceAudio.playClick(800); // final snap sound
        }
      }, 100);
    }
  }, [item.type, showCard]);

  // Gentle float effect in space
  useEffect(() => {
    controls.start({
      y: [0, driftAmount.current, -driftAmount.current, 0],
      rotate: [rotation, rotation + 5, rotation - 5, rotation],
      transition: {
        duration: floatSpeed.current,
        repeat: Infinity,
        ease: "easeInOut",
        delay: floatDelay.current,
      },
    });
  }, [controls, rotation]);

  const handleDragEnd = (event: any, info: any) => {
    // Save new coordinates after dragging
    const offsetWidth = nodeRef.current?.offsetWidth || 0;
    const offsetHeight = nodeRef.current?.offsetHeight || 0;
    
    // We compute positions relative to the infinite canvas coordinate space
    const newX = item.x + info.offset.x;
    const newY = item.y + info.offset.y;
    onUpdatePosition(item.id, newX, newY);
    
    // Randomize a small new angle for post-drag drift
    setRotation((Math.random() - 0.5) * 15);
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
      {/* 1. STAR NODE LAYER */}
      {!showCard && !isSolving && (
        <motion.div
          onClick={() => onTapNode(item)}
          whileHover={{ scale: 1.2 }}
          className="relative w-16 h-16 flex items-center justify-center rounded-full bg-blue-950/20 border border-blue-400/40 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-300"
        >
          {/* Pulsing Star Core */}
          <div className="w-6 h-6 rounded-full bg-cyan-400 blur-[2px] animate-pulse" />
          {/* Orbital Ring */}
          <div className="absolute inset-[-4px] rounded-full border border-dashed border-cyan-400/30 animate-[spin_10s_linear_infinite]" />
          <div className="absolute inset-[-8px] rounded-full border border-blue-500/10 animate-[spin_15s_linear_infinite_reverse]" />
          
          <span className="absolute text-[8px] font-mono tracking-widest text-cyan-300 pointer-events-none uppercase">
            STAR
          </span>
        </motion.div>
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

      {/* 3. COMPLETED NFT CARD */}
      {showCard && !isSolving && (
        <motion.div
          onClick={() => onTapCard(item)}
          whileHover={{ scale: 1.05, rotateY: 5, rotateX: -5 }}
          className="w-[140px] h-[190px] rounded-xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/20 hover:border-cyan-500/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col p-2.5 transition-all duration-300"
        >
          {/* Glassmorphic border glow highlights */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

          {/* NFT Image Preview */}
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
            {/* Owner Label */}
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[8px] text-white/80 font-mono border border-white/5">
              @{item.ownerName || "owner"}
            </div>
          </div>

          {/* Name & Stats */}
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
