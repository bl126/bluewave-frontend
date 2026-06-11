"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, ExternalLink, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildQuestStartappLink } from "@/lib/questDeepLink";
import { buildLocalQuestChecks } from "@/lib/questLocalChecks";
import { fetchQuestProgress, type QuestListItem } from "@/lib/questsApi";
import QuestDetailsPopup from "./QuestDetailsPopup";
import QuestCriteriaPanel from "./QuestCriteriaPanel";
import QuestBoardPass from "./QuestBoardPass";

interface QuestDetailOverlayProps {
  quest: QuestListItem;
  telegramUser?: { id?: number; roles?: string[]; is_human_verified?: boolean; total_referrals?: number } | null;
  onClose: () => void;
  onToast?: (msg: string) => void;
}

/* ── Verified Host Badge (cyan bg, black check) ───────────────────────── */
function VerifiedHostBadge() {
  return (
    <span
      className="inline-flex w-[18px] h-[18px] rounded-full bg-cyan-400 items-center justify-center shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
      aria-hidden
    >
      <Check size={11} className="text-black stroke-[3px]" />
    </span>
  );
}

/* ── Date formatter ───────────────────────────────────────────────────── */
function formatDropDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

/* ── Tab types ────────────────────────────────────────────────────────── */
type DetailTab = "board_pass" | "criteria" | "about";

export default function QuestDetailOverlay({ quest, telegramUser, onClose, onToast }: QuestDetailOverlayProps) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("board_pass");
  const [checks, setChecks] = useState(() => buildLocalQuestChecks(telegramUser, null, null));
  const [progressStatus, setProgressStatus] = useState<{
    eligible?: boolean;
    minted?: boolean;
    wallet_address?: string;
  }>({});
  const [walletConfirmed, setWalletConfirmed] = useState<boolean>(false);

  // Premium Anti-Farming Scanning States
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'revealing' | 'done'>('idle');
  const [scanStep, setScanStep] = useState(0);
  const [revealIndex, setRevealIndex] = useState(-1);
  const [farmingDetected, setFarmingDetected] = useState(false);
  const [suspectedAccounts, setSuspectedAccounts] = useState<string[]>([]);

  const fullDetails = quest.details || quest.summary || "";

  /* ── Computed stats ─────────────────────────────────────────────────── */
  const maxSupply = quest.max_supply ?? (quest.counter_config as Record<string, unknown>)?.max as number | undefined;
  const mintedCount = quest.minted_count ?? 0;
  const remainingMints = maxSupply != null ? Math.max(0, maxSupply - mintedCount) : null;
  const prizePool = quest.prize_pool ?? ((quest.counter_config as Record<string, unknown>)?.prize_pool as string | undefined) ?? null;

  /* ── Lock body scroll ──────────────────────────────────────────────── */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("questDetailOpen", { detail: true }));
    return () => {
      document.body.style.overflow = "unset";
      window.dispatchEvent(new CustomEvent("questDetailOpen", { detail: false }));
      window.dispatchEvent(new CustomEvent("scrollDirectionChanged", { detail: "up" }));
    };
  }, []);

  /* ── Fetch progress on mount ───────────────────────────────────────── */
  useEffect(() => {
    setChecks(buildLocalQuestChecks(telegramUser, null, null));
    fetchQuestProgress(quest.id).then((res) => {
      if (res && !res.error) {
        setProgressStatus({ eligible: res.eligible, minted: res.minted, wallet_address: res.wallet_address });
        setFarmingDetected(!!res.farming_detected);
        setSuspectedAccounts(res.suspected_accounts || []);

        if (res.checks?.length) {
          setChecks(res.checks);
        }

        if (res.minted) {
          setScanState('done');
          setRevealIndex(999);
        }
      }
    });
  }, [quest.id, telegramUser]);

  /* ── Native back handler ───────────────────────────────────────────── */
  useEffect(() => {
    const handleNativeBack = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    window.addEventListener("bwNativeBack", handleNativeBack, true);
    return () => window.removeEventListener("bwNativeBack", handleNativeBack, true);
  }, [onClose]);

  const toast = (msg: string) => onToast?.(msg);

  /* ── Share handler ─────────────────────────────────────────────────── */
  const handleShare = async () => {
    const link = buildQuestStartappLink(quest.slug);
    const tg = (window as any).Telegram?.WebApp;

    // Try Telegram native share first
    if (tg?.shareUrl) {
      try {
        tg.shareUrl(link);
        return;
      } catch { /* fallback below */ }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(link);
      toast(t("missions.quests.link_copied"));
    } catch {
      toast(t("missions.quests.action_failed"));
    }
  };

  /* ── Eligibility scan ──────────────────────────────────────────────── */
  const startEligibilityCheck = async () => {
    setScanState('scanning');
    setScanStep(0);
    setRevealIndex(-1);

    const timer1 = setTimeout(() => setScanStep(1), 800);
    const timer2 = setTimeout(() => setScanStep(2), 1600);

    try {
      const res = await fetchQuestProgress(quest.id);

      setTimeout(() => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        setScanState('revealing');

        if (res && !res.error) {
          if (res.checks?.length) setChecks(res.checks);
          setProgressStatus({ eligible: res.eligible, minted: res.minted, wallet_address: res.wallet_address });
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
    } catch {
      setTimeout(() => {
        clearTimeout(timer1);
        clearTimeout(timer2);
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

  /* ── Stats columns ─────────────────────────────────────────────────── */
  const statsColumns = [
    {
      value: remainingMints != null ? remainingMints.toLocaleString() : "—",
      label: "Mint",
    },
    {
      value: prizePool || "—",
      label: "Prize Pool",
    },
    {
      value: formatDropDate(quest.started_at),
      label: "Dropped",
    },
  ];

  return (
    <>
      <motion.div
        ref={scrollRef}
        onScroll={handleScroll}
        className="fixed inset-0 z-[130] flex flex-col bg-app-bg overflow-y-auto"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ═══════════════════ HERO SECTION ═══════════════════ */}
        <div className="relative w-full shrink-0" style={{ minHeight: "340px" }}>
          {/* Background Image */}
          {quest.image_url ? (
            <img
              src={quest.image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/40 via-blue-700/30 to-app-bg" />
          )}

          {/* Gradient overlays for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-app-bg/90 via-transparent to-transparent" />

          {/* Top Navigation Bar */}
          <div
            className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4"
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 12px)",
            }}
          >
            {/* Back Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>

            {/* Share/Forward Button */}
            <button
              type="button"
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
            >
              <ExternalLink size={16} />
            </button>
          </div>

          {/* Centered Content */}
          <div className="relative z-[5] flex flex-col items-center justify-end h-full px-6 pb-16 pt-24">
            {/* Host Logo */}
            <div className="w-16 h-16 rounded-full border-2 border-white/25 bg-app-card overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)] mb-4">
              {quest.host_logo_url ? (
                <img src={quest.host_logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-app-accent font-black text-xl bg-app-bg">
                  {(quest.host_name || "B").slice(0, 1)}
                </div>
              )}
            </div>

            {/* Title + Verified Badge */}
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <h1 className="text-xl font-black text-white uppercase tracking-tight leading-tight text-center drop-shadow-lg">
                {quest.title}
              </h1>
              {quest.host_verified && <VerifiedHostBadge />}
            </div>

            {/* NFT Tier */}
            {quest.nft_tier != null && (
              <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-cyan-400/90 drop-shadow">
                {t("missions.quests.wave_label")} {romanTier(quest.nft_tier)}
              </span>
            )}
          </div>

          {/* ── 3-Column Stats Bar ─────────────────────────────── */}
          <div className="absolute bottom-0 left-0 right-0 z-[6] px-6 pb-0 translate-y-1/2">
            <div className="flex items-stretch rounded-2xl bg-app-card/90 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
              {statsColumns.map((col, i) => (
                <div
                  key={col.label}
                  className={`flex-1 flex flex-col items-center justify-center py-4 gap-0.5
                    ${i < statsColumns.length - 1 ? "border-r border-white/[0.06]" : ""}`}
                >
                  <span className="text-base font-black text-text-main tracking-tight">{col.value}</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-text-sub/70">{col.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════ BOTTOM SHEET ═══════════════════ */}
        <div className="relative z-10 flex-1 -mt-1">
          {/* Spacer for stats bar overlap */}
          <div className="h-8" />

          {/* Tab Bar */}
          <div className="px-5 pt-4 pb-1">
            <div className="flex items-center bg-app-card/60 backdrop-blur-md rounded-2xl border border-white/[0.06] p-1 gap-1">
              {([
                { id: "board_pass" as DetailTab, label: "Board Pass" },
                { id: "criteria" as DetailTab, label: "Criteria" },
                { id: "about" as DetailTab, label: "About" },
              ]).map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200
                      ${isActive
                        ? "bg-app-accent/15 text-app-accent shadow-[0_0_12px_rgba(0,246,255,0.08)]"
                        : "text-text-sub/70 hover:text-text-main"
                      }`}
                  >
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="quest-tab-indicator"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-app-accent"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="px-5 pb-32 pt-4">
            <AnimatePresence mode="wait">
              {/* ── BOARD PASS TAB ── */}
              {activeTab === "board_pass" && (
                <motion.div
                  key="board_pass"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <QuestBoardPass questId={quest.id} myTelegramId={telegramUser?.id} />
                </motion.div>
              )}

              {/* ── CRITERIA TAB ── */}
              {activeTab === "criteria" && (
                <motion.div
                  key="criteria"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-5"
                >
                  <QuestCriteriaPanel
                    checks={checks}
                    animateReveal={scanState === 'revealing' || scanState === 'done'}
                    revealIndex={revealIndex}
                  />

                  {/* Minted Badge */}
                  {progressStatus.minted && (
                    <div className="px-4 py-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/35 text-center shadow-[0_0_15px_rgba(34,211,238,0.08)] animate-in zoom-in-95 duration-250">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
                        {t("missions.quests.minted_badge") || "WAVE BADGE MINTED ✓"}
                      </span>
                    </div>
                  )}

                  {/* Action States */}
                  {!progressStatus.minted && (
                    <div className="space-y-4">
                      {/* Farming Detected */}
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

                      {/* Eligible */}
                      {scanState === 'done' && !farmingDetected && progressStatus.eligible && (
                        <div className="flex flex-col gap-4 p-5 rounded-2xl border border-cyan-400/35 bg-cyan-400/[0.03] shadow-[0_0_20px_rgba(34,211,238,0.05)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">🎉</span>
                            <h4 className="text-xs font-black uppercase tracking-widest text-cyan-400">
                              You Are Eligible!
                            </h4>
                          </div>
                          {progressStatus.wallet_address && (
                            <p className="text-[10px] text-text-sub">
                              Connected: <span className="font-mono">{progressStatus.wallet_address}</span>
                            </p>
                          )}
                          <label className="inline-flex items-center space-x-2 mt-2">
                            <input
                              type="checkbox"
                              checked={walletConfirmed}
                              onChange={e => setWalletConfirmed(e.target.checked)}
                              className="form-checkbox h-4 w-4 text-cyan-500 border-app-border rounded"
                            />
                            <span className="text-xs text-text-sub">I confirm this is my wallet address</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleMintRequest}
                            disabled={!walletConfirmed}
                            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-white text-[10px] font-black uppercase tracking-widest rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            Mint NFT
                          </button>
                        </div>
                      )}

                      {/* Ineligible */}
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

                      {/* Initial Scan Button */}
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
                </motion.div>
              )}

              {/* ── ABOUT TAB ── */}
              {activeTab === "about" && (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-5"
                >
                  {/* Host Info */}
                  <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
                    <div className="w-10 h-10 rounded-full border border-white/15 bg-app-card overflow-hidden shrink-0">
                      {quest.host_logo_url ? (
                        <img src={quest.host_logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-app-accent font-black text-sm">
                          {(quest.host_name || "B").slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-black text-text-main uppercase tracking-tight truncate">
                          {quest.host_name || "Bluewave"}
                        </span>
                        {quest.host_verified && <VerifiedHostBadge />}
                      </div>
                      <span className="text-[10px] text-text-sub/60 font-semibold uppercase tracking-wider">
                        Quest Host
                      </span>
                    </div>
                  </div>

                  {/* Quest Description */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-app-accent/80">
                      Quest Details
                    </h3>
                    <p className="text-sm text-text-main/80 leading-relaxed whitespace-pre-wrap">
                      {fullDetails || "No details available for this quest."}
                    </p>
                  </div>

                  {/* Quest Meta */}
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub/60">Category</span>
                      <span className="text-[11px] font-black uppercase tracking-tight text-text-main">{quest.category || "NFT"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub/60">Status</span>
                      <span className={`text-[11px] font-black uppercase tracking-tight ${quest.status === 'active' ? 'text-cyan-400' : 'text-text-sub'}`}>
                        {quest.status || "—"}
                      </span>
                    </div>
                    {quest.started_at && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub/60">Started</span>
                        <span className="text-[11px] font-black text-text-main">
                          {new Date(quest.started_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    )}
                    {quest.ends_at && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub/60">Ends</span>
                        <span className="text-[11px] font-black text-text-main">
                          {new Date(quest.ends_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    )}
                    {maxSupply != null && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub/60">Total Supply</span>
                        <span className="text-[11px] font-black text-text-main">{maxSupply.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════ SCANNING OVERLAY ═══════════════════ */}
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
                {scanStep === 2 && "FINALIZING LEDGER VERIFICATION..."}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function romanTier(tier: number) {
  const map: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };
  return map[tier] || String(tier);
}
