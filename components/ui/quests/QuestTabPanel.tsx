"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Lock, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { canAdminQuests } from "@/lib/questAccess";
import { useApi } from "@/lib/useApi";
import type { QuestFilter, QuestListItem } from "@/lib/questsApi";
import QuestGlassCard from "./QuestGlassCard";
import QuestDetailOverlay from "./QuestDetailOverlay";

interface QuestTabPanelProps {
  telegramUser: { id?: number } | null;
  isHumanVerified: boolean;
  onToast?: (msg: string) => void;
}

const FILTERS: { id: QuestFilter; labelKey: string }[] = [
  { id: "waves", labelKey: "missions.quests.filter_waves" },
  { id: "active", labelKey: "missions.quests.filter_active" },
  { id: "ended", labelKey: "missions.quests.filter_ended" },
];

export default function QuestTabPanel({ telegramUser, isHumanVerified, onToast }: QuestTabPanelProps) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<QuestFilter>("waves");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<QuestListItem | null>(null);

  const isAdmin = canAdminQuests(telegramUser?.id);
  const { data, loading: isLoading, mutate } = useApi(
    isAdmin ? `/quests?filter=${filter}` : null,
    { revalidateOnFocus: true }
  );

  const quests: QuestListItem[] = isAdmin && data && !data.error ? data.quests || [] : [];

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
        className="relative space-y-3 pb-24"
      >
        {/* Floating filter — quest tab only */}
        <div
          className="fixed z-[125] right-4"
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 108px)",
          }}
        >
          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className="w-11 h-11 rounded-2xl flex items-center justify-center
              bg-app-card/80 backdrop-blur-xl border border-white/10 shadow-app-shadow
              text-app-accent hover:bg-app-accent/10 transition-colors"
            aria-label={t("missions.quests.filter_menu")}
          >
            <Menu size={20} />
          </button>

          <AnimatePresence>
            {filterOpen && (
              <>
                <div className="fixed inset-0 z-[124]" onClick={() => setFilterOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  className="absolute right-0 top-full mt-2 z-[126] min-w-[140px] py-1 rounded-xl border border-app-border bg-app-card/95 backdrop-blur-2xl shadow-app-shadow overflow-hidden"
                >
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setFilter(f.id);
                        setFilterOpen(false);
                        mutate();
                      }}
                      className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                        filter === f.id ? "text-app-accent bg-app-accent/10" : "text-text-sub hover:bg-app-accent/5"
                      }`}
                    >
                      {t(f.labelKey)}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-app-accent animate-spin" />
          </div>
        )}

        {!isLoading && quests.length === 0 && (
          <div className="py-16 text-center px-6">
            <p className="text-sm text-text-sub italic">{t("missions.quests.admin_empty")}</p>
            <p className="text-[10px] text-text-sub/60 mt-2 uppercase tracking-widest">
              {t("missions.quests.admin_empty_hint")}
            </p>
          </div>
        )}

        {!isLoading &&
          quests.map((q) => (
            <QuestGlassCard
              key={q.id}
              quest={q}
              onOpen={() => setSelectedQuest(q)}
            />
          ))}
      </motion.div>

      <AnimatePresence>
        {selectedQuest && (
          <QuestDetailOverlay
            quest={selectedQuest}
            onClose={() => setSelectedQuest(null)}
            onToast={onToast}
          />
        )}
      </AnimatePresence>
    </>
  );
}
