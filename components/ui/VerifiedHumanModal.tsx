"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { useEffect } from "react";

interface VerifiedHumanModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function VerifiedHumanModal({ isOpen, onClose }: VerifiedHumanModalProps) {
    useEffect(() => {
        if (isOpen) {
            const tg = (window as any).Telegram?.WebApp;
            if (tg?.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred("success");
            }
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        className="relative w-full max-w-sm bg-zinc-950 border border-cyan-500/20 rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)]"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    >
                        {/* Top Cyan Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-cyan-500/20 blur-[60px] pointer-events-none" />

                        <div className="relative p-8 flex flex-col items-center text-center">
                            {/* Animated Icon */}
                            <div className="relative mb-6">
                                <motion.div
                                    className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full"
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <div className="relative w-20 h-20 bg-cyan-500/10 border border-cyan-400/20 rounded-full flex items-center justify-center">
                                    <UserCheck className="w-10 h-10 text-cyan-400" />
                                </div>

                                {/* Floating Sparkles */}
                                <motion.div
                                    className="absolute -top-2 -right-2 text-cyan-300"
                                    animate={{ y: [0, -10, 0], opacity: [0, 1, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    <Sparkles size={16} />
                                </motion.div>
                            </div>

                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
                                Identity Verified
                            </h2>

                            <div className="flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30">
                                <ShieldCheck size={14} className="text-cyan-400" />
                                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-widest">Verified Human</span>
                            </div>

                            <p className="text-cyan-100/60 text-sm leading-relaxed mb-8">
                                Your presence has been cryptographically confirmed. You are now recognized as a **Verified Human** within the Bluewave Protocol.
                            </p>

                            {/* Benefits */}
                            <div className="w-full space-y-3 mb-8">
                                {[
                                    "Exclusive Verified Human Ring",
                                    "Priority Network Signal Processing",
                                    "Protocol Governance Rights (Phase III)"
                                ].map((text, i) => (
                                    <div key={i} className="flex items-center gap-3 text-left">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                                        <span className="text-[11px] font-bold text-cyan-50/80 uppercase tracking-tight">{text}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-[0_4px_20px_rgba(6,182,212,0.3)]"
                            >
                                Acknowledge Protocol
                            </button>

                            <button
                                onClick={onClose}
                                className="mt-4 text-[10px] font-black uppercase tracking-widest text-cyan-500/40 hover:text-cyan-500 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
