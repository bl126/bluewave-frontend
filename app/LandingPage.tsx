// [CODE: FRONTEND_LANDING_PAGE_COMPONENT]
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
import TopRightMenu from "../components/ui/TopRightMenu";
import WhitepaperOverlay from "../components/WhitepaperOverlay";
import StatsOverlay from "../components/ui/StatsOverlay";

// [CODE: FRONTEND_LANDING_PAGE_MAIN_COMPONENT]
export default function LandingPage() {

  // [CODE: FRONTEND_TELEGRAM_WEBAPP_INIT]
  // ⭐ ENSURE Telegram WebApp is initialized
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        console.log("Telegram WebApp initialized:", tg.initDataUnsafe);
      } catch (e) {
        console.log("WebApp init error:", e);
      }
    }
  }, []);

  // [CODE: FRONTEND_BROWSER_BLOCK]
  // ❗ Block users opening in browser – Bluewave is Telegram-only
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) {
      alert("Bluewave can only be opened inside Telegram.");
      setOnboardingOpen(true);
    }
  }, []);

  // [CODE: FRONTEND_STATE_MANAGEMENT]
  // 👤 Store Telegram user info (manual onboarding, not Telegram init)
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isMissionOpen, setMissionOpen] = useState(false);
  const [isLeaderboardOpen, setLeaderboardOpen] = useState(false);
  const [isMarketOpen, setMarketOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [isWhitepaperOpen, setWhitepaperOpen] = useState(false);
  const [isStatsOpen, setStatsOpen] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  // ⭐ Pull username + id from Telegram InitData, preload into state
  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const tgUser = tg?.initDataUnsafe?.user;
      if (tgUser) {
        const autoUsername = tgUser.username?.toLowerCase() || `bw_user_${tgUser.id}`;
        setTelegramUser({
          id: tgUser.id,
          tg_id: tgUser.id,
          username: autoUsername,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          photo_url: tgUser.photo_url || null,
        });

        // Pre-store for onboarding to pick up
        window.localStorage.setItem("bw_tg_id", String(tgUser.id));
      }
    } catch (e) {
      console.log("TG InitData error:", e);
    }
  }, []);

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
          const err = await res.json().catch(() => ({}));
          if (err.detail === "TOO_FAST") {
            console.warn("Rate limited. Retrying in 1.2s...");
            setTimeout(() => {
              window.location.reload();
            }, 1200);
            return;
          }
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
          photo_url: user.photo_url || null,
          points_balance: user.points_balance ?? 0,
          referral_earnings_pending: user.referral_earnings_pending ?? 0,
          total_referrals: user.total_referrals ?? 0,
          inactive_referrals_cache: user.inactive_referrals_cache ?? 0,
          streak: user.streak_days ?? 0,
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
      first_name: user.first_name,
      photo_url: user.photo_url || null,
      points_balance: user.points_balance ?? null,
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
      {/* TopRightMenu */}
      {!onboardingOpen && !isLoading && (
        <TopRightMenu
          onOpenWhitepaper={() => setWhitepaperOpen(true)}
          isWhitepaperActive={isWhitepaperOpen}
          onOpenStats={() => setStatsOpen(true)}
          isStatsActive={isStatsOpen}
        />
      )}

      {/* 💰 Top-left Balance */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2 text-cyan-400 font-semibold text-sm">
        <Wallet size={16} />
        <span>
          {balance !== null
            ? `${balance.toLocaleString()} $BWAVE`
            : telegramUser
              ? "Loading..."
              : (
                <span className="text-cyan-400 animate-pulse">
                  Connecting…
                </span>
              )}
        </span>
      </div>

      {/* 🧭 Navigation Bar */}
      {!onboardingOpen && (
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
      )}

      {/* 🎯 Overlays (Lazy-rendered to save API calls) */}
      {isMissionOpen && (
        <MissionCenter isOpen={isMissionOpen} onClose={() => setMissionOpen(false)} telegramUser={telegramUser} />
      )}
      {isLeaderboardOpen && (
        <Leaderboard isOpen={isLeaderboardOpen} onClose={() => setLeaderboardOpen(false)} telegramUser={telegramUser} />
      )}
      {isMarketOpen && (
        <Marketplace isOpen={isMarketOpen} onClose={() => setMarketOpen(false)} />
      )}
      {isProfileOpen && (
        <Profile isOpen={isProfileOpen} onClose={() => setProfileOpen(false)} telegramUser={telegramUser} />
      )}

      {/* 🌀 Loading Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="fixed inset-0 z-[100]">
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📄 Whitepaper Overlay */}
      <WhitepaperOverlay
        isOpen={isWhitepaperOpen}
        onClose={() => setWhitepaperOpen(false)}
      />

      {/* 📊 Stats Overlay */}
      <StatsOverlay
        isOpen={isStatsOpen}
        onClose={() => setStatsOpen(false)}
        onOpenWhitepaper={() => {
          setStatsOpen(false);
          setWhitepaperOpen(true);
        }}
        onOpenAbout={() => {/* implementation for about */ }}
        onOpenLedger={() => {/* implementation for ledger */ }}
        onOpenFAQ={() => {/* implementation for faq */ }}
      />

      {/* 🔐 Onboarding LOCK SCREEN */}
      <OnboardingModal
        isOpen={onboardingOpen}
        onComplete={handleOnboardingComplete}
        autoUsername={telegramUser?.username}
      />
    </div>
  );
}
