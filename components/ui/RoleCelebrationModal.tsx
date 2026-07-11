"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { findRoleByName } from "@/lib/roles";
import { useLanguage } from "@/contexts/LanguageContext";

interface RoleCelebrationModalProps {
    isOpen: boolean;
    roleName: string;
    onClose: () => void;
}

export default function RoleCelebrationModal({ isOpen, roleName, onClose }: RoleCelebrationModalProps) {
    const { t } = useLanguage();
    const roleData = findRoleByName(roleName);
    const Icon = roleData?.icon || ShieldCheck;

    useEffect(() => {
        if (isOpen) {
            const tg = (window as any).Telegram?.WebApp;
            if (tg?.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred("success");
            }
        }
    }, [isOpen]);

    if (!roleData) return null;

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

                    {/* Bottom Sheet Container */}
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
                        {/* Top Glow based on role color */}
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-b ${roleData.color} blur-[60px] pointer-events-none opacity-40`} />

                        {/* Drag Handle */}
                        <div className="w-full flex justify-center pt-4 pb-2">
                            <div className="w-12 h-1.5 bg-white/15 rounded-full" />
                        </div>

                        <div className="relative p-6 px-8 flex flex-col items-center text-center pb-12">
                            {/* Animated Icon */}
                            <div className="relative mb-6">
                                <motion.div
                                    className={`absolute inset-0 bg-gradient-to-b ${roleData.color} blur-2xl rounded-full opacity-30`}
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <div className={`relative w-20 h-20 bg-white/5 border ${roleData.border} rounded-full flex items-center justify-center shadow-lg`}
                                     style={{ boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.15)" }}>
                                    <Icon className={`w-10 h-10 ${roleData.text}`} />
                                </div>

                                {/* Floating Sparkles */}
                                <motion.div
                                    className={`absolute -top-2 -right-2 ${roleData.text}`}
                                    animate={{ y: [0, -10, 0], opacity: [0, 1, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    <Sparkles size={16} />
                                </motion.div>
                            </div>

                            <h2 className="text-2xl font-bold tracking-tight text-white leading-tight mb-2" style={{ letterSpacing: "-0.5px" }}>
                                {t("role_celebration.title")}
                            </h2>

                            <div className={`flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-white/5 border ${roleData.border}`}>
                                <Icon size={14} className={roleData.text} />
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${roleData.text}`}>
                                    {t(`roles_list.${roleData.name}.name`) || roleData.name}
                                </span>
                            </div>

                            <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-xs">
                                {t("role_celebration.desc").replace("{{role}}", t(`roles_list.${roleData.name}.name`) || roleData.name)}
                            </p>

                            {/* Benefit / Boost */}
                            <div className="w-full max-w-xs space-y-3 mb-8">
                                <div className="flex items-center gap-3 text-left bg-white/5 p-3 rounded-2xl border border-white/5">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleData.color} flex items-center justify-center shrink-0`}>
                                        <Icon size={20} className={roleData.text} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">{t("role_celebration.yield_multiplier")}</p>
                                        <p className={`text-lg font-bold ${roleData.text} leading-none`}>{roleData.boost} {t("role_celebration.boost")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-left px-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                    <span className="text-[11px] font-semibold text-white/70 uppercase tracking-tight">
                                        {t(`roles_list.${roleData.name}.benefit`) || roleData.benefit}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="w-full max-w-xs space-y-3">
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-white text-black font-semibold text-sm rounded-full transition-all active:scale-[0.97] hover:bg-white/95"
                                    style={{
                                      boxShadow: "0 4px 20px rgba(255, 255, 255, 0.15)"
                                    }}
                                >
                                    {t("role_celebration.collect")}
                                </button>

                                <button
                                    onClick={onClose}
                                    className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white/60 transition-colors"
                                >
                                    {t("role_celebration.dismiss")}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
