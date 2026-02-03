"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Activity } from "lucide-react";
import React from "react";

export default function StatsOverlay({
    isOpen,
    onClose,
    onOpenPresenceScore,
    onOpenLedger,
    onOpenFAQ,
    onOpenWhitepaper,
}: {
    isOpen: boolean;
    onClose: () => void;
    onOpenPresenceScore?: () => void;
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
                    className="fixed inset-0 z-[80] bg-[#0B0F14]/95 backdrop-blur-xl flex flex-col overflow-hidden text-white"
                >
                    {/* Header Bar */}
                    <div className="absolute top-0 left-0 right-0 h-16 z-[110] flex items-center justify-between px-6 bg-gradient-to-b from-[#0B0F14] via-[#0B0F14]/90 to-transparent pointer-events-none">
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
                                        We are recalibrating the protocol metrics for enhanced precision. Real-time ecosystem data will be available soon.
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

