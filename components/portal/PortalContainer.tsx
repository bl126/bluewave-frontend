"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PuzzleBoard from "./PuzzleBoard";
import InfiniteCanvas from "./InfiniteCanvas";
import FloatingNode, { NodeItem } from "./FloatingNode";
import { spaceAudio } from "./SpaceAudio";
import { X, Heart, MessageSquare, Send, Upload, Sparkles, LogOut, ZoomIn, ZoomOut } from "lucide-react";

interface PortalContainerProps {
  onClose: () => void;
}

const PRELOADED_ARTS = [
  { name: "Cosmic Nebula", url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=500" },
  { name: "Digital Dream", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500" },
  { name: "Neon Flux", url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500" },
  { name: "Quantum Rift", url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=500" },
];

export default function PortalContainer({ onClose }: PortalContainerProps) {
  const [status, setStatus] = useState<"blackout" | "puzzle" | "space">("blackout");
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

  // Comments Input State
  const [commentText, setCommentText] = useState("");

  // Initialize space coordinates
  useEffect(() => {
    // 2 Seconds blackout duration, then load puzzle
    if (status === "blackout") {
      spaceAudio.playHum();
      const timer = setTimeout(() => {
        setStatus("puzzle");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Seed initial floating elements once space starts
  useEffect(() => {
    if (status === "space") {
      // Create scattered nodes in the infinite coordinate space
      const initialNodes: NodeItem[] = [
        { id: "node-1", type: "node", x: -200, y: -150, likes: 12, comments: [] },
        { id: "node-2", type: "node", x: 250, y: -180, likes: 8, comments: [] },
        { id: "node-3", type: "node", x: -300, y: 180, likes: 25, comments: [{ id: "c1", user: "space_traveler", text: "Stunning colors!" }] },
        { id: "node-4", type: "node", x: 200, y: 150, likes: 19, comments: [] },
        { id: "node-5", type: "node", x: 0, y: -300, likes: 3, comments: [] },
      ];
      setItems(initialNodes);
      
      // Center the viewport initially
      setPan({ x: window.innerWidth / 2 - 50, y: window.innerHeight / 2 - 50 });
    }
  }, [status]);

  const handleUpdatePosition = (id: string, x: number, y: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, x, y } : item))
    );
  };

  const handleSubmitArt = () => {
    if (!newArtName.trim() || !newOwnerName.trim()) return;

    const finalUrl = customArtUrl.trim() || selectedArtUrl;

    // Update state to transform selected star node into an NFT card
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
    spaceAudio.playClick(700);
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
    const newComment = {
      id: `comment-${Date.now()}`,
      user: "AnonymousOperator",
      text: commentText.trim(),
    };

    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedCard.id
          ? { ...item, comments: [...item.comments, newComment] }
          : item
      )
    );

    setSelectedCard((prev) =>
      prev ? { ...prev, comments: [...prev.comments, newComment] } : null
    );
    setCommentText("");
  };

  const handleExit = () => {
    spaceAudio.stopHum();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] w-screen h-screen bg-black overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {/* Phase 1: Screen Blackout */}
        {status === "blackout" && (
          <motion.div
            key="blackout"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-black flex flex-col items-center justify-center"
          >
            <p className="text-neutral-500 font-mono text-[10px] tracking-[0.3em] uppercase animate-pulse">
              Entering deep space...
            </p>
          </motion.div>
        )}

        {/* Phase 2: Assembly Puzzle */}
        {status === "puzzle" && (
          <PuzzleBoard
            key="puzzle"
            onComplete={() => setStatus("space")}
          />
        )}

        {/* Phase 3: The Infinite Space Canvas */}
        {status === "space" && (
          <motion.div
            key="space"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
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

            {/* Static HUD Header Controls */}
            <div className="absolute top-6 left-6 z-[101] flex items-center gap-4">
              <button
                onClick={handleExit}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/40 bg-red-950/20 text-red-400 backdrop-blur-md text-xs font-mono tracking-widest hover:bg-red-500 hover:text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              >
                <LogOut size={14} />
                EXIT PORTAL
              </button>
            </div>

            {/* Dynamic Zoom Indicator HUD */}
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
                    {/* Header */}
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

                    {/* Inputs */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 tracking-wider uppercase mb-1">
                          Art Name
                        </label>
                        <input
                          type="text"
                          value={newArtName}
                          onChange={(e) => setNewArtName(e.target.value)}
                          placeholder="e.g. Eclipse Harmony"
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
                          placeholder="e.g. cosmo_operator"
                          className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>

                      {/* Art Selector */}
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
                          onChange={(e) => {
                            setCustomArtUrl(e.target.value);
                          }}
                          placeholder="Or paste custom image URL..."
                          className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>

                      {/* Submit */}
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

            {/* Modal: Card Details Overlay */}
            <AnimatePresence>
              {selectedCard && (
                <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 50 }}
                    className="relative w-full max-w-[420px] rounded-3xl bg-neutral-950 border border-white/10 overflow-hidden text-white shadow-[0_15px_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh]"
                  >
                    {/* Floating Close Button */}
                    <button
                      onClick={() => setSelectedCard(null)}
                      className="absolute top-4 right-4 z-[10] p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>

                    {/* NFT Artwork Frame */}
                    <div className="w-full aspect-square relative bg-neutral-900 border-b border-white/10">
                      <img
                        src={selectedCard.artUrl}
                        alt={selectedCard.artName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                      
                      {/* Floating metadata */}
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

                        {/* Likes counter */}
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

                    {/* Comments section */}
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
                            Be the first to comments on this art...
                          </div>
                        ) : (
                          selectedCard.comments.map((comment) => (
                            <div
                              key={comment.id}
                              className="bg-neutral-900/50 border border-white/5 rounded-xl p-3 text-xs"
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400/80 mb-1">
                                <span>@{comment.user}</span>
                              </div>
                              <p className="text-white/80 leading-relaxed">
                                {comment.text}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Comment Input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Type comment..."
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
