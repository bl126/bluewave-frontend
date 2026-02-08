"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Map } from "lucide-react";
import React, { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface RoadmapOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RoadmapOverlay({ isOpen, onClose }: RoadmapOverlayProps) {
    const { t } = useLanguage();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const phases = [
        {
            title: "Phase I",
            subtitle: "Foundation",
            items: ["Mini App Launch", "Organic Growth", "Anti-Bot PvP 1.0"],
            active: true
        },
        {
            title: "Phase II",
            subtitle: "On-Chain Migration",
            items: ["Presence Ledger", "$BWAVE Jetton", "Marketplace Beta"],
            active: false
        },
        {
            title: "Phase III",
            subtitle: "Expansion",
            items: ["Full TGE", "Global Partnerships", "Governance DAO"],
            active: false
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-xl flex flex-col items-center justify-start overflow-y-auto overflow-x-hidden text-cyan-200"
                >
                    {/* Header Bar */}
                    <div className="sticky top-0 left-0 right-0 h-16 min-h-[64px] z-[110] flex items-center justify-between px-6 bg-transparent pointer-events-none">
                        <button
                            onClick={onClose}
                            className="group flex items-center gap-2 text-cyan-400 hover:text-cyan-200 transition-colors pointer-events-auto"
                        >
                            <div className="p-2 rounded-full bg-cyan-950/30 group-hover:bg-cyan-900/50 transition-colors border border-cyan-900/50">
                                <ArrowLeft size={20} />
                            </div>
                            <span className="text-sm font-medium tracking-wide uppercase hidden sm:block">{t("stats.back")}</span>
                        </button>
                    </div>

                    <div className="max-w-md w-full px-6 py-12 space-y-10">
                        <div className="text-center space-y-4">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex flex-col items-center gap-4"
                            >
                                <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_30px_#00e6ff20]">
                                    <Map size={48} className="text-cyan-400" />
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight text-white uppercase italic">
                                    {t("menu.roadmap")}
                                </h1>
                            </motion.div>
                        </div>

                        <div className="space-y-8 relative">
                            {/* Connector Line */}
                            <div className="absolute left-6 top-8 bottom-8 w-[1px] bg-cyan-900" />

                            {phases.map((phase, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="relative pl-14"
                                >
                                    <div className={`absolute left-4 top-1.5 w-4 h-4 rounded-full border-2 border-black ${phase.active ? 'bg-cyan-400 shadow-[0_0_15px_#22d3ee]' : 'bg-cyan-900'}`} />
                                    <div className="space-y-2">
                                        <div className="flex items-baseline gap-3">
                                            <h3 className="text-cyan-400 font-bold uppercase tracking-widest text-xs">{phase.title}</h3>
                                            <span className="text-white font-semibold">{phase.subtitle}</span>
                                        </div>
                                        <ul className="space-y-1">
                                            {phase.items.map((item, i) => (
                                                <li key={i} className="text-sm text-cyan-100/60 leading-relaxed">• {item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
