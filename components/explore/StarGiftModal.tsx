"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export const STAR_GIFT_PRESETS = [1, 5, 10, 25, 50] as const;

export type StarGiftModalMode = "setup" | "confirm";

interface StarGiftModalProps {
  isOpen: boolean;
  mode: StarGiftModalMode;
  recipientName: string;
  starsBalance: number;
  initialAmount?: number;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

export default function StarGiftModal({
  isOpen,
  mode,
  recipientName,
  starsBalance,
  initialAmount = 1,
  isSubmitting = false,
  onClose,
  onConfirm,
}: StarGiftModalProps) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState(initialAmount);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) setAmount(initialAmount);
  }, [isOpen, initialAmount]);

  if (!mounted) return null;

  const canAfford = starsBalance >= amount;
  const displayName = recipientName || t("explore.gift_star_recipient_fallback");

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[350] bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            className="fixed inset-0 z-[351] flex items-end sm:items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                    <Star size={22} className="text-amber-400" fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">
                      {mode === "setup" ? t("explore.gift_star_setup_title") : t("explore.gift_star_confirm_title")}
                    </h3>
                    <p className="text-[10px] text-white/50 font-medium mt-0.5 truncate max-w-[200px]">
                      {displayName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/5 text-white/50 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {mode === "setup" ? (
                <div className="px-5 pb-5 space-y-4">
                  <p className="text-[11px] text-white/60 leading-relaxed">{t("explore.gift_star_setup_desc")}</p>
                  <div className="flex flex-wrap gap-2">
                    {STAR_GIFT_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(preset)}
                        disabled={starsBalance < preset}
                        className={`min-w-[52px] px-3 py-2.5 rounded-xl border text-sm font-black transition-all ${
                          amount === preset
                            ? "bg-amber-500 text-black border-amber-400"
                            : starsBalance < preset
                              ? "bg-white/5 border-white/5 text-white/25 cursor-not-allowed"
                              : "bg-white/5 border-white/10 text-amber-200 hover:border-amber-500/40"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/40">
                    {t("explore.gift_star_balance_label")}: <span className="text-amber-400 font-bold">{starsBalance}</span>
                  </p>
                  <button
                    type="button"
                    disabled={!canAfford || isSubmitting}
                    onClick={() => onConfirm(amount)}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 text-black font-black uppercase text-xs tracking-widest disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : t("explore.gift_star_continue_btn")}
                  </button>
                </div>
              ) : (
                <div className="px-5 pb-5 space-y-4">
                  <p className="text-center text-sm text-white/80 leading-relaxed">
                    {t("explore.gift_star_confirm_msg")
                      .replace("{{amount}}", String(amount))
                      .replace("{{name}}", displayName)}
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="flex-1 py-3.5 rounded-2xl border border-white/15 text-white/70 font-black uppercase text-[10px] tracking-widest"
                    >
                      {t("explore.gift_star_undo")}
                    </button>
                    <button
                      type="button"
                      disabled={!canAfford || isSubmitting}
                      onClick={() => onConfirm(amount)}
                      className="flex-1 py-3.5 rounded-2xl bg-amber-500 text-black font-black uppercase text-[10px] tracking-widest disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : t("explore.gift_star_confirm_btn")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function getSavedStarGiftAmount(): number {
  if (typeof window === "undefined") return 1;
  const raw = localStorage.getItem("bw_star_gift_amount");
  const n = parseInt(raw || "1", 10);
  return STAR_GIFT_PRESETS.includes(n as (typeof STAR_GIFT_PRESETS)[number]) ? n : 1;
}

export function saveStarGiftAmount(amount: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem("bw_star_gift_amount", String(amount));
  localStorage.setItem("bw_star_gift_setup_done", "1");
}

export function hasCompletedStarGiftSetup(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("bw_star_gift_setup_done") === "1";
}
