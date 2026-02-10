// [CODE: FRONTEND_PROFILE_COMPONENT]
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, MoreVertical, Wallet, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/useApi";
import Settings from "./Settings";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

// [CODE: FRONTEND_PROFILE_TYPES]
interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
}

// [CODE: FRONTEND_PROFILE_MAIN_COMPONENT]
export default function Profile({ isOpen, onClose, telegramUser }: ProfileProps) {
  const { t } = useLanguage();

  // Use passed telegramUser for immediate UI if available
  const [user, setUser] = useState<any>(telegramUser || null);
  const [loading, setLoading] = useState(!telegramUser);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [cooldown, setCooldown] = useState<number | null>(null);
  const [cooldownText, setCooldownText] = useState("00:00:00");
  const [claiming, setClaiming] = useState(false);
  const [badgeUnlocked, setBadgeUnlocked] = useState(false);
  const [claimDone, setClaimDone] = useState(false);

  // Settings overlay states
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  // [CODE: FRONTEND_TELEGRAM_ID_MANAGEMENT]
  // ⭐ Telegram ID extracted from Mini App or Props
  const [telegramId, setTelegramId] = useState<number | null>(telegramUser?.id || null);

  useEffect(() => {
    if (!telegramId) {
      const stored = localStorage.getItem("bw_tg_id");
      if (stored) {
        setTelegramId(Number(stored));
      }
    }
  }, [telegramId]);

  // ⭐ SWR fetch using Telegram ID (safe null)
  const { data: swrUser, error: swrError, loading: swrLoading, mutate } =
    useApi(telegramId ? `/user/${telegramId}` : null);

  useEffect(() => {
    if (telegramId && isOpen) mutate();  // force SWR refresh when ID loads or modal opens
  }, [telegramId, isOpen]);

  // ⭐ Sync SWR result
  useEffect(() => {
    if (swrUser) {
      setUser(swrUser);
      setLoading(false);
      setError("");               // clear any old error
    }

    // only show error if we truly have no user data AND loading is done AND SWR has finished its attempt
    if (swrError && !swrUser && !swrLoading && !user) {
      // Small delay before showing error to avoid flicker if it's just a transient state
      const timeout = setTimeout(() => {
        if (!swrUser && !user) setError("Could not load profile");
      }, 800);
      setLoading(false);
      return () => clearTimeout(timeout);
    }
  }, [swrUser, swrError, swrLoading, user]);

  // ⭐ Load cooldown when opening modal + telegram id available
  useEffect(() => {
    if (isOpen && telegramId) {
      loadCooldown();
    }
  }, [isOpen, telegramId]);


  const [nextNotifyAt, setNextNotifyAt] = useState<number | null>(null);
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    const handler = () => {
      setBadgeUnlocked(true);
      setTimeout(() => setBadgeUnlocked(false), 3000);
    };

    window.addEventListener("badgeUnlocked", handler);
    return () => window.removeEventListener("badgeUnlocked", handler);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("notifyNextTime");
    if (saved) setNextNotifyAt(Number(saved));
  }, []);

  useEffect(() => {
    if (!nextNotifyAt) return;

    const interval = setInterval(() => {
      const diff = nextNotifyAt - Date.now();

      if (diff <= 0) {
        setNextNotifyAt(null);
        localStorage.removeItem("notifyNextTime");
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      setCooldownText(`${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [nextNotifyAt]);

  // ⭐ ADD THIS NEW LEVEL LOGIC HERE
  const [level, setLevel] = useState("Loading...");

  useEffect(() => {
    if (swrUser?.level) {
      setLevel(swrUser.level);
    }
  }, [swrUser?.level]);


  useEffect(() => {
    if (cooldown === null) return;

    const interval = setInterval(() => {
      setCooldown(prev => {
        if (!prev || prev <= 1000) {
          setCooldown(null);
          return null;
        }
        const next = prev - 1000;

        const h = String(Math.floor(next / 3600000)).padStart(2, "0");
        const m = String(Math.floor((next % 3600000) / 60000)).padStart(2, "0");
        const s = String(Math.floor((next % 60000) / 1000)).padStart(2, "0");

        setCooldownText(`${h}:${m}:${s}`);

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  // Auto-refresh profile picture daily
  useEffect(() => {
    if (!telegramId) return;
    const interval = setInterval(() => {
      setUser((prev: any) => ({
        ...prev,
        photo_url: prev.photo_url ? `${prev.photo_url}?r=${Date.now()}` : null
      }));
    }, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [telegramId]);

  const handleClaim = async () => {
    if (claiming) return;
    setClaiming(true);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/claim_referral`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id: telegramId }),
    });

    const result = await res.json();

    if (result.claimed) {
      setUser((prev: any) => ({
        ...prev,
        referral_earnings_pending: 0,
        points_balance: result.new_balance,
      }));

      window.dispatchEvent(
        new CustomEvent("updateBalance", { detail: result.new_balance })
      );

      mutate();

      const tg = (window as any).Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred("success");
      }

      setClaimDone(true);
      setTimeout(() => {
        setClaimDone(false);
        setClaiming(false);
      }, 2000);
    } else {
      setClaiming(false);
    }
  };


  async function loadCooldown() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notify_usage/${telegramId}`);
    const data = await res.json();

    if (!data.last_sent) {
      setCooldown(null);
      return;
    }

    const lastSent = new Date(data.last_sent).getTime();
    const now = Date.now();
    const cooldownMs = 4 * 60 * 60 * 1000; // 4 hours

    const remaining = lastSent + cooldownMs - now;

    if (remaining > 0) {
      setCooldown(remaining);
    } else {
      setCooldown(null);
    }
  }

  const handleNotifyInactive = async () => {
    if (nextNotifyAt !== null || notifying) return;

    // Lock UI immediately
    setNotifying(true);
    setCooldownText("Notifying...");

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notify_inactive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id: telegramId }),
    });

    const result = await res.json();

    // Backend blocked (daily limit)
    if (result.blocked) {
      const next = Date.now() + 4 * 60 * 60 * 1000;
      setNextNotifyAt(next);
      localStorage.setItem("notifyNextTime", String(next));
      setNotifying(false);
      return;
    }

    // Success → start real cooldown
    const next = Date.now() + 4 * 60 * 60 * 1000;
    setNextNotifyAt(next);
    localStorage.setItem("notifyNextTime", String(next));

    setNotifying(false);
  };

  const handleSaveName = async (newName: string) => {
    // Name editing removed as per request
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-xl flex flex-col overflow-y-auto text-cyan-200 
                     pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header Bar - Truly Floating */}
          <div className="flex justify-between items-center p-6 sticky top-0 z-50 bg-transparent pointer-events-none">
            <button
              onClick={onClose}
              className="group pointer-events-auto"
            >
              <div className="p-2 rounded-full bg-cyan-950/30 group-hover:bg-cyan-900/50 transition-colors border border-cyan-900/50 shadow-[0_0_15px_-5px_#22d3ee]">
                <ArrowLeft size={20} className="text-cyan-400 group-hover:text-cyan-200" />
              </div>
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="group pointer-events-auto"
            >
              <div className="p-2 rounded-full bg-cyan-950/30 group-hover:bg-cyan-900/50 transition-colors border border-cyan-900/50 shadow-[0_0_15px_-5px_#22d3ee]">
                <MoreVertical size={20} className="text-cyan-400 group-hover:text-cyan-200" />
              </div>
            </button>
          </div>

          <div className="max-w-md mx-auto w-full p-6 pb-24">

            {loading && (
              <div className="space-y-3 animate-pulse">
                {/* Profile Picture + BW ID Skeleton */}
                <div className="relative flex items-start justify-between mb-3">
                  <div className="w-24 h-24 rounded-full bg-cyan-900/30 border border-cyan-900/50"></div>
                  <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 px-4 py-1.5 rounded-full shadow-[0_0_15px_#00e6ff15]">
                    <div className="w-12 h-3 bg-cyan-900/50 rounded"></div>
                  </div>
                </div>

                {/* Name + Username Skeleton */}
                <div className="flex flex-col items-start gap-1.5 mb-3">
                  <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 px-4 py-1.5 rounded-full shadow-[0_0_15px_#00e6ff15]">
                    <div className="w-24 h-3 bg-cyan-900/50 rounded"></div>
                  </div>
                  <div className="w-20 h-2 bg-cyan-900/30 rounded ml-1"></div>
                </div>

                {/* Status Cards Skeleton */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-lg p-2 text-center shadow-[0_0_15px_#00e6ff15]">
                    <div className="w-12 h-2 bg-cyan-900/50 rounded mx-auto mb-1"></div>
                    <div className="w-10 h-2 bg-cyan-900/30 rounded mx-auto"></div>
                  </div>
                  <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-lg p-2 text-center shadow-[0_0_15px_#00e6ff15]">
                    <div className="w-12 h-2 bg-cyan-900/50 rounded mx-auto"></div>
                  </div>
                  <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-lg p-2 text-center shadow-[0_0_15px_#00e6ff15]">
                    <div className="w-16 h-2 bg-cyan-900/50 rounded mx-auto mb-1"></div>
                    <div className="w-8 h-2 bg-cyan-900/30 rounded mx-auto"></div>
                  </div>
                </div>

                {/* Wallet Skeleton */}
                <div className="flex items-center gap-2">
                  <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-full p-3 shadow-[0_0_15px_#00e6ff15]">
                    <div className="w-5 h-5 bg-cyan-900/50 rounded"></div>
                  </div>
                  <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 px-4 py-1.5 rounded-full shadow-[0_0_15px_#00e6ff15]">
                    <div className="w-24 h-2 bg-cyan-900/50 rounded"></div>
                  </div>
                </div>

                {/* Network Earnings Skeleton */}
                <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-lg p-3 shadow-[0_0_15px_#00e6ff15]">
                  <div className="w-28 h-2 bg-cyan-900/50 rounded mb-2"></div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-7 bg-cyan-900/30 rounded-lg border border-cyan-900/50"></div>
                    <div className="flex-1 h-7 bg-cyan-900/30 rounded-lg border border-cyan-900/50"></div>
                  </div>
                </div>

                {/* Roles Skeleton */}
                <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-lg p-4 shadow-[0_0_15px_#00e6ff15] min-h-[80px]">
                  <div className="w-12 h-2 bg-cyan-900/50 rounded mb-1.5"></div>
                  <div className="w-32 h-2 bg-cyan-900/30 rounded"></div>
                </div>

                {/* Footer Skeleton */}
                <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-lg p-3 shadow-[0_0_15px_#00e6ff15]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-20 h-2 bg-cyan-900/50 rounded"></div>
                    <div className="w-12 h-5 bg-cyan-900/30 rounded-lg border border-cyan-900/50"></div>
                  </div>
                  <div className="w-full h-2 bg-cyan-900/30 rounded mb-2"></div>
                  <div className="w-24 h-2 bg-cyan-900/30 rounded"></div>
                </div>
              </div>
            )}
            {error && <p className="text-center text-red-400">{error}</p>}

            {user && (
              <div className="flex flex-col gap-6">

                {/* Professional Header Card */}
                <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/20 rounded-[2rem] p-5 shadow-[0_0_30px_#00e6ff05] flex items-center gap-5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-50"></div>

                  {/* Avatar Section */}
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 rounded-full blur-2xl bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors"></div>

                    {user.photo_url ? (
                      <div className="relative">
                        <img
                          src={`${user.photo_url}?r=${Date.now()}`}
                          alt="avatar"
                          className="relative w-24 h-24 rounded-full border-2 border-cyan-400/30 shadow-[0_0_20px_#00e6ff40] object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="
                        relative w-24 h-24 rounded-full
                        bg-cyan-950/40
                        flex items-center justify-center
                        text-cyan-400 text-3xl font-bold
                        shadow-[0_0_20px_#00e6ff30]
                        border-2 border-cyan-400/30
                      "
                      >
                        {(user.name?.charAt(0) || user.username?.charAt(0) || "U").toUpperCase()}
                      </div>
                    )}

                    {/* Streak Badge */}
                    {user.streak_days >= 3 && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full 
                                   bg-[#001f2e] border-2 border-cyan-400
                                   shadow-[0_0_15px_#00e6ff] flex items-center justify-center"
                      >
                        <span className="text-[12px] text-cyan-400 font-black">✓</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center relative z-10">
                    <div className="flex flex-col mb-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-cyan-50 font-bold text-lg sm:text-2xl tracking-tight truncate">
                          {user.first_name || user.name || user.username}
                        </h2>
                        <div className="bg-cyan-500/5 border border-cyan-400/20 px-2.5 py-1 rounded-lg shrink-0">
                          <span className="text-cyan-500/80 font-black text-[9px] sm:text-[10px] tracking-[0.15em] uppercase">
                            BW ID: {telegramId ? String(telegramId).slice(-3) : "..."}
                          </span>
                        </div>
                      </div>
                      <span className="text-cyan-500/50 text-[11px] sm:text-[13px] font-semibold tracking-wide mt-0.5">
                        @{user.username}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-400/20 rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                        <span className="text-cyan-300 text-[11px] font-black uppercase tracking-widest">{t("profile.level")} {level}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Cards Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 group hover:border-cyan-500/30 transition-colors shadow-lg">
                    <div className="text-cyan-50 text-2xl font-black leading-none">{user.streak_days}</div>
                    <div className="text-cyan-500/60 text-[10px] font-black uppercase tracking-[0.2em]">{t("profile.streak")}</div>
                  </div>

                  <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 group hover:border-cyan-500/30 transition-colors shadow-lg">
                    <div className="text-cyan-50 text-2xl font-black leading-none">{user.total_referrals || 0}</div>
                    <div className="text-cyan-500/60 text-[10px] font-black uppercase tracking-[0.2em]">{t("profile.total_networks")}</div>
                  </div>
                </div>

                {/* Wallet Action Card */}
                <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-2xl p-1.5 flex items-center group cursor-pointer hover:border-cyan-500/30 transition-all shadow-lg active:scale-[0.98]">
                  <div className="p-4 bg-cyan-500/5 rounded-2xl shrink-0 group-hover:bg-cyan-500/10 transition-colors">
                    <Wallet className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex-1 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src="/ton-transparent.png" alt="TON" className="w-6 h-6" />
                      <span className="text-cyan-100 font-black text-sm uppercase tracking-wider">{t("profile.connect_wallet")}</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-gray-600 group-hover:bg-cyan-500 transition-colors"></div>
                  </div>
                </div>

                {/* Earnings Module */}
                <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-3xl p-5 shadow-lg flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-cyan-500/5 pb-3">
                    <h3 className="text-cyan-500/70 text-[11px] font-black uppercase tracking-[0.15em]">{t("profile.network_earnings")}</h3>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-cyan-50 text-3xl font-black">{user.referral_earnings_pending}</span>
                      <span className="text-cyan-500/80 text-xs font-black tracking-widest">$BWAVE</span>
                    </div>

                    <div className="flex gap-3 mt-1">
                      <button
                        onClick={handleClaim}
                        disabled={user.referral_earnings_pending === 0 || claiming}
                        className={`flex-1 py-3.5 text-[12px] font-black rounded-xl border transition-all uppercase tracking-[0.15em] ${user.referral_earnings_pending === 0
                          ? "bg-gray-900/40 text-gray-600 border-gray-800"
                          : "bg-cyan-500/10 text-cyan-300 border-cyan-400 group hover:shadow-[0_0_20px_#00e6ff20] active:scale-[0.97]"
                          } disabled:opacity-50`}
                      >
                        {claiming ? t("profile.claiming") : claimDone ? t("profile.done") : t("profile.claim")}
                      </button>
                      <button
                        onClick={handleNotifyInactive}
                        disabled={notifying || cooldown !== null}
                        className={`flex-1 py-3.5 text-[12px] font-black rounded-xl border transition-all uppercase tracking-[0.15em] ${cooldown !== null
                          ? "border-gray-800 text-gray-700 bg-gray-900/20"
                          : "border-cyan-400/20 text-cyan-500/80 hover:bg-cyan-500/5 hover:border-cyan-400/40 active:scale-[0.97]"
                          } disabled:opacity-50`}
                      >
                        {notifying ? t("profile.wait") : cooldown !== null ? `${cooldownText}` : t("profile.notify_inactive")}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Roles & Status */}
                <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-3xl p-5 shadow-lg flex flex-col gap-4">
                  <div className="text-cyan-500/70 text-[11px] font-black uppercase tracking-[0.15em]">{t("profile.roles")}</div>
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-cyan-500/5 rounded-2xl bg-cyan-950/5">
                    <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest opacity-60 italic">{t("profile.no_roles")}</p>
                  </div>
                </div>

                {/* Referral Assets */}
                <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-3xl p-5 shadow-lg flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="text-cyan-500/70 text-[11px] font-black uppercase tracking-[0.15em]">{t("profile.referral_link")}</div>
                      <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-none">Global Network Builder</div>
                    </div>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(user.referral_link);
                        setCopied(true);

                        const tg = (window as any).Telegram?.WebApp;
                        if (tg?.HapticFeedback) {
                          tg.HapticFeedback.impactOccurred("medium");
                        }

                        setTimeout(() => setCopied(false), 1500);
                      }}
                      className="px-5 py-2.5 bg-cyan-500/10 border border-cyan-400/40 text-cyan-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500/20 transition-all shadow-[0_0_15px_#00e6ff20] active:scale-[0.95]"
                    >
                      {copied ? t("profile.copied") : t("profile.copy")}
                    </button>
                  </div>

                  <div className="bg-black/40 border border-cyan-500/10 rounded-2xl p-4 group cursor-copy active:bg-cyan-500/5 transition-all">
                    <div className="text-cyan-400 text-xs font-mono break-all opacity-60 group-hover:opacity-100 transition-opacity">
                      {user.referral_link}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 pt-4 border-t border-cyan-500/5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-900"></div>
                      <div className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                        {t("profile.joined")}: {new Date(user.joined_at).toLocaleDateString()}
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-900"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <AnimatePresence>
              {badgeUnlocked && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2
                             bg-cyan-500/20 text-cyan-200 border border-cyan-400
                             px-3 py-1 rounded-lg text-xs shadow-[0_0_20px_#00e6ff]"
                >
                  {t("profile.badge_unlocked")}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sub-overlays nested within the main container */}
          <Settings
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onOpenLanguage={() => setLanguageOpen(true)}
          />

          <LanguageSelector
            isOpen={languageOpen}
            onClose={() => setLanguageOpen(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
