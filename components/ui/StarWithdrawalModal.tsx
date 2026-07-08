"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, Loader2, Wallet, AlertCircle, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";
import { createPortal } from "react-dom";
import { getApi, postApi } from "@/lib/useApi";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchTonPriceUsd,
  getCachedTonPriceUsd,
} from "@/lib/tonPriceCache";
import {
  getCachedStarWithdrawalInfo,
  setCachedStarWithdrawalInfo,
  seedFromTelegramUser,
  type StarWithdrawalInfo,
} from "@/lib/starWithdrawalCache";

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

function applyInfo(
  res: Record<string, unknown>,
  telegramUser: any,
  fallbackTon: number
): StarWithdrawalInfo {
  const tonPrice = Number(res.ton_price_usd ?? 0) || fallbackTon;
  const starUsd = Number(res.star_usd_rate ?? 0.009);
  return {
    stars_balance: Number(res.stars_balance ?? telegramUser?.stars_balance ?? 0),
    stars_withdrawable: Number(res.stars_withdrawable ?? 0),
    ledger_withdrawable: Number(res.ledger_withdrawable ?? 0),
    effective_withdrawable: Number(
      res.effective_withdrawable ?? res.stars_withdrawable ?? telegramUser?.stars_withdrawable ?? 0
    ),
    stars_on_hold: Number(res.stars_on_hold ?? 0),
    gift_hold_days: Number(res.gift_hold_days ?? 3),
    min_withdrawal_stars: Number(res.min_withdrawal_stars ?? 1000),
    star_usd_rate: starUsd,
    ton_price_usd: tonPrice,
    star_ton_rate: Number(
      res.star_ton_rate ?? (tonPrice > 0 ? starUsd / tonPrice : 0)
    ),
    wallet_address: String(res.wallet_address ?? telegramUser?.wallet_address ?? ""),
    ts: Date.now(),
  };
}

export default function StarWithdrawalModal({
  isOpen,
  onClose,
  telegramUser,
  onSuccess,
}: StarWithdrawalModalProps) {
  const { t } = useLanguage();
  const dragControls = useDragControls();
  const [mounted, setMounted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const tgId = telegramUser?.id ?? telegramUser?.tg_id;

  const [info, setInfo] = useState<StarWithdrawalInfo>(() => {
    const cached = tgId ? getCachedStarWithdrawalInfo(tgId) : null;
    const seeded = tgId ? seedFromTelegramUser(tgId, telegramUser) : null;
    const base = cached ?? seeded;
    const ton = base?.ton_price_usd || getCachedTonPriceUsd();
    return {
      stars_balance: base?.stars_balance ?? Number(telegramUser?.stars_balance ?? 0),
      stars_withdrawable: base?.stars_withdrawable ?? Number(telegramUser?.stars_withdrawable ?? 0),
      ledger_withdrawable: base?.ledger_withdrawable ?? 0,
      effective_withdrawable:
        base?.effective_withdrawable ?? Number(telegramUser?.stars_withdrawable ?? 0),
      stars_on_hold: base?.stars_on_hold ?? 0,
      gift_hold_days: base?.gift_hold_days ?? 3,
      min_withdrawal_stars: base?.min_withdrawal_stars ?? 1000,
      star_usd_rate: base?.star_usd_rate ?? 0.009,
      ton_price_usd: ton > 0 ? ton : 0,
      star_ton_rate:
        base?.star_ton_rate ??
        (ton > 0 ? 0.009 / ton : 0),
      wallet_address: base?.wallet_address ?? String(telegramUser?.wallet_address ?? ""),
      ts: base?.ts ?? 0,
    };
  });

  const [amount, setAmount] = useState("");
  const [walletConfirmed, setWalletConfirmed] = useState(false);
  const fetchGen = useRef(0);

  const hydrateInstant = useCallback(() => {
    if (!tgId) return;
    const cached = getCachedStarWithdrawalInfo(tgId);
    const seeded = seedFromTelegramUser(tgId, telegramUser);
    const ton = getCachedTonPriceUsd();
    const base = cached ?? seeded;
    if (base) {
      setInfo((prev) => ({
        ...prev,
        ...base,
        ton_price_usd: base.ton_price_usd > 0 ? base.ton_price_usd : ton,
        star_ton_rate:
          base.star_ton_rate > 0
            ? base.star_ton_rate
            : (base.ton_price_usd > 0 || ton > 0)
              ? base.star_usd_rate / (base.ton_price_usd || ton)
              : prev.star_ton_rate,
        wallet_address: base.wallet_address || String(telegramUser?.wallet_address ?? ""),
      }));
    } else {
      setInfo((prev) => ({
        ...prev,
        stars_balance: Number(telegramUser?.stars_balance ?? prev.stars_balance),
        effective_withdrawable: Number(
          telegramUser?.stars_withdrawable ?? prev.effective_withdrawable
        ),
        wallet_address: String(telegramUser?.wallet_address ?? prev.wallet_address),
        ton_price_usd: ton > 0 ? ton : prev.ton_price_usd,
        star_ton_rate: ton > 0 ? 0.009 / ton : prev.star_ton_rate,
      }));
    }
  }, [tgId, telegramUser]);

  const refreshInfo = useCallback(
    async (silent = true) => {
      if (!tgId) return;
      const gen = ++fetchGen.current;
      if (!silent) setRefreshing(true);
      setError(null);
      try {
        let tonFallback = getCachedTonPriceUsd();
        if (info.ton_price_usd <= 0) {
          const liveTon = await fetchTonPriceUsd();
          if (liveTon > 0) tonFallback = liveTon;
        }
        const res = await getApi(`/stars/withdrawal/info?tg_id=${tgId}`);
        if (gen !== fetchGen.current) return;
        if (res?.error) {
          if (!silent) setError(res.error);
          return;
        }
        const next = applyInfo(res, telegramUser, tonFallback);
        if (next.ton_price_usd <= 0 && tonFallback > 0) {
          next.ton_price_usd = tonFallback;
          next.star_ton_rate = next.star_usd_rate / tonFallback;
        }
        setInfo(next);
        setCachedStarWithdrawalInfo(tgId, res);
      } catch {
        if (!silent) setError("Failed to load withdrawal info");
      } finally {
        if (gen === fetchGen.current) setRefreshing(false);
      }
    },
    [tgId, telegramUser, info.ton_price_usd]
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen || !tgId) return;
    setAmount("");
    setWalletConfirmed(false);
    setSuccess(null);
    setError(null);
    hydrateInstant();
    void refreshInfo(true);
    void fetchTonPriceUsd().then((p) => {
      if (p > 0) {
        setInfo((prev) => ({
          ...prev,
          ton_price_usd: prev.ton_price_usd > 0 ? prev.ton_price_usd : p,
          star_ton_rate: prev.star_ton_rate > 0 ? prev.star_ton_rate : 0.009 / p,
        }));
      }
    });
  }, [isOpen, tgId, hydrateInstant, refreshInfo]);

  const parsedAmount = parseInt(amount, 10) || 0;
  const tonPreview = useMemo(() => {
    if (parsedAmount <= 0 || info.star_usd_rate <= 0 || info.ton_price_usd <= 0) return 0;
    return (parsedAmount * info.star_usd_rate) / info.ton_price_usd;
  }, [parsedAmount, info.star_usd_rate, info.ton_price_usd]);

  const priceReady = info.ton_price_usd > 0;

  const canSubmit =
    !submitting &&
    !!info.wallet_address &&
    walletConfirmed &&
    parsedAmount >= info.min_withdrawal_stars &&
    parsedAmount <= info.effective_withdrawable &&
    tonPreview > 0 &&
    priceReady;

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
        if (code === "MIN_WITHDRAWAL")
          setError(t("withdraw.min_error").replace("{{min}}", String(info.min_withdrawal_stars)));
        else if (code === "GIFT_HOLD_ACTIVE")
          setError(t("withdraw.hold_active").replace("{{days}}", String(info.gift_hold_days)));
        else if (code === "INSUFFICIENT_WITHDRAWABLE") setError(t("withdraw.insufficient_gifted"));
        else if (code === "NO_WALLET" || code === "WALLET_MISMATCH") setError(t("withdraw.no_wallet"));
        else if (code === "WALLET_NOT_CONFIRMED") setError(t("withdraw.confirm_wallet"));
        else if (code === "IDENTITY_MISMATCH" || code === "USER_NOT_FOUND")
          setError(t("withdraw.identity_error"));
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

  const tryDismiss = () => {
    if (submitting) return;
    onClose();
  };

  // Stack registration
  useEffect(() => {
    if (!isOpen) return;
    if (typeof window !== "undefined") {
      (window as any).bwActiveSheets = (window as any).bwActiveSheets || [];
      (window as any).bwActiveSheets.push("withdrawal");
    }
    return () => {
      if (typeof window !== "undefined") {
        (window as any).bwActiveSheets = ((window as any).bwActiveSheets || []).filter(
          (id: string) => id !== "withdrawal"
        );
      }
    };
  }, [isOpen]);

  // Back listener
  useEffect(() => {
    if (!isOpen) return;
    const handleNativeBack = (e: Event) => {
      const activeSheets = (window as any).bwActiveSheets || [];
      if (activeSheets[activeSheets.length - 1] === "withdrawal") {
        if (submitting) return;
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("bwNativeBack", handleNativeBack, true);
    return () => window.removeEventListener("bwNativeBack", handleNativeBack, true);
  }, [isOpen, onClose, submitting]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1029] pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={tryDismiss}
            className="absolute inset-0 z-0 bg-app-bg/75 backdrop-blur-md cursor-default"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 420 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, dragInfo) => {
              if (submitting) return;
              if (dragInfo.offset.y > 100) tryDismiss();
            }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 z-10 bg-app-card border-t border-app-border rounded-t-[2.5rem] flex flex-col max-h-[92vh] shadow-app-shadow w-full pointer-events-auto"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 20px) + 16px)" }}
          >
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing touch-none shrink-0"
            >
              <div className="w-12 h-1.5 bg-app-border/50 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-8 pb-4 shrink-0">
              <div>
                <h2 className="text-text-main font-black text-xl uppercase tracking-tight">
                  {t("withdraw.title")}
                </h2>
                <p className="text-readable-sm mt-0.5">{t("withdraw.subtitle")}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => refreshInfo(false)}
                  disabled={refreshing}
                  className="p-2 rounded-full bg-app-accent/5 text-text-sub hover:text-app-accent transition-colors disabled:opacity-40"
                  aria-label="Refresh"
                >
                  <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                </button>
                <button
                  onClick={tryDismiss}
                  className="p-2 rounded-full bg-app-accent/5 hover:bg-app-accent/10 text-app-accent transition-colors active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-6 custom-scrollbar flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-app-border bg-app-accent/5 p-3">
                  <p className="text-readable-muted font-bold uppercase">{t("withdraw.gifted_only")}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <StarIcon size={14} />
                    <span className="text-amber-300 font-black text-lg tabular-nums">
                      {info.effective_withdrawable.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-app-border bg-app-bg/30 p-3">
                  <p className="text-readable-muted font-bold uppercase">{t("withdraw.total_balance")}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <StarIcon size={14} />
                    <span className="text-text-main font-black text-lg tabular-nums">
                      {info.stars_balance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-readable-sm leading-relaxed">
                {t("withdraw.gifted_note").replace("{{days}}", String(info.gift_hold_days))}
              </p>

              {info.stars_on_hold > 0 && (
                <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-2.5">
                  <p className="text-readable-sm text-cyan-200/95">
                    {t("withdraw.hold_notice")
                      .replace("{{n}}", info.stars_on_hold.toLocaleString())
                      .replace("{{days}}", String(info.gift_hold_days))}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3">
                <p className="text-readable-sm text-amber-200/95">
                  {t("withdraw.min_label").replace("{{min}}", info.min_withdrawal_stars.toLocaleString())}
                </p>
                <p className="text-readable-muted mt-1">
                  {t("withdraw.rate_usd_label").replace("{{rate}}", info.star_usd_rate.toFixed(3))}
                </p>
                {priceReady ? (
                  <p className="text-readable-muted mt-0.5">
                    {t("withdraw.ton_live").replace("{{price}}", info.ton_price_usd.toFixed(3))}
                  </p>
                ) : (
                  <p className="text-amber-400/90 text-[11px] font-bold mt-1 animate-pulse">
                    {t("withdraw.price_unavailable")}
                  </p>
                )}
              </div>

              {!info.wallet_address ? (
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
                  <p className="text-text-main font-mono text-xs break-all leading-relaxed">
                    {info.wallet_address}
                  </p>
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
                  min={info.min_withdrawal_stars}
                  max={info.effective_withdrawable}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                  placeholder={String(info.min_withdrawal_stars)}
                  disabled={!info.wallet_address}
                  className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-text-main font-black text-lg placeholder:text-text-muted focus:outline-none focus:border-app-accent/50 disabled:opacity-50"
                />

                {parsedAmount > 0 && (
                  <div className="mt-3 rounded-2xl border border-app-accent/30 bg-app-accent/5 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <StarIcon size={16} />
                        <span className="text-amber-300 font-black text-lg tabular-nums truncate">
                          {parsedAmount.toLocaleString()}
                        </span>
                        <span className="text-readable-muted text-[10px] font-black uppercase shrink-0">
                          Stars
                        </span>
                      </div>
                      <ArrowRight size={18} className="text-app-accent shrink-0" />
                      <div className="flex items-center gap-1.5 min-w-0 justify-end">
                        <img src="/ton-transparent.png" alt="TON" className="w-4 h-4 object-contain shrink-0" />
                        <span className="text-app-accent font-black text-lg tabular-nums">
                          {priceReady ? tonPreview.toFixed(4) : "—"}
                        </span>
                        <span className="text-readable-muted text-[10px] font-black uppercase shrink-0">
                          TON
                        </span>
                      </div>
                    </div>
                    {priceReady && (
                      <p className="text-readable-sm mt-2 text-center">
                        {t("withdraw.ton_preview").replace("{{ton}}", tonPreview.toFixed(4))}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {error && <p className="text-red-400 text-sm font-bold">{error}</p>}
              {success && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                  <CheckCircle2 size={16} />
                  {success}
                </div>
              )}

              <button
                onClick={handleWithdraw}
                disabled={!canSubmit || !!success}
                className="w-full py-4 rounded-2xl bg-amber-500 text-black font-black uppercase text-sm tracking-widest disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors shrink-0"
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
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
