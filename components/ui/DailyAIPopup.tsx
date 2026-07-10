"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

interface DailyAIPopupProps {
    pointsAwarded: number;
    onClose: () => void;
}

export default function DailyAIPopup({ pointsAwarded, onClose }: DailyAIPopupProps) {
    const { t } = useLanguage();
    const { theme } = useTheme();
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

    // Native Back Button Interceptor -> Close modal
    useEffect(() => {
        if (!isVisible) return;
        const handleNativeBack = (e: Event) => {
            e.preventDefault();
            handleClose();
        };
        window.addEventListener("bwNativeBack", handleNativeBack);
        return () => window.removeEventListener("bwNativeBack", handleNativeBack);
    }, [isVisible]);

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-[8px]"
                        onClick={handleClose}
                    />

                    {/* Bottom Sheet Modal Container using Frosted / Liquid Glass principles */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 26, stiffness: 190 }}
                        className="relative w-full z-10 overflow-hidden text-text-main flex flex-col rounded-t-[2.5rem] pb-safe"
                        style={{
                          background: "rgba(0, 0, 0, 0.45)",
                          backdropFilter: "blur(30px) saturate(190%)",
                          WebkitBackdropFilter: "blur(30px) saturate(190%)",
                          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                          boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 -10px 40px rgba(0, 0, 0, 0.5)"
                        }}
                    >
                        {/* Specular Liquid Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-app-accent/5 blur-[60px] rounded-full pointer-events-none" />

                        {/* Drag Handle */}
                        <div className="w-full flex justify-center pt-4 pb-2">
                            <div className="w-12 h-1.5 bg-white/15 rounded-full" />
                        </div>

                        <div className="relative p-6 px-8 flex flex-col items-center text-center pb-12">

                            {/* Animated Emblem */}
                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", damping: 15, delay: 0.2 }}
                                className="w-20 h-20 mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-lg"
                                style={{ boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.15)" }}
                            >
                                <span className="text-xl font-bold text-white opacity-95 tracking-wider">BLU</span>
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-2xl font-bold text-white mb-2 tracking-tight"
                                style={{ letterSpacing: "-0.5px" }}
                            >
                                {t("daily_ai_popup.title")}
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-sm text-white/60 mb-6 leading-relaxed px-4 pt-1"
                            >
                                {t("daily_ai_popup.desc")}
                            </motion.p>

                            {/* Reward display container */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", damping: 20, delay: 0.5 }}
                                className="w-full max-w-xs bg-white/5 border border-white/10 rounded-2xl py-6 px-4 mb-8 flex flex-col relative overflow-hidden group shadow-md"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />

                                <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-2">
                                    {t("daily_ai_popup.reward_generated")}
                                </span>

                                <div className="flex items-center justify-center gap-1.5">
                                    <span className="text-4xl font-black text-white leading-none">
                                        +{pointsAwarded.toLocaleString()}
                                    </span>
                                    <span className="text-sm font-semibold text-white/60 mt-2">
                                        XP
                                    </span>
                                </div>
                            </motion.div>

                            {/* Acknowledge Button */}
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                onClick={handleClose}
                                className="w-full max-w-xs py-4 bg-white text-black font-semibold text-sm rounded-full transition-all active:scale-[0.97] hover:bg-white/95"
                                style={{
                                  boxShadow: "0 4px 20px rgba(255, 255, 255, 0.15)"
                                }}
                            >
                                {t("daily_ai_popup.acknowledge")}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
