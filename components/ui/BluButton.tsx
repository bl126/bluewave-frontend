"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";

export default function BluButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    // Track which edge (left/right) the button is snapped to
    const [snapEdge, setSnapEdge] = useState<"left" | "right">("left");
    // Y position as fraction of screen (0.5 = center)
    const [yFraction, setYFraction] = useState(0.5);

    const dragRef = useRef<HTMLDivElement>(null);
    const dragStartPos = useRef({ x: 0, y: 0 });

    // Compute pixel position from edge + yFraction
    const getStyle = () => {
        const top = `calc(${yFraction * 100}vh - 20px)`;
        if (snapEdge === "left") {
            return { top, left: "-12px" };
        } else {
            return { top, right: "-12px", left: "auto" };
        }
    };

    const handleDragEnd = (_: any, info: any) => {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        // Determine closest edge
        const finalX = info.point.x;
        const finalY = Math.max(screenH * 0.15, Math.min(screenH * 0.85, info.point.y));

        const newEdge: "left" | "right" = finalX < screenW / 2 ? "left" : "right";
        setSnapEdge(newEdge);
        setYFraction(finalY / screenH);
        setIsDragging(false);
    };

    return (
        <>
            {/* BLU Draggable Button */}
            <motion.div
                ref={dragRef}
                drag
                dragMomentum={false}
                dragElastic={0.08}
                onDragStart={() => {
                    setIsDragging(true);
                    setIsOpen(false);
                }}
                onDragEnd={handleDragEnd}
                style={{
                    position: "fixed",
                    zIndex: 80,
                    ...getStyle(),
                    touchAction: "none",
                }}
                className="select-none"
            >
                <motion.button
                    onClick={() => {
                        if (!isDragging) setIsOpen(true);
                    }}
                    whileHover={{ opacity: 1, scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    animate={{ opacity: isOpen ? 1 : 0.3 }}
                    transition={{ duration: 0.25 }}
                    className="w-10 h-10 rounded-full bg-black/60 border border-cyan-500/30 backdrop-blur-xl 
                     flex items-center justify-center shadow-[0_0_12px_rgba(0,230,255,0.15)]"
                >
                    <span className="text-[9px] font-black tracking-widest text-cyan-400 uppercase leading-none">
                        BLU
                    </span>
                </motion.button>
            </motion.div>

            {/* Chat Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 z-[85]"
                            onClick={() => setIsOpen(false)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />

                        {/* Chat Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.96 }}
                            transition={{ type: "spring", stiffness: 320, damping: 28 }}
                            className="fixed z-[90] bottom-24 left-1/2 -translate-x-1/2
                         w-[85vw] max-w-sm
                         bg-black/50 backdrop-blur-2xl
                         border border-cyan-900/30
                         rounded-3xl overflow-hidden
                         shadow-[0_0_30px_rgba(0,230,255,0.08)]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 pt-4 pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center">
                                        <span className="text-[7px] font-black text-cyan-400 tracking-widest">BLU</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-cyan-300/60 tracking-wider uppercase">Bluewave AI</span>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-cyan-500/30 hover:text-cyan-400 transition-colors text-xs leading-none"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Skeleton Chat Bubbles */}
                            <div className="px-5 py-3 flex flex-col gap-3 animate-pulse">
                                {/* BLU message (left) */}
                                <div className="flex items-end gap-2">
                                    <div className="w-5 h-5 rounded-full bg-cyan-900/30 shrink-0" />
                                    <div className="h-8 w-3/4 rounded-2xl rounded-bl-sm bg-cyan-900/20 border border-cyan-800/20" />
                                </div>
                                {/* User message (right) */}
                                <div className="flex justify-end">
                                    <div className="h-7 w-1/2 rounded-2xl rounded-br-sm bg-white/5 border border-white/10" />
                                </div>
                                {/* BLU message (left) long */}
                                <div className="flex items-end gap-2">
                                    <div className="w-5 h-5 rounded-full bg-cyan-900/30 shrink-0" />
                                    <div className="h-12 w-full rounded-2xl rounded-bl-sm bg-cyan-900/20 border border-cyan-800/20" />
                                </div>
                                {/* User message (right) short */}
                                <div className="flex justify-end">
                                    <div className="h-7 w-1/3 rounded-2xl rounded-br-sm bg-white/5 border border-white/10" />
                                </div>
                            </div>

                            {/* Center Status Text */}
                            <div className="flex items-center justify-center py-2 pb-4">
                                <motion.p
                                    className="text-[9px] text-cyan-500/50 font-semibold tracking-[0.2em] uppercase"
                                    animate={{ opacity: [0.4, 0.9, 0.4] }}
                                    transition={{ duration: 2.5, repeat: Infinity }}
                                >
                                    BLu is watching · coming soon
                                </motion.p>
                            </div>

                            {/* Fake Input */}
                            <div className="px-4 pb-4">
                                <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-2.5">
                                    <div className="flex-1 h-3 rounded-full bg-white/5" />
                                    <div className="w-6 h-6 rounded-full bg-cyan-900/20 border border-cyan-800/20 flex items-center justify-center">
                                        <span className="text-[8px] text-cyan-500/30">↑</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
