"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import BluewaveGlobe from "../components/ui/BluewaveGlobe";
import MissionCenter from "../components/ui/MissionCenter";
import Leaderboard from "../components/ui/Leaderboard";
import Marketplace from "../components/ui/Marketplace";
import Profile from "../components/ui/Profile";
import OnboardingModal from "../components/ui/OnboardingModal"; // ✅ ADD THIS
import { Wallet, Rocket, Trophy, Store, User } from "lucide-react";
import LoadingScreen from "./LoadingScreen";

export default function LandingPage() {
  // 👤 Store Telegram user info (manual onboarding, not Telegram init)
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isMissionOpen, setMissionOpen] = useState(false);
  const [isLeaderboardOpen, setLeaderboardOpen] = useState(false);
  const [isMarketOpen, setMarketOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingOpen, setOnboardingOpen] = useState(false); // ✅ ADD

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  // 🔥 NEW: Check onboarding status using localStorage + Supabase
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedTgId = window.localStorage.getItem("bw_tg_id");

    // No saved ID → force onboarding
    if (!savedTgId) {
      setOnboardingOpen(true);
      return;
    }

    // Fetch user from backend using saved tg_id
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/user/${savedTgId}`);
        if (!res.ok) {
          setOnboardingOpen(true);
          return;
        }

        const user = await res.json();

        // If onboarding not completed → force onboarding
        if (!user.first_login_completed) {
          setOnboardingOpen(true);
          return;
        }

        // Otherwise login success
        const tgIdNum = Number(savedTgId);

        setTelegramUser({
          id: tgIdNum,
          tg_id: tgIdNum,
          username: user.username,
          first_name: user.name,
          photo_url: user.photo_url,
          points_balance: user.points_balance,
          referral_earnings_pending: user.referral_earnings_pending,
          total_referrals: user.total_referrals,
          inactive_referrals_cache: user.inactive_referrals_cache,
          streak: user.streak_days,
          joined_at: user.joined_at,
        });

        setBalance(user.points_balance ?? null);
      } catch (err) {
        console.error("Error:", err);
        setOnboardingOpen(true);
      }
    })();
  }, [apiBase]);

  // 💰 Fetch balance (unchanged)
  const fetchBalance = async (tgId: number) => {
    try {
      const res = await fetch(`${apiBase}/api/balance/${tgId}`);
      const data = await res.json();
      if (data.balance !== undefined) setBalance(data.balance);
    } catch (e) {
      console.error("Error fetching balance:", e);
    }
  };

  // Update balance after login
  useEffect(() => {
    if (telegramUser?.id) {
      fetchBalance(telegramUser.id);
    }
  }, [telegramUser]);

  // 🔁 Listen for global balance updates (unchanged)
  useEffect(() => {
    const handleBalanceUpdate = (event: any) => {
      setBalance(event.detail);
    };
    window.addEventListener("updateBalance", handleBalanceUpdate);
    return () => window.removeEventListener("updateBalance", handleBalanceUpdate);
  }, []);

  // 🔄 Refresh balance every 60s (unchanged)
  useEffect(() => {
    if (!telegramUser?.id) return;
    const interval = setInterval(() => fetchBalance(telegramUser.id), 60000);
    return () => clearInterval(interval);
  }, [telegramUser]);

  // 🔥 NEW: Called when onboarding completes successfully
  const handleOnboardingComplete = (user: any) => {
    const tgId = user.tg_id;

    // Save for future auto-login
    if (typeof window !== "undefined") {
      window.localStorage.setItem("bw_tg_id", String(tgId));
    }

    // Set user into state
    setTelegramUser({
      id: tgId,
      tg_id: tgId,
      username: user.username,
      points_balance: user.points_balance,
    });

    setBalance(user.points_balance ?? null);

    setOnboardingOpen(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ backgroundColor: "black" }}>
      {/* 🌍 Background Globe */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <BluewaveGlobe onLoaded={() => setIsLoading(false)} />
      </div>

      {/* 💰 Top-left Balance */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2 text-cyan-400 font-semibold text-sm">
        <Wallet size={16} />
        <span>
          {balance !== null
            ? `${balance.toLocaleString()} $BWAVE`
            : telegramUser
            ? "Loading..."
            : "Connect to begin"}
        </span>
      </div>

      {/* 🧭 Navigation Bar */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute left-1/2 -translate-x-1/2 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30
                   flex items-center justify-around w-[92%] max-w-sm bg-black/50 backdrop-blur-md
                   rounded-2xl p-2 shadow-[0_0_20px_#00e6ff30] border border-cyan-900"
      >
        <button onClick={() => setMissionOpen(true)} className="flex flex-col items-center text-xs text-cyan-400 hover:text-cyan-200">
          <Rocket size={18} /> Missions
        </button>

        <button onClick={() => setLeaderboardOpen(true)} className="flex flex-col items-center text-xs text-cyan-400 hover:text-cyan-200">
          <Trophy size={18} /> Leaderboard
        </button>

        <button onClick={() => setMarketOpen(true)} className="flex flex-col items-center text-xs text-cyan-400 hover:text-cyan-200">
          <Store size={18} /> Market
        </button>

        <button onClick={() => setProfileOpen(true)} className="flex flex-col items-center text-xs text-cyan-400 hover:text-cyan-200">
          <User size={18} /> Profile
        </button>
      </motion.div>

      {/* 🎯 Overlays */}
      <MissionCenter isOpen={isMissionOpen} onClose={() => setMissionOpen(false)} telegramUser={telegramUser} />
      <Leaderboard isOpen={isLeaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
      <Marketplace isOpen={isMarketOpen} onClose={() => setMarketOpen(false)} />
      <Profile isOpen={isProfileOpen} onClose={() => setProfileOpen(false)} telegramUser={telegramUser} />

      {/* 🌀 Loading Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="fixed inset-0 z-50">
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔐 Onboarding LOCK SCREEN */}
      <OnboardingModal isOpen={onboardingOpen} onComplete={handleOnboardingComplete} />
    </div>
  );
}
