"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Flame, Star, CheckCircle2, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface ClaimBoostData {
  base_claimed: number;
  multiplier: number;
  total_claimed: number;
  applied_roles: string[];
  is_loading?: boolean;
}

interface ClaimBoostPopupProps {
  isOpen: boolean;
  data: ClaimBoostData | null;
  onClose: () => void;
}

export default function ClaimBoostPopup({ isOpen, data, onClose }: ClaimBoostPopupProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [displayValue, setDisplayValue] = useState(0);
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  // Animation Sequence
  useEffect(() => {
    if (!isOpen || !data) {
      setStep(0);
      setDisplayValue(0);
      return;
    }

    // Step 1: Base Amount (Calculated or Optimistic)
    setDisplayValue(dataRef.current?.base_claimed || 0);
    setStep(1);

    // Step 2 & 3 Controller
    let isCancelled = false;

    const runSequence = async () => {
      // 1. Initial Quick delay for 'Calculating' feel (much shorter)
      await new Promise(r => setTimeout(r, 400));
      if (isCancelled) return;

      // 2. Show Boost Multiplier immediately based on optimistic data
      setStep(2);
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");

      // 3. Short reveal duration before final spin
      await new Promise(r => setTimeout(r, 800));
      if (isCancelled) return;

      // 4. Spin to Final Amount
      setStep(3);
      
      const duration = 1000;
      const startTime = Date.now();
      const startValue = dataRef.current?.base_claimed || 0;
      const endValue = dataRef.current?.total_claimed || 0;

      const animateNumber = () => {
        if (isCancelled) return;
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const easeProgress = Math.sin((progress * Math.PI) / 2);
        const currentValue = Math.floor(startValue + (endValue - startValue) * easeProgress);
        
        setDisplayValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animateNumber);
        } else {
          setStep(4); // Final State
          if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
        }
      };

      requestAnimationFrame(animateNumber);
    };

    runSequence();

    return () => {
      isCancelled = true;
    };
  }, [isOpen]); // Only restart when opening/closing

  if (!data) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-sm rounded-[2rem] border border-cyan-500/20 bg-gradient-to-b from-black/80 to-cyan-950/40 p-6 flex flex-col items-center shadow-[0_0_50px_#00e6ff10] overflow-hidden relative"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Background Effects */}
            {step >= 2 && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-orange-500/10 via-transparent to-transparent pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              />
            )}

            <div className="flex flex-col items-center w-full z-10 relative">

              {/* Top Icon */}
              <motion.div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-lg border-2 ${step >= 4 ? "bg-green-500/20 border-green-500/50 text-green-400" :
                  step >= 2 ? "bg-orange-500/20 border-orange-500/50 text-orange-400" :
                    "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                  }`}
                animate={{
                  scale: step === 2 || step === 4 ? [1, 1.2, 1] : 1,
                  rotate: step === 2 ? [0, -10, 10, -10, 0] : 0
                }}
                transition={{ duration: 0.5 }}
              >
                {step >= 4 ? <CheckCircle2 size={32} /> :
                  step >= 2 ? <Flame size={32} /> :
                    <Zap size={32} />}
              </motion.div>

              <h2 className="text-cyan-50/60 uppercase tracking-widest text-[11px] font-bold mb-2">{t("claim_boost_popup.title")}</h2>

              {/* Dynamic Number Display */}
              <motion.div
                className={`text-6xl font-black mb-1 flex items-baseline gap-2 ${step >= 4 ? "text-green-400 drop-shadow-[0_0_15px_#4ade80]" :
                  step >= 2 ? "text-orange-400 drop-shadow-[0_0_15px_#f97316]" :
                    "text-cyan-50"
                  }`}
                animate={{ scale: step === 3 ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 0.2, repeat: step === 3 ? Infinity : 0 }}
              >
                {displayValue}
                <span className="text-sm font-bold opacity-60">$BWAVE</span>
              </motion.div>

              {/* Roles Boost Reveal */}
              <div className="h-28 w-full mt-4 flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-cyan-400/60 uppercase tracking-widest text-xs font-bold"
                    >
                      {t("claim_boost_popup.calculating")}
                    </motion.div>
                  )}

                  {step >= 2 && data.multiplier > 1.0 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="flex flex-col items-center w-full"
                    >
                      <div className="bg-orange-500/10 border border-orange-500/30 px-4 py-2 rounded-xl flex items-center gap-2 mb-3">
                        <Flame className="text-orange-400" size={16} />
                        <span className="text-orange-400 font-black uppercase tracking-widest text-xs">
                          {t("claim_boost_popup.roles_boost")} {data.multiplier.toFixed(2)}x
                        </span>
                      </div>

                      <div className="flex flex-wrap justify-center gap-1.5 w-full">
                        {data.applied_roles.map((role, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + (idx * 0.1) }}
                            className="text-[9px] font-black uppercase tracking-widest bg-cyan-950/50 text-cyan-300 border border-cyan-800/50 px-2 py-1 rounded"
                          >
                            + {t(`roles_list.${role}.name`)}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step >= 2 && data.multiplier === 1.0 && (
                    <motion.div
                      key="step-no-boost"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-cyan-500/50 uppercase tracking-widest text-[10px] font-bold text-center"
                    >
                      {t("claim_boost_popup.no_boost")}<br />{t("claim_boost_popup.no_boost_hint")}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dismiss Button */}
              <AnimatePresence>
                {step >= 4 && (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={onClose}
                    className="mt-6 w-full py-4 rounded-xl bg-cyan-500 text-black font-black uppercase tracking-widest text-sm hover:bg-cyan-400 active:scale-95 transition-all shadow-[0_0_20px_#00e6ff40]"
                  >
                    {t("claim_boost_popup.collect")}
                  </motion.button>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
