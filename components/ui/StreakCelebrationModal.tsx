import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Check, Share2, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface StreakCelebrationModalProps {
    isOpen: boolean;
    streakDays: number;
    rewardAmount: number;
    onClose: () => void;
}

const StreakCelebrationModal: React.FC<StreakCelebrationModalProps> = ({
    isOpen,
    streakDays,
    rewardAmount,
    onClose,
}) => {
    const { t } = useLanguage();
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowContent(true);
            const tg = (window as any).Telegram?.WebApp;
            if (tg?.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred("success");
            }
        } else {
            setShowContent(false);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        className="relative w-full max-w-sm bg-gradient-to-b from-cyan-950/80 to-black border border-cyan-500/30 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_-10px_rgba(6,182,212,0.3)]"
                    >
                        {/* Ambient Background Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />

                        {/* Content Container */}
                        <div className="relative p-8 flex flex-col items-center text-center">

                            {/* Animated Fire Icon */}
                            <motion.div
                                initial={{ y: 10, scale: 0.9 }}
                                animate={{
                                    y: [0, -10, 0],
                                    scale: [1, 1.1, 1],
                                    filter: [
                                        "drop-shadow(0 0 10px #22d3ee)",
                                        "drop-shadow(0 0 20px #06b6d4)",
                                        "drop-shadow(0 0 10px #22d3ee)"
                                    ]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="mb-6 relative"
                            >
                                <div className="absolute inset-0 bg-cyan-400 blur-2xl opacity-20 rounded-full animate-pulse" />
                                <Flame size={80} className="text-cyan-400 relative z-10" strokeWidth={1.5} />
                                <motion.div
                                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], x: [0, 20, -20], y: [0, -40, -60] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="absolute top-0 left-1/2 -translate-x-1/2 text-cyan-200"
                                >
                                    <Sparkles size={20} />
                                </motion.div>
                            </motion.div>

                            {/* Title & Stats */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="space-y-2 mb-8"
                            >
                                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase italic">
                                    {t("streak_celebration.title")}
                                </h2>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="h-px w-8 bg-cyan-900" />
                                    <span className="text-cyan-400 font-mono font-bold tracking-[0.3em] text-xs uppercase">
                                        {streakDays} {t("streak_celebration.continuum")}
                                    </span>
                                    <div className="h-px w-8 bg-cyan-900" />
                                </div>
                            </motion.div>

                            {/* Reward Badge */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4, type: "spring" }}
                                className="w-full bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 mb-8 flex items-center justify-between group overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <div className="text-left">
                                    <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest mb-1">{t("streak_celebration.reward_granted")}</p>
                                    <p className="text-2xl font-black text-cyan-100 tracking-tight">+{rewardAmount} $BWAVE</p>
                                </div>
                                <div className="p-2 rounded-full bg-cyan-400 text-black shadow-[0_0_15px_#22d3ee]">
                                    <Check size={20} strokeWidth={3} />
                                </div>
                            </motion.div>

                            {/* Action Buttons */}
                            <div className="w-full space-y-3">
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                                >
                                    {t("streak_celebration.claim_continue")}
                                </button>
                            </div>

                            {/* Close Label */}
                            <p className="mt-6 text-[10px] text-cyan-900 font-bold uppercase tracking-widest">
                                {t("streak_celebration.footer")}
                            </p>
                        </div>

                        {/* Bottom Accent */}
                        <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default StreakCelebrationModal;
