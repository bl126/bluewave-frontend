"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface QuestCriterionCheck {
  id?: string;
  label?: string;
  done?: boolean;
  detail?: string;
  current?: number;
  target?: number;
}

const DEFAULT_BOXES = [
  { id: "verified_human", labelKey: "missions.quests.criterion_verified_human" },
  { id: "network_builder_badge", labelKey: "missions.quests.criterion_network_builder" },
  { id: "lifetime_entropy", labelKey: "missions.quests.criterion_entropy" },
];

interface QuestCriteriaPanelProps {
  checks?: QuestCriterionCheck[];
}

export default function QuestCriteriaPanel({ checks = [] }: QuestCriteriaPanelProps) {
  const { t } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const checkById = (id: string) => checks.find((c) => c.id === id);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-app-accent/80 px-1">
        {t("missions.quests.criteria_heading")}
      </h3>

      {DEFAULT_BOXES.map((box) => {
        const check = checkById(box.id);
        const done = !!check?.done;
        const isOpen = expandedId === box.id;

        return (
          <div key={box.id} className="flex flex-col gap-0">
            <button
              type="button"
              onClick={() => setExpandedId(isOpen ? null : box.id)}
              className={`w-full px-4 py-3.5 rounded-2xl border text-left transition-all duration-200
                ${isOpen ? "bg-app-accent/8 border-app-accent/35 rounded-b-none" : "bg-app-card/40 border-app-border hover:border-app-accent/25"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-black uppercase tracking-widest text-text-main">
                  {t(box.labelKey)}
                </span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-text-sub transition-transform duration-300 ${isOpen ? "rotate-180 text-app-accent" : ""}`}
                />
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-3 -mt-px rounded-b-2xl border border-t-0 border-app-accent/20 bg-app-accent/[0.04] flex items-start gap-3">
                    <CriterionCheckIcon done={done} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${done ? "text-app-accent" : "text-text-sub"}`}>
                        {done ? t("missions.quests.criterion_pass") : t("missions.quests.criterion_fail")}
                      </p>
                      {check?.detail && (
                        <p className="text-xs text-text-sub mt-1 leading-relaxed">{check.detail}</p>
                      )}
                      {box.id === "lifetime_entropy" && check?.current != null && (
                        <p className="text-[10px] font-mono text-app-accent/70 mt-2 uppercase tracking-wide">
                          {Number(check.current).toLocaleString()}
                          {check.target != null ? ` / ${Number(check.target).toLocaleString()}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function CriterionCheckIcon({ done }: { done: boolean }) {
  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
        done ? "bg-cyan-400 border-cyan-300" : "bg-transparent border-app-border"
      }`}
    >
      {done && <Check size={14} className="text-black stroke-[3px]" />}
    </div>
  );
}
