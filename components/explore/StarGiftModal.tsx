"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export const STAR_GIFT_PRESETS = [1, 5, 10, 25, 50, 100] as const;
export const STAR_GIFT_MIN = 1;

function isPresetAmount(n: number): n is (typeof STAR_GIFT_PRESETS)[number] {
  return (STAR_GIFT_PRESETS as readonly number[]).includes(n);
}

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
  onEditAmount?: () => void;
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
  onEditAmount,
}: StarGiftModalProps) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState(initialAmount);
  const [customDraft, setCustomDraft] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const safe = Math.max(STAR_GIFT_MIN, Math.min(initialAmount, starsBalance || initialAmount));
    setAmount(safe);
    setCustomDraft(isPresetAmount(safe) ? "" : String(safe));
  }, [isOpen, initialAmount, starsBalance]);

  if (!mounted) return null;

  const maxGift = Math.max(starsBalance, STAR_GIFT_MIN);
  const isValidAmount =
    Number.isInteger(amount) && amount >= STAR_GIFT_MIN && amount <= starsBalance;
  const canAfford = isValidAmount;

  const selectPreset = (preset: number) => {
    setCustomDraft("");
    setAmount(preset);
  };

  const handleCustomChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    setCustomDraft(digits);
    if (!digits) {
      setAmount(STAR_GIFT_MIN);
      return;
    }
    const parsed = parseInt(digits, 10);
    if (!Number.isFinite(parsed)) return;
    setAmount(Math.min(Math.max(parsed, STAR_GIFT_MIN), maxGift));
  };
  const displayName = recipientName || t("explore.gift_star_recipient_fallback");

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[400] pointer-events-auto"
          role="dialog"
          aria-modal="true"
        >
          {/* Full-screen shield — blocks all background taps; only X / Telegram back closes */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 bg-app-bg/85 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            className="absolute inset-0 z-10 flex items-end sm:items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-sm bg-app-card border border-app-border rounded-3xl overflow-hidden shadow-app-shadow pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3 border-b border-app-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Star size={22} className="text-amber-400" fill="currentColor" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-text-main uppercase tracking-tight">
                      {mode === "setup" ? t("explore.gift_star_setup_title") : t("explore.gift_star_confirm_title")}
                    </h3>
                    <p className="text-[10px] text-text-sub font-medium mt-0.5 truncate">
                      {displayName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="p-2 rounded-xl bg-app-accent/5 border border-app-border text-text-sub hover:text-text-main transition-colors shrink-0"
                  aria-label={t("explore.gift_star_close")}
                >
                  <X size={18} />
                </button>
              </div>

              {mode === "setup" ? (
                <div className="px-5 py-5 space-y-4">
                  <p className="text-[11px] text-text-sub leading-relaxed">{t("explore.gift_star_setup_desc")}</p>
                  <div className="flex flex-wrap gap-2">
                    {STAR_GIFT_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => selectPreset(preset)}
                        disabled={starsBalance < preset}
                        className={`min-w-[52px] px-3 py-2.5 rounded-xl border text-sm font-black transition-all ${
                          customDraft === "" && amount === preset
                            ? "bg-amber-500 text-black border-amber-400"
                            : starsBalance < preset
                              ? "bg-app-bg/50 border-app-border text-text-sub/30 cursor-not-allowed"
                              : "bg-app-accent/5 border-app-border text-text-main hover:border-amber-500/40"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-sub block mb-2">
                      {t("explore.gift_star_custom_label")}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={customDraft}
                      placeholder={t("explore.gift_star_custom_placeholder")}
                      onChange={(e) => handleCustomChange(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border bg-app-bg text-text-main text-sm font-black tabular-nums outline-none transition-colors ${
                        customDraft !== ""
                          ? "border-amber-500/60 ring-1 ring-amber-500/30"
                          : "border-app-border focus:border-amber-500/40"
                      }`}
                    />
                    {customDraft !== "" && !isValidAmount && (
                      <p className="text-[10px] text-red-400 font-medium mt-1.5">
                        {amount > starsBalance
                          ? t("explore.gift_star_custom_over_balance")
                          : t("explore.gift_star_custom_invalid")}
                      </p>
                    )}
                  </div>
                  <p className="text-[10px] text-text-sub">
                    {t("explore.gift_star_balance_label")}:{" "}
                    <span className="text-amber-400 font-bold">{starsBalance}</span>
                  </p>
                  <button
                    type="button"
                    disabled={!canAfford || isSubmitting}
                    onClick={() => onConfirm(amount)}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 text-black font-black uppercase text-xs tracking-widest disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors"
                  >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : t("explore.gift_star_continue_btn")}
                  </button>
                </div>
              ) : (
                <div className="px-5 py-5 space-y-4">
                  <div className="rounded-2xl bg-app-accent/5 border border-app-border px-4 py-3 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-sub mb-1">
                      {t("explore.gift_star_amount_label")}
                    </p>
                    <p className="text-2xl font-black text-amber-400">{amount}</p>
                  </div>
                  <p className="text-center text-sm text-text-main leading-relaxed">
                    {t("explore.gift_star_confirm_msg")
                      .replace("{{amount}}", String(amount))
                      .replace("{{name}}", displayName)}
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => onEditAmount?.()}
                      className="flex-1 py-3.5 rounded-2xl border border-app-border bg-app-accent/5 text-text-main font-black uppercase text-[10px] tracking-widest hover:bg-app-accent/10 transition-colors"
                    >
                      {t("explore.gift_star_set_btn")}
                    </button>
                    <button
                      type="button"
                      disabled={!canAfford || isSubmitting}
                      onClick={() => onConfirm(amount)}
                      className="flex-1 py-3.5 rounded-2xl bg-amber-500 text-black font-black uppercase text-[10px] tracking-widest disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors"
                    >
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : t("explore.gift_star_confirm_btn")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function getSavedStarGiftAmount(): number {
  if (typeof window === "undefined") return STAR_GIFT_MIN;
  const raw = localStorage.getItem("bw_star_gift_amount");
  const n = parseInt(raw || String(STAR_GIFT_MIN), 10);
  if (!Number.isFinite(n) || n < STAR_GIFT_MIN) return STAR_GIFT_MIN;
  return n;
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
