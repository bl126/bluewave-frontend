// [CODE: FRONTEND_PROFILE_COMPONENT]
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, MoreVertical, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/useApi";
import Settings from "./Settings";
import LanguageSelector from "./LanguageSelector";
import ChangeName from "./ChangeName";
import { useLanguage } from "@/contexts/LanguageContext";

// [CODE: FRONTEND_PROFILE_TYPES]
interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
}

// [CODE: FRONTEND_PROFILE_MAIN_COMPONENT]
export default function Profile({ isOpen, onClose }: ProfileProps) {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
  const [changeNameOpen, setChangeNameOpen] = useState(false);

  // [CODE: FRONTEND_TELEGRAM_ID_MANAGEMENT]
  // ⭐ Telegram ID extracted from Mini App
  const [telegramId, setTelegramId] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("bw_tg_id");
    if (stored) {
      setTelegramId(Number(stored));
    }
  }, []);

  // ⭐ SWR fetch using Telegram ID (safe null)
  const { data: swrUser, error: swrError, loading: swrLoading, mutate } =
    useApi(telegramId ? `/user/${telegramId}` : null);

  useEffect(() => {
    if (telegramId) mutate();  // force SWR refresh when ID loads
  }, [telegramId]);

  // ⭐ Sync SWR result
  useEffect(() => {
    if (swrUser) {
      setUser(swrUser);
      setLoading(false);
      setError("");               // clear any old error
    }
    // only show error if we truly have no user data
    if (swrError && !swrUser) {
      setError("Could not load profile");
      setLoading(false);
    }
  }, [swrUser, swrError]);

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
    if (!telegramId) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/update_name`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id: telegramId, name: newName }),
      });

      const result = await res.json();

      if (result.success) {
        setUser((prev: any) => ({ ...prev, name: result.name, raw_name: result.name }));
      }
    } catch (error) {
      console.error("Failed to update name:", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100) {
                onClose();
              }
            }}
            className="fixed z-50 left-1/2 bottom-0 -translate-x-1/2
                       w-full max-w-md bg-black/70 backdrop-blur-xl border-t border-cyan-900/50
                       rounded-t-3xl p-6 pb-24 text-cyan-200 shadow-[0_-4px_40px_#00e6ff20]
                       max-h-[85vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Drag Handle */}
            <div className="w-12 h-1 bg-cyan-700/50 rounded-full mx-auto mb-4"></div>

            {/* Header with 3-dot menu */}
            <div className="flex justify-end items-center mb-6">
              <button
                onClick={() => setSettingsOpen(true)}
                className="text-cyan-300 hover:text-cyan-100 transition-colors"
              >
                <MoreVertical size={20} />
              </button>
            </div>

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
              <div className="space-y-3">

                {/* Profile Picture + BW ID Section */}
                <div className="relative flex items-start justify-between mb-3">
                  {/* Left: Profile Picture */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-xl bg-cyan-500/20"></div>

                    {user.photo_url ? (
                      <div className="relative">
                        <img
                          src={`${user.photo_url}?r=${Date.now()}`}
                          alt="avatar"
                          className="relative w-24 h-24 rounded-full border border-cyan-400/40 shadow-[0_0_20px_#00e6ff50] object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="
                        relative w-24 h-24 rounded-full
                        bg-[#001f2e]
                        flex items-center justify-center
                        text-[#00eaff] text-3xl font-bold
                        shadow-[0_0_40px_#00eaff80]
                        border border-cyan-400/40
                      "
                      >
                        {(user.name?.charAt(0) || user.username?.charAt(0) || "U").toUpperCase()}
                      </div>
                    )}

                    {/* 🌊 Streak Badge (3+ days) — cyan checkmark circle */}
                    {user.streak_days >= 3 && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="absolute bottom-1 right-1 w-6 h-6 rounded-full 
                                   bg-cyan-400/30 border border-cyan-300 
                                   shadow-[0_0_12px_#00e6ff] flex items-center justify-center"
                      >
                        <span className="text-[10px] text-cyan-100 font-bold">✓</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Right: BW ID Pill */}
                  <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 px-4 py-1.5 rounded-full shadow-[0_0_15px_#00e6ff15]">
                    <span className="text-cyan-300 font-semibold text-xs">
                      BW ID: {telegramId ? String(telegramId).slice(-3) : "..."}
                    </span>
                  </div>
                </div>

                {/* Name Pill + @username */}
                <div className="flex flex-col items-start gap-1.5 mb-3">
                  <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 px-4 py-1.5 rounded-full shadow-[0_0_15px_#00e6ff15]">
                    <span className="text-cyan-300 font-semibold text-sm">
                      {user.raw_name || user.first_name || user.name}
                    </span>
                  </div>
                  <div className="text-cyan-500 text-xs font-medium ml-1">
                    @{user.username}
                  </div>
                </div>

                {/* Status Cards Row */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Day Streak */}
                  <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-lg p-2 text-center shadow-[0_0_15px_#00e6ff15]">
                    <div className="text-cyan-100 text-[11px] font-bold">{user.streak_days}</div>
                    <div className="text-cyan-500 text-[10px] font-medium uppercase tracking-tight">{t("profile.streak")}</div>
                  </div>

                  {/* Level */}
                  <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-lg p-2 text-center shadow-[0_0_15px_#00e6ff15]">
                    <div className="text-cyan-400 text-[11px] font-semibold">{t("profile.level")} {level}</div>
                  </div>

                  {/* Total Networks */}
                  <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-lg p-2 text-center shadow-[0_0_15px_#00e6ff15]">
                    <div className="text-cyan-100 text-[11px] font-bold">{user.total_referrals || 0}</div>
                    <div className="text-cyan-500 text-[10px] font-medium uppercase tracking-tight">{t("profile.total_networks")}</div>
                  </div>
                </div>

                {/* Wallet Section */}
                <div className="flex items-center gap-2">
                  <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-full p-3 shadow-[0_0_15px_#00e6ff15]">
                    <Wallet className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 px-4 py-1.5 rounded-full shadow-[0_0_15px_#00e6ff15] hover:bg-cyan-500/10 transition-all cursor-pointer flex items-center gap-2">
                    <img src="/ton-transparent.png" alt="TON" className="w-4 h-4" />
                    <span className="text-cyan-300 font-semibold text-xs">{t("profile.connect_wallet")}</span>
                  </div>
                </div>

                {/* Network Earnings Block */}
                <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-lg p-3 shadow-[0_0_15px_#00e6ff15]">
                  <h3 className="text-cyan-400 text-xs font-semibold mb-2">{t("profile.network_earnings")}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClaim}
                      disabled={user.referral_earnings_pending === 0 || claiming}
                      className={`flex-1 px-3 py-1.5 text-xs rounded-lg border transition-all ${user.referral_earnings_pending === 0
                        ? "bg-gray-700 text-gray-400 border-gray-600"
                        : "bg-cyan-500/20 text-cyan-300 border-cyan-400 hover:bg-cyan-500/30 shadow-[0_0_10px_#00e6ff30]"
                        } disabled:opacity-50`}
                    >
                      {claiming ? t("profile.claiming") : claimDone ? t("profile.done") : `${t("profile.claim")} (${user.referral_earnings_pending})`}
                    </button>
                    <button
                      onClick={handleNotifyInactive}
                      disabled={notifying || cooldown !== null}
                      className={`flex-1 px-3 py-1.5 text-xs rounded-lg border transition-all ${cooldown !== null
                        ? "border-gray-700 text-gray-500 bg-gray-800 opacity-60"
                        : "border-cyan-400 text-cyan-300 hover:bg-cyan-500/20 shadow-[0_0_10px_#00e6ff30]"
                        } disabled:opacity-50`}
                    >
                      {notifying ? t("profile.wait") : cooldown !== null ? `Wait ${cooldownText}` : t("profile.notify_inactive")}
                    </button>
                  </div>
                </div>

                {/* Roles Section */}
                <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-lg p-4 shadow-[0_0_15px_#00e6ff15] min-h-[80px]">
                  <div className="text-cyan-400 text-xs font-semibold mb-1.5">{t("profile.roles")}</div>
                  <div className="text-cyan-500 text-[10px] italic">{t("profile.no_roles")}</div>
                </div>

                {/* Footer Section */}
                <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-lg p-3 shadow-[0_0_15px_#00e6ff15]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-cyan-400 text-[10px] font-semibold">{t("profile.referral_link")}</div>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(user.referral_link);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                      className="px-3 py-1 border border-cyan-400 text-cyan-300 rounded-lg text-[10px] font-semibold hover:bg-cyan-500/20 transition-all"
                    >
                      {copied ? t("profile.copied") : t("profile.copy")}
                    </button>
                  </div>
                  <div className="text-cyan-300 text-[10px] font-medium mb-2 truncate">
                    {user.referral_link}
                  </div>
                  <div className="text-cyan-500 text-[10px]">
                    {t("profile.joined")}: {new Date(user.joined_at).toLocaleDateString()}
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
          </motion.div>
        </>
      )
      }

      {/* Settings Overlay */}
      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenLanguage={() => setLanguageOpen(true)}
        onOpenChangeName={() => setChangeNameOpen(true)}
      />

      {/* Language Selector Overlay */}
      <LanguageSelector
        isOpen={languageOpen}
        onClose={() => setLanguageOpen(false)}
      />

      {/* Change Name Overlay */}
      <ChangeName
        isOpen={changeNameOpen}
        onClose={() => setChangeNameOpen(false)}
        currentName={user?.name || ""}
        onSave={handleSaveName}
      />
    </AnimatePresence>
  );
}
