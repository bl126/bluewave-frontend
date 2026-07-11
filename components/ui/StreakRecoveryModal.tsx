"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Clock, ShieldAlert, X } from "lucide-react";
import { postApi } from "@/lib/useApi";
import { useLanguage } from "@/contexts/LanguageContext";

interface StreakRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  telegramId: number;
  recoverableStreak: number;
  expiresAt: string;
  pointsBalance: number;
}

export default function StreakRecoveryModal({
  isOpen,
  onClose,
  telegramId,
  recoverableStreak,
  expiresAt,
  pointsBalance
}: StreakRecoveryModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Dynamic burn cost — mirrors backend formula exactly
  const calculateRecoveryCost = (streak: number): number => {
    if (streak >= 100) return 20000;
    if (streak >= 60)  return 10000;
    if (streak >= 30)  return 5000;
    if (streak >= 14)  return 2500;
    if (streak >= 7)   return 1000;
    return 500; // 3–6 days
  };
  const RECOVERY_COST = calculateRecoveryCost(recoverableStreak);
  const hasEnoughBalance = pointsBalance >= RECOVERY_COST;

  // Countdown timer logic
  useEffect(() => {
    if (!isOpen || !expiresAt) return;

    const updateTimer = () => {
      const expirationDate = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const difference = expirationDate - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, isOpen]);

  const formatTime = (value: number) => value.toString().padStart(2, "0");

  const handleRecover = async () => {
    if (loading || !hasEnoughBalance) return;
    setLoading(true);
    setError(null);

    try {
      const result = await postApi("/user/recover_streak", { telegram_id: telegramId });
      if (result.success || result.error === "ALREADY_RECOVERED") {
        
        if (result.success) {
          // Trigger generic balance and streak update events for the app to sync
          window.dispatchEvent(new CustomEvent("updateBalance", { detail: result.new_balance }));
          window.dispatchEvent(
            new CustomEvent("updateUser", {
              detail: {
                points_balance: result.new_balance,
                streak_days: result.new_streak,
                recoverable_streak: 0,
                streak_recovery_expires_at: null
              }
            })
          );
        } else if (result.error === "ALREADY_RECOVERED") {
          // Sync client down if already recovered
          window.dispatchEvent(
            new CustomEvent("updateUser", {
              detail: {
                recoverable_streak: 0,
                streak_recovery_expires_at: null
              }
            })
          );
        }
        
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1500);
      } else {
        setError(result.error === "INSUFFICIENT_BALANCE" ? "Insufficient BP." : "Failed to recover streak. Try again.");
      }
    } catch (e: any) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[160] bg-app-bg/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-app-card border border-app-border rounded-[2rem] overflow-hidden shadow-app-shadow pointer-events-auto relative backdrop-blur-2xl"
            >
              {success ? (
                <div className="p-8 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500 rounded-full flex items-center justify-center mb-6 shadow-app-shadow">
                    <Flame size={40} className="text-green-400" />
                  </div>
                  <h2 className="text-2xl font-black text-text-main uppercase tracking-wider mb-2">{t("streakRecovery.streak_saved_title")}</h2>
                  <p className="text-green-400 font-bold tracking-widest text-sm uppercase">{t("streakRecovery.streak_saved_subtitle")}</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-app-accent/5 rounded-full text-text-sub hover:text-text-main hover:bg-app-accent/10 transition-colors"
                  >
                    <X size={18} />
                  </button>

                  <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 relative mb-6">
                      <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse blur-xl" />
                      <div className="w-full h-full bg-app-bg/50 border border-app-border rounded-full flex items-center justify-center relative z-10 overflow-hidden backdrop-blur-md shadow-app-shadow">
                        <Flame size={32} className="text-red-500 opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 to-transparent" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-app-bg border border-app-border rounded-full p-1.5 z-20 shadow-lg">
                        <ShieldAlert size={16} className="text-red-400" />
                      </div>
                    </div>

                    <h2 className="text-xl font-black text-text-main uppercase tracking-tight mb-2">
                      {t("streakRecovery.streak_at_risk_title")}
                    </h2>
                    <p className="text-text-main/60 text-xs font-bold leading-relaxed mb-6 uppercase tracking-wider">
                      {t("streakRecovery.streak_at_risk_subtitle").replace("{days}", recoverableStreak.toString())}
                    </p>

                    {timeLeft && (
                      <div className="flex gap-2 mb-8">
                        <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-3 flex flex-col items-center min-w-[60px]">
                          <span className="text-red-400 font-black text-xl leading-none font-mono">
                            {formatTime(timeLeft.hours)}
                          </span>
                          <span className="text-red-500/50 text-[8px] font-black uppercase tracking-widest mt-1">{t("streakRecovery.hrs")}</span>
                        </div>
                        <div className="flex flex-col justify-center pb-4 text-red-500/30 font-bold">:</div>
                        <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-3 flex flex-col items-center min-w-[60px]">
                          <span className="text-red-400 font-black text-xl leading-none font-mono">
                            {formatTime(timeLeft.minutes)}
                          </span>
                          <span className="text-red-500/50 text-[8px] font-black uppercase tracking-widest mt-1">{t("streakRecovery.min")}</span>
                        </div>
                        <div className="flex flex-col justify-center pb-4 text-red-500/30 font-bold">:</div>
                        <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-3 flex flex-col items-center min-w-[60px]">
                          <span className="text-red-400 font-black text-xl leading-none font-mono">
                            {formatTime(timeLeft.seconds)}
                          </span>
                          <span className="text-red-500/50 text-[8px] font-black uppercase tracking-widest mt-1">{t("streakRecovery.sec")}</span>
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="mb-4 text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 py-2 px-4 rounded-lg w-full border border-red-500/20">
                        {error}
                      </div>
                    )}

                    <button
                      onClick={handleRecover}
                      disabled={loading || !hasEnoughBalance || (timeLeft?.hours === 0 && timeLeft?.minutes === 0 && timeLeft?.seconds === 0)}
                      className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all relative overflow-hidden flex flex-col items-center gap-1 ${
                        !hasEnoughBalance
                          ? "bg-app-accent/5 border border-app-border text-text-sub cursor-not-allowed"
                          : "bg-red-500 text-white shadow-app-shadow active:scale-95"
                      }`}
                    >
                      {loading ? (
                        <span className="animate-pulse">{t("streakRecovery.processing")}</span>
                      ) : !hasEnoughBalance ? (
                        <>
                          <span>{t("streakRecovery.insufficient_balance")}</span>
                          <span className="text-[9px] text-text-sub font-bold tracking-widest">{t("streakRecovery.need_more_bp").replace("{amount}", (RECOVERY_COST - pointsBalance).toString())}</span>
                        </>
                      ) : (
                        <>
                          <span>{t("streakRecovery.pay_to_recover").replace("{amount}", RECOVERY_COST.toString())}</span>
                        </>
                      )}
                    </button>
                    
                    <button 
                      onClick={onClose} 
                      className="mt-4 text-[10px] font-bold text-text-sub tracking-widest uppercase hover:text-text-main transition-colors"
                    >
                      {t("streakRecovery.dismiss")}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
