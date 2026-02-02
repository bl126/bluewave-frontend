"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Activity } from "lucide-react";
import React from "react";
import TopRightMenu from "./TopRightMenu";

export default function StatsOverlay({
    isOpen,
    onClose,
    onOpenAbout,
    onOpenLedger,
    onOpenFAQ,
    onOpenWhitepaper,
}: {
    isOpen: boolean;
    onClose: () => void;
    onOpenAbout?: () => void;
    onOpenLedger?: () => void;
    onOpenFAQ?: () => void;
    onOpenWhitepaper?: () => void;
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-3xl flex flex-col overflow-hidden text-white"
                >
                    {/* Header Bar */}
                    <div className="flex items-center justify-between px-6 h-20 shrink-0 border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-[110]">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-all font-medium uppercase tracking-widest text-xs"
                        >
                            <ArrowLeft size={18} />
                            <span>Back</span>
                        </button>

                        <TopRightMenu
                            onOpenAbout={onOpenAbout}
                            onOpenLedger={onOpenLedger}
                            onOpenFAQ={onOpenFAQ}
                            onOpenStats={() => { }}
                            onOpenWhitepaper={onOpenWhitepaper}
                            isStatsActive={true}
                        />
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 flex flex-col items-center justify-center p-6">
                        <div className="max-w-xl w-full text-center space-y-8">
                            {/* Hero Title */}
                            <div className="space-y-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-center gap-2 text-cyan-500/60"
                                >
                                    <Activity size={12} />
                                    <span className="text-[10px] uppercase tracking-[0.4em] font-medium">Network Protocol Metrics</span>
                                </motion.div>
                                <h1 className="text-5xl font-bold tracking-tight text-white/90">
                                    Network Stats
                                </h1>
                            </div>

                            {/* Coming Soon Message */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="p-12 rounded-[40px] bg-white/[0.02] border border-white/5 backdrop-blur-3xl relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                <div className="relative z-10 space-y-4">
                                    <div className="inline-flex items-center px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-[10px] uppercase tracking-widest font-bold">
                                        Protocol Upgrade in Progress
                                    </div>
                                    <h2 className="text-2xl font-semibold text-white/80">Coming Soon</h2>
                                    <p className="text-sm text-white/30 max-w-xs mx-auto leading-relaxed">
                                        We are recalibrating the protocol metrics for enhanced precision. Real-time ecosystem data will be available shortly.
                                    </p>
                                </div>
                            </motion.div>

                            {/* Decorative Footer */}
                            <div className="pt-8 opacity-20">
                                <div className="flex items-center justify-center gap-2 text-[9px] uppercase tracking-[0.3em] font-medium">
                                    <span>Protocol Snapshot v1.1.0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

