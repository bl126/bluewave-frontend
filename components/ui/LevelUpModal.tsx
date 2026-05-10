"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Star, Zap, Target, Shield, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { findRoleByName } from "@/lib/roles";
import { useLanguage } from "@/contexts/LanguageContext";

interface LevelUpModalProps {
    level: number;
    isOpen: boolean;
    onClose: () => void;
}

const LEVEL_ICONS = [Star, Zap, Target, Shield, Trophy];

export default function LevelUpModal({ level, isOpen, onClose }: LevelUpModalProps) {
    const { t } = useLanguage();
    const Icon = LEVEL_ICONS[Math.min(level - 1, 4)];
    const roleData = findRoleByName(`LEVEL ${level}`);
    const [particles, setParticles] = useState<{ id: number, x: number, y: number, color: string }[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Generate some celebratory particles
            const newParticles = Array.from({ length: 50 }).map((_, i) => ({
                id: i,
                x: Math.random() * 100 - 50,
                y: Math.random() * 100 - 50,
                color: ["#00E6FF", "#22D3EE", "#06B6D4", "#0891B2"][Math.floor(Math.random() * 4)]
            }));
            setParticles(newParticles);

            // Auto close after 5 seconds if not closed manually
            const timer = setTimeout(onClose, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-app-bg/90 backdrop-blur-3xl overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Particles */}
                    {particles.map((p) => (
                        <motion.div
                            key={p.id}
                            className="absolute w-2 h-2 rounded-full"
                            style={{ backgroundColor: p.color }}
                            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                            animate={{
                                x: p.x * 10,
                                y: p.y * 10,
                                opacity: 0,
                                scale: 0.5
                            }}
                            transition={{ duration: 2, ease: "easeOut", delay: 0.1 }}
                        />
                    ))}

                    <motion.div
                        className="relative flex flex-col items-center justify-center p-8 text-center max-w-sm"
                        initial={{ scale: 0.5, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", damping: 15, stiffness: 100 }}
                    >
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-app-accent/20 blur-[100px] rounded-full animate-pulse" />

                        {/* Badge Container */}
                        <motion.div
                            className={`w-32 h-32 rounded-[2.5rem] bg-gradient-to-br ${roleData?.color || 'from-app-accent/20 to-app-accent/40'} border-4 ${roleData?.border || 'border-app-accent/50'} flex items-center justify-center mb-8 shadow-app-shadow relative`}
                            animate={{
                                rotate: [0, -5, 5, -5, 0],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <Icon size={64} className="text-app-accent" />

                            <motion.div
                                className="absolute -bottom-4 -right-4 w-12 h-12 rounded-full bg-app-accent border-4 border-app-bg flex items-center justify-center shadow-xl"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5, type: "spring" }}
                            >
                                <Check size={24} className="text-black stroke-[4px]" />
                            </motion.div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h1 className="text-4xl font-black text-text-main uppercase tracking-tighter mb-2">{t("level_up_modal.title")}</h1>
                            <p className="text-app-accent font-bold uppercase tracking-[0.3em] text-sm mb-6">
                                {t("level_up_modal.reached")} {level}
                            </p>

                            <div className="bg-app-accent/5 border border-app-border rounded-2xl p-4 mb-8">
                                <p className="text-xs text-text-sub font-medium uppercase leading-relaxed">
                                    {t(`roles_list.LEVEL ${level}.desc`) || t("level_up_modal.default_desc")}
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="px-10 py-4 bg-app-accent text-app-bg font-black uppercase text-xs tracking-widest rounded-2xl shadow-app-shadow hover:bg-app-accent/80 transition-all active:scale-95"
                            >
                                {t("level_up_modal.continue")}
                            </button>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
