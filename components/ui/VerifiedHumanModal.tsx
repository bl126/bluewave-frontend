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
                        className={`absolute inset-0 ${theme === 'light' ? 'bg-white' : 'bg-black/80 backdrop-blur-md'}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        className="relative w-full max-w-sm bg-app-card border border-app-accent/20 rounded-[32px] overflow-hidden shadow-app-shadow"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    >
                        {/* Top Accent Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-app-accent/20 blur-[60px] pointer-events-none" />

                        <div className="relative p-8 flex flex-col items-center text-center">
                            {/* Animated Icon */}
                            <div className="relative mb-6">
                                <motion.div
                                    className="absolute inset-0 bg-app-accent/20 blur-2xl rounded-full"
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <div className="relative w-20 h-20 bg-app-accent/10 border border-app-accent/20 rounded-full flex items-center justify-center">
                                    <UserCheck className="w-10 h-10 text-app-accent" />
                                </div>

                                {/* Floating Sparkles */}
                                <motion.div
                                    className="absolute -top-2 -right-2 text-app-accent/80"
                                    animate={{ y: [0, -10, 0], opacity: [0, 1, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    <Sparkles size={16} />
                                </motion.div>
                            </div>

                            <h2 className="text-2xl font-black text-text-main uppercase tracking-tighter mb-2">
                                {t("verified_human_modal.title")}
                            </h2>

                            <div className="flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-app-accent/10 border border-app-accent/30">
                                <ShieldCheck size={14} className="text-app-accent" />
                                <span className="text-[10px] font-black uppercase text-app-accent tracking-widest">{t("verified_human_modal.badge")}</span>
                            </div>

                            <p className="text-text-sub text-sm leading-relaxed mb-8">
                                {t("verified_human_modal.desc")}
                            </p>

                            {/* Benefits */}
                            <div className="w-full space-y-3 mb-8">
                                {[
                                    t("verified_human_modal.benefit_1"),
                                    t("verified_human_modal.benefit_2"),
                                    t("verified_human_modal.benefit_3")
                                ].map((text, i) => (
                                    <div key={i} className="flex items-center gap-3 text-left">
                                        <div className="w-1.5 h-1.5 rounded-full bg-app-accent" />
                                        <span className="text-[11px] font-bold text-text-sub uppercase tracking-tight">{text}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-app-accent hover:opacity-90 text-app-bg font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-app-shadow"
                            >
                                {t("verified_human_modal.acknowledge")}
                            </button>

                            <button
                                onClick={onClose}
                                className="mt-4 text-[10px] font-black uppercase tracking-widest text-text-sub/40 hover:text-text-sub transition-colors"
                            >
                                {t("verified_human_modal.close")}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
