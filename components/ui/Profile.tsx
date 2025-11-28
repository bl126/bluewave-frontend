"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/useApi";


interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
}

export default function Profile({ isOpen, onClose, telegramUser }: ProfileProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [cooldown, setCooldown] = useState<number | null>(null);
  const [cooldownText, setCooldownText] = useState("00:00:00");
  const [claiming, setClaiming] = useState(false);
  const [badgeUnlocked, setBadgeUnlocked] = useState(false);



  const telegram_id = telegramUser?.id;
  // ⭐ SWR cached user fetch (replaces old useEffect)
  const { data: swrUser, error: swrError, loading: swrLoading } =
    useApi(`/user/${telegram_id}`);
  // Sync SWR data into local user state
  useEffect(() => {
    if (swrUser) {
      setUser(swrUser);
      setLoading(false);
    }
    if (swrError) {
      setError("Could not load profile");
    }
  }, [swrUser, swrError]);

  useEffect(() => {
    if (isOpen && telegram_id) {
      loadCooldown(); // ensure cooldown loads on open
    }
  }, [isOpen, telegram_id]);


  const [nextNotifyAt, setNextNotifyAt] = useState<number | null>(null);
  
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

      setCooldownText(`${h}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [nextNotifyAt]);

  // ⭐ ADD THIS NEW LEVEL LOGIC HERE
  const [level, setLevel] = useState("Loading...");

  useEffect(() => {
    if (!telegram_id) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user_level/${telegram_id}`)
      .then(r => r.json())
      .then(d => setLevel(d.level));
  }, [telegram_id]);


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
    if (!telegram_id) return;
    const interval = setInterval(() => {
      setUser((prev: any) => ({
        ...prev,
        photo_url: prev.photo_url ? `${prev.photo_url}?r=${Date.now()}` : null
      }));
    }, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [telegram_id]);

  const handleClaim = async () => {
    if (claiming) return;
    setClaiming(true);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/claim_referral`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id }),
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
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notify_usage/${telegram_id}`);
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

    if (cooldown !== null) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notify_inactive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id }),
    });

    const result = await res.json();

    if (result.blocked) {
      // Start a fresh 4h timer
      setCooldown(4 * 60 * 60 * 1000);
      return;
    }

    const next = Date.now() + 4 * 60 * 60 * 1000;

    localStorage.setItem("notifyNextTime", String(next));
    setNextNotifyAt(next);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                       w-[90%] max-w-sm bg-black/60 backdrop-blur-md border border-cyan-900 
                       rounded-2xl p-5 text-cyan-200 shadow-[0_0_25px_#00e6ff30]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex justify-center relative mb-4">
              <h2 className="text-cyan-400 text-lg font-semibold tracking-wide">
                PROFILE
              </h2>
              <button
                onClick={onClose}
                className="absolute right-0 text-cyan-300 hover:text-cyan-100"
              >
                <X size={20} />
              </button>
            </div>

            {loading && <p className="text-center text-cyan-400">Loading...</p>}
            {error && <p className="text-center text-red-400">{error}</p>}

            {user && (
              <div className="space-y-3 text-sm">

                {/* Avatar container */}
                <div className="flex flex-col items-center mb-2">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-xl bg-cyan-500/20"></div>

                    {user.photo_url ? (
                      <img
                      src={`${user.photo_url}?r=${Date.now()}`}
                      alt="avatar"
                      className="relative w-20 h-20 rounded-full border border-cyan-400/40 shadow-[0_0_20px_#00e6ff50] object-cover"
                    />
                  ) : (
                    <div
                      className="
                        relative w-20 h-20 rounded-full
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

                  {/* 🔥 Streak days */}
                  {user.streak_days > 0 && (
                    <div className="text-cyan-400 text-xs mt-2">
                      🌊 {user.streak_days} Day Streak
                    </div>
                  )}


                </div>

                <div className="text-center text-cyan-400 text-xs mb-3">
                  Level — {level}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <p>
                    BW ID: <span className="text-cyan-300">{user.bw_id}</span>
                  </p>
                  <p>
                    Name: <span className="text-cyan-300">{user.name}</span>
                  </p>
                  <p>
                    Total Referrals:{" "}
                    <span className="text-cyan-300">{user.total_referrals}</span>
                  </p>
                  <p>
                    Inactive Referrals:{" "}
                    <span className="text-cyan-300">
                      {user.inactive_referrals_cache}
                    </span>
                  </p>
                </div>

                <div className="mt-3 border-t border-cyan-900/50 pt-2">
                  <p>
                    Referral Earnings:{" "}
                    <span className="text-cyan-300">
                      {user.referral_earnings_pending} $BWAVE
                    </span>
                  </p>
                  <button
                    onClick={handleClaim}
                    disabled={user.referral_earnings_pending === 0}
                    className={`px-3 py-1 mt-1 text-xs rounded-md border ${
                      user.referral_earnings_pending === 0
                        ? "bg-gray-700 text-gray-400 border-gray-600"
                        : "bg-cyan-500/20 text-cyan-300 border-cyan-400 hover:bg-cyan-500/30"
                    }`}
                  >
                    {claiming ? "Claiming..." :
                    user.referral_earnings_pending === 0 ? "Done" : "Claim"}
                  </button>
                </div>

                <div>
                  <button
                    onClick={handleNotify}
                    disabled={nextNotifyAt !== null}
                    className={`w-full mt-2 text-xs px-3 py-1 border rounded-md
                      ${nextNotifyAt !== null
                        ? "border-gray-700 text-gray-500 bg-gray-800 opacity-60"
                        : "border-cyan-400 text-cyan-300 hover:bg-cyan-500/20"
                      }
                    `}
                  >
                    {nextNotifyAt !== null ? `Wait ${cooldownText}` : "Notify Them"}
                  </button>
                </div>

                {/* Referral Link & Copy */}
                <div className="mt-3 border-t border-cyan-900/50 pt-2 text-center">
                  <p className="text-xs text-cyan-400 mb-1">Referral Link:</p>
                  <div className="flex justify-center items-center space-x-2">
                    <span className="text-[11px] text-cyan-300 truncate max-w-[180px]">
                      {user.referral_link}
                    </span>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(user.referral_link);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                      className="text-[11px] px-2 py-0.5 border border-cyan-400 text-cyan-300 rounded-md hover:bg-cyan-500/20"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="text-xs text-center text-cyan-500 mt-3">
                  Joined: {new Date(user.joined_at).toLocaleDateString()}
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
