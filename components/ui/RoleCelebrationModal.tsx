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

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-app-bg/80 backdrop-blur-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        className={`relative w-full max-w-sm bg-app-card border ${roleData.border || 'border-app-border'} rounded-[32px] overflow-hidden shadow-app-shadow`}
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    >
                        {/* Top Glow based on role color */}
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-b ${roleData.color} blur-[60px] pointer-events-none opacity-50`} />

                        <div className="relative p-8 flex flex-col items-center text-center">
                            {/* Animated Icon */}
                            <div className="relative mb-6">
                                <motion.div
                                    className={`absolute inset-0 bg-gradient-to-b ${roleData.color} blur-2xl rounded-full opacity-30`}
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <div className={`relative w-20 h-20 bg-app-bg/40 border ${roleData.border} rounded-full flex items-center justify-center`}>
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

                            <h2 className="text-2xl font-black text-text-main uppercase tracking-tighter mb-2">
                                {t("role_celebration.title")}
                            </h2>

                            <div className={`flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-app-bg/40 border ${roleData.border}`}>
                                <Icon size={14} className={roleData.text} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${roleData.text}`}>
                                    {t(`roles_list.${roleData.name}.name`) || roleData.name}
                                </span>
                            </div>

                            <p className="text-text-sub text-sm leading-relaxed mb-8">
                                {t("role_celebration.desc").replace("{{role}}", t(`roles_list.${roleData.name}.name`) || roleData.name)}
                            </p>

                            {/* Benefit / Boost */}
                            <div className="w-full space-y-3 mb-8">
                                <div className="flex items-center gap-3 text-left bg-app-accent/5 p-3 rounded-2xl border border-app-border">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleData.color} flex items-center justify-center shrink-0`}>
                                        <Icon size={20} className={roleData.text} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-text-sub/40 uppercase tracking-widest leading-none mb-1">{t("role_celebration.yield_multiplier")}</p>
                                        <p className={`text-lg font-black ${roleData.text} leading-none`}>{roleData.boost} {t("role_celebration.boost")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-left px-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-app-accent" />
                                    <span className="text-[11px] font-bold text-text-main/80 uppercase tracking-tight">
                                        {t(`roles_list.${roleData.name}.benefit`) || roleData.benefit}
                                    </span>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-app-accent hover:bg-app-accent/80 text-black font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-app-shadow"
                            >
                                {t("role_celebration.collect")}
                            </button>

                            <button
                                onClick={onClose}
                                className="mt-4 text-[10px] font-black uppercase tracking-widest text-text-sub/40 hover:text-app-accent transition-colors"
                            >
                                {t("role_celebration.dismiss")}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
