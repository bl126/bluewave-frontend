"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildQuestStartappLink } from "@/lib/questDeepLink";
import { buildLocalQuestChecks } from "@/lib/questLocalChecks";
import { fetchQuestProgress, type QuestListItem } from "@/lib/questsApi";
import QuestCriteriaPanel from "./QuestCriteriaPanel";
import QuestBoardPass from "./QuestBoardPass";

interface QuestDetailOverlayProps {
  quest: QuestListItem;
  telegramUser?: { id?: number; roles?: string[]; is_human_verified?: boolean; total_referrals?: number } | null;
  onClose: () => void;
  onToast?: (msg: string) => void;
}

/* ── Verified Host Badge (premium circular design, cyan bg, white check icon) ── */
function VerifiedHostBadge() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5 shrink-0 drop-shadow-[0_0_8px_rgba(34,211,238,0.45)]"
      aria-hidden
    >
      {/* Outer glow ring */}
      <circle cx="12" cy="12" r="11" fill="none" stroke="#22d3ee" strokeWidth="1" className="opacity-40" />
      {/* Solid body */}
      <circle cx="12" cy="12" r="9" fill="#22d3ee" />
      {/* Centered white check icon */}
      <path
        stroke="#ffffff"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.5 11.8l1.8 1.8 3.2-3.2"
        fill="none"
      />
    </svg>
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
              setRevealIndex(999); // Instantly flag all items as resolved
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

  /* ── Tab Switch Swipe Handler ──────────────────────────────────────── */
  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 60;
    if (info.offset.x < -swipeThreshold) {
      // Swipe left -> next tab
      if (activeTab === "board_pass") {
        setActiveTab("criteria");
      } else if (activeTab === "criteria") {
        setActiveTab("about");
      }
    } else if (info.offset.x > swipeThreshold) {
      // Swipe right -> previous tab
      if (activeTab === "about") {
        setActiveTab("criteria");
      } else if (activeTab === "criteria") {
        setActiveTab("board_pass");
      }
    }
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[130] flex flex-col bg-app-bg overflow-hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ═══════════════════ HERO SECTION ═══════════════════ */}
        {/* Height increased to h-[240px] to give visual spacing */}
        <div className="relative w-full shrink-0 h-[240px]">
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

          {/* Top Navigation Bar (Brought down +10px more -> 27px) */}
          <div
            className="absolute top-0 left-0 right-0 z-10 flex items-center justify-end px-4"
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 27px)",
            }}
          >
            {/* Share/Forward Button (No circle background, just white icon) */}
            <button
              type="button"
              onClick={handleShare}
              className="w-10 h-10 flex items-center justify-center text-white hover:text-white/80 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-white shrink-0">
                <path d="M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z" />
              </svg>
            </button>
          </div>

          {/* Centered Content (pb-12 to push text up and create visual space from bottom sheet) */}
          <div className="relative z-[5] flex flex-col items-center justify-end h-full px-6 pb-12 pt-16">
            {/* Title + Verified Badge */}
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <h1 className="text-lg font-black text-white uppercase tracking-tight leading-tight text-center drop-shadow-lg">
                {quest.title}
              </h1>
              {quest.host_verified && <VerifiedHostBadge />}
            </div>

            {/* NFT Tier */}
            {quest.nft_tier != null && (
              <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-cyan-400 drop-shadow">
                {t("missions.quests.wave_label")} {romanTier(quest.nft_tier)}
              </span>
            )}
          </div>
        </div>

        {/* ═══════════════════ BOTTOM SHEET ═══════════════════ */}
        {/* Margins adjusted to -mt-1 to push the sheet down, showing cover details and creating spacing */}
        <div className="relative z-10 flex-1 flex flex-col bg-app-bg rounded-t-[28px] border-t border-white/[0.06] -mt-1 overflow-hidden">
          {/* ── 3-Column Stats Bar (Unboxed & Spread out: Mint left-aligned, Prize Pool centered, Dropped right-aligned) ── */}
          <div className="w-full px-10 pt-6 pb-2 shrink-0">
            <div className="flex items-center justify-between">
              {/* Mint (Left aligned) */}
              <div className="flex-1 flex flex-col items-start justify-center text-left">
                <span className="text-base font-black text-text-main tracking-tight pl-2">{statsColumns[0].value}</span>
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-text-sub pl-2">{statsColumns[0].label}</span>
              </div>

              {/* Prize Pool (Centered) */}
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <span className="text-base font-black text-text-main tracking-tight">{statsColumns[1].value}</span>
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-text-sub">{statsColumns[1].label}</span>
              </div>

              {/* Dropped (Right aligned) */}
              <div className="flex-1 flex flex-col items-end justify-center text-right">
                <span className="text-base font-black text-text-main tracking-tight pr-2">{statsColumns[2].value}</span>
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-text-sub pr-2">{statsColumns[2].label}</span>
              </div>
            </div>
          </div>

          {/* Tab Bar (Clean and neat like Mission Center tabs) */}
          <div className="px-5 pt-3 pb-1 shrink-0">
            <div className="flex items-center justify-between pb-1.5 gap-2">
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
                    className={`relative flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wide border transition-all duration-200
                      ${isActive
                        ? "bg-app-accent/15 border-app-border text-app-accent shadow-app-shadow"
                        : "bg-transparent border-app-border text-text-sub hover:border-app-accent/50 hover:text-app-accent"
                      }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Area (Scroll Contained inside tabs + Swipe-enabled) */}
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.35}
                onDragEnd={handleDragEnd}
                className="absolute inset-0 overflow-y-auto px-5 pb-12 pt-4 flex flex-col"
              >
                {/* ── BOARD PASS TAB ── */}
                {activeTab === "board_pass" && (
                  <QuestBoardPass questId={quest.id} myTelegramId={telegramUser?.id} />
                )}

                {/* ── CRITERIA TAB ── */}
                {activeTab === "criteria" && (
                  <div className="space-y-5 flex-1">
                    <QuestCriteriaPanel
                      checks={checks}
                      animateReveal={scanState === 'revealing'}
                      revealIndex={revealIndex}
                    />

                    {/* Minted Badge */}
                    {progressStatus.minted && (
                      <div className="px-4 py-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/35 text-center shadow-[0_0_15px_rgba(34,211,238,0.08)]">
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
                          <div className="flex flex-col gap-4 p-5 rounded-2xl border border-red-500/30 bg-red-500/[0.03] shadow-[0_0_20px_rgba(239,68,68,0.02)]">
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
                          <div className="flex flex-col gap-4 p-5 rounded-2xl border border-cyan-400/35 bg-cyan-400/[0.03] shadow-[0_0_20px_rgba(34,211,238,0.05)]">
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
                          <div className="flex flex-col gap-3 p-5 rounded-2xl border border-app-border bg-app-card/25">
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
                  </div>
                )}

                {/* ── ABOUT TAB ── */}
                {activeTab === "about" && (
                  <div className="space-y-5 flex-1">
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
                        <span className="text-[10px] text-text-sub/80 font-semibold uppercase tracking-wider">
                          Quest Host
                        </span>
                      </div>
                    </div>

                    {/* Quest Description */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-app-accent/80">
                        Quest Details
                      </h3>
                      <p className="text-sm text-text-main leading-relaxed whitespace-pre-wrap">
                        {fullDetails || "No details available for this quest."}
                      </p>
                    </div>

                    {/* Quest Meta */}
                    <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub/80">Category</span>
                        <span className="text-[11px] font-black uppercase tracking-tight text-text-main">{quest.category || "NFT"}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub/80">Status</span>
                        <span className={`text-[11px] font-black uppercase tracking-tight ${quest.status === 'active' ? 'text-cyan-400' : 'text-text-sub'}`}>
                          {quest.status || "—"}
                        </span>
                      </div>
                      {quest.started_at && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub/80">Started</span>
                          <span className="text-[11px] font-black text-text-main">
                            {new Date(quest.started_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      )}
                      {quest.ends_at && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub/80">Ends</span>
                          <span className="text-[11px] font-black text-text-main">
                            {new Date(quest.ends_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      )}
                      {maxSupply != null && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub/80">Total Supply</span>
                          <span className="text-[11px] font-black text-text-main">{maxSupply.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
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
