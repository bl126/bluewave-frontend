"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Check, Star, Zap, Target, Shield, Trophy } from "lucide-react";
import { useState } from "react";
import { findRoleByName } from "@/lib/roles";
import { useLanguage } from "@/contexts/LanguageContext";

interface LevelCriterion {
    id: string;
    label: string;
    target: number;
    type?: "number" | "boolean" | "default";
}

interface LevelData {
    level: number;
    role: string;
    icon: any;
    criteria: LevelCriterion[];
}

const LEVELS: LevelData[] = [
    {
        level: 1,
        role: "LEVEL 1",
        icon: Star,
        criteria: [
            { id: "default", label: "level_popup.protocol_entry", target: 1, type: "default" }
        ]
    },
    {
        level: 2,
        role: "LEVEL 2",
        icon: Zap,
        criteria: [
            { id: "commits", label: "level_popup.presence_commits", target: 50 },
            { id: "points", label: "level_popup.bwave_points", target: 10000 },
            { id: "networks", label: "level_popup.human_networks", target: 5 },
            { id: "streak", label: "level_popup.streak_days", target: 10 },
            { id: "verified", label: "level_popup.level_verified", target: 1, type: "boolean" }
        ]
    },
    {
        level: 3,
        role: "LEVEL 3",
        icon: Target,
        criteria: [
            { id: "commits", label: "level_popup.presence_commits", target: 500 },
            { id: "points", label: "level_popup.bwave_points", target: 100000 },
            { id: "networks", label: "level_popup.human_networks", target: 20 },
            { id: "streak", label: "level_popup.streak_days", target: 50 },
            { id: "verified", label: "level_popup.level_verified", target: 1, type: "boolean" }
        ]
    },
    {
        level: 4,
        role: "LEVEL 4",
        icon: Shield,
        criteria: [
            { id: "commits", label: "level_popup.presence_commits", target: 1000 },
            { id: "points", label: "level_popup.bwave_points", target: 500000 },
            { id: "networks", label: "level_popup.human_networks", target: 50 },
            { id: "streak", label: "level_popup.streak_days", target: 100 },
            { id: "verified", label: "level_popup.level_verified", target: 1, type: "boolean" }
        ]
    },
    {
        level: 5,
        role: "LEVEL 5",
        icon: Trophy,
        criteria: [
            { id: "commits", label: "level_popup.presence_commits", target: 10000 },
            { id: "points", label: "level_popup.bwave_points", target: 1000000 },
            { id: "networks", label: "level_popup.human_networks", target: 100 },
            { id: "badges", label: "level_popup.role_badge", target: 5 },
            { id: "verified", label: "level_popup.level_verified", target: 1, type: "boolean" }
        ]
    }
];

interface LevelPopupProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
}

export default function LevelPopup({ isOpen, onClose, user }: LevelPopupProps) {
    const [expandedLevel, setExpandedLevel] = useState<number>(0);
    const { t } = useLanguage();

    const getMetricValue = (id: string) => {
        if (!user) return 0;
        switch (id) {
            case "commits": return user.presence_commits || 0;
            case "points": return user.points_balance || 0;
            case "networks": return user.verified_human_networks || 0;
            case "streak": return user.streak_days || 0;
            case "verified": return (user.roles || []).includes("Verified Human") ? 1 : 0;
            case "badges": return (user.roles || []).filter((r: string) => !r.startsWith("LEVEL ")).length;
            case "default": return 1;
            default: return 0;
        }
    };

    const isLevelCompleted = (levelNum: number) => {
        if (!user?.level) return false;
        return parseInt(user.level) >= levelNum;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="relative w-full max-w-sm bg-[#050505] border border-cyan-500/20 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[65vh] shadow-[0_0_50px_rgba(6,182,212,0.2)]"
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Exit Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-cyan-400 hover:text-cyan-300 transition-colors z-[160]"
                        >
                            <X size={16} />
                        </button>

                        {/* Header */}
                        <div className="p-4 pt-6 flex flex-col items-center border-b border-white/5 text-center">
                            <h2 className="text-white text-lg font-black uppercase tracking-tight">{t("level_popup.title")}</h2>
                            <p className="text-cyan-500/50 text-[8px] font-bold uppercase tracking-widest mt-0.5">{t("level_popup.subtitle")}</p>
                        </div>

                        {/* Content - Scrollable Accordion */}
                        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 pb-24 custom-scrollbar">
                            {LEVELS.map((lvl) => {
                                const isExpanded = expandedLevel === lvl.level;
                                const isCompleted = isLevelCompleted(lvl.level);
                                const isCurrent = parseInt(user?.level || "1") === lvl.level;
                                const roleData = findRoleByName(lvl.role);

                                return (
                                    <div
                                        key={lvl.level}
                                        className={`border transition-all duration-300 rounded-[2rem] overflow-hidden ${isExpanded
                                            ? "bg-cyan-500/5 border-cyan-500/30"
                                            : "bg-white/[0.02] border-white/5 opacity-60"
                                            }`}
                                    >
                                        {/* Level Card Header */}
                                        <button
                                            onClick={() => setExpandedLevel(isExpanded ? 0 : lvl.level)}
                                            className="w-full p-3.5 flex items-center gap-4 text-left"
                                        >
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-lg ${isCompleted || isCurrent
                                                ? (roleData?.border ? `${roleData.border} bg-cyan-500/10 text-cyan-400` : "border-cyan-500/20 bg-cyan-500/10 text-cyan-400")
                                                : "border-white/10 bg-white/5 text-white/20"
                                                }`}>
                                                <lvl.icon size={18} />
                                            </div>

                                            <div className="flex-1 flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isCompleted || isCurrent ? "text-white" : "text-white/40"}`}>
                                                        {t("level_popup.level")} {lvl.level}
                                                    </span>
                                                    {isCompleted && (
                                                        <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#00E6FF]">
                                                            <Check size={8} className="text-black stroke-[4px]" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`text-[9px] font-bold uppercase tracking-widest ${isCompleted || isCurrent ? "text-cyan-400" : "text-white/20"}`}>
                                                    {roleData?.name || lvl.role}
                                                </span>
                                            </div>

                                            <div className={`transition-transform duration-300 ${isExpanded ? "rotate-180 text-cyan-400" : "text-white/20"}`}>
                                                <ChevronDown size={16} />
                                            </div>
                                        </button>

                                        {/* Accordion Content */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-5 pb-5 flex flex-col gap-3 border-t border-cyan-500/10 pt-4">
                                                        {lvl.criteria.map((cri) => {
                                                            const current = getMetricValue(cri.id);
                                                            const target = cri.target;
                                                            const progress = Math.min((current / target) * 100, 100);
                                                            const done = current >= target;

                                                            return (
                                                                <div key={cri.id} className="flex flex-col gap-2">
                                                                    <div className="flex flex-row items-start justify-between gap-3">
                                                                        <span className="text-[9px] font-black uppercase tracking-wider text-white/60 flex-1 min-w-0 leading-tight">
                                                                            {cri.label.includes('.') ? t(cri.label) : cri.label}
                                                                        </span>
                                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                                            {done ? (
                                                                                <Check size={10} className="text-[#00E6FF]" />
                                                                            ) : null}
                                                                            <span className={`text-[9px] font-mono ${done ? "text-cyan-400" : "text-white/30"}`}>
                                                                                {cri.type === "boolean"
                                                                                    ? (done ? t("level_popup.verified") : t("level_popup.not_yet"))
                                                                                    : cri.type === "default"
                                                                                        ? t("level_popup.active")
                                                                                        : `${current.toLocaleString()}/${target.toLocaleString()}`}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {cri.type !== "default" && (
                                                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                                            <motion.div
                                                                                className="h-full bg-cyan-500 shadow-[0_0_8px_#00e6ff]"
                                                                                initial={{ width: 0 }}
                                                                                animate={{ width: `${progress}%` }}
                                                                                transition={{ duration: 1, ease: "easeOut" }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}

                                                        <div className="mt-1 p-3 bg-cyan-500/5 rounded-2xl border border-cyan-500/10">
                                                            <p className="text-[8px] text-cyan-400/60 font-medium leading-relaxed uppercase tracking-tighter">
                                                                {roleData?.desc || t("level_popup.default_desc")}
                                                            </p>
                                                            <p className="text-[8px] text-cyan-400 mt-0.5 font-bold uppercase">
                                                                {t("level_popup.benefit")} {roleData?.benefit || t("level_popup.default_benefit")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
