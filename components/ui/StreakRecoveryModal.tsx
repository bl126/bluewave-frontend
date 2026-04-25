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

  // Constants
  const RECOVERY_COST = 1000;
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
        
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 3000);
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
            className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-[#0B1221] border border-red-500/30 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.15)] pointer-events-auto relative"
            >
              {success ? (
                <div className="p-8 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                    <Flame size={40} className="text-green-400" />
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">Streak Saved!</h2>
                  <p className="text-green-400 font-bold tracking-widest text-sm uppercase">You are back on track.</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X size={18} />
                  </button>

                  <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 relative mb-6">
                      <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse blur-xl" />
                      <div className="w-full h-full bg-black/50 border border-red-500/50 rounded-full flex items-center justify-center relative z-10 overflow-hidden backdrop-blur-md shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                        <Flame size={32} className="text-red-500 opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 to-transparent" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-black border border-red-500/50 rounded-full p-1.5 z-20 shadow-lg">
                        <ShieldAlert size={16} className="text-red-400" />
                      </div>
                    </div>

                    <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                      Streak At Risk
                    </h2>
                    <p className="text-white/60 text-xs font-bold leading-relaxed mb-6 uppercase tracking-wider">
                      You lost your <span className="text-red-400">{recoverableStreak}-day</span> streak. Recover it before time runs out.
                    </p>

                    {timeLeft && (
                      <div className="flex gap-2 mb-8">
                        <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-3 flex flex-col items-center min-w-[60px]">
                          <span className="text-red-400 font-black text-xl leading-none font-mono">
                            {formatTime(timeLeft.hours)}
                          </span>
                          <span className="text-red-500/50 text-[8px] font-black uppercase tracking-widest mt-1">Hrs</span>
                        </div>
                        <div className="flex flex-col justify-center pb-4 text-red-500/30 font-bold">:</div>
                        <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-3 flex flex-col items-center min-w-[60px]">
                          <span className="text-red-400 font-black text-xl leading-none font-mono">
                            {formatTime(timeLeft.minutes)}
                          </span>
                          <span className="text-red-500/50 text-[8px] font-black uppercase tracking-widest mt-1">Min</span>
                        </div>
                        <div className="flex flex-col justify-center pb-4 text-red-500/30 font-bold">:</div>
                        <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-3 flex flex-col items-center min-w-[60px]">
                          <span className="text-red-400 font-black text-xl leading-none font-mono">
                            {formatTime(timeLeft.seconds)}
                          </span>
                          <span className="text-red-500/50 text-[8px] font-black uppercase tracking-widest mt-1">Sec</span>
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
                          ? "bg-white/5 border border-white/10 text-white/40 cursor-not-allowed"
                          : "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)] active:scale-95"
                      }`}
                    >
                      {loading ? (
                        <span className="animate-pulse">Processing...</span>
                      ) : !hasEnoughBalance ? (
                        <>
                          <span>Insufficient Balance</span>
                          <span className="text-[9px] text-white/30 font-bold tracking-widest">Need {RECOVERY_COST - pointsBalance} more BP</span>
                        </>
                      ) : (
                        <>
                          <span>Pay {RECOVERY_COST} BP to Recover</span>
                        </>
                      )}
                    </button>
                    
                    <button 
                      onClick={onClose} 
                      className="mt-4 text-[10px] font-bold text-white/30 tracking-widest uppercase hover:text-white/50 transition-colors"
                    >
                      Dismiss (Remains on profile)
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
