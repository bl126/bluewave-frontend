"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

interface VerifiedHumanModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function VerifiedHumanModal({ isOpen, onClose }: VerifiedHumanModalProps) {
    const { t } = useLanguage();
    const { theme } = useTheme();

    // Haptic success signal
    useEffect(() => {
        if (isOpen) {
            const tg = (window as any).Telegram?.WebApp;
            if (tg?.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred("success");
            }
        }
    }, [isOpen]);

    // Native Back Button Interceptor -> Close modal
    useEffect(() => {
        if (!isOpen) return;
        const handleNativeBack = (e: Event) => {
            e.preventDefault();
            onClose();
        };
        window.addEventListener("bwNativeBack", handleNativeBack);
        return () => window.removeEventListener("bwNativeBack", handleNativeBack);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex flex-col justify-end overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[8px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Bottom Sheet Modal Container */}
                    <motion.div
                        className="relative w-full z-10 overflow-hidden text-text-main flex flex-col rounded-t-[2.5rem] pb-safe"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 26, stiffness: 190 }}
                        style={{
                          background: "rgba(10, 10, 12, 0.88)",
                          backdropFilter: "blur(40px) saturate(210%)",
                          WebkitBackdropFilter: "blur(40px) saturate(210%)",
                          borderTop: "1px solid rgba(255, 255, 255, 0.12)",
                          boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 -10px 40px rgba(0, 0, 0, 0.5)"
                        }}
                    >
                        {/* Specular Ambient Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-app-accent/10 blur-[60px] rounded-full pointer-events-none" />

                        {/* Drag Handle */}
                        <div className="w-full flex justify-center pt-4 pb-2">
                            <div className="w-12 h-1.5 bg-white/15 rounded-full" />
                        </div>

                        <div className="relative p-6 px-8 flex flex-col items-center text-center pb-12">
                            {/* Animated Verified Emblem */}
                            <div className="relative mb-6">
                                <motion.div
                                    className="absolute inset-0 bg-app-accent/20 blur-2xl rounded-full"
                                    animate={{ scale: [1, 1.15, 1] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                />
                                <div className="relative w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shadow-lg"
                                     style={{ boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.15)" }}>
                                    <UserCheck className="w-9 h-9 text-white opacity-95" strokeWidth={1.5} />
                                </div>

                                {/* Floating Sparkles */}
                                <motion.div
                                    className="absolute -top-1 -right-1 text-white opacity-80"
                                    animate={{ y: [0, -6, 0], opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Sparkles size={14} />
                                </motion.div>
                            </div>

                            <h2 className="text-2xl font-bold tracking-tight text-white leading-tight mb-2" style={{ letterSpacing: "-0.5px" }}>
                                {t("verified_human_modal.title")}
                            </h2>

                            <div className="flex items-center gap-1.5 mb-5 px-3 py-1 rounded-full bg-white/10 border border-white/10">
                                <ShieldCheck size={13} className="text-white opacity-80" />
                                <span className="text-[9px] font-black uppercase text-white/80 tracking-widest">{t("verified_human_modal.badge")}</span>
                            </div>

                            <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-xs">
                                {t("verified_human_modal.desc")}
                            </p>

                            {/* Benefits Checklist */}
                            <div className="w-full max-w-xs space-y-3 mb-8 bg-white/5 p-4 rounded-2xl border border-white/5 text-left">
                                {[
                                    t("verified_human_modal.benefit_1"),
                                    t("verified_human_modal.benefit_2"),
                                    t("verified_human_modal.benefit_3")
                                ].map((text, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                        <span className="text-[11px] font-semibold text-white/70 uppercase tracking-tight">{text}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Capsule Action Buttons */}
                            <div className="w-full max-w-xs space-y-3">
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-white text-black font-semibold text-sm rounded-full transition-all active:scale-[0.97] hover:bg-white/95"
                                    style={{
                                      boxShadow: "0 4px 20px rgba(255, 255, 255, 0.15)"
                                    }}
                                >
                                    {t("verified_human_modal.acknowledge")}
                                </button>

                                <button
                                    onClick={onClose}
                                    className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white/60 transition-colors"
                                >
                                    {t("verified_human_modal.close")}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
