"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { canAdminQuests } from "@/lib/questAccess";
import { useApi } from "@/lib/useApi";
import { fetchQuestBySlug, type QuestListItem } from "@/lib/questsApi";
import QuestGlassCard from "./QuestGlassCard";
import QuestDetailOverlay from "./QuestDetailOverlay";

interface QuestTabPanelProps {
  telegramUser: { id?: number; roles?: string[]; is_human_verified?: boolean; total_referrals?: number } | null;
  isHumanVerified: boolean;
  isMissionOpen?: boolean;
  onToast?: (msg: string) => void;
}

function QuestCardSkeleton() {
  return (
    <div className="relative w-full overflow-hidden rounded-[1.35rem] border border-white/[0.08] bg-white/[0.03] animate-pulse">
      <div className="flex gap-4 p-5 min-h-[176px]">
        {/* Left side text/content placeholders */}
        <div className="flex-1 flex flex-col justify-between gap-3 min-w-0 py-0.5">
          {/* Category Tag placeholder */}
          <div className="w-16 h-5 rounded-full bg-white/[0.08]" />
          
          {/* Title placeholders */}
          <div className="space-y-2 pr-2">
            <div className="h-4 w-[85%] rounded bg-white/[0.08]" />
            <div className="h-4 w-[60%] rounded bg-white/[0.08]" />
          </div>

          {/* Subline placeholder */}
          <div className="h-3.5 w-1/2 rounded bg-white/[0.08]" />
        </div>

        {/* Right side Image box placeholder */}
        <div className="shrink-0 w-[7.5rem] h-[7.5rem] sm:w-32 sm:h-32 rounded-2xl bg-white/[0.08] border border-white/5 self-center" />
      </div>
    </div>
  );
}

export default function QuestTabPanel({
  telegramUser,
  isHumanVerified,
  isMissionOpen = true,
  onToast,
}: QuestTabPanelProps) {
  const { t } = useLanguage();
  const [selectedQuest, setSelectedQuest] = useState<QuestListItem | null>(null);

  const isAdmin = canAdminQuests(telegramUser?.id, (telegramUser as any)?.bw_id);

  const { data, loading: isLoading } = useApi(
    isAdmin && isMissionOpen ? `/quests?filter=waves` : null,
    { revalidateOnFocus: false, dedupingInterval: 120000 }
  );

  const quests: QuestListItem[] = isAdmin && data && !data.error ? data.quests || [] : [];
  const showListLoader = isLoading && quests.length === 0;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("questDetailOpen", { detail: !!selectedQuest }));
    return () => {
      if (selectedQuest) {
        window.dispatchEvent(new CustomEvent("questDetailOpen", { detail: false }));
      }
    };
  }, [selectedQuest]);

  useEffect(() => {
    const openBySlug = async (e: Event) => {
      const slug = (e as CustomEvent<string>).detail;
      if (!slug || !isAdmin) return;
      const found = quests.find((q) => q.slug === slug);
      if (found) {
        setSelectedQuest(found);
        return;
      }
      const res = await fetchQuestBySlug(slug);
      if (res && !res.error && res.id) {
        setSelectedQuest(res as QuestListItem);
      }
    };
    window.addEventListener("openQuestBySlug", openBySlug);
    return () => window.removeEventListener("openQuestBySlug", openBySlug);
  }, [quests, isAdmin]);

  if (!isAdmin) {
    return (
      <motion.div
        key="quest-placeholder"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center justify-center pt-12 pb-8 text-center gap-5"
      >
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center border shadow-app-shadow ${
            isHumanVerified ? "bg-app-accent/10 border-app-border" : "bg-app-accent/5 border-app-border"
          }`}
        >
          {isHumanVerified ? (
            <span className="text-4xl">⚡</span>
          ) : (
            <Lock size={36} className="text-app-accent" strokeWidth={2} />
          )}
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-text-main uppercase tracking-widest">{t("missions.quests.title")}</h3>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black tracking-widest uppercase ${
              isHumanVerified
                ? "bg-app-accent/15 border-app-border text-app-accent"
                : "bg-app-border/50 border-app-border text-text-sub"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isHumanVerified ? "bg-app-accent" : "bg-text-sub"}`} />
            {isHumanVerified ? t("missions.quests.verified_human") : t("missions.quests.verified_only")}
          </div>
        </div>
        <div className="max-w-xs bg-app-card border border-app-border rounded-2xl p-5 space-y-3">
          {isHumanVerified ? (
            <p className="text-sm text-text-main/70 leading-relaxed italic">{t("missions.quests.empty")}</p>
          ) : (
            <p className="text-sm text-text-sub leading-relaxed">{t("missions.quests.lock_hint")}</p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        key="quest-admin"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 pb-8"
      >
        {showListLoader && (
          <div className="flex flex-col gap-4">
            <QuestCardSkeleton />
            <QuestCardSkeleton />
            <QuestCardSkeleton />
          </div>
        )}

        {!showListLoader && quests.length === 0 && (
          <div className="py-20 text-center px-6">
            <p className="text-sm text-text-sub italic">{t("missions.quests.admin_empty")}</p>
          </div>
        )}

        {quests.map((q) => (
          <QuestGlassCard key={q.id} quest={q} onOpen={() => setSelectedQuest(q)} />
        ))}
      </motion.div>

      <AnimatePresence>
        {selectedQuest && (
          <QuestDetailOverlay
            quest={selectedQuest}
            telegramUser={telegramUser}
            onClose={() => setSelectedQuest(null)}
            onToast={onToast}
          />
        )}
      </AnimatePresence>
    </>
  );
}
