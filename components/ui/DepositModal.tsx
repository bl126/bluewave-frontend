"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2, AlertCircle, Zap, ChevronRight, RefreshCw } from "lucide-react";
import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import { createPortal } from "react-dom";

// ─── Config ──────────────────────────────────────────────────────────────────
const DEPOSIT_WALLET = process.env.NEXT_PUBLIC_DEPOSIT_WALLET || "";
const STAR_PRICE_USD = 0.013;   // $0.013 per Star — matches Telegram's official rate
const MIN_STARS      = 100;     // minimum purchase: 100 Stars

// ─── Helpers ─────────────────────────────────────────────────────────────────
function calcStars(ton: number, tonPriceUsd: number): number {
  if (ton <= 0 || tonPriceUsd <= 0) return 0;
  const stars = Math.floor((ton * tonPriceUsd) / STAR_PRICE_USD);
  return stars >= MIN_STARS ? stars : 0;
}

function minTonRequired(tonPriceUsd: number): number {
  if (tonPriceUsd <= 0) return 1;
  // Round up to 3 decimal places
  return Math.ceil((MIN_STARS * STAR_PRICE_USD / tonPriceUsd) * 1000) / 1000;
}

// ─── Types ───────────────────────────────────────────────────────────────────
type DepositType = "ton" | "stars";
type TxStatus = "idle" | "pending" | "success" | "error";

interface DepositModalProps {
  type: DepositType;
  telegramUser: any;
  onClose: () => void;
  onSuccess?: (starsAdded?: number) => void;
}

const StarIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);

// ─── Main Component ──────────────────────────────────────────────────────────
export default function DepositModal({ type, telegramUser, onClose, onSuccess }: DepositModalProps) {
  const [tonConnectUI] = useTonConnectUI();
  const walletAddress = useTonAddress();

  const [tonPrice, setTonPrice] = useState<number>(0);
  const [priceLoading, setPriceLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(1); // default preset index
  const [useCustom, setUseCustom] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ─── Fetch Live TON Price ────────────────────────────────────────────────
  const fetchPrice = useCallback(async () => {
    setPriceLoading(true);
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd"
      );
      const data = await res.json();
      setTonPrice(data["the-open-network"]?.usd || 0);
    } catch {
      setTonPrice(0); // will show "Price unavailable"
    } finally {
      setPriceLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 300_000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [fetchPrice]);

  const isWalletConnected = !!walletAddress;
  const minTon = tonPrice > 0 ? minTonRequired(tonPrice) : 0;

  // Presets — calculated dynamically from live price
  const PRESETS = tonPrice > 0 ? [
    { ton: minTon,         label: `${minTon} ⊤`,  badge: "Min" },
    { ton: Math.ceil(minTon * 5  * 10) / 10, label: "", badge: "" },
    { ton: Math.ceil(minTon * 10 * 10) / 10, label: "", badge: "Popular" },
    { ton: Math.ceil(minTon * 25 * 10) / 10, label: "", badge: "Best Value" },
  ].map(p => ({ ...p, ton: Math.round(p.ton * 100) / 100, label: p.label || `${Math.round(p.ton * 100) / 100} ⊤` }))
  : [];

  // Active TON amount
  const activeTon = useCustom
    ? parseFloat(customAmount) || 0
    : (selectedPreset !== null && PRESETS[selectedPreset] ? PRESETS[selectedPreset].ton : 0);

  const starsToReceive = tonPrice > 0 ? calcStars(activeTon, tonPrice) : 0;
  const usdValue = activeTon * tonPrice;
  const isValidAmount = starsToReceive >= MIN_STARS;

  const modalTitle = type === "ton" ? "Top Up TON Balance" : "Buy Bluewave Stars";
  const modalIcon = type === "ton"
    ? <img src="/ton-transparent.png" alt="TON" className="w-7 h-7 object-contain" />
    : <span className="text-cyan-400"><StarIcon size={26} /></span>;

  // ─── Send Transaction ────────────────────────────────────────────────────
  const handleDeposit = async () => {
    if (!isWalletConnected) { tonConnectUI.openModal(); return; }
    if (!isValidAmount || txStatus === "pending") return;

    setTxStatus("pending");
    try {
      const tgId = telegramUser?.id || 0;
      const bwId = telegramUser?.bw_id || "";
      const commentPayload = `tg_id:${tgId}|bw_id:${bwId}`;

      // Encode as TON text comment (opcode 0x00000000 prefix)
      const encoder = new TextEncoder();
      const commentBytes = encoder.encode(commentPayload);
      const rawBytes = new Uint8Array(4 + commentBytes.length);
      rawBytes.set(commentBytes, 4);
      const payloadBase64 = btoa(String.fromCharCode(...rawBytes));

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: DEPOSIT_WALLET,
          amount: String(Math.round(activeTon * 1_000_000_000)),
          payload: payloadBase64,
        }],
      });

      setTxStatus("success");
      setTimeout(() => { onSuccess?.(starsToReceive); onClose(); }, 2500);
    } catch (err: any) {
      if (err?.message?.includes("User rejected")) setTxStatus("idle");
      else { setTxStatus("error"); setTimeout(() => setTxStatus("idle"), 3000); }
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/70 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 32, stiffness: 300 }}
          className="w-full max-w-md relative"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 20px) + 16px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative mx-3 rounded-[28px] overflow-hidden border border-white/10 shadow-[0_-20px_80px_rgba(0,230,255,0.08)]"
            style={{ background: "linear-gradient(135deg, rgba(10,14,26,0.98) 0%, rgba(0,20,40,0.98) 100%)" }}
          >
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
                  {modalIcon}
                </div>
                <div>
                  <h2 className="text-white font-black text-[16px] tracking-tight">{modalTitle}</h2>
                  {/* Live TON price */}
                  <div className="flex items-center gap-1.5">
                    {priceLoading ? (
                      <span className="text-white/30 text-[10px] font-mono animate-pulse">Fetching price…</span>
                    ) : tonPrice > 0 ? (
                      <>
                        <span className="text-white/40 text-[10px] font-mono">
                          1 ⊤ = ${tonPrice.toFixed(3)} · ⭐$0.013
                        </span>
                        <button onClick={fetchPrice} className="text-white/20 hover:text-cyan-400 transition-colors">
                          <RefreshCw size={9} />
                        </button>
                      </>
                    ) : (
                      <span className="text-amber-400 text-[10px] font-mono">Price unavailable</span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors active:scale-90">
                <X size={16} />
              </button>
            </div>

            {/* Wallet connect banner */}
            {!isWalletConnected && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="mx-5 mb-4 flex items-center gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20"
              >
                <AlertCircle size={16} className="text-amber-400 shrink-0" />
                <p className="text-amber-300 text-[11px] font-bold">Connect your TON wallet to deposit</p>
                <button onClick={() => tonConnectUI.openModal()} className="ml-auto text-[10px] font-black text-amber-400 uppercase tracking-widest whitespace-nowrap">
                  Connect →
                </button>
              </motion.div>
            )}

            {/* Min Stars info */}
            <div className="mx-5 mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
              <Zap size={11} className="text-cyan-400 shrink-0" />
              <p className="text-cyan-400/70 text-[10px] font-bold">
                Minimum purchase: <span className="text-cyan-400">{MIN_STARS} Stars</span>
                {tonPrice > 0 && <span className="text-white/30"> · ≈ {minTon} TON (${(minTon * tonPrice).toFixed(2)})</span>}
              </p>
            </div>

            {/* Preset grid */}
            {priceLoading ? (
              <div className="px-5 pb-4 grid grid-cols-2 gap-2.5">
                {[0,1,2,3].map(i => (
                  <div key={i} className="h-20 rounded-2xl bg-white/[0.03] border border-white/8 animate-pulse" />
                ))}
              </div>
            ) : tonPrice > 0 ? (
              <div className="px-5 pb-4">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">Select Amount</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {PRESETS.map((preset, idx) => {
                    const isSelected = !useCustom && selectedPreset === idx;
                    const s = calcStars(preset.ton, tonPrice);
                    const usd = preset.ton * tonPrice;
                    return (
                      <motion.button key={idx} whileTap={{ scale: 0.97 }}
                        onClick={() => { setSelectedPreset(idx); setUseCustom(false); }}
                        className={`relative flex flex-col p-3.5 rounded-2xl border transition-all text-left ${
                          isSelected
                            ? "bg-cyan-400/10 border-cyan-400/40 shadow-[0_0_20px_rgba(0,230,255,0.1)]"
                            : "bg-white/[0.03] border-white/8 hover:border-white/15"
                        }`}
                      >
                        {preset.badge && (
                          <span className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded-full border border-cyan-400/20">
                            {preset.badge}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <img src="/ton-transparent.png" alt="TON" className="w-4 h-4 object-contain" />
                          <span className={`font-black text-[15px] ${isSelected ? "text-cyan-400" : "text-white"}`}>{preset.label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <StarIcon size={10} />
                          <span className={`text-[11px] font-black ${isSelected ? "text-cyan-400" : "text-white/60"}`}>
                            {s.toLocaleString()} Stars
                          </span>
                        </div>
                        <span className="text-[9px] text-white/25 font-mono mt-0.5">${usd.toFixed(2)}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Custom amount */}
            <div className="px-5 pb-4">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Custom Amount</p>
              <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                useCustom ? "border-cyan-400/40 bg-cyan-400/5" : "border-white/8 bg-white/[0.03]"
              }`}>
                <img src="/ton-transparent.png" alt="TON" className="w-5 h-5 object-contain shrink-0" />
                <input
                  type="number" min={minTon} step="0.1"
                  placeholder={`Min ${minTon} TON`}
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setUseCustom(true); setSelectedPreset(null); }}
                  onFocus={() => { setUseCustom(true); setSelectedPreset(null); }}
                  className="flex-1 bg-transparent border-none outline-none text-white font-bold text-[14px] placeholder-white/20"
                />
                {useCustom && tonPrice > 0 && activeTon > 0 && (
                  <span className="text-white/30 text-[11px] font-mono shrink-0">${usdValue.toFixed(2)}</span>
                )}
              </div>
            </div>

            {/* Summary */}
            <AnimatePresence>
              {activeTon > 0 && tonPrice > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className={`mx-5 mb-4 p-4 rounded-2xl border ${
                    isValidAmount
                      ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-400/20"
                      : "bg-red-500/5 border-red-500/20"
                  }`}
                >
                  {isValidAmount ? (
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">You send</span>
                        <div className="flex items-center gap-2">
                          <img src="/ton-transparent.png" alt="TON" className="w-5 h-5 object-contain" />
                          <span className="text-white font-black text-[18px]">{activeTon} TON</span>
                        </div>
                        <span className="text-white/30 text-[10px] font-mono">≈ ${usdValue.toFixed(2)} USD</span>
                      </div>
                      <ChevronRight size={20} className="text-white/20" />
                      <div className="flex flex-col gap-1 items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">You receive</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-cyan-400 font-black text-[18px]">{starsToReceive.toLocaleString()}</span>
                          <span className="text-cyan-400"><StarIcon size={16} /></span>
                        </div>
                        <span className="text-white/30 text-[10px] font-mono">≈ ${(starsToReceive * STAR_PRICE_USD).toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} className="text-red-400 shrink-0" />
                      <p className="text-red-400 text-[11px] font-bold">
                        Below minimum — need at least {MIN_STARS} Stars ({minTon} TON)
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA */}
            <div className="px-5 pb-5">
              <motion.button
                whileTap={{ scale: 0.97 }} onClick={handleDeposit}
                disabled={txStatus === "pending" || txStatus === "success"}
                className={`w-full h-14 rounded-2xl font-black text-[14px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg ${
                  txStatus === "success" ? "bg-emerald-500 text-white"
                  : txStatus === "error"  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : !isWalletConnected    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : !isValidAmount        ? "bg-white/5 text-white/30 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-[0_0_30px_rgba(0,230,255,0.25)]"
                }`}
              >
                {txStatus === "pending" && <Loader2 size={18} className="animate-spin" />}
                {txStatus === "success"  && <CheckCircle2 size={18} />}
                {txStatus === "error"    && <AlertCircle size={18} />}
                {txStatus === "idle" && !isWalletConnected && "Connect Wallet to Deposit"}
                {txStatus === "idle" && isWalletConnected && !isValidAmount && `Min ${MIN_STARS} Stars (${minTon} TON)`}
                {txStatus === "idle" && isWalletConnected && isValidAmount  && `Deposit ${activeTon} TON`}
                {txStatus === "pending" && "Waiting for Signature…"}
                {txStatus === "success" && `+${starsToReceive.toLocaleString()} Stars Incoming! 🎉`}
                {txStatus === "error"   && "Transaction Failed — Try Again"}
              </motion.button>

              <p className="text-center text-[9px] text-white/20 font-mono mt-3 leading-relaxed">
                Stars credited within ~30s after blockchain confirmation.{"\n"}
                Rate: $0.013/Star (matches Telegram official) · Min {MIN_STARS} Stars
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
