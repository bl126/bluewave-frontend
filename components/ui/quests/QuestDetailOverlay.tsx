"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, ShieldCheck, Share2, Bell, Flag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { QuestProgress } from "@/lib/questsApi";
import {
  fetchQuestDetail,
  fetchQuestProgress,
  fetchQuestShare,
  reportQuest,
  toggleQuestSubscribe,
  type QuestListItem,
} from "@/lib/questsApi";
import QuestDetailsPopup from "./QuestDetailsPopup";
import QuestCriteriaBar from "./QuestCriteriaBar";

interface QuestDetailOverlayProps {
  quest: QuestListItem;
  onClose: () => void;
  onToast?: (msg: string) => void;
}

export default function QuestDetailOverlay({ quest: questProp, onClose, onToast }: QuestDetailOverlayProps) {
  const { t } = useLanguage();
  const [quest, setQuest] = useState<QuestListItem>(questProp);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState<QuestProgress | null>(null);
  const [, setSubscribed] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    setQuest(questProp);
    let cancelled = false;
    fetchQuestDetail(questProp.id).then((res) => {
      if (!cancelled && res && !res.error && res.id) {
        setQuest((prev) => ({ ...prev, ...res }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [questProp.id, questProp]);

  const preview = quest.details_preview?.short ?? truncateWords(quest.details || quest.summary || "", 100);
  const hasMore = quest.details_preview?.has_more ?? wordCount(quest.details || "") > 100;
  const fullDetails = quest.details || quest.summary || "";
  const criteriaSummary =
    (quest.criteria_json as { summary?: string })?.summary ||
    quest.summary ||
    t("missions.quests.criteria_default");
  const requirements = ((quest.criteria_json as { requirements?: unknown[] })?.requirements || []) as {
    id?: string;
    label?: string;
  }[];

  useEffect(() => {
    const handleNativeBack = (e: Event) => {
      if (detailsOpen) {
        setDetailsOpen(false);
        e.preventDefault();
        return;
      }
      if (menuOpen) {
        setMenuOpen(false);
        e.preventDefault();
        return;
      }
      e.preventDefault();
      onClose();
    };
    window.addEventListener("bwNativeBack", handleNativeBack, true);
    return () => window.removeEventListener("bwNativeBack", handleNativeBack, true);
  }, [onClose, detailsOpen, menuOpen]);

  useEffect(() => {
    let cancelled = false;
    fetchQuestProgress(quest.id).then((res) => {
      if (!cancelled && res && !res.error) setProgress(res);
    });
    return () => {
      cancelled = true;
    };
  }, [quest.id]);

  const toast = (msg: string) => onToast?.(msg);

  const handleReport = async () => {
    setMenuOpen(false);
    const res = await reportQuest(quest.id);
    toast(res?.success ? t("missions.quests.reported") : t("missions.quests.action_failed"));
  };

  const handleSubscribe = async () => {
    setMenuOpen(false);
    const res = await toggleQuestSubscribe(quest.id);
    if (res?.success) {
      setSubscribed(!!res.subscribed);
      toast(res.subscribed ? t("missions.quests.subscribed") : t("missions.quests.unsubscribed"));
    } else {
      toast(t("missions.quests.action_failed"));
    }
  };

  const handleShare = async () => {
    setMenuOpen(false);
    const res = await fetchQuestShare(quest.id);
    if (res?.error || !res?.link) {
      toast(t("missions.quests.action_failed"));
      return;
    }
    const tg = (window as any).Telegram?.WebApp;
    const text = `${res.share_text || quest.title}\n${res.link}`;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(res.link)}&text=${encodeURIComponent(res.share_text || quest.title)}`);
    } else if (navigator.share) {
      try {
        await navigator.share({ title: quest.title, text, url: res.link });
      } catch {
        await navigator.clipboard.writeText(text);
        toast(t("missions.quests.link_copied"));
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast(t("missions.quests.link_copied"));
    }
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[130] flex flex-col bg-app-bg/98 backdrop-blur-3xl overflow-y-auto"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 60px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 24 }}
        transition={{ duration: 0.22 }}
      >
        <div className="px-4 pb-8 max-w-xl mx-auto w-full flex flex-col gap-5">
          {/* Host row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl border border-app-border bg-app-card overflow-hidden shrink-0">
                {quest.host_logo_url ? (
                  <img src={quest.host_logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-app-accent font-black text-xs">
                    {(quest.host_name || "B").slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-text-main uppercase tracking-tight truncate">
                    {quest.host_name || "Bluewave"}
                  </span>
                  {quest.host_verified && <ShieldCheck size={14} className="text-app-accent shrink-0" />}
                </div>
                {quest.nft_tier && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-text-sub">
                    {t("missions.quests.wave_label")} {romanTier(quest.nft_tier)}
                  </span>
                )}
              </div>
            </div>

            <div className="relative shrink-0">
              <button
                ref={menuRef}
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-full text-text-sub hover:text-app-accent hover:bg-app-accent/10 transition-colors"
              >
                <MoreVertical size={18} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-[131]" onClick={() => setMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 z-[132] w-44 border border-app-border rounded-xl shadow-app-shadow overflow-hidden bg-app-card/95 backdrop-blur-2xl"
                    >
                      <button
                        type="button"
                        onClick={handleReport}
                        className="w-full flex items-center gap-2 px-4 py-3 text-xs text-text-main hover:bg-app-accent/10 border-b border-app-border"
                      >
                        <Flag size={12} /> {t("missions.quests.menu_report")}
                      </button>
                      <button
                        type="button"
                        onClick={handleSubscribe}
                        className="w-full flex items-center gap-2 px-4 py-3 text-xs text-text-main hover:bg-app-accent/10 border-b border-app-border"
                      >
                        <Bell size={12} /> {t("missions.quests.menu_notify")}
                      </button>
                      <button
                        type="button"
                        onClick={handleShare}
                        className="w-full flex items-center gap-2 px-4 py-3 text-xs text-text-main hover:bg-app-accent/10"
                      >
                        <Share2 size={12} /> {t("missions.quests.menu_share")}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Hero image */}
          {quest.image_url && (
            <div className="w-full aspect-[4/3] max-h-[280px] rounded-2xl overflow-hidden border border-app-border">
              <img src={quest.image_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <h1 className="text-lg font-black text-text-main uppercase tracking-tight leading-tight">{quest.title}</h1>

          {/* Details */}
          <div className="space-y-2">
            <p className="text-sm text-text-main/75 leading-relaxed">{preview}</p>
            {hasMore && (
              <button
                type="button"
                onClick={() => setDetailsOpen(true)}
                className="text-[10px] font-black uppercase tracking-widest text-app-accent hover:underline"
              >
                {t("missions.quests.see_more")}
              </button>
            )}
          </div>

          {/* Criteria */}
          <QuestCriteriaBar
            summary={criteriaSummary}
            requirements={requirements}
            checks={progress?.checks}
          />

          {progress?.minted && (
            <div className="px-4 py-3 rounded-2xl bg-app-accent/10 border border-app-accent/30 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-app-accent">
                {t("missions.quests.minted_badge")}
              </span>
            </div>
          )}
          {progress?.eligible && !progress?.minted && (
            <div className="px-4 py-3 rounded-2xl bg-app-accent/5 border border-app-border text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-sub">
                {t("missions.quests.eligible_soon")}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      <QuestDetailsPopup isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} details={fullDetails} />
    </>
  );
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function truncateWords(text: string, max: number) {
  const words = text.trim().split(/\s+/);
  if (words.length <= max) return text;
  return words.slice(0, max).join(" ") + "…";
}

function romanTier(tier: number) {
  const map: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };
  return map[tier] || String(tier);
}
