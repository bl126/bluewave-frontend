"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchQuestBoardPass, type BoardPassLeader } from "@/lib/questsApi";
import { QUEST_BOARD_PASS_MOCK } from "./questBoardPassMock";

interface QuestBoardPassProps {
  questId: string;
  myTelegramId?: number;
  useMockWhenEmpty?: boolean;
}

function Avatar({ user, isMe }: { user: BoardPassLeader; isMe: boolean }) {
  const [err, setErr] = useState(false);
  const initial = (user.name || "U").charAt(0).toUpperCase();
  return (
    <div
      className={`w-10 h-10 rounded-full overflow-hidden shrink-0 border ${
        isMe ? "border-app-accent shadow-app-shadow" : "border-app-border"
      }`}
    >
      {user.photo_url && !err ? (
        <img src={user.photo_url} alt="" className="w-full h-full object-cover" onError={() => setErr(true)} />
      ) : (
        <div className="w-full h-full bg-app-accent/10 flex items-center justify-center text-app-accent font-black text-sm">
          {initial}
        </div>
      )}
    </div>
  );
}

function rankLabel(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function QuestBoardPass({
  questId,
  myTelegramId,
  useMockWhenEmpty = true,
}: QuestBoardPassProps) {
  const { t } = useLanguage();
  const [leaders, setLeaders] = useState<BoardPassLeader[]>([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchQuestBoardPass(questId).then((res) => {
      if (!cancelled && res && !res.error) {
        setLeaders(res.leaders || []);
      }
      if (!cancelled) setFetched(true);
    });
    return () => {
      cancelled = true;
    };
  }, [questId]);

  const isMock = fetched && leaders.length === 0 && useMockWhenEmpty;
  const display = isMock ? QUEST_BOARD_PASS_MOCK : leaders;

  return (
    <div className="flex flex-col gap-4 pt-4 border-t border-app-border/60">
      <div className="flex items-center justify-between px-1 gap-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-app-accent/80">
          {t("missions.quests.board_pass_title")}
        </h3>
        <div className="flex items-center gap-2">
          {isMock && (
            <span className="text-[8px] font-black uppercase tracking-widest text-cyan-400/60 border border-cyan-400/20 px-2 py-0.5 rounded-full">
              {t("missions.quests.board_pass_preview")}
            </span>
          )}
          {fetched && (
            <span className="text-[9px] font-bold text-text-sub uppercase tracking-widest">
              {display.length} {t("missions.quests.board_pass_minted")}
            </span>
          )}
        </div>
      </div>

      {!fetched && (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-2xl bg-app-accent/5 border border-app-border" />
          ))}
        </div>
      )}

      {fetched &&
        display.map((u, idx) => {
          const isMe = !isMock && String(u.telegram_id) === String(myTelegramId);
          return (
            <motion.div
              key={`${u.telegram_id}-${idx}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(idx * 0.04, 0.35) }}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-colors
                ${isMe ? "bg-app-accent/10 border-app-accent/40" : "bg-app-bg/30 border-app-border"}
                ${isMock ? "opacity-85" : ""}`}
            >
              <span
                className={`font-black text-sm w-10 text-center shrink-0 ${isMe ? "text-app-accent" : "text-text-sub"}`}
              >
                {rankLabel(u.rank)}
              </span>
              <Avatar user={u} isMe={isMe} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-black text-text-main truncate text-sm">{u.name}</p>
                  {u.country_flag && <span className="text-sm leading-none">{u.country_flag}</span>}
                </div>
                {u.bw_id && (
                  <p className="text-[9px] text-text-sub font-mono truncate mt-0.5">{u.bw_id}</p>
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-app-accent/70 shrink-0">
                {t("missions.quests.board_pass_holder")}
              </span>
            </motion.div>
          );
        })}
    </div>
  );
}
