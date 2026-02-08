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
            subtitle: "Foundation & Early Adoption",
            items: [
                "Daily Missions, Streaks & Global Tracker",
                "Organic Growth to 250+ active users",
                "Community Builders Team Launch",
                "AI PvP 1 & 1.1 Anti-Bot protocol active",
                "Milestone: 10k users +",
                "Expansion to 20+ countries"
            ],
            status: "Currently",
            active: true
        },
        {
            title: "Phase II",
            subtitle: "On-Chain Expansion & Utility",
            items: [
                "TON Presence Ledger deployment",
                "MVP implementation to the BTP",
                "Ethical Marketplace Beta",
                "Milestone: 100k - 500k users",
                "Next: 5M + mission completion"
            ],
            status: "Soon",
            active: false
        },
        {
            title: "Phase III",
            subtitle: "Scale & Ecosystem Growth",
            items: [
                "Full TGE (Token Generation Event)",
                "Full B2B Marketplace Integration",
                "DAO Governance Activation",
                "Milestone: 1M+ Active Users",
                "Global Protocol Partnerships"
            ],
            status: "Future",
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
                    className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-xl flex flex-col items-center justify-start overflow-y-auto overflow-x-hidden text-cyan-200"
                >
                    {/* Header Bar */}
                    <div className="sticky top-0 left-0 right-0 h-16 min-h-[64px] z-[130] flex items-center justify-between px-6 bg-transparent pointer-events-none">
                        <button
                            onClick={onClose}
                            className="group flex items-center gap-2 text-cyan-400 hover:text-cyan-200 transition-colors pointer-events-auto"
                        >
                            <div className="p-2 rounded-full bg-cyan-950/30 group-hover:bg-cyan-900/50 transition-colors border border-cyan-900/50 shadow-[0_0_15px_-5px_#22d3ee]">
                                <ArrowLeft size={20} />
                            </div>
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
                            <div className="absolute left-6 top-8 bottom-8 w-[1px] bg-cyan-900/50" />

                            {phases.map((phase, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`relative pl-14 ${!phase.active ? 'opacity-40 filter grayscale' : ''}`}
                                >
                                    <div className={`absolute left-4 top-1.5 w-4 h-4 rounded-full border-2 border-black ${phase.active ? 'bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-pulse' : 'bg-cyan-900'}`} />
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className={`font-bold uppercase tracking-widest text-xs ${phase.active ? 'text-cyan-400' : 'text-gray-500'}`}>{phase.title}</h3>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${phase.active ? 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10' : 'text-gray-500 border-gray-700 bg-gray-800/50'}`}>
                                                {phase.status}
                                            </span>
                                        </div>
                                        <div>
                                            <div className={`font-semibold mb-2 ${phase.active ? 'text-white' : 'text-gray-400'}`}>{phase.subtitle}</div>
                                            <ul className="space-y-1">
                                                {phase.items.map((item, i) => (
                                                    <li key={i} className={`text-sm leading-relaxed flex items-start gap-2 ${phase.active ? 'text-cyan-100/80' : 'text-gray-500'}`}>
                                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-current flex-shrink-0" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
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
