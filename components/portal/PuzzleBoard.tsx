"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { spaceAudio } from "./SpaceAudio";

interface Block {
  id: string;
  char: string;
  targetRow: number;
  targetCol: number;
  // Scattered positions
  scatterX: number;
  scatterY: number;
  scatterRotate: number;
  scatterScale: number;
}

interface PuzzleBoardProps {
  onComplete: () => void;
}

const MESSAGE_ROWS = [
  "   P O R T A L   ",
  "D I M E N S I O N",
  "  A R T  C O N T E S T  ",
];

export default function PuzzleBoard({ onComplete }: PuzzleBoardProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isAssembled, setIsAssembled] = useState(false);
  const [isDispersing, setIsDispersing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize the blocks
  useEffect(() => {
    const newBlocks: Block[] = [];
    MESSAGE_ROWS.forEach((row, rowIndex) => {
      const chars = row.split("");
      chars.forEach((char, colIndex) => {
        // Skip whitespace to make it look cleaner, or render empty boxes
        if (char === " ") return;

        // Random scattered initial offsets
        const scatterX = (Math.random() - 0.5) * window.innerWidth * 0.9;
        const scatterY = (Math.random() - 0.5) * window.innerHeight * 0.9;
        const scatterRotate = (Math.random() - 0.5) * 360;
        const scatterScale = Math.random() * 0.8 + 0.2;

        newBlocks.push({
          id: `block-${rowIndex}-${colIndex}`,
          char,
          targetRow: rowIndex,
          targetCol: colIndex,
          scatterX,
          scatterY,
          scatterRotate,
          scatterScale,
        });
      });
    });

    setBlocks(newBlocks);

    // Staggered assembly
    const assemblyDuration = 3000;
    const startTime = Date.now();

    // Start playing hum sound immediately
    spaceAudio.playHum();

    // Play periodic data click sound during assembly
    const clickInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= assemblyDuration) {
        clearInterval(clickInterval);
        setIsAssembled(true);
        // Play final confirmation chime
        spaceAudio.playClick(600);
        setTimeout(() => spaceAudio.playClick(800), 100);
      } else {
        // Play click with frequency shifting upwards
        const ratio = elapsed / assemblyDuration;
        const pitch = 300 + ratio * 900; // 300Hz to 1200Hz
        spaceAudio.playClick(pitch);
      }
    }, 60);

    return () => {
      clearInterval(clickInterval);
    };
  }, []);

  const handleStart = () => {
    setIsDispersing(true);
    spaceAudio.playDisperse();
    // After dispersion completes, notify container
    setTimeout(() => {
      onComplete();
    }, 1200);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden select-none"
    >
      {/* Scattered Blocks Board */}
      <div className="relative w-full h-[300px] flex items-center justify-center">
        {blocks.map((block) => {
          // Calculate grid positioning relative to screen center
          const cellWidth = 26;
          const cellHeight = 36;
          const totalCols = 24;
          const totalRows = MESSAGE_ROWS.length;

          const targetX = (block.targetCol - totalCols / 2) * cellWidth;
          const targetY = (block.targetRow - totalRows / 2) * cellHeight;

          return (
            <motion.div
              key={block.id}
              initial={{
                x: block.scatterX,
                y: block.scatterY,
                rotate: block.scatterRotate,
                scale: block.scatterScale,
                opacity: 0,
              }}
              animate={
                isDispersing
                  ? {
                      // Disperse from center
                      x: targetX * 10 + (Math.random() - 0.5) * 500,
                      y: targetY * 10 + (Math.random() - 0.5) * 500,
                      rotate: (Math.random() - 0.5) * 720,
                      scale: 0.1,
                      opacity: 0,
                    }
                  : {
                      x: targetX,
                      y: targetY,
                      rotate: 0,
                      scale: 1,
                      opacity: 1,
                    }
              }
              transition={{
                type: "spring",
                damping: isDispersing ? 18 : 22,
                stiffness: isDispersing ? 40 : 50,
                mass: 1.2,
                delay: isDispersing ? 0 : Math.random() * 0.5,
              }}
              className="absolute w-6 h-8 flex items-center justify-center border border-emerald-500/30 bg-emerald-950/15 rounded text-emerald-400 font-mono text-lg font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            >
              {block.char}
            </motion.div>
          );
        })}
      </div>

      {/* Assemble Button Overlay */}
      <AnimatePresence>
        {isAssembled && !isDispersing && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-[20%] flex flex-col items-center gap-4"
          >
            <p className="text-emerald-500/60 font-mono text-xs tracking-[0.2em] uppercase animate-pulse">
              Dimensional Alignment Confirmed
            </p>
            <button
              onClick={handleStart}
              className="relative px-8 py-3 rounded border border-emerald-500 bg-emerald-950/30 text-emerald-400 font-mono font-bold tracking-[0.35em] text-sm uppercase transition-all duration-300 hover:bg-emerald-400 hover:text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] cursor-pointer"
            >
              Open Portal
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
