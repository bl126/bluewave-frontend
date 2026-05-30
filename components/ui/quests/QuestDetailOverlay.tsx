"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Check, Copy, Flag, Loader2 } from "lucide-react";
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

  // Premium Anti-Farming Scanning States
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'revealing' | 'done'>('idle');
  const [scanStep, setScanStep] = useState(0); // 0, 1, 2 for scanning step texts
  const [revealIndex, setRevealIndex] = useState(-1);
  const [farmingDetected, setFarmingDetected] = useState(false);
  const [suspectedAccounts, setSuspectedAccounts] = useState<string[]>([]);

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
    // Initial silent sync to check if already minted
    setChecks(buildLocalQuestChecks(telegramUser, null));
    fetchQuestProgress(quest.id).then((res) => {
      if (res && !res.error) {
        setProgressStatus({ eligible: res.eligible, minted: res.minted });
        setFarmingDetected(!!res.farming_detected);
        setSuspectedAccounts(res.suspected_accounts || []);
        
        if (res.minted) {
          if (res.checks?.length) setChecks(res.checks);
          setScanState('done');
          setRevealIndex(999);
        }
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

  const startEligibilityCheck = async () => {
    setScanState('scanning');
    setScanStep(0);
    setRevealIndex(-1);
    
    // Stagger step text animations
    const timer1 = setTimeout(() => setScanStep(1), 800);
    const timer2 = setTimeout(() => setScanStep(2), 1600);
    
    try {
      const res = await fetchQuestProgress(quest.id);
      
      // Enforce 2.5s scan duration for premium feel
      setTimeout(() => {
        setScanState('revealing');
        
        if (res && !res.error) {
          if (res.checks?.length) setChecks(res.checks);
          setProgressStatus({ eligible: res.eligible, minted: res.minted });
          setFarmingDetected(!!res.farming_detected);
          setSuspectedAccounts(res.suspected_accounts || []);
          
          let idx = 0;
          const total = res.checks?.length || 6;
          const interval = setInterval(() => {
            setRevealIndex(idx);
            idx++;
            if (idx >= total) {
              clearInterval(interval);
              setScanState('done');
              if (res.farming_detected) {
                toast("Network integrity check failed: Farming suspected!");
              } else if (res.eligible) {
                toast("Ledger verification complete: You are eligible!");
              }
            }
          }, 400);
        } else {
          setScanState('idle');
          toast(t("missions.quests.action_failed") || "Verification failed. Try again.");
        }
      }, 2500);
    } catch (err) {
      setTimeout(() => {
        setScanState('idle');
        toast(t("missions.quests.action_failed") || "Verification failed. Try again.");
      }, 2500);
    }
  };

  const handleMintRequest = () => {
    toast("MINT_NOT_READY — smart contract Phase 3–5. User-paid gas (~0.05–0.2 TON) when live.");
  };

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

          <QuestCriteriaPanel 
            checks={checks} 
            animateReveal={scanState === 'revealing' || scanState === 'done'}
            revealIndex={revealIndex}
          />

          {progressStatus.minted && (
            <div className="px-4 py-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/35 text-center shadow-[0_0_15px_rgba(34,211,238,0.08)] animate-in zoom-in-95 duration-250">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
                {t("missions.quests.minted_badge") || "WAVE BADGE MINTED ✓"}
              </span>
            </div>
          )}

          {!progressStatus.minted && (
            <div className="space-y-4">
              {/* 1. Farming Detected Suspicion Card */}
              {scanState === 'done' && farmingDetected && (
                <div className="flex flex-col gap-4 p-5 rounded-2xl border border-red-500/30 bg-red-500/[0.03] shadow-[0_0_20px_rgba(239,68,68,0.02)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">⚠️</span>
                    <h4 className="text-xs font-black uppercase tracking-widest text-red-400">
                      Network Farming Suspected
                    </h4>
                  </div>
                  <p className="text-xs text-text-sub leading-relaxed">
                    Multiple accounts in your network share matching device fingerprints or network details. Suspected accounts:{" "}
                    <span className="font-mono font-bold text-red-300">
                      {suspectedAccounts.join(", ") || "None"}
                    </span>
                    . If you think this is a false positive, please{" "}
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new CustomEvent("openBugsSuggestions"))}
                      className="inline font-bold text-cyan-400 hover:underline underline-offset-2"
                    >
                      contact support
                    </button>{" "}
                    to open a suggestion ticket immediately.
                  </p>
                </div>
              )}

              {/* 2. Success Eligible Mint Card */}
              {scanState === 'done' && !farmingDetected && progressStatus.eligible && (
                <div className="flex flex-col gap-4 p-5 rounded-2xl border border-cyan-400/35 bg-cyan-400/[0.03] shadow-[0_0_20px_rgba(34,211,238,0.05)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🎉</span>
                    <h4 className="text-xs font-black uppercase tracking-widest text-cyan-400">
                      You Are Eligible!
                    </h4>
                  </div>
                  <p className="text-xs text-text-sub leading-relaxed">
                    Your presence signals and network integrity have been fully verified on the ledger. You are authorized to mint your Wave Badge.
                  </p>
                  <button
                    type="button"
                    onClick={handleMintRequest}
                    className="w-full py-3.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_22px_rgba(34,211,238,0.45)] transition-all duration-300"
                  >
                    Mint Wave Badge
                  </button>
                </div>
              )}

              {/* 3. Ineligible Failure Card */}
              {scanState === 'done' && !farmingDetected && !progressStatus.eligible && (
                <div className="flex flex-col gap-3 p-5 rounded-2xl border border-app-border bg-app-card/25 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">❌</span>
                    <h4 className="text-xs font-black uppercase tracking-widest text-text-main">
                      Quest Ineligible
                    </h4>
                  </div>
                  <p className="text-xs text-text-sub leading-relaxed">
                    You do not meet all required criteria for this Wave Quest yet. Complete the remaining steps above and try again.
                  </p>
                  <button
                    type="button"
                    onClick={startEligibilityCheck}
                    className="w-full py-3 border border-app-border hover:border-app-accent/35 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-sub hover:text-cyan-400 bg-app-card/10 transition-colors"
                  >
                    Re-Scan Ledger
                  </button>
                </div>
              )}

              {/* 4. Initial Scan Button */}
              {scanState === 'idle' && (
                <button
                  type="button"
                  onClick={startEligibilityCheck}
                  className="w-full py-4 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black uppercase tracking-[0.18em] shadow-[0_0_15px_rgba(34,211,238,0.18)] hover:shadow-[0_0_25px_rgba(34,211,238,0.32)] transition-all duration-300"
                >
                  Check Eligibility
                </button>
              )}
            </div>
          )}

          <QuestBoardPass questId={quest.id} myTelegramId={telegramUser?.id} />
        </div>
      </motion.div>

      {/* Centered High-Fidelity Scanning Overlay */}
      {scanState === 'scanning' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-app-bg/85 backdrop-blur-md">
          <div className="flex flex-col items-center justify-center p-8 rounded-3xl border border-app-border bg-app-card/75 backdrop-blur-2xl max-w-xs w-full text-center gap-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] animate-in zoom-in-95 duration-200">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-cyan-500/25 animate-ping" />
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" strokeWidth={2.5} />
            </div>
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400 animate-pulse">
                INSPECTING LEDGER DATA
              </h4>
              <p className="text-[10px] text-text-sub font-black tracking-wider uppercase leading-relaxed min-h-[30px] flex items-center justify-center px-2">
                {scanStep === 0 && "VERIFYING PRESENCE SIGNATURES..."}
                {scanStep === 1 && "ANALYZING REFERRAL NETWORK NODES..."}
                {scanStep === 2 && "SCANNING DEVICE & IP INTEGRITY..."}
              </p>
            </div>
          </div>
        </div>
      )}

      <QuestDetailsPopup isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} details={fullDetails} />
    </>
  );
}

function romanTier(tier: number) {
  const map: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };
  return map[tier] || String(tier);
}
