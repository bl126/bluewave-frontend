"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useDragControls, type PanInfo } from "framer-motion";
import { ArrowRightLeft, Loader2, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { createPortal } from "react-dom";
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
  const dragControls = useDragControls();

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

  /* Telegram back button listener */
  useEffect(() => {
    if (!isOpen) return;
    const handleBack = () => {
      if (convertStatus === "idle") onClose();
    };
    window.addEventListener("bwNativeBack", handleBack);
    return () => window.removeEventListener("bwNativeBack", handleBack);
  }, [isOpen, onClose, convertStatus]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (convertStatus !== "idle") return;
      if (info.offset.y > 100) {
        onClose();
      }
    },
    [onClose, convertStatus]
  );

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="convert-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => convertStatus === "idle" && onClose()}
            className="fixed inset-0 z-[998] bg-app-bg/60 backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            key="convert-sheet"
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-[999] bg-app-card border-t border-app-border rounded-t-[2.5rem] flex flex-col max-h-[80vh] shadow-app-shadow backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle pill */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-text-sub/30" />
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto pb-24 flex-1">
              {/* Header */}
              <div className="px-5 pt-2 pb-3 flex items-center gap-3 border-b border-app-border">
                <div className="w-11 h-11 rounded-2xl bg-app-accent/10 flex items-center justify-center border-2 border-app-accent/30 shrink-0">
                  <ArrowRightLeft size={22} className="text-app-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-text-main uppercase tracking-tight">Convert Gram</h3>
                  <p className="text-text-sub text-[9px] font-bold uppercase tracking-widest mt-0.5">
                    to Bluewave Stars
                  </p>
                </div>
              </div>

              <div className="px-5 py-5 space-y-4">
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
                      <img src="/gram icon.png" alt="Gram" className="w-5 h-5" />
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
                          <img src="/gram icon.png" alt="Gram" className="w-4 h-4" />
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
