"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PuzzleBoard from "./PuzzleBoard";
import InfiniteCanvas from "./InfiniteCanvas";
import FloatingNode, { NodeItem } from "./FloatingNode";
import { spaceAudio } from "./SpaceAudio";
import { X, Heart, MessageSquare, Send, Sparkles, LogOut, ZoomIn, ZoomOut } from "lucide-react";

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
}

export default function PortalContainer({ onClose }: PortalContainerProps) {
  const [status, setStatus] = useState<"portal-ring" | "blackout" | "puzzle" | "space">("portal-ring");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
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
        { id: "node-1", type: "node", x: -250, y: -160, likes: 14, comments: [] },
        { id: "node-2", type: "node", x: 280, y: -200, likes: 9, comments: [] },
        {
          id: "node-3", 
          type: "node", 
          x: -320, 
          y: 200, 
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
        { id: "node-4", type: "node", x: 240, y: 170, likes: 22, comments: [] },
        { id: "node-5", type: "node", x: 0, y: -340, likes: 5, comments: [] },
      ];
      setItems(initialNodes);
      setPan({ x: window.innerWidth / 2 - 50, y: window.innerHeight / 2 - 50 });
    }
  }, [status]);

  // Portal Ring Animation Frame (Step 1 Doctor Strange Realistic fire sparks and vortex)
  useEffect(() => {
    if (status !== "portal-ring") return;

    const canvas = ringCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Particle factory
    const createParticle = (cx: number, cy: number, radius: number): PortalParticle => {
      const angle = Math.random() * 2 * Math.PI;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;

      // Radial speed outward
      const radialSpeed = Math.random() * 1.5 + 0.5;
      const spinSpeed = 1.2; // tangential speed

      const vx = Math.cos(angle) * radialSpeed - Math.sin(angle) * spinSpeed;
      const vy = Math.sin(angle) * radialSpeed + Math.cos(angle) * spinSpeed;

      const size = Math.random() * 3 + 1;
      
      // Fire sparks: transition from cyan (hottest center) to orange/red sparks
      const colors = [
        "rgba(249, 115, 22, 1)", // Orange
        "rgba(253, 186, 116, 1)", // Golden orange
        "rgba(6, 182, 212, 1)", // Hot cyan
        "rgba(239, 68, 68, 0.9)"  // Red fire spark
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];

      return {
        x,
        y,
        vx,
        vy,
        size,
        color,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.015
      };
    };

    const drawRing = () => {
      // Dark environment backdrop
      ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.22; // portal size

      // Swirling center vortex (Step 1)
      ctx.save();
      const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
      gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
      gradient.addColorStop(0.3, "rgba(6, 182, 212, 0.2)"); // Cyan aura
      gradient.addColorStop(0.8, "rgba(249, 115, 22, 0.15)"); // Orange ring glow
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();

      // Spawn portal ring sparks
      for (let i = 0; i < 4; i++) {
        ringParticles.current.push(createParticle(cx, cy, radius));
      }

      // Draw particles
      ringParticles.current.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          ringParticles.current.splice(index, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 8;
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
    spaceAudio.playPortalClick();
    setStatus("blackout");
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

        {/* Phase 4: Infinite Space Canvas */}
        {status === "space" && (
          <motion.div
            key="space"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 w-full h-full"
          >
            <InfiniteCanvas
              zoom={zoom}
              setZoom={setZoom}
              pan={pan}
              setPan={setPan}
            >
              {items.map((item) => (
                <FloatingNode
                  key={item.id}
                  item={item}
                  onTapNode={setSelectedNode}
                  onTapCard={setSelectedCard}
                  onUpdatePosition={handleUpdatePosition}
                />
              ))}
            </InfiniteCanvas>

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

            {/* Zoom HUD */}
            <div className="absolute bottom-6 right-6 z-[101] flex items-center gap-2 p-1.5 rounded-full border border-white/10 bg-black/60 backdrop-blur-md">
              <button
                onClick={() => setZoom(Math.max(zoom / 1.2, 0.3))}
                className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-[10px] font-mono text-white/80 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(zoom * 1.2, 3))}
                className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ZoomIn size={16} />
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
