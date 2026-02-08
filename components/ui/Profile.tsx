// [CODE: FRONTEND_PROFILE_COMPONENT]
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, MoreVertical, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/useApi";

// [CODE: FRONTEND_PROFILE_TYPES]
interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
}

// [CODE: FRONTEND_PROFILE_MAIN_COMPONENT]
export default function Profile({ isOpen, onClose }: ProfileProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [cooldown, setCooldown] = useState<number | null>(null);
  const [cooldownText, setCooldownText] = useState("00:00:00");
  const [claiming, setClaiming] = useState(false);
  const [badgeUnlocked, setBadgeUnlocked] = useState(false);

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

      // ★ Move this OUTSIDE the dispatch
      setTimeout(() => setClaiming(false), 1200);
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

  const handleNotify = async () => {
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
                       rounded-t-3xl p-6 text-cyan-200 shadow-[0_-4px_40px_#00e6ff20]
                       max-h-[85vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Drag Handle */}
            <div className="w-12 h-1 bg-cyan-700/50 rounded-full mx-auto mb-4"></div>

            {/* Header with 3-dot menu */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-cyan-400 text-xl font-semibold tracking-wide">
                PROFILE
              </h2>
              <button className="text-cyan-300 hover:text-cyan-100">
                <MoreVertical size={20} />
              </button>
            </div>

            {loading && <p className="text-center text-cyan-400">Loading...</p>}
            {error && <p className="text-center text-red-400">{error}</p>}

            {user && (
              <div className="space-y-4">

                {/* Identity Section */}
                <div className="flex flex-col items-center mb-4">
                  <div className="relative mb-3">
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

                    {/* 🌊 Streak Badge (3+ days) — glowing check circle */}
                    {user.streak_days >= 3 && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full 
                                   bg-cyan-400/30 border border-cyan-300 
                                   shadow-[0_0_12px_#00e6ff] flex items-center justify-center"
                      >
                        <span className="text-[12px] text-cyan-100 font-bold">✓</span>
                      </motion.div>
                    )}
                  </div>

                  {/* BW ID (primary) */}
                  <div className="text-cyan-300 text-lg font-semibold mb-1">
                    BW ID: {user.bw_id}
                  </div>

                  {/* Name */}
                  <div className="text-cyan-400 text-base mb-0.5">
                    {user.name}
                  </div>

                  {/* @username */}
                  <div className="text-cyan-500 text-sm">
                    @{user.username}
                  </div>
                </div>

                {/* Status Cards Row */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Day Streak */}
                  <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-xl p-3 text-center shadow-[0_0_15px_#00e6ff15]">
                    <div className="text-cyan-400 text-xs mb-1">Streak Days</div>
                    <div className="text-cyan-200 text-lg font-bold">{user.streak_days}</div>
                  </div>

                  {/* Level */}
                  <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-xl p-3 text-center shadow-[0_0_15px_#00e6ff15]">
                    <div className="text-cyan-400 text-xs mb-1">Level</div>
                    <div className="text-cyan-200 text-sm font-bold">{level}</div>
                  </div>

                  {/* Total Networks */}
                  <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-xl p-3 text-center shadow-[0_0_15px_#00e6ff15]">
                    <div className="text-cyan-400 text-xs mb-1">Total Networks</div>
                    <div className="text-cyan-200 text-lg font-bold">{user.total_referrals}</div>
                  </div>
                </div>

                {/* Network Earnings Block */}
                <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-xl p-4 shadow-[0_0_15px_#00e6ff15]">
                  <div className="text-cyan-400 text-sm font-semibold mb-2">Network Earnings</div>
                  <div className="text-cyan-200 text-xl font-bold mb-3">
                    {user.referral_earnings_pending} $BWAVE
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClaim}
                      disabled={user.referral_earnings_pending === 0}
                      className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-all ${user.referral_earnings_pending === 0
                        ? "bg-gray-700 text-gray-400 border-gray-600"
                        : "bg-cyan-500/20 text-cyan-300 border-cyan-400 hover:bg-cyan-500/30 shadow-[0_0_10px_#00e6ff30]"
                        }`}
                    >
                      {claiming ? "Claiming..." :
                        user.referral_earnings_pending === 0 ? "Done" : "Claim"}
                    </button>
                    <button
                      onClick={handleNotify}
                      disabled={nextNotifyAt !== null}
                      className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-all
                        ${nextNotifyAt !== null
                          ? "border-gray-700 text-gray-500 bg-gray-800 opacity-60"
                          : "border-cyan-400 text-cyan-300 hover:bg-cyan-500/20 shadow-[0_0_10px_#00e6ff30]"
                        }
                      `}
                    >
                      {notifying
                        ? "Notifying..."
                        : nextNotifyAt !== null
                          ? `Wait ${cooldownText}`
                          : "Notify Inactive Networks"}
                    </button>
                  </div>
                </div>

                {/* Wallet Section (Static) */}
                <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-xl p-4 shadow-[0_0_15px_#00e6ff15] flex items-center gap-3">
                  <img src="/ton-transparent.png" alt="TON" className="w-8 h-8" />
                  <div className="flex-1">
                    <div className="text-cyan-400 text-sm font-semibold">Connect Wallet</div>
                    <div className="text-cyan-500 text-xs">TON Wallet Integration</div>
                  </div>
                </div>

                {/* Roles Section (Empty for now) */}
                <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-xl p-4 shadow-[0_0_15px_#00e6ff15]">
                  <div className="text-cyan-400 text-sm font-semibold mb-2">Roles</div>
                  <div className="text-cyan-500 text-xs italic">No roles assigned yet</div>
                </div>

                {/* Footer Section */}
                <div className="bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-xl p-4 shadow-[0_0_15px_#00e6ff15]">
                  <div className="text-cyan-400 text-xs mb-2">Referral Link:</div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] text-cyan-300 truncate flex-1">
                      {user.referral_link}
                    </span>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(user.referral_link);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                      className="text-[11px] px-3 py-1 border border-cyan-400 text-cyan-300 rounded-md hover:bg-cyan-500/20"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="text-xs text-cyan-500">
                    Joined: {new Date(user.joined_at).toLocaleDateString()}
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
                  🔥 3-Day Streak Badge Unlocked!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
