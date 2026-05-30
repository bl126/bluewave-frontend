"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { QuestCriterionCheck } from "@/lib/questsApi";

/* ── Translation lookup table ─────────────────────────────────────────────── */
const LABEL_KEYS: Record<string, string> = {
  verified_human: "missions.quests.criterion_verified_human",
  network_builder_badge: "missions.quests.criterion_network_builder",
  lifetime_entropy: "missions.quests.criterion_entropy",
  streak_20days: "missions.quests.criterion_streak_20days",
  network_verified_humans: "missions.quests.criterion_network_verified_humans",
};

interface QuestCriteriaPanelProps {
  checks?: QuestCriterionCheck[];
  animateReveal?: boolean;
  revealIndex?: number;
}

export default function QuestCriteriaPanel({ checks = [], animateReveal = false, revealIndex = 999 }: QuestCriteriaPanelProps) {
  const { t } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-app-accent/80 px-1">
        {t("missions.quests.criteria_heading") || "QUEST ELIGIBILITY CRITERIA"}
      </h3>

      {checks.map((check, idx) => {
        const done = !!check.done;
        const isOpen = expandedId === check.id;

        // Determine reveal status if animating
        const isRevealed = !animateReveal || revealIndex >= idx;
        const isScanning = animateReveal && revealIndex === idx;

        // Resolve display label (translation → API label → id)
        const labelKey = LABEL_KEYS[check.id];
        const translated = labelKey ? t(labelKey) : undefined;
        const displayLabel = (translated && translated !== labelKey) ? translated : (check.label || check.id);

        return (
          <motion.div
            key={check.id}
            initial={animateReveal ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="flex flex-col gap-0"
          >
            <button
              type="button"
              disabled={!isRevealed}
              onClick={() => setExpandedId(isOpen ? null : check.id)}
              className={`w-full px-4 py-3.5 rounded-2xl border text-left transition-all duration-200
                ${!isRevealed ? "bg-app-card/10 border-app-border/40 opacity-40 cursor-not-allowed" : ""}
                ${isOpen ? "bg-app-accent/8 border-app-accent/35 rounded-b-none" : ""}
                ${isRevealed && !isOpen ? "bg-app-card/40 border-app-border hover:border-app-accent/25" : ""}
                ${isScanning ? "bg-app-accent/[0.03] border-app-accent/25 shadow-[0_0_12px_rgba(6,182,212,0.05)]" : ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Status Indicator inside header for scanning/revealed checks */}
                  {isScanning ? (
                    <Loader2 size={13} className="text-cyan-400 animate-spin shrink-0" />
                  ) : isRevealed ? (
                    <CriterionCheckIcon done={done} />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-app-border/40 shrink-0 bg-app-card/20" />
                  )}
                  <span className={`text-[11px] font-black uppercase tracking-widest truncate ${isScanning ? "text-cyan-400" : "text-text-main"}`}>
                    {displayLabel}
                  </span>
                </div>
                {isRevealed && (
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-text-sub transition-transform duration-300 ${isOpen ? "rotate-180 text-app-accent" : ""}`}
                  />
                )}
                {isScanning && (
                  <span className="text-[8px] font-black text-cyan-400/90 tracking-widest uppercase animate-pulse">
                    Scanning...
                  </span>
                )}
              </div>
            </button>

            <AnimatePresence>
              {isOpen && isRevealed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-3 -mt-px rounded-b-2xl border border-t-0 border-app-accent/20 bg-app-accent/[0.04] flex items-start gap-2.5">
                    <CriterionCheckIcon done={done} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-black uppercase tracking-wider ${done ? "text-app-accent" : "text-red-400/90"}`}>
                        {done ? t("missions.quests.criterion_pass") || "CRITERION PASSED" : t("missions.quests.criterion_fail") || "NOT ELIGIBLE"}
                      </p>
                      {check.detail && (
                        <p className="text-xs text-text-sub mt-1 leading-relaxed">{check.detail}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

interface CriterionCheckIconProps {
  done: boolean;
  size?: "sm" | "md";
}

function CriterionCheckIcon({ done, size = "sm" }: CriterionCheckIconProps) {
  const isMd = size === "md";
  const containerClass = isMd ? "w-5 h-5 rounded-[6px]" : "w-4 h-4 rounded-[5px]";
  const iconSize = isMd ? 12 : 9;

  return (
    <div
      className={`${containerClass} flex items-center justify-center shrink-0 border transition-all duration-300 ${
        done 
          ? "bg-cyan-400 border-cyan-300/80 shadow-[0_0_8px_rgba(34,211,238,0.25)]" 
          : "bg-red-500/10 border-red-500/30"
      }`}
    >
      {done ? (
        <Check size={iconSize} className="text-black stroke-[3px]" />
      ) : (
        <X size={iconSize} className="text-red-400 stroke-[3px]" />
      )}
    </div>
  );
}
