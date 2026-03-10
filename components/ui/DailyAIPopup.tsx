"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";

interface DailyAIPopupProps {
    pointsAwarded: number;
    onClose: () => void;
}

export default function DailyAIPopup({ pointsAwarded, onClose }: DailyAIPopupProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Slight delay for dramatic effect
        const timer = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={handleClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: -20, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-cyan-800/40 bg-[#060606] shadow-[0_0_60px_rgba(0,230,255,0.15)]"
                    >
                        {/* Decorative background effects */}
                        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-[2rem]">
                            <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_top_right,rgba(0,230,255,0.12)_0%,rgba(0,0,0,0)_60%)]" />
                            <div className="absolute bottom-[-10%] left-[20%] w-[100%] h-[100%] bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,100,255,0.1)_0%,rgba(0,0,0,0)_50%)]" />
                        </div>

                        <div className="relative z-10 p-8 flex flex-col items-center text-center">

                            {/* Animated Check / Icon */}
                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", damping: 15, delay: 0.2 }}
                                className="w-20 h-20 mb-6 rounded-full bg-black/50 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,230,255,0.2)]"
                            >
                                <span className="text-2xl font-black text-cyan-400 tracking-wider">BLU</span>
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-2xl font-bold text-white mb-2 tracking-tight"
                            >
                                Epoch Finalized
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-sm text-gray-400 mb-6 leading-relaxed"
                            >
                                Your community signal from yesterday has been verified by the intelligence layer.
                            </motion.p>

                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", damping: 20, delay: 0.5 }}
                                className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded-2xl py-6 px-4 mb-8 flex flex-col relative overflow-hidden group"
                            >
                                {/* Subtle inner glow */}
                                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent pointer-events-none" />

                                <span className="text-xs font-semibold text-cyan-500 uppercase tracking-[0.2em] mb-2 pointer-events-auto">
                                    Reward Generated
                                </span>

                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-4xl font-black text-white pointer-events-auto shadow-sm">
                                        +{pointsAwarded.toLocaleString()}
                                    </span>
                                    <span className="text-base font-bold text-cyan-400 pointer-events-auto mt-2">
                                        XP
                                    </span>
                                </div>
                            </motion.div>

                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                onClick={handleClose}
                                className="w-full relative group overflow-hidden rounded-xl bg-cyan-500 p-[1px]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-cyan-600 opacity-80" />
                                <div className="relative flex items-center justify-center rounded-xl bg-black px-4 py-3 transition-colors group-hover:bg-cyan-950/50">
                                    <span className="font-bold text-cyan-400 transition-colors group-hover:text-cyan-300">
                                        Acknowledge
                                    </span>
                                </div>
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
