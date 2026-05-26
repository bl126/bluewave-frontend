"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { spaceAudio } from "./SpaceAudio";

interface BlockChar {
  id: string;
  char: string;
  gridRow: number;
  gridCol: number;
  type: "text" | "symbol" | "filler";
  // Anim offsets
  scatterX: number;
  scatterY: number;
  scatterRotate: number;
  scatterScale: number;
}

interface PuzzleBoardProps {
  onComplete: () => void;
}

const UI_LAYOUT = [
  "   [ ACCESS GATEWAY ]   ",
  "                        ",
  "UPLINK PORTAL CONTEST   ",
  "ESTABLISH LEDGER IDENTITY",
  "                        ",
];

const GLYPHS = ["Δ", "Ω", "Ψ", "Φ", "▰", "░", "▒", "▓", "★", "✦", "⚡", "⚛"];

export default function PuzzleBoard({ onComplete }: PuzzleBoardProps) {
  const [blocks, setBlocks] = useState<BlockChar[]>([]);
  const [phase, setPhase] = useState<"rain" | "assemble" | "ready" | "unsolving">("rain");
  
  // Consent Checkboxes
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const totalRows = UI_LAYOUT.length;
  const totalCols = 25;

  useEffect(() => {
    // Generate block matrix grid
    const initialBlocks: BlockChar[] = [];
    
    // Fill text characters from layout
    UI_LAYOUT.forEach((row, rIdx) => {
      const padded = row.padEnd(totalCols, " ");
      padded.split("").forEach((char, cIdx) => {
        const isSpace = char === " ";
        const isFiller = isSpace && Math.random() > 0.88;
        const finalChar = isFiller ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : char;

        if (isSpace && !isFiller) return;

        // Scatter calculations
        const scatterX = (Math.random() - 0.5) * window.innerWidth * 1.2;
        const scatterY = -window.innerHeight - Math.random() * 500; // falling from above
        const scatterRotate = (Math.random() - 0.5) * 720;
        const scatterScale = Math.random() * 0.6 + 0.4;

        initialBlocks.push({
          id: `block-${rIdx}-${cIdx}`,
          char: finalChar,
          gridRow: rIdx,
          gridCol: cIdx,
          type: isFiller ? "symbol" : "text",
          scatterX,
          scatterY,
          scatterRotate,
          scatterScale,
        });
      });
    });

    setBlocks(initialBlocks);

    // Audio triggers
    spaceAudio.startBlockRainAudio();

    // 1. Rain duration
    const rainTimeout = setTimeout(() => {
      setPhase("assemble");
    }, 2500);

    return () => {
      clearTimeout(rainTimeout);
    };
  }, []);

  // Handle assembly sounds
  useEffect(() => {
    if (phase === "assemble") {
      let clicksCount = 0;
      const totalClicks = 25;
      const interval = setInterval(() => {
        clicksCount++;
        const pitch = 400 + (clicksCount / totalClicks) * 800; // Pitch slide up
        spaceAudio.playClick(pitch);

        if (clicksCount >= totalClicks) {
          clearInterval(interval);
          setPhase("ready");
          spaceAudio.playClick(1000); // Confirmation chord
          setTimeout(() => spaceAudio.playClick(1200), 80);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [phase]);

  const handleEnterSpace = () => {
    if (!termsAccepted || !privacyAccepted) return;
    setPhase("unsolving");
    spaceAudio.playDisperse();
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden select-none"
    >
      {/* Moving Galaxy background behind matrix puzzle */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,246,255,0.15)_0%,transparent_70%)] animate-pulse" />

      {/* Scattered Blocks Board */}
      <div className="relative w-full h-[320px] flex items-center justify-center mb-6">
        {blocks.map((block) => {
          const cellWidth = 14;
          const cellHeight = 24;
          const targetX = (block.gridCol - totalCols / 2) * cellWidth;
          const targetY = (block.gridRow - totalRows / 2) * cellHeight - 40;

          // Compute unsolving dispersal vector from screen center
          const angle = Math.atan2(targetY, targetX);
          const force = 900 + Math.random() * 400;
          const unsolveX = targetX + Math.cos(angle) * force;
          const unsolveY = targetY + Math.sin(angle) * force;

          let animateState: any = {};
          if (phase === "rain") {
            animateState = {
              x: block.scatterX,
              y: block.scatterY + window.innerHeight * 0.4, // matrix downward float
              rotate: block.scatterRotate,
              scale: block.scatterScale,
              opacity: 0.6,
            };
          } else if (phase === "assemble") {
            animateState = {
              x: targetX,
              y: targetY,
              rotate: 0,
              scale: 1,
              opacity: 1,
            };
          } else if (phase === "ready") {
            animateState = {
              x: targetX,
              y: targetY,
              rotate: 0,
              scale: 1,
              opacity: 1,
            };
          } else if (phase === "unsolving") {
            animateState = {
              x: unsolveX,
              y: unsolveY,
              rotate: (Math.random() - 0.5) * 540,
              scale: 0.2,
              opacity: 0,
            };
          }

          return (
            <motion.div
              key={block.id}
              animate={animateState}
              transition={{
                type: "spring",
                damping: phase === "unsolving" ? 18 : 25,
                stiffness: phase === "unsolving" ? 35 : 45,
                mass: 1.1,
                delay: phase === "unsolving" ? Math.random() * 0.3 : Math.random() * 0.4,
              }}
              className={`absolute flex items-center justify-center font-mono text-xs font-bold ${
                block.type === "symbol"
                  ? "text-cyan-500/50"
                  : block.gridRow === 0
                  ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                  : "text-white/80"
              }`}
              style={{
                width: cellWidth,
                height: cellHeight,
              }}
            >
              {block.char}
            </motion.div>
          );
        })}
      </div>

      {/* Holographic Interactive Terms Form */}
      <AnimatePresence>
        {phase === "ready" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-[340px] p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_15px_40px_rgba(0,0,0,0.5)] flex flex-col gap-4 text-white z-10"
          >
            {/* Holographic header indicator */}
            <div className="flex items-center gap-1.5 self-center">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[9px] font-mono tracking-widest text-cyan-400 uppercase">
                Connection Secured
              </span>
            </div>

            {/* Matrix Form Description */}
            <p className="text-[11px] font-mono text-white/60 leading-relaxed text-center">
              A spatial art hub floating in a weightless void. Upload your NFT concepts or view other dimensions.
            </p>

            <hr className="border-white/10" />

            {/* Checkbox 1: Terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={() => {
                  spaceAudio.playClick(600);
                  setTermsAccepted(!termsAccepted);
                }}
                className="hidden"
              />
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                termsAccepted 
                  ? "bg-cyan-500 border-cyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                  : "border-white/20 group-hover:border-cyan-500/50"
              }`}>
                {termsAccepted && <span className="text-[9px] font-bold">✓</span>}
              </div>
              <span className="text-[11px] font-mono text-white/70 group-hover:text-white transition-colors leading-none pt-0.5">
                I accept the portal contest terms
              </span>
            </label>

            {/* Checkbox 2: Privacy */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={() => {
                  spaceAudio.playClick(600);
                  setPrivacyAccepted(!privacyAccepted);
                }}
                className="hidden"
              />
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                privacyAccepted 
                  ? "bg-cyan-500 border-cyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                  : "border-white/20 group-hover:border-cyan-500/50"
              }`}>
                {privacyAccepted && <span className="text-[9px] font-bold">✓</span>}
              </div>
              <span className="text-[11px] font-mono text-white/70 group-hover:text-white transition-colors leading-none pt-0.5">
                I consent to NFT spatial storage
              </span>
            </label>

            {/* Submit Button */}
            <button
              onClick={handleEnterSpace}
              disabled={!termsAccepted || !privacyAccepted}
              className="w-full mt-2 py-3 rounded-lg bg-cyan-500 text-black font-mono font-bold tracking-[0.25em] text-xs uppercase hover:bg-cyan-400 active:scale-98 transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer shadow-[0_4px_20px_rgba(6,182,212,0.2)] hover:shadow-[0_4px_30px_rgba(6,182,212,0.4)]"
            >
              Enter Space
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
