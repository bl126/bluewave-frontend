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
      whileTap={{ scale: 0.985 }}
      className="relative w-full text-left overflow-hidden rounded-[1.35rem] border border-white/[0.12]
        bg-gradient-to-br from-white/[0.11] via-white/[0.04] to-transparent
        backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_12px_40px_rgba(0,0,0,0.14)]
        hover:border-cyan-400/25 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/[0.06] via-transparent to-transparent pointer-events-none" />

      <div className="relative flex gap-4 p-5 min-h-[176px]">
        <div className="flex-1 flex flex-col justify-between gap-3 min-w-0 py-0.5">
          <span className="self-start px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em]
            bg-cyan-500/15 border border-cyan-400/20 text-cyan-300">
            {quest.category || "NFT"}
          </span>

          <h4 className="text-[15px] font-black text-text-main uppercase tracking-tight leading-snug line-clamp-3 pr-2">
            {quest.title}
          </h4>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold text-text-sub">
            {started && <span>{started}</span>}
            {started && subline && <span className="text-white/20">·</span>}
            {subline && <span className="text-cyan-400/90">{subline}</span>}
          </div>
        </div>

        <div className="shrink-0 w-[7.5rem] h-[7.5rem] sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-white/15 bg-black/20 shadow-lg self-center">
          {quest.image_url ? (
            <img src={quest.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-cyan-400/30 text-3xl font-black">?</div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
