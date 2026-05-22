"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Star, Wallet, AlertCircle, CheckCircle2 } from "lucide-react";
import { createPortal } from "react-dom";
import { getApi, postApi } from "@/lib/useApi";
import { useLanguage } from "@/contexts/LanguageContext";

const StarIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);

interface StarWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
  onSuccess?: () => void;
}

export default function StarWithdrawalModal({
  isOpen,
  onClose,
  telegramUser,
  onSuccess,
}: StarWithdrawalModalProps) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [withdrawable, setWithdrawable] = useState(0);
  const [ledgerWithdrawable, setLedgerWithdrawable] = useState(0);
  const [starsOnHold, setStarsOnHold] = useState(0);
  const [giftHoldDays, setGiftHoldDays] = useState(3);
  const [starsBalance, setStarsBalance] = useState(0);
  const [minStars, setMinStars] = useState(1000);
  const [starUsdRate, setStarUsdRate] = useState(0.009);
  const [tonPriceUsd, setTonPriceUsd] = useState(0);
  const [walletAddress, setWalletAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [walletConfirmed, setWalletConfirmed] = useState(false);

  const tgId = telegramUser?.id ?? telegramUser?.tg_id;

  const loadInfo = useCallback(async () => {
    if (!tgId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getApi(`/stars/withdrawal/info?tg_id=${tgId}`);
      if (res?.error) {
        setError(res.error);
        return;
      }
      const effective = Number(
        res.effective_withdrawable ?? res.stars_withdrawable ?? 0
      );
      setWithdrawable(effective);
      setLedgerWithdrawable(Number(res.ledger_withdrawable ?? 0));
      setStarsOnHold(Number(res.stars_on_hold ?? 0));
      setGiftHoldDays(Number(res.gift_hold_days ?? 3));
      setStarsBalance(Number(res.stars_balance ?? 0));
      setMinStars(Number(res.min_withdrawal_stars ?? 1000));
      setStarUsdRate(Number(res.star_usd_rate ?? 0.009));
      setTonPriceUsd(Number(res.ton_price_usd ?? 0));
      setWalletAddress(res.wallet_address || telegramUser?.wallet_address || "");
    } catch {
      setError("Failed to load withdrawal info");
    } finally {
      setLoading(false);
    }
  }, [tgId, telegramUser?.wallet_address]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen && tgId) {
      setAmount("");
      setWalletConfirmed(false);
      setSuccess(null);
      loadInfo();
    }
  }, [isOpen, tgId, loadInfo]);

  const parsedAmount = parseInt(amount, 10) || 0;
  const tonPreview = useMemo(() => {
    if (parsedAmount <= 0 || starUsdRate <= 0 || tonPriceUsd <= 0) return 0;
    return (parsedAmount * starUsdRate) / tonPriceUsd;
  }, [parsedAmount, starUsdRate, tonPriceUsd]);

  const canSubmit =
    !loading &&
    !submitting &&
    !!walletAddress &&
    walletConfirmed &&
    parsedAmount >= minStars &&
    parsedAmount <= withdrawable &&
    tonPreview > 0;

  const handleWithdraw = async () => {
    if (!canSubmit || !tgId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await postApi("/stars/withdraw", {
        tg_id: tgId,
        bw_id: telegramUser?.bw_id || "",
        stars_amount: parsedAmount,
        wallet_confirmed: true,
      });
      if (!res?.success) {
        const code = res?.error || "WITHDRAWAL_FAILED";
        if (code === "MIN_WITHDRAWAL") setError(t("withdraw.min_error").replace("{{min}}", String(minStars)));
        else if (code === "GIFT_HOLD_ACTIVE") setError(t("withdraw.hold_active").replace("{{days}}", String(giftHoldDays)));
        else if (code === "INSUFFICIENT_WITHDRAWABLE") setError(t("withdraw.insufficient_gifted"));
        else if (code === "NO_WALLET" || code === "WALLET_MISMATCH") setError(t("withdraw.no_wallet"));
        else if (code === "WALLET_NOT_CONFIRMED") setError(t("withdraw.confirm_wallet"));
        else if (code === "IDENTITY_MISMATCH" || code === "USER_NOT_FOUND") setError(t("withdraw.identity_error"));
        else if (code === "PRICE_UNAVAILABLE") setError(t("withdraw.price_unavailable"));
        else setError(t("withdraw.failed"));
        return;
      }
      setSuccess(t("withdraw.success"));
      window.dispatchEvent(
        new CustomEvent("updateUser", {
          detail: {
            stars_balance: res.new_stars_balance,
            stars_withdrawable: res.new_stars_withdrawable,
          },
        })
      );
      onSuccess?.();
      setTimeout(() => onClose(), 2200);
    } catch {
      setError(t("withdraw.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[220] bg-app-bg/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            className="fixed inset-0 z-[221] flex items-end sm:items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-sm bg-app-card border border-app-border rounded-[2rem] shadow-app-shadow pointer-events-auto max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-3">
                <div>
                  <h2 className="text-text-main font-black text-lg uppercase tracking-tight">
                    {t("withdraw.title")}
                  </h2>
                  <p className="text-readable-sm mt-1">{t("withdraw.subtitle")}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-app-accent/10 text-text-sub hover:text-app-accent"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 pb-8 flex flex-col gap-4">
                {loading ? (
                  <div className="py-10 flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-app-accent" size={28} />
                    <p className="text-readable-sm">{t("withdraw.loading")}</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-app-border bg-app-accent/5 p-3">
                        <p className="text-readable-muted font-bold uppercase">{t("withdraw.gifted_only")}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <StarIcon size={14} />
                          <span className="text-amber-300 font-black text-lg tabular-nums">
                            {withdrawable.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-app-border bg-app-bg/30 p-3">
                        <p className="text-readable-muted font-bold uppercase">{t("withdraw.total_balance")}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <StarIcon size={14} />
                          <span className="text-text-main font-black text-lg tabular-nums">
                            {starsBalance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-readable-sm leading-relaxed">
                      {t("withdraw.gifted_note").replace("{{days}}", String(giftHoldDays))}
                    </p>

                    {starsOnHold > 0 && (
                      <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-2.5">
                        <p className="text-readable-sm text-cyan-200/95">
                          {t("withdraw.hold_notice")
                            .replace("{{n}}", starsOnHold.toLocaleString())
                            .replace("{{days}}", String(giftHoldDays))}
                        </p>
                      </div>
                    )}

                    <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3">
                      <p className="text-readable-sm text-amber-200/95">
                        {t("withdraw.min_label").replace("{{min}}", minStars.toLocaleString())}
                      </p>
                      <p className="text-readable-muted mt-1">
                        {t("withdraw.rate_usd_label").replace("{{rate}}", starUsdRate.toFixed(3))}
                      </p>
                      {tonPriceUsd > 0 && (
                        <p className="text-readable-muted mt-0.5">
                          {t("withdraw.ton_live").replace("{{price}}", tonPriceUsd.toFixed(3))}
                        </p>
                      )}
                    </div>

                    {!walletAddress ? (
                      <div className="flex items-start gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/10">
                        <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-300">{t("withdraw.no_wallet")}</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-app-border bg-app-bg/40 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Wallet size={14} className="text-app-accent" />
                          <span className="text-readable-sm font-black uppercase">{t("withdraw.wallet_label")}</span>
                        </div>
                        <p className="text-text-main font-mono text-xs break-all leading-relaxed">{walletAddress}</p>
                        <label className="flex items-start gap-2 mt-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={walletConfirmed}
                            onChange={(e) => setWalletConfirmed(e.target.checked)}
                            className="mt-0.5 accent-[#00F6FF]"
                          />
                          <span className="text-readable-sm">{t("withdraw.wallet_confirm")}</span>
                        </label>
                      </div>
                    )}

                    <div>
                      <label className="text-readable-sm font-black uppercase block mb-2">
                        {t("withdraw.amount_label")}
                      </label>
                      <input
                        type="number"
                        min={minStars}
                        max={withdrawable}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                        placeholder={String(minStars)}
                        disabled={!walletAddress}
                        className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-text-main font-black text-lg placeholder:text-text-muted focus:outline-none focus:border-app-accent/50 disabled:opacity-50"
                      />
                      {parsedAmount > 0 && tonPreview > 0 && (
                        <p className="text-readable-sm mt-2">
                          {t("withdraw.ton_preview").replace("{{ton}}", tonPreview.toFixed(4))}
                        </p>
                      )}
                    </div>

                    {error && (
                      <p className="text-red-400 text-sm font-bold">{error}</p>
                    )}
                    {success && (
                      <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                        <CheckCircle2 size={16} />
                        {success}
                      </div>
                    )}

                    <button
                      onClick={handleWithdraw}
                      disabled={!canSubmit || !!success}
                      className="w-full py-4 rounded-2xl bg-amber-500 text-black font-black uppercase text-sm tracking-widest disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          {t("withdraw.submitting")}
                        </>
                      ) : (
                        t("withdraw.submit")
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
