"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { spaceAudio } from "./SpaceAudio";

interface PuzzleBlock {
  id: string;
  sx: number; // slice source x
  sy: number; // slice source y
  tx: number; // target x (destination)
  ty: number; // target y (destination)
  x: number;  // current x
  y: number;  // current y
  vx: number; // velocity x
  vy: number; // velocity y
  rotation: number; // current angle
  spin: number;     // spin speed
  scale: number;
  alpha: number;
  state: "falling" | "piled" | "assembling" | "solved";
  delay: number;
}

interface PuzzleBoardProps {
  onComplete: () => void;
}

export default function PuzzleBoard({ onComplete }: PuzzleBoardProps) {
  const [phase, setPhase] = useState<"rain" | "assemble" | "ready" | "unsolving">("rain");
  
  // Consent Checkboxes
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const blocksRef = useRef<PuzzleBlock[]>([]);
  const isMusicStarted = useRef(false);

  const ROWS = 20;
  const COLS = 28;

  useEffect(() => {
    // 1. Play soft rebuilding audio
    spaceAudio.startBlockRainAudio();

    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const blockWidth = width / COLS;
    const blockHeight = height / ROWS;

    // 2. Generate offscreen canvas with target final UI layout
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const oCtx = offscreen.getContext("2d");
    if (oCtx) {
      // Draw spatial deep space backdrop
      const spaceGrad = oCtx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width * 0.7);
      spaceGrad.addColorStop(0, "#031c24"); // deep teal core
      spaceGrad.addColorStop(0.55, "#01080e"); // dark atmospheric blue
      spaceGrad.addColorStop(1, "#000103");   // space black
      oCtx.fillStyle = spaceGrad;
      oCtx.fillRect(0, 0, width, height);

      // Draw faint stars
      oCtx.fillStyle = "rgba(255, 255, 255, 0.4)";
      for (let i = 0; i < 150; i++) {
        oCtx.beginPath();
        oCtx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.2 + 0.3, 0, 2 * Math.PI);
        oCtx.fill();
      }

      // Draw soft volumetric cyan nebula clouds
      const nebGrad = oCtx.createRadialGradient(width / 2, height * 0.4, 20, width / 2, height * 0.4, 280);
      nebGrad.addColorStop(0, "rgba(6, 182, 212, 0.08)"); // glowing cyan
      nebGrad.addColorStop(0.6, "rgba(8, 145, 178, 0.03)"); // soft teal rim
      nebGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      oCtx.fillStyle = nebGrad;
      oCtx.beginPath();
      oCtx.arc(width / 2, height * 0.4, 280, 0, 2 * Math.PI);
      oCtx.fill();

      // Draw Glowing Holographic Glass Panel
      const panelW = 340;
      const panelH = 300;
      const px = (width - panelW) / 2;
      const py = (height - panelH) / 2;

      oCtx.save();
      // Curved corners roundrect
      oCtx.beginPath();
      oCtx.roundRect(px, py, panelW, panelH, 20);
      oCtx.fillStyle = "rgba(255, 255, 255, 0.02)"; // ultra transparent glass
      oCtx.fill();

      // Shiny holographic border
      const borderGrad = oCtx.createLinearGradient(px, py, px + panelW, py + panelH);
      borderGrad.addColorStop(0, "rgba(255, 255, 255, 0.2)");
      borderGrad.addColorStop(0.5, "rgba(6, 182, 212, 0.08)");
      borderGrad.addColorStop(1, "rgba(255, 255, 255, 0.05)");
      oCtx.strokeStyle = borderGrad;
      oCtx.lineWidth = 1.5;
      oCtx.stroke();
      oCtx.restore();

      // Draw Mock Text (representing final UI assembled)
      oCtx.save();
      oCtx.textAlign = "center";
      oCtx.fillStyle = "#ffffff";
      
      // Header
      oCtx.font = "bold 10px monospace";
      oCtx.fillStyle = "rgba(6, 182, 212, 0.85)"; // glowing cyan
      oCtx.fillText("▲ CONNECTION SECURED", width / 2, py + 38);

      // Title
      oCtx.font = "bold 15px sans-serif";
      oCtx.fillStyle = "#ffffff";
      oCtx.fillText("UPLINK PORTAL CONTEST", width / 2, py + 72);
      
      // Divider line
      oCtx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      oCtx.beginPath();
      oCtx.moveTo(px + 40, py + 92);
      oCtx.lineTo(px + panelW - 40, py + 92);
      oCtx.stroke();

      // Description Text
      oCtx.font = "11px monospace";
      oCtx.fillStyle = "rgba(255, 255, 255, 0.6)";
      oCtx.fillText("A spatial art hub floating in a weightless void.", width / 2, py + 122);
      oCtx.fillText("Upload your NFT concepts or view other dimensions.", width / 2, py + 140);

      // Checkboxes Mocks
      oCtx.textAlign = "left";
      oCtx.font = "11px monospace";
      oCtx.fillStyle = "rgba(255, 255, 255, 0.7)";
      
      // Mock Checkbox 1
      oCtx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      oCtx.strokeRect(px + 30, py + 172, 12, 12);
      oCtx.fillText("I accept the portal contest terms", px + 52, py + 182);

      // Mock Checkbox 2
      oCtx.strokeRect(px + 30, py + 202, 12, 12);
      oCtx.fillText("I consent to NFT spatial storage", px + 52, py + 212);

      // Mock Enter Space Button
      oCtx.save();
      oCtx.beginPath();
      oCtx.roundRect(px + 30, py + 236, panelW - 60, 38, 8);
      oCtx.fillStyle = "rgba(6, 182, 212, 0.1)";
      oCtx.fill();
      oCtx.strokeStyle = "rgba(6, 182, 212, 0.3)";
      oCtx.stroke();
      
      oCtx.textAlign = "center";
      oCtx.fillStyle = "rgba(6, 182, 212, 0.5)"; // dimmed initially
      oCtx.font = "bold 11px monospace";
      oCtx.fillText("ENTER SPACE", width / 2, py + 258);
      oCtx.restore();
    }
    offscreenCanvasRef.current = offscreen;

    // 3. Generate individual glass block fragments
    const initialBlocks: PuzzleBlock[] = [];
    
    // Column pile Y trackers to enable realistic fragments accumulation
    const columnPileY = new Array(COLS).fill(height);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const sx = c * blockWidth;
        const sy = r * blockHeight;
        const tx = sx + blockWidth / 2;
        const ty = sy + blockHeight / 2;

        // Falling starting coordinates (scattered, falling from far above)
        const x = sx + (Math.random() - 0.5) * 60;
        const y = -Math.random() * 1200 - 150; // delayed heights
        
        // Random rotational tumbles
        const rotation = (Math.random() - 0.5) * Math.PI * 4;
        const spin = (Math.random() - 0.5) * 0.08;

        initialBlocks.push({
          id: `block-${r}-${c}`,
          sx,
          sy,
          tx,
          ty,
          x,
          y,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * 3 + 4.5, // fast falling rain streams
          rotation,
          spin,
          scale: Math.random() * 0.2 + 0.9, // slight size variance
          alpha: 1.0,
          state: "falling",
          delay: Math.random() * 120 // random offsets
        });
      }
    }

    blocksRef.current = initialBlocks;

    // 4. Matrix rain loop and spring assembly solver
    const update = () => {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      let allPiled = true;
      let allAssembled = true;

      blocksRef.current.forEach((p) => {
        // ---- PHASE 1: Dense Crystalline Rain & Pile accumulation ----
        if (phase === "rain") {
          allAssembled = false;
          
          if (p.state === "falling") {
            p.y += p.vy;
            p.x += p.vx;
            p.rotation += p.spin;

            // Crystalline drip sound triggers
            if (Math.random() > 0.998) {
              spaceAudio.playMatrixClick();
            }

            // Target column
            const col = Math.floor(p.tx / blockWidth);
            const pileY = columnPileY[col];

            // Pile collision check
            if (p.y >= pileY - blockHeight / 2) {
              p.y = pileY - blockHeight / 2;
              p.vx = 0;
              p.vy = 0;
              p.spin = 0;
              p.state = "piled";
              
              // Pile height grows up
              columnPileY[col] -= blockHeight * 0.82; // slightly compact blocks

              // Soft crystalline chime on impact
              if (Math.random() > 0.92) {
                spaceAudio.playClick(2400 + Math.random() * 600);
              }
            } else {
              allPiled = false;
            }
          }
        }
        // ---- PHASE 2: Spring-ease Reconstruction ----
        else if (phase === "assemble" || phase === "ready" || phase === "unsolving") {
          p.state = "assembling";
          
          // Interpolate current positions to target slots with smooth spring forces
          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          
          p.x += dx * 0.045;
          p.y += dy * 0.045;
          p.rotation += (0 - p.rotation) * 0.045;
          p.scale += (1.0 - p.scale) * 0.045;

          // Sound cues when rows snap back into place
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 1.2) {
            allAssembled = false;
          } else {
            p.x = p.tx;
            p.y = p.ty;
            p.rotation = 0;
            p.scale = 1.0;
            p.state = "solved";
          }
        }

        // Dissolution / Dispersal transition on complete
        if (phase === "unsolving") {
          const dx = p.tx - width / 2;
          const dy = p.ty - height / 2;
          const angle = Math.atan2(dy, dx);
          const speed = 16 + Math.random() * 12;
          p.x += Math.cos(angle) * speed;
          p.y += Math.sin(angle) * speed;
          p.rotation += (Math.random() - 0.5) * 0.25;
          p.alpha = Math.max(0, p.alpha - 0.035);
        }

        // ---- RENDER BLOCK ----
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;

        const w = blockWidth * p.scale;
        const h = blockHeight * p.scale;

        // Draw image fragment from offscreen canvas mockup
        if (offscreenCanvasRef.current) {
          ctx.drawImage(
            offscreenCanvasRef.current,
            p.sx, p.sy, blockWidth, blockHeight,
            -w / 2, -h / 2, w, h
          );
        }

        // 3D Glass Reflection / border lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.strokeRect(-w / 2, -h / 2, w, h);

        // Highlight glint across glass shards
        const glintGrad = ctx.createLinearGradient(-w, -h, w, h);
        glintGrad.addColorStop(0, "rgba(255, 255, 255, 0.0)");
        glintGrad.addColorStop(0.48, "rgba(255, 255, 255, 0.0)");
        glintGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.08)"); // Diagonal light reflection
        glintGrad.addColorStop(0.52, "rgba(255, 255, 255, 0.0)");
        glintGrad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
        ctx.fillStyle = glintGrad;
        ctx.fillRect(-w / 2, -h / 2, w, h);

        ctx.restore();
      });

      // State machine logic switches
      if (phase === "rain" && allPiled) {
        // When container is completely filled, slow down and reconstruct
        setTimeout(() => {
          setPhase("assemble");
          // Play row snap chimes sequentially
          let rowIdx = 0;
          const snapInterval = setInterval(() => {
            const pitch = 300 + (rowIdx / ROWS) * 700;
            spaceAudio.playClick(pitch);
            rowIdx++;
            if (rowIdx >= ROWS) clearInterval(snapInterval);
          }, 110);
        }, 1500);
      }

      if (phase === "assemble" && allAssembled) {
        setPhase("ready");
        spaceAudio.playClick(1000); // deep resolved chord chime
      }

      animFrame = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [phase]);

  const handleEnterSpace = () => {
    if (!termsAccepted || !privacyAccepted) return;
    setPhase("unsolving");
    spaceAudio.playDisperse();
    setTimeout(() => {
      onComplete();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden select-none">
      
      {/* Display Canvas where fragments animate */}
      <canvas ref={displayCanvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Holographic Interactive Terms overlay fades in once solved */}
      <AnimatePresence>
        {phase === "ready" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.8 } }}
            className="w-full max-w-[340px] p-6 rounded-2xl bg-white/[0.015] border border-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_15px_40px_rgba(0,0,0,0.6)] flex flex-col gap-4 text-white z-10"
          >
            {/* Connection secure indicator */}
            <div className="flex items-center gap-1.5 self-center">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[9px] font-mono tracking-widest text-cyan-400 uppercase">
                Connection Secured
              </span>
            </div>

            {/* Real Interactive inputs mapping the mock drawing */}
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
                  spaceAudio.playClick(900);
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
                  spaceAudio.playClick(900);
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
