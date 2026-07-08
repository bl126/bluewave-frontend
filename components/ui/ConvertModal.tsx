"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRightLeft, Loader2, CheckCircle2, AlertCircle, Zap } from "lucide-react";

import { postApi } from "@/lib/useApi";

interface ConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  tonBalance: number;
  tonPrice: number;
  telegramUser: any;
  onSuccess?: (tonSpent: number, starsEarned: number) => void;
}

const STAR_PRICE_USD = 0.013;
const MIN_STARS = 100;

export default function ConvertModal({
  isOpen,
  onClose,
  tonBalance,
  tonPrice,
  telegramUser,
  onSuccess
}: ConvertModalProps) {
  const [amount, setAmount] = useState("");
  const [convertStatus, setConvertStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [starsPreview, setStarsPreview] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setConvertStatus("idle");
      setErrorMsg("");
      setStarsPreview(0);
    }
  }, [isOpen]);

  // Update stars preview when amount changes
  useEffect(() => {
    if (amount && tonPrice > 0) {
      const tonAmount = parseFloat(amount);
      if (!isNaN(tonAmount) && tonAmount > 0) {
        const usdValue = tonAmount * tonPrice;
        const stars = Math.floor(usdValue / STAR_PRICE_USD);
        setStarsPreview(stars);
      } else {
        setStarsPreview(0);
      }
    } else {
      setStarsPreview(0);
    }
  }, [amount, tonPrice]);

  const isValidAmount = () => {
    const tonAmount = parseFloat(amount);
    if (!tonAmount || tonAmount <= 0) return false;
    if (tonAmount > tonBalance) return false;
    if (starsPreview < MIN_STARS) return false;
    return true;
  };

  const minTonNeeded = tonPrice > 0 ? (MIN_STARS * STAR_PRICE_USD) / tonPrice : 0;

  const handleConvert = async () => {
    if (!isValidAmount() || convertStatus !== "idle") return;
    setConvertStatus("loading");
    setErrorMsg("");

    try {
      const tgId = telegramUser?.id ?? telegramUser?.tg_id;
      if (!tgId) {
        setConvertStatus("error");
        setErrorMsg("Session error — reopen the app");
        setTimeout(() => setConvertStatus("idle"), 3000);
        return;
      }

      const data = await postApi("/user/convert_ton_to_stars", {
        telegram_id: tgId,
        ton_amount: parseFloat(amount),
      });

      if (data.error) {
        setConvertStatus("error");
        setErrorMsg(data.error || "Conversion failed");
        setTimeout(() => setConvertStatus("idle"), 3000);
        return;
      }

      setConvertStatus("success");
      setTimeout(() => {
        onSuccess?.(data.ton_spent, data.stars_earned);
      }, 1800);
    } catch (err: any) {
      setConvertStatus("error");
      setErrorMsg(err.message || "Network error — please try again");
      setTimeout(() => setConvertStatus("idle"), 3000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] pointer-events-auto">
          {/* Backdrop — blocks background clicks */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => convertStatus === "idle" && onClose()}
            className="absolute inset-0 z-0 bg-app-bg/80 backdrop-blur-md"
          />

          {/* Modal card */}
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute left-1/2 top-1/2 z-10 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 bg-app-card border border-app-border rounded-[2.5rem] p-8 overflow-hidden shadow-app-shadow pointer-events-auto"
          >
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-app-accent/10 blur-[80px] -z-10 pointer-events-none" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-app-accent/5 hover:bg-app-accent/10 text-app-accent transition-colors active:scale-95"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-app-accent/10 flex items-center justify-center border-2 border-app-accent/30">
                  <ArrowRightLeft size={32} className="text-app-accent" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-text-main uppercase tracking-tight">Convert Gram</h3>
                  <p className="text-text-sub text-[11px] font-bold uppercase tracking-widest mt-1">
                    to Bluewave Stars
                  </p>
                </div>
              </div>

              {/* Available balance row */}
              <div className="bg-app-bg/50 border border-app-border rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-text-sub text-[10px] font-bold uppercase tracking-widest">Available Gram</p>
                  <p className="text-text-main font-black text-lg mt-0.5">{tonBalance.toFixed(4)} Gram</p>
                </div>
                <div className="text-right">
                  <p className="text-text-sub text-[10px] font-bold uppercase tracking-widest">USD Value</p>
                  <p className="text-text-main font-black text-lg mt-0.5">
                    ${(tonBalance * tonPrice).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="text-text-main text-[10px] font-black uppercase tracking-widest block mb-2">
                  Amount to Convert
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-app-bg/50 border border-app-border rounded-xl px-4 py-3 pr-20 text-text-main font-mono text-lg placeholder-text-main/40 focus:border-app-accent outline-none transition-colors"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <img src="/Gram Diamond Mark.png" alt="Gram" className="w-5 h-5" />
                    <span className="text-text-main font-black text-sm">Gram</span>
                  </div>
                </div>
              </div>

              {/* Min / Max helpers */}
              <div className="flex gap-2">
                <button
                  onClick={() => setAmount(minTonNeeded.toFixed(4))}
                  className="flex-1 text-[9px] font-black uppercase tracking-widest py-2 px-3 rounded-lg bg-app-accent/10 border border-app-accent/30 text-app-accent hover:bg-app-accent/20 transition-colors active:scale-95"
                >
                  Min ({minTonNeeded.toFixed(4)} Gram)
                </button>
                <button
                  onClick={() => setAmount(tonBalance.toFixed(4))}
                  className="flex-1 text-[9px] font-black uppercase tracking-widest py-2 px-3 rounded-lg bg-app-accent/10 border border-app-accent/30 text-app-accent hover:bg-app-accent/20 transition-colors active:scale-95"
                >
                  Max ({tonBalance.toFixed(4)} Gram)
                </button>
              </div>

              {/* Conversion preview */}
              <AnimatePresence>
                {amount && tonPrice > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-gradient-to-r from-app-accent/10 to-purple-500/10 border border-app-accent/20 rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <img src="/Gram Diamond Mark.png" alt="Gram" className="w-4 h-4" />
                        <span className="text-text-main font-black text-sm">
                          {parseFloat(amount || "0").toFixed(4)} Gram
                        </span>
                      </div>
                      <ArrowRightLeft size={16} className="text-app-accent" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-app-accent font-black text-sm">{starsPreview.toLocaleString()} ⭐</span>
                      </div>
                    </div>
                    <div className="text-[9px] font-bold text-text-main/60 uppercase tracking-widest">
                      @ ${tonPrice.toFixed(2)}/Gram = ${(parseFloat(amount || "0") * tonPrice).toFixed(2)} USD
                    </div>
                    {starsPreview > 0 && starsPreview < MIN_STARS && (
                      <div className="mt-2 flex items-center gap-1.5 text-amber-400">
                        <Zap size={12} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">
                          Below minimum {MIN_STARS} stars
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error message */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
                  >
                    <AlertCircle size={16} className="text-red-400 shrink-0" />
                    <span className="text-red-400 text-[10px] font-bold">{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success message */}
              <AnimatePresence>
                {convertStatus === "success" && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30"
                  >
                    <CheckCircle2 size={16} className="text-green-400" />
                    <span className="text-green-400 text-[10px] font-bold uppercase tracking-widest">
                      Conversion Successful!
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CTA button */}
              <button
                onClick={handleConvert}
                disabled={!isValidAmount() || convertStatus !== "idle"}
                className={`w-full h-12 font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
                  !isValidAmount() || convertStatus !== "idle"
                    ? "bg-app-accent/30 text-app-bg/60 cursor-not-allowed"
                    : "bg-app-accent hover:opacity-90 text-app-bg shadow-app-shadow active:scale-95"
                }`}
              >
                {convertStatus === "loading" && <Loader2 size={16} className="animate-spin" />}
                {convertStatus === "success" && <CheckCircle2 size={16} />}
                <span>
                  {convertStatus === "loading"
                    ? "Converting..."
                    : convertStatus === "success"
                    ? "Done!"
                    : "Convert to Stars"}
                </span>
              </button>

              {/* Help text */}
              <p className="text-[9px] text-text-main/50 text-center font-bold uppercase tracking-widest">
                Instant conversion · No blockchain fees · Uses live Gram price
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
