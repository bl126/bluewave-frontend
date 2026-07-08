"use client";

import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ChevronDown, Check, Star, Zap, Target, Shield, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
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
    const dragControls = useDragControls();

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

    useEffect(() => {
        if (!isOpen) return;

        const handleBack = () => {
            onClose();
        };

        if (typeof window !== "undefined") {
            (window as any).bwBackStack = (window as any).bwBackStack || [];
            (window as any).bwBackStack.push(handleBack);
        }

        const handleNativeBack = (e: Event) => {
            const stack = (window as any).bwBackStack || [];
            if (stack[stack.length - 1] === handleBack) {
                e.preventDefault();
                handleBack();
            }
        };

        window.addEventListener("bwNativeBack", handleNativeBack);

        return () => {
            window.removeEventListener("bwNativeBack", handleNativeBack);
            if (typeof window !== "undefined") {
                (window as any).bwBackStack = ((window as any).bwBackStack || []).filter(
                    (item: any) => item !== handleBack
                );
            }
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop — above nav */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[998] bg-app-bg/60 backdrop-blur-sm"
                    />

                    {/* Sheet — above nav */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        drag="y"
                        dragControls={dragControls}
                        dragListener={false}
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100) onClose();
                        }}
                        className="fixed bottom-0 left-0 right-0 z-[999] bg-app-card border-t border-app-border rounded-t-[2.5rem] flex flex-col max-h-[70vh] shadow-app-shadow text-text-main"
                    >
                        {/* Drag Handle */}
                        <div
                            onPointerDown={(e) => dragControls.start(e)}
                            className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing touch-none"
                        >
                            <div className="w-12 h-1.5 bg-app-border/50 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="p-4 flex flex-col items-center border-b border-app-border text-center">
                            <h2 className="text-text-main text-lg font-black uppercase tracking-tight">{t("level_popup.title")}</h2>
                            <p className="text-text-sub text-[8px] font-bold uppercase tracking-widest mt-0.5">{t("level_popup.subtitle")}</p>
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
                                            ? "bg-app-accent/5 border-app-accent/30"
                                            : "bg-app-accent/[0.02] border-app-border opacity-60"
                                            }`}
                                    >
                                        {/* Level Card Header */}
                                        <button
                                            onClick={() => setExpandedLevel(isExpanded ? 0 : lvl.level)}
                                            className="w-full p-3.5 flex items-center gap-4 text-left"
                                        >
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-lg ${isCompleted || isCurrent
                                                ? (roleData?.border ? `${roleData.border} bg-app-accent/10 text-app-accent` : "border-app-accent/20 bg-app-accent/10 text-app-accent")
                                                : "border-app-border bg-app-accent/5 text-text-muted"
                                                }`}>
                                                <lvl.icon size={18} />
                                            </div>

                                            <div className="flex-1 flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isCompleted || isCurrent ? "text-text-main" : "text-text-sub"}`}>
                                                        {t("level_popup.level")} {lvl.level}
                                                    </span>
                                                    {isCompleted && (
                                                        <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-app-accent">
                                                            <Check size={8} className="text-app-bg stroke-[4px]" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`text-[9px] font-bold uppercase tracking-widest ${isCompleted || isCurrent ? "text-app-accent" : "text-text-muted"}`}>
                                                    {roleData?.name || lvl.role}
                                                </span>
                                            </div>

                                            <div className={`transition-transform duration-300 ${isExpanded ? "rotate-180 text-app-accent" : "text-text-muted"}`}>
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
                                                    <div className="px-5 pb-5 flex flex-col gap-3 border-t border-app-accent/10 pt-4">
                                                        {lvl.criteria.map((cri) => {
                                                            const current = getMetricValue(cri.id);
                                                            const target = cri.target;
                                                            const progress = Math.min((current / target) * 100, 100);
                                                            const done = current >= target;

                                                            return (
                                                                <div key={cri.id} className="flex flex-col gap-2">
                                                                    <div className="flex flex-row items-start justify-between gap-3">
                                                                        <span className="text-[9px] font-black uppercase tracking-wider text-text-sub flex-1 min-w-0 leading-tight">
                                                                            {cri.label.includes('.') ? t(cri.label) : cri.label}
                                                                        </span>
                                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                                            {done ? (
                                                                                <Check size={10} className="text-app-accent" />
                                                                            ) : null}
                                                                            <span className={`text-[9px] font-mono ${done ? "text-app-accent" : "text-text-muted"}`}>
                                                                                {cri.type === "boolean"
                                                                                    ? (done ? t("level_popup.verified") : t("level_popup.not_yet"))
                                                                                    : cri.type === "default"
                                                                                        ? t("level_popup.active")
                                                                                        : `${current.toLocaleString()}/${target.toLocaleString()}`}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {cri.type !== "default" && (
                                                                        <div className="h-1 w-full bg-app-accent/5 rounded-full overflow-hidden">
                                                                            <motion.div
                                                                                className="h-full bg-app-accent shadow-app-shadow"
                                                                                initial={{ width: 0 }}
                                                                                animate={{ width: `${progress}%` }}
                                                                                transition={{ duration: 1, ease: "easeOut" }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}

                                                        <div className="mt-1 p-3 bg-app-accent/5 rounded-2xl border border-app-border">
                                                            <p className="text-[8px] text-app-accent/60 font-medium leading-relaxed uppercase tracking-tighter">
                                                                {roleData?.desc || t("level_popup.default_desc")}
                                                            </p>
                                                            <p className="text-[8px] text-app-accent mt-0.5 font-bold uppercase">
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
                </>
            )}
        </AnimatePresence>
    );
}
