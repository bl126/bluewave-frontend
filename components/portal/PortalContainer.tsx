"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import PuzzleBoard from "./PuzzleBoard";
import { NodeItem } from "./FloatingNode";
import { spaceAudio } from "./SpaceAudio";
import { X, Heart, MessageSquare, Send, Sparkles, LogOut } from "lucide-react";

// Dynamic import — Three.js must not run during SSR
const GalaxyScene = dynamic(() => import("./GalaxyScene"), { ssr: false });

interface PortalContainerProps {
  onClose: () => void;
}

const PRELOADED_ARTS = [
  { name: "Cosmic Nebula", url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=500" },
  { name: "Digital Dream", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500" },
  { name: "Neon Flux", url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500" },
  { name: "Quantum Rift", url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=500" },
];

interface PortalParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  type: "flame" | "spark" | "ember";
  angle: number;
  radius: number;
  spinSpeed: number;
  wobbleSeed: number;
}

export default function PortalContainer({ onClose }: PortalContainerProps) {
  const [status, setStatus] = useState<"portal-ring" | "blackout" | "puzzle" | "space">("portal-ring");
  // zoom/pan removed — camera is controlled by OrbitControls in the 3D scene
  const [items, setItems] = useState<NodeItem[]>([]);
  
  // Modals / Overlays
  const [selectedNode, setSelectedNode] = useState<NodeItem | null>(null);
  const [selectedCard, setSelectedCard] = useState<NodeItem | null>(null);

  // New Submission Form States
  const [newArtName, setNewArtName] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [selectedArtUrl, setSelectedArtUrl] = useState(PRELOADED_ARTS[0].url);
  const [customArtUrl, setCustomArtUrl] = useState("");

  // Threaded Comments State
  const [commentText, setCommentText] = useState("");
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);

  // Portal Ring Canvas elements
  const ringCanvasRef = useRef<HTMLCanvasElement>(null);
  const ringParticles = useRef<PortalParticle[]>([]);
  const isImploding = useRef(false);

  // 1. Core State Machine: Audio control
  useEffect(() => {
    if (status === "portal-ring") {
      spaceAudio.startPortalRingAudio();
    } else if (status === "space") {
      spaceAudio.startSpaceAudio();
    }
  }, [status]);

  // Transition from blackout to puzzle
  useEffect(() => {
    if (status === "blackout") {
      const timer = setTimeout(() => {
        setStatus("puzzle");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Seed Space elements
  useEffect(() => {
    if (status === "space") {
      const initialNodes: NodeItem[] = [
        { id: "node-1", type: "node", x: 0, y: 0, likes: 14, comments: [] },
        { id: "node-2", type: "node", x: 0, y: 0, likes: 9, comments: [] },
        {
          id: "node-3", 
          type: "node", 
          x: 0, 
          y: 0, 
          likes: 38, 
          comments: [
            { 
              id: "c1", 
              user: "galaxy_operator", 
              text: "The parallax depth in this dimension is mind-blowing!",
              replies: [{ id: "r1", user: "nebula_builder", text: "Agreed, looks extremely realistic." }] 
            }
          ] 
        },
        { id: "node-4", type: "node", x: 0, y: 0, likes: 22, comments: [] },
        { id: "node-5", type: "node", x: 0, y: 0, likes: 5, comments: [] },
      ];
      setItems(initialNodes);
    }
  }, [status]);

  // Portal Ring Animation Frame (Doctor Strange Realistic fire sparks and vortex physics)
  useEffect(() => {
    if (status !== "portal-ring") return;

    const canvas = ringCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let baseRadius = Math.min(canvas.width, canvas.height) * 0.22;
    if (baseRadius < 150) baseRadius = 150; // clamp minimum size

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Particle factory
    const createParticle = (cx: number, cy: number, radiusVal: number, type: "flame" | "spark" | "ember", angleOverride?: number): PortalParticle => {
      const angle = angleOverride !== undefined ? angleOverride : Math.random() * 2 * Math.PI;
      const radius = radiusVal + (Math.random() - 0.5) * 14;

      let x = cx + Math.cos(angle) * radius;
      let y = cy + Math.sin(angle) * radius;

      let vx = 0;
      let vy = 0;
      let size = Math.random() * 2 + 1;
      let alpha = 1.0;
      let decay = Math.random() * 0.012 + 0.01;

      // Color spectrum from hot white center to orange to cool smoky red
      let color = "rgba(249, 115, 22, 1)"; 

      if (type === "flame") {
        const rVal = Math.random();
        if (rVal < 0.12) {
          color = "rgba(255, 255, 255, 0.95)"; // white hot core
        } else if (rVal < 0.42) {
          color = "rgba(253, 224, 71, 0.9)"; // yellow flame
        } else if (rVal < 0.8) {
          color = "rgba(249, 115, 22, 0.85)"; // orange
        } else {
          color = "rgba(239, 68, 68, 0.7)"; // red rim
        }
        size = Math.random() * 4.2 + 1.8;
        decay = Math.random() * 0.02 + 0.015; // fast decay
      } else if (type === "spark") {
        // High tangential velocity with slight outward spread
        const speedMultiplier = isImploding.current ? 12 : 5;
        const radialSpeed = Math.random() * 1.5 + 0.5;
        const tangentialSpeed = speedMultiplier + Math.random() * 4;
        vx = -Math.sin(angle) * tangentialSpeed + Math.cos(angle) * radialSpeed;
        vy = Math.cos(angle) * tangentialSpeed + Math.sin(angle) * radialSpeed;

        color = Math.random() > 0.45 ? "rgba(254, 215, 170, 0.95)" : "rgba(253, 224, 71, 0.95)"; // bright yellow/gold
        size = Math.random() * 1.8 + 0.6;
        decay = Math.random() * 0.025 + 0.018;
      } else if (type === "ember") {
        // Soft float upwards (gravity soot)
        vx = (Math.random() - 0.5) * 1.2;
        vy = -Math.random() * 1.6 - 0.6;
        color = Math.random() > 0.55 ? "rgba(220, 38, 38, 0.65)" : "rgba(115, 115, 115, 0.45)"; // glowing red soot / carbon ash
        size = Math.random() * 2.5 + 0.8;
        decay = Math.random() * 0.008 + 0.005; // lives longer
      }

      return {
        x,
        y,
        vx,
        vy,
        size,
        color,
        alpha,
        decay,
        type,
        angle,
        radius,
        spinSpeed: (0.028 + Math.random() * 0.022), // circular rotation speed
        wobbleSeed: Math.random() * 100
      };
    };

    const drawRing = () => {
      // Clear with trail-fade to draw natural sparks motion-blur and smoky trails
      ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Handle gravity implosion state
      if (isImploding.current) {
        baseRadius = baseRadius * 0.85 - 0.8;
        if (baseRadius <= 3.5) {
          spaceAudio.playDisperse();
          setStatus("blackout");
          return;
        }
      }

      // 1. Draw Volumetric Atmospheric Glow and Refraction Distortion Core
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const radGlow = baseRadius + 45;
      const gradient = ctx.createRadialGradient(cx, cy, baseRadius * 0.6, cx, cy, radGlow);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(0.55, "rgba(220, 38, 38, 0.03)"); // faint hot red haze
      gradient.addColorStop(0.78, "rgba(249, 115, 22, 0.1)");  // orange core
      gradient.addColorStop(0.92, "rgba(253, 224, 71, 0.14)"); // hot yellow rim
      gradient.addColorStop(1.0, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radGlow, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();

      // Soft concentric space warping refraction rings (fluid heat distortion)
      ctx.save();
      ctx.strokeStyle = "rgba(253, 186, 116, 0.035)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius + Math.sin(Date.now() * 0.004) * 8, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();

      // 2. Spawn fresh particles dynamically based on current scale
      const spawnCount = isImploding.current ? 18 : 6;
      for (let i = 0; i < spawnCount; i++) {
        ringParticles.current.push(createParticle(cx, cy, baseRadius, "flame"));
      }

      // Occasional spark ejection and floating ash embers
      if (!isImploding.current) {
        if (Math.random() > 0.45) {
          ringParticles.current.push(createParticle(cx, cy, baseRadius, "spark"));
        }
        if (Math.random() > 0.6) {
          ringParticles.current.push(createParticle(cx, cy, baseRadius, "ember"));
        }
      } else {
        // High density sparks ejecting inside imploding singularity
        for (let i = 0; i < 4; i++) {
          ringParticles.current.push(createParticle(cx, cy, baseRadius, "spark"));
        }
      }

      // 3. Physics update loop and additive render
      ringParticles.current.forEach((p, index) => {
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          ringParticles.current.splice(index, 1);
        } else {
          // Physics step
          if (p.type === "flame") {
            // Rapid orbital spin with gravity pull
            p.angle += p.spinSpeed * (isImploding.current ? 2.5 : 1.0);
            p.radius += (baseRadius - p.radius) * 0.16 + Math.sin(p.angle * 4.5 + p.wobbleSeed) * 2.2;
            p.x = cx + Math.cos(p.angle) * p.radius;
            p.y = cy + Math.sin(p.angle) * p.radius;
          } else if (p.type === "spark") {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96; // drag
            p.vy *= 0.96;
            p.vy += 0.07; // gravitational downward arc
          } else if (p.type === "ember") {
            p.x += Math.sin(p.wobbleSeed + p.y * 0.015) * 0.55; // atmospheric drift
            p.y += p.vy; // float upwards
          }

          // Composite rendering
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.globalCompositeOperation = p.type === "ember" ? "source-over" : "screen"; // Additive blending for hot fire elements
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
          ctx.fillStyle = p.color;

          // Glowing shadow mask
          ctx.shadowBlur = p.type === "flame" ? 14 : p.type === "spark" ? 6 : 0;
          ctx.shadowColor = p.color;

          ctx.fill();
          ctx.restore();
        }
      });

      animFrame = requestAnimationFrame(drawRing);
    };

    drawRing();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [status]);

  const handleEnterPortalClick = () => {
    if (isImploding.current) return;
    isImploding.current = true;
    spaceAudio.playPortalClick();
  };

  const handleUpdatePosition = (id: string, x: number, y: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, x, y } : item))
    );
  };

  const handleSubmitArt = () => {
    if (!newArtName.trim() || !newOwnerName.trim()) return;

    const finalUrl = customArtUrl.trim() || selectedArtUrl;

    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedNode?.id
          ? {
              ...item,
              type: "card",
              artUrl: finalUrl,
              artName: newArtName,
              ownerName: newOwnerName,
            }
          : item
      )
    );

    setSelectedNode(null);
    setNewArtName("");
    setNewOwnerName("");
    setCustomArtUrl("");
  };

  const handleLike = () => {
    if (!selectedCard) return;
    spaceAudio.playClick(650);
    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedCard.id ? { ...item, likes: item.likes + 1 } : item
      )
    );
    setSelectedCard((prev) => (prev ? { ...prev, likes: prev.likes + 1 } : null));
  };

  const handleAddComment = () => {
    if (!selectedCard || !commentText.trim()) return;
    spaceAudio.playClick(500);

    const newEntry = {
      id: `c-${Date.now()}`,
      user: "VoidOperator",
      text: commentText.trim(),
      replies: []
    };

    if (replyingCommentId) {
      // Threaded Reply
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== selectedCard.id) return item;
          const updatedComments = item.comments.map((c) => {
            if (c.id === replyingCommentId) {
              return { ...c, replies: [...(c.replies || []), newEntry] };
            }
            return c;
          });
          return { ...item, comments: updatedComments };
        })
      );

      setSelectedCard((prev) => {
        if (!prev) return null;
        const updatedComments = prev.comments.map((c) => {
          if (c.id === replyingCommentId) {
            return { ...c, replies: [...(c.replies || []), newEntry] };
          }
          return c;
        });
        return { ...prev, comments: updatedComments };
      });
    } else {
      // Normal top-level comment
      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedCard.id
            ? { ...item, comments: [...item.comments, newEntry] }
            : item
        )
      );

      setSelectedCard((prev) =>
        prev ? { ...prev, comments: [...prev.comments, newEntry] } : null
      );
    }

    setCommentText("");
    setReplyingCommentId(null);
  };

  const handleExit = () => {
    spaceAudio.stopAll();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] w-screen h-screen bg-black overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        
        {/* Phase 1: Massive Fire Portal Ring Entry Screen */}
        {status === "portal-ring" && (
          <motion.div
            key="portal-ring-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 w-full h-full flex items-center justify-center bg-black"
          >
            <canvas ref={ringCanvasRef} className="absolute inset-0 pointer-events-none" />
            
            {/* Swirling text/button at center core */}
            <div className="z-10 flex flex-col items-center gap-4 text-center">
              <h2 className="text-cyan-400 font-mono text-[10px] tracking-[0.4em] uppercase animate-pulse">
                Dimensional Portal Uplink
              </h2>
              <button
                onClick={handleEnterPortalClick}
                className="relative px-8 py-3 rounded border border-orange-500 bg-orange-950/20 text-orange-400 font-mono font-bold tracking-[0.3em] text-xs uppercase hover:bg-orange-500 hover:text-black hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_25px_rgba(249,115,22,0.3)] hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] cursor-pointer"
              >
                Enter Portal
              </button>
            </div>
          </motion.div>
        )}

        {/* Phase 2: Fade to Black */}
        {status === "blackout" && (
          <motion.div
            key="blackout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black flex flex-col items-center justify-center"
          >
            <p className="text-neutral-600 font-mono text-[10px] tracking-[0.35em] uppercase animate-pulse">
              Reconstructing matrix rain...
            </p>
          </motion.div>
        )}

        {/* Phase 3: Assembly Puzzle Rain */}
        {status === "puzzle" && (
          <PuzzleBoard
            key="puzzle"
            onComplete={() => setStatus("space")}
          />
        )}

        {/* Phase 4: 3D Galaxy Scene */}
        {status === "space" && (
          <motion.div
            key="space"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 w-full h-full"
          >
            <GalaxyScene
              items={items}
              onNodeClick={setSelectedNode}
              onCardClick={setSelectedCard}
            />

            {/* Static HUD Header controls */}
            <div className="absolute top-6 left-6 z-[101] flex items-center gap-4">
              <button
                onClick={handleExit}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/40 bg-red-950/20 text-red-400 backdrop-blur-md text-xs font-mono tracking-widest hover:bg-red-500 hover:text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse"
              >
                <LogOut size={14} />
                EXIT SPACE
              </button>
            </div>

            {/* Modal: Submission Overlay */}
            <AnimatePresence>
              {selectedNode && (
                <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-[360px] rounded-2xl bg-neutral-950 border border-cyan-500/30 p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] text-white overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2 text-cyan-400">
                        <Sparkles size={16} />
                        <h3 className="font-mono text-sm tracking-wider uppercase font-bold">
                          Register Art NFT
                        </h3>
                      </div>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="p-1 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 tracking-wider uppercase mb-1">
                          Art Title
                        </label>
                        <input
                          type="text"
                          value={newArtName}
                          onChange={(e) => setNewArtName(e.target.value)}
                          placeholder="e.g. Hyperstellar Wave"
                          className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 tracking-wider uppercase mb-1">
                          Owner Username
                        </label>
                        <input
                          type="text"
                          value={newOwnerName}
                          onChange={(e) => setNewOwnerName(e.target.value)}
                          placeholder="e.g. quantum_explorer"
                          className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 tracking-wider uppercase mb-1.5">
                          Select Art Style
                        </label>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          {PRELOADED_ARTS.map((art) => (
                            <button
                              key={art.name}
                              type="button"
                              onClick={() => {
                                setSelectedArtUrl(art.url);
                                setCustomArtUrl("");
                              }}
                              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all relative ${
                                selectedArtUrl === art.url && !customArtUrl
                                  ? "border-cyan-400 scale-95"
                                  : "border-transparent opacity-60 hover:opacity-100"
                              }`}
                            >
                              <img src={art.url} alt={art.name} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={customArtUrl}
                          onChange={(e) => setCustomArtUrl(e.target.value)}
                          placeholder="Or paste custom image URL..."
                          className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>

                      <button
                        onClick={handleSubmitArt}
                        disabled={!newArtName.trim() || !newOwnerName.trim()}
                        className="w-full mt-2 py-2.5 rounded-lg bg-cyan-500 text-black text-xs font-bold font-mono tracking-widest uppercase hover:bg-cyan-400 active:scale-98 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        Launch Card
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Modal: Card Details & Threaded Comments */}
            <AnimatePresence>
              {selectedCard && (
                <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 50 }}
                    className="relative w-full max-w-[420px] rounded-3xl bg-neutral-950 border border-white/10 overflow-hidden text-white shadow-[0_15px_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh]"
                  >
                    <button
                      onClick={() => {
                        setSelectedCard(null);
                        setReplyingCommentId(null);
                      }}
                      className="absolute top-4 right-4 z-[10] p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>

                    {/* Artwork Preview Frame */}
                    <div className="w-full aspect-square relative bg-neutral-900 border-b border-white/10">
                      <img
                        src={selectedCard.artUrl}
                        alt={selectedCard.artName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                      
                      <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase mb-1">
                            Art Owner
                          </p>
                          <h4 className="text-lg font-bold truncate">
                            {selectedCard.artName}
                          </h4>
                          <p className="text-xs text-white/70 font-mono">
                            @{selectedCard.ownerName}
                          </p>
                        </div>

                        <button
                          onClick={handleLike}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                          <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" />
                          <span className="text-xs font-mono font-bold">
                            {selectedCard.likes}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Comments & Replies list */}
                    <div className="flex-1 flex flex-col p-5 overflow-hidden">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare size={14} className="text-neutral-400" />
                        <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">
                          Comments ({selectedCard.comments.length})
                        </span>
                      </div>

                      {/* Comments Scrollable feed */}
                      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 max-h-[160px] custom-scrollbar">
                        {selectedCard.comments.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs text-neutral-500 font-mono">
                            No comments yet. Write something below!
                          </div>
                        ) : (
                          selectedCard.comments.map((comment) => (
                            <div key={comment.id} className="space-y-2">
                              {/* Top-Level Comment */}
                              <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-3 text-xs">
                                <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400/80 mb-1">
                                  <span>@{comment.user}</span>
                                  <button
                                    onClick={() => setReplyingCommentId(comment.id)}
                                    className="text-[9px] text-white/40 hover:text-white transition-colors cursor-pointer uppercase tracking-wider"
                                  >
                                    Reply
                                  </button>
                                </div>
                                <p className="text-white/80 leading-relaxed">
                                  {comment.text}
                                </p>
                              </div>

                              {/* Indented Replies Thread */}
                              {comment.replies && comment.replies.map((reply) => (
                                <div
                                  key={reply.id}
                                  className="ml-6 bg-neutral-950/70 border-l-2 border-cyan-500/30 rounded-r-xl p-2.5 text-[11px]"
                                >
                                  <div className="text-[9px] font-mono text-cyan-500/80 mb-0.5">
                                    @{reply.user}
                                  </div>
                                  <p className="text-white/70 leading-relaxed">
                                    {reply.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Comment / Reply Input */}
                      <div className="flex flex-col gap-1">
                        {replyingCommentId && (
                          <div className="flex items-center justify-between px-2 text-[9px] font-mono text-cyan-400">
                            <span>Replying to comment...</span>
                            <button
                              onClick={() => setReplyingCommentId(null)}
                              className="text-red-400 hover:text-red-300 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder={replyingCommentId ? "Type reply..." : "Type comment..."}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddComment();
                            }}
                            className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                          />
                          <button
                            onClick={handleAddComment}
                            className="p-2 rounded-xl bg-cyan-500 text-black hover:bg-cyan-400 active:scale-95 transition-all cursor-pointer"
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
