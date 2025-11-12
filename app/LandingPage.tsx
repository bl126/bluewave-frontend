"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import BluewaveGlobe from "../components/ui/BluewaveGlobe";
import MissionCenter from "../components/ui/MissionCenter";
import Leaderboard from "../components/ui/Leaderboard";
import Marketplace from "../components/ui/Marketplace";
import Profile from "../components/ui/Profile";
import { Wallet, Rocket, Trophy, Store, User } from "lucide-react";
import LoadingScreen from "./LoadingScreen";


export default function LandingPage() {
  // 👤 Store Telegram user info
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isMissionOpen, setMissionOpen] = useState(false);
  const [isLeaderboardOpen, setLeaderboardOpen] = useState(false);
  const [isMarketOpen, setMarketOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);


  // 🧠 Initialize Telegram WebApp and extract user info
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready(); // Required by Telegram Mini App
      // Verify user authenticity
      fetch("https://bluewave-backend-wj70.onrender.com/api/verify_telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: tg.initData }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setTelegramUser(tg.initDataUnsafe?.user);
            console.log("✅ Telegram user verified");
          } else {
            console.error("❌ Verification failed:", data.error);
          }
        })
        .catch((err) => console.error("Error verifying Telegram user:", err));
    }
  }, []);

  // 💰 Fetch balance from backend when Telegram ID is ready
  const fetchBalance = async (tgId: number) => {
    try {
      const res = await fetch(`https://bluewave-backend-wj70.onrender.com/api/balance/${tgId}`);
      const data = await res.json();
      if (data.balance !== undefined) setBalance(data.balance);
    } catch (e) {
      console.error("Error fetching balance:", e);
    }
  };

  // ⏱️ Auto-fetch when Telegram user is loaded
  useEffect(() => {
    if (telegramUser?.id) {
      fetchBalance(telegramUser.id);
    }
  }, [telegramUser]);

  // 🔁 Listen for global balance updates
  useEffect(() => {
    const handleBalanceUpdate = (event: any) => {
      setBalance(event.detail);
    };
    window.addEventListener("updateBalance", handleBalanceUpdate);
    return () => window.removeEventListener("updateBalance", handleBalanceUpdate);
  }, []);

  // 🔄 Optional: refresh balance every 60s
  useEffect(() => {
    if (!telegramUser?.id) return;
    const interval = setInterval(() => fetchBalance(telegramUser.id), 60000);
    return () => clearInterval(interval);
  }, [telegramUser]);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ backgroundColor: "black" }}
    >
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
            : "Connecting..."}
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
        {/* 🚀 Missions */}
        <button
          onClick={() => setMissionOpen(true)}
          className="flex flex-col items-center text-xs text-cyan-400 hover:text-cyan-200 transition-all"
        >
          <Rocket size={18} /> Missions
        </button>

        {/* 🏆 Leaderboard */}
        <button
          onClick={() => setLeaderboardOpen(true)}
          className="flex flex-col items-center text-xs text-cyan-400 hover:text-cyan-200 transition-all"
        >
          <Trophy size={18} /> Leaderboard
        </button>

        {/* 🛒 Market */}
        <button
          onClick={() => setMarketOpen(true)}
          className="flex flex-col items-center text-xs text-cyan-400 hover:text-cyan-200 transition-all"
        >
          <Store size={18} /> Market
        </button>

        {/* 👤 Profile */}
        <button
          onClick={() => setProfileOpen(true)}
          className="flex flex-col items-center text-xs text-cyan-400 hover:text-cyan-200 transition-all"
        >
          <User size={18} /> Profile
        </button>
      </motion.div>

      {/* 🎯 Overlays */}
      <MissionCenter isOpen={isMissionOpen} onClose={() => setMissionOpen(false)} />
      <Leaderboard isOpen={isLeaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
      <Marketplace isOpen={isMarketOpen} onClose={() => setMarketOpen(false)} />
      <Profile isOpen={isProfileOpen} onClose={() => setProfileOpen(false)} telegramUser={telegramUser} />
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-50"
          >
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
