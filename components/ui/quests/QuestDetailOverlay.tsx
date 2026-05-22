"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Check, Copy, Flag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildQuestStartappLink } from "@/lib/questDeepLink";
import { buildLocalQuestChecks } from "@/lib/questLocalChecks";
import { questDetailsPreview } from "@/lib/questText";
import { fetchQuestProgress, reportQuest, type QuestListItem } from "@/lib/questsApi";
import QuestDetailsPopup from "./QuestDetailsPopup";
import QuestCriteriaPanel from "./QuestCriteriaPanel";
import QuestBoardPass from "./QuestBoardPass";

interface QuestDetailOverlayProps {
  quest: QuestListItem;
  telegramUser?: { id?: number; roles?: string[]; is_human_verified?: boolean; total_referrals?: number } | null;
  onClose: () => void;
  onToast?: (msg: string) => void;
}

function VerifiedHostBadge() {
  return (
    <span
      className="inline-flex w-[14px] h-[14px] rounded-[5px] bg-cyan-400 items-center justify-center shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.4)]"
      aria-hidden
    >
      <Check size={9} className="text-black stroke-[3px]" />
    </span>
  );
}

export default function QuestDetailOverlay({ quest, telegramUser, onClose, onToast }: QuestDetailOverlayProps) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checks, setChecks] = useState(() => buildLocalQuestChecks(telegramUser, null));
  const [progressStatus, setProgressStatus] = useState<{
    eligible?: boolean;
    minted?: boolean;
  }>({});

  const fullDetails = quest.details || quest.summary || "";
  const previewMeta = quest.details_preview?.has_more != null
    ? { short: quest.details_preview.short, has_more: quest.details_preview.has_more }
    : questDetailsPreview(fullDetails, 50);
  const previewText = previewMeta.short;
  const hasMore = previewMeta.has_more;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("questDetailOpen", { detail: true }));
    return () => {
      document.body.style.overflow = "unset";
      window.dispatchEvent(new CustomEvent("questDetailOpen", { detail: false }));
      window.dispatchEvent(new CustomEvent("scrollDirectionChanged", { detail: "up" }));
    };
  }, []);

  useEffect(() => {
    setChecks(buildLocalQuestChecks(telegramUser, null));
    fetchQuestProgress(quest.id).then((res) => {
      if (res && !res.error) {
        if (res.checks?.length) setChecks(res.checks);
        setProgressStatus({ eligible: res.eligible, minted: res.minted });
      }
    });
  }, [quest.id, telegramUser]);

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

  const toast = (msg: string) => onToast?.(msg);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const top = el.scrollTop;
    if (top > 56) {
      window.dispatchEvent(new CustomEvent("scrollDirectionChanged", { detail: "down" }));
    } else if (top < 12) {
      window.dispatchEvent(new CustomEvent("scrollDirectionChanged", { detail: "up" }));
    }
  };

  const handleReport = async () => {
    setMenuOpen(false);
    const res = await reportQuest(quest.id);
    toast(res?.success ? t("missions.quests.reported") : t("missions.quests.action_failed"));
  };

  const handleCopyLink = async () => {
    setMenuOpen(false);
    const link = buildQuestStartappLink(quest.slug);
    try {
      await navigator.clipboard.writeText(link);
      toast(t("missions.quests.link_copied"));
    } catch {
      toast(t("missions.quests.action_failed"));
    }
  };

  return (
    <>
      <motion.div
        ref={scrollRef}
        onScroll={handleScroll}
        className="fixed inset-0 z-[130] flex flex-col bg-app-bg/[0.98] backdrop-blur-3xl overflow-y-auto"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 60px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.22 }}
      >
        <div className="px-4 pb-12 max-w-xl mx-auto w-full flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full border border-white/15 bg-app-card overflow-hidden shrink-0 mt-0.5">
                {quest.host_logo_url ? (
                  <img src={quest.host_logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-app-accent font-black text-[9px]">
                    {(quest.host_name || "B").slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0 gap-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[13px] font-black text-text-main uppercase tracking-tight truncate">
                    {quest.host_name || "Bluewave"}
                  </span>
                  {quest.host_verified && <VerifiedHostBadge />}
                </div>
                {quest.nft_tier != null && (
                  <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-cyan-400/90">
                    {t("missions.quests.wave_label")} {romanTier(quest.nft_tier)}
                  </span>
                )}
              </div>
            </div>

            <div className="relative shrink-0">
              <button
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
                      className="absolute right-0 top-full mt-2 z-[132] w-40 border border-app-border rounded-xl shadow-app-shadow overflow-hidden bg-app-card/95 backdrop-blur-2xl"
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
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-2 px-4 py-3 text-xs text-text-main hover:bg-app-accent/10"
                      >
                        <Copy size={12} /> {t("missions.quests.menu_copy")}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {quest.image_url && (
            <div className="w-full aspect-[4/3] max-h-[280px] rounded-2xl overflow-hidden border border-white/10 shadow-lg -mt-1">
              <img src={quest.image_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <h1 className="text-lg font-black text-text-main uppercase tracking-tight leading-tight">{quest.title}</h1>

          <p className="text-sm text-text-main/80 leading-relaxed">
            {previewText}
            {hasMore && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={() => setDetailsOpen(true)}
                  className="inline text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:underline align-baseline"
                >
                  {t("missions.quests.see_more")}
                </button>
              </>
            )}
          </p>

          <QuestCriteriaPanel checks={checks} />

          {progressStatus.minted && (
            <div className="px-4 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                {t("missions.quests.minted_badge")}
              </span>
            </div>
          )}
          {progressStatus.eligible && !progressStatus.minted && (
            <div className="px-4 py-3 rounded-2xl bg-app-accent/5 border border-app-border text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-sub">
                {t("missions.quests.eligible_soon")}
              </span>
            </div>
          )}

          <QuestBoardPass questId={quest.id} myTelegramId={telegramUser?.id} />
        </div>
      </motion.div>

      <QuestDetailsPopup isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} details={fullDetails} />
    </>
  );
}

function romanTier(tier: number) {
  const map: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };
  return map[tier] || String(tier);
}
