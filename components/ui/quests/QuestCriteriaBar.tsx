"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CriteriaRequirement {
  id?: string;
  label?: string;
  type?: string;
  target?: number;
}

interface QuestCriteriaBarProps {
  summary: string;
  requirements?: CriteriaRequirement[];
  checks?: { id?: string; label?: string; done?: boolean }[];
}

export default function QuestCriteriaBar({ summary, requirements = [], checks = [] }: QuestCriteriaBarProps) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();

  const mergedChecks = requirements.length
    ? requirements.map((r) => {
        const found = checks.find((c) => c.id === r.id);
        return { id: r.id, label: r.label || r.id, done: found?.done ?? false };
      })
    : checks;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-4 py-3 rounded-2xl border text-left transition-all duration-200
          ${expanded ? "bg-app-accent/5 border-app-accent/30" : "bg-app-accent/[0.02] border-app-border"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold text-text-main leading-snug line-clamp-2">{summary}</span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-text-sub transition-transform duration-300 ${expanded ? "rotate-180 text-app-accent" : ""}`}
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 flex flex-col gap-2 border border-app-border rounded-2xl bg-app-card/30">
              <p className="text-[9px] font-black uppercase tracking-widest text-text-sub">
                {t("missions.quests.criteria_title")}
              </p>
              {mergedChecks.length === 0 ? (
                <p className="text-xs text-text-sub italic">{t("missions.quests.criteria_empty")}</p>
              ) : (
                mergedChecks.map((c) => (
                  <div key={c.id || c.label} className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                        c.done ? "bg-app-accent border-app-accent" : "border-app-border bg-transparent"
                      }`}
                    >
                      {c.done && <Check size={10} className="text-app-bg stroke-[3px]" />}
                    </div>
                    <span className={`text-[11px] font-semibold ${c.done ? "text-app-accent" : "text-text-sub"}`}>
                      {c.label}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
