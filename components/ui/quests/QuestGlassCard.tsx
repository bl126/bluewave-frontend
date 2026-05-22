"use client";

import { motion } from "framer-motion";
import type { QuestListItem } from "@/lib/questsApi";

interface QuestGlassCardProps {
  quest: QuestListItem;
  onOpen: () => void;
}

function formatStarted(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

export default function QuestGlassCard({ quest, onOpen }: QuestGlassCardProps) {
  const subline = quest.counter?.display || "";
  const started = formatStarted(quest.started_at);

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileTap={{ scale: 0.98 }}
      className="relative w-full text-left overflow-hidden rounded-2xl border border-white/10
        bg-gradient-to-br from-white/[0.09] via-app-accent/[0.03] to-transparent
        backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_8px_32px_rgba(0,0,0,0.12)]
        hover:border-app-accent/30 transition-colors duration-200"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-app-accent/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative flex gap-3 p-4 min-h-[88px]">
        <div className="flex-1 flex flex-col justify-between gap-2 min-w-0">
          <span className="self-start px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest
            bg-app-accent/15 border border-app-border text-app-accent">
            {quest.category || "QUEST"}
          </span>

          <h4 className="text-[13px] font-black text-text-main uppercase tracking-tight leading-snug line-clamp-2 pr-1">
            {quest.title}
          </h4>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-bold text-text-sub">
            {started && <span>{started}</span>}
            {started && subline && <span className="text-app-border">·</span>}
            {subline && <span className="text-app-accent/80">{subline}</span>}
          </div>
        </div>

        <div className="shrink-0 w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-xl overflow-hidden border border-white/10 bg-app-card/50">
          {quest.image_url ? (
            <img src={quest.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-app-accent/40 text-2xl font-black">
              ?
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
