"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Check, Star, Zap, Target, Shield, Trophy } from "lucide-react";
import { useState } from "react";
import { findRoleByName } from "@/lib/roles";

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
            { id: "default", label: "Protocol Entry", target: 1, type: "default" }
        ]
    },
    {
        level: 2,
        role: "LEVEL 2",
        icon: Zap,
        criteria: [
            { id: "commits", label: "Presence Commits", target: 50 },
            { id: "points", label: "$BWAVE Points", target: 10000 },
            { id: "networks", label: "Verified Human Networks", target: 5 },
            { id: "streak", label: "Streak Days", target: 10 },
            { id: "verified", label: "Verified Human", target: 1, type: "boolean" }
        ]
    },
    {
        level: 3,
        role: "LEVEL 3",
        icon: Target,
        criteria: [
            { id: "commits", label: "Presence Commits", target: 500 },
            { id: "points", label: "$BWAVE Points", target: 100000 },
            { id: "networks", label: "Verified Human Networks", target: 20 },
            { id: "streak", label: "Streak Days", target: 50 },
            { id: "verified", label: "Verified Human", target: 1, type: "boolean" }
        ]
    },
    {
        level: 4,
        role: "LEVEL 4",
        icon: Shield,
        criteria: [
            { id: "commits", label: "Presence Commits", target: 1000 },
            { id: "points", label: "$BWAVE Points", target: 500000 },
            { id: "networks", label: "Verified Human Networks", target: 50 },
            { id: "streak", label: "Streak Days", target: 100 },
            { id: "verified", label: "Verified Human", target: 1, type: "boolean" }
        ]
    },
    {
        level: 5,
        role: "LEVEL 5",
        icon: Trophy,
        criteria: [
            { id: "commits", label: "Presence Commits", target: 10000 },
            { id: "points", label: "$BWAVE Points", target: 1000000 },
            { id: "networks", label: "Verified Human Networks", target: 100 },
            { id: "badges", label: "Role Badge Holder", target: 5 },
            { id: "verified", label: "Verified Human", target: 1, type: "boolean" }
        ]
    }
];

interface LevelPopupProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
}

export default function LevelPopup({ isOpen, onClose, user }: LevelPopupProps) {
    const [expandedLevel, setExpandedLevel] = useState<number>(user?.level ? parseInt(user.level) : 1);

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
                        className="relative w-full max-w-sm bg-[#050505] border border-cyan-500/20 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[85vh] shadow-[0_0_50px_rgba(6,182,212,0.2)]"
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Exit Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-cyan-400 hover:text-cyan-400 transition-colors z-[160]"
                        >
                            <X size={20} />
                        </button>

                        {/* Header */}
                        <div className="p-8 pt-10 flex flex-col items-center border-b border-white/5 text-center">
                            <h2 className="text-white text-2xl font-black uppercase tracking-tight">Level System</h2>
                            <p className="text-cyan-500/50 text-[10px] font-bold uppercase tracking-widest mt-1">Your Presence Journey</p>
                        </div>

                        {/* Content - Scrollable Accordion */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-10">
                            {LEVELS.map((lvl) => {
                                const isExpanded = expandedLevel === lvl.level;
                                const isCompleted = isLevelCompleted(lvl.level);
                                const isCurrent = parseInt(user?.level || "1") === lvl.level;
                                const roleData = findRoleByName(lvl.role);

                                return (
                                    <div
                                        key={lvl.level}
                                        className={`border transition-all duration-300 rounded-3xl overflow-hidden ${isExpanded
                                            ? "bg-cyan-500/5 border-cyan-500/30"
                                            : "bg-white/[0.02] border-white/5 opacity-60"
                                            }`}
                                    >
                                        {/* Level Card Header */}
                                        <button
                                            onClick={() => setExpandedLevel(isExpanded ? 0 : lvl.level)}
                                            className="w-full p-5 flex items-center gap-4 text-left"
                                        >
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${isCompleted || isCurrent
                                                ? (roleData?.border ? `${roleData.border} bg-cyan-500/10 text-cyan-400` : "border-cyan-500/20 bg-cyan-500/10 text-cyan-400")
                                                : "border-white/10 bg-white/5 text-white/20"
                                                }`}>
                                                <lvl.icon size={22} />
                                            </div>

                                            <div className="flex-1 flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-black uppercase tracking-widest ${isCompleted || isCurrent ? "text-white" : "text-white/40"}`}>
                                                        LEVEL {lvl.level}
                                                    </span>
                                                    {isCompleted && (
                                                        <div className="flex items-center justify-center w-4 h-4 rounded-full bg-cyan-500">
                                                            <Check size={10} className="text-black stroke-[4px]" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isCompleted || isCurrent ? "text-cyan-400" : "text-white/20"}`}>
                                                    {roleData?.name || lvl.role}
                                                </span>
                                            </div>

                                            <div className={`transition-transform duration-300 ${isExpanded ? "rotate-180 text-cyan-400" : "text-white/20"}`}>
                                                <ChevronDown size={20} />
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
                                                    <div className="px-5 pb-6 flex flex-col gap-4 border-t border-cyan-500/10 pt-4">
                                                        {lvl.criteria.map((cri) => {
                                                            const current = getMetricValue(cri.id);
                                                            const target = cri.target;
                                                            const progress = Math.min((current / target) * 100, 100);
                                                            const done = current >= target;

                                                            return (
                                                                <div key={cri.id} className="flex flex-col gap-2">
                                                                    <div className="flex justify-between items-end">
                                                                        <span className="text-[10px] font-black uppercase tracking-wider text-white/60">
                                                                            {cri.label}
                                                                        </span>
                                                                        <div className="flex items-center gap-1.5">
                                                                            {done ? (
                                                                                <Check size={12} className="text-cyan-400" />
                                                                            ) : null}
                                                                            <span className={`text-[10px] font-mono ${done ? "text-cyan-400" : "text-white/30"}`}>
                                                                                {cri.type === "boolean"
                                                                                    ? (done ? "VERIFIED" : "NOT YET")
                                                                                    : cri.type === "default"
                                                                                        ? "ACTIVE"
                                                                                        : `${current.toLocaleString()}/${target.toLocaleString()}`}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {cri.type !== "default" && (
                                                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                                            <motion.div
                                                                                className="h-full bg-cyan-500 shadow-[0_0_10px_#00e6ff]"
                                                                                initial={{ width: 0 }}
                                                                                animate={{ width: `${progress}%` }}
                                                                                transition={{ duration: 1, ease: "easeOut" }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}

                                                        <div className="mt-2 p-3 bg-cyan-500/5 rounded-2xl border border-cyan-500/10">
                                                            <p className="text-[9px] text-cyan-400/60 font-medium leading-relaxed uppercase tracking-tighter">
                                                                {roleData?.desc || "Complete all criteria to unlock this level and its exclusive ecosystem benefits."}
                                                            </p>
                                                            <p className="text-[9px] text-cyan-400 mt-1 font-bold uppercase">
                                                                Benefit: {roleData?.benefit || "Unlocked higher status."}
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
