"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import React, { useEffect, useState } from "react";

interface PresenceScoreOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PresenceScoreOverlay({ isOpen, onClose }: PresenceScoreOverlayProps) {
    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-[80] bg-[#0B0F14]/95 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Header Bar */}
                    <div className="absolute top-0 left-0 right-0 h-16 z-[110] flex items-center justify-between px-6 bg-gradient-to-b from-black via-black/90 to-transparent pointer-events-none">
                        <button
                            onClick={onClose}
                            className="group flex items-center gap-2 text-cyan-400 hover:text-cyan-200 transition-colors pointer-events-auto"
                        >
                            <div className="p-2 rounded-full bg-cyan-950/30 group-hover:bg-cyan-900/50 transition-colors border border-cyan-900/50">
                                <ArrowLeft size={20} />
                            </div>
                            <span className="text-sm font-medium tracking-wide uppercase hidden sm:block">Back</span>
                        </button>
                    </div>

                    {/* Central Presence Core & Rings */}
                    <div className="relative flex items-center justify-center w-64 h-64 md:w-96 md:h-96">
                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-cyan-500/10 blur-[100px] rounded-full" />

                        {/* Concentric Rings */}
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    rotate: i % 2 === 0 ? 360 : -360,
                                }}
                                transition={{
                                    duration: 10 + i * 5,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                                className="absolute rounded-full border border-cyan-500/20"
                                style={{
                                    width: `${(i + 1) * 20}%`,
                                    height: `${(i + 1) * 20}%`,
                                    borderStyle: i % 2 === 0 ? "solid" : "dashed",
                                    borderWidth: "1px",
                                    opacity: 0.2 + (i * 0.15),
                                }}
                            />
                        ))}

                        {/* Central Core (Orb) */}
                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1],
                                opacity: [0.7, 0.9, 0.7],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            className="relative z-10 w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-cyan-400 via-cyan-600 to-cyan-900 shadow-[0_0_50px_rgba(34,211,238,0.4)] flex items-center justify-center overflow-hidden"
                        >
                            {/* Inner core shimmer */}
                            <motion.div
                                animate={{
                                    rotate: 360,
                                }}
                                transition={{
                                    duration: 8,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                                className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.2),transparent)]"
                            />
                        </motion.div>

                        {/* Subtle Particle Drift (Optional) */}
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={`particle-${i}`}
                                initial={{
                                    x: (Math.random() - 0.5) * 400,
                                    y: (Math.random() - 0.5) * 400,
                                    opacity: 0
                                }}
                                animate={{
                                    x: 0,
                                    y: 0,
                                    opacity: [0, 0.8, 0]
                                }}
                                transition={{
                                    duration: 3 + Math.random() * 4,
                                    repeat: Infinity,
                                    delay: Math.random() * 5,
                                }}
                                className="absolute w-1 h-1 bg-cyan-400 rounded-full blur-[1px]"
                            />
                        ))}
                    </div>

                    {/* Text / Copy */}
                    <div className="mt-12 text-center space-y-6 px-6 max-w-lg">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="space-y-2"
                        >
                            <h1 className="text-2xl md:text-3xl font-bold tracking-[0.2em] text-cyan-50 uppercase">
                                Accumulating<br />Presence Signals
                            </h1>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.4, 0] }}
                            transition={{
                                delay: 2,
                                duration: 8,
                                repeat: Infinity,
                                repeatDelay: 2
                            }}
                            className="text-[10px] md:text-xs tracking-[0.3em] text-cyan-400 uppercase font-medium"
                        >
                            Your Presence Score unlocks in Phase III Pre TGE
                        </motion.div>
                    </div>

                    {/* Infrastructure Footer Decorations */}
                    <div className="absolute bottom-12 flex flex-col items-center gap-4 opacity-40">
                        <div className="w-16 h-[1px] bg-cyan-500/50" />
                        <div className="text-[9px] uppercase tracking-[0.5em] text-cyan-500 font-mono">
                            Protocol Presence Recording Active
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
