"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, Loader2, CheckCircle2, AlertCircle, Zap, ChevronRight, RefreshCw, Wallet } from "lucide-react";
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
  const dragControls = useDragControls();

  const [tonPrice, setTonPrice] = useState<number>(0);
  const [priceLoading, setPriceLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [useCustom, setUseCustom] = useState(true);
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [mounted, setMounted] = useState(false);

  // Live Wallet Balance states
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

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

  // ─── Fetch On-Chain Wallet Balance ────────────────────────────────────────
  const fetchWalletBalance = useCallback(async (address: string) => {
    if (!address) {
      setWalletBalance(null);
      return;
    }
    setBalanceLoading(true);
    try {
      // 1. Try Toncenter v3 API
      const res = await fetch(`https://toncenter.com/api/v3/account?address=${address}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.balance !== undefined) {
          const bal = parseFloat(data.balance) / 1_000_000_000;
          setWalletBalance(bal);
          setBalanceLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("[TON DEPOSIT] Toncenter v3 fetch failed, trying Tonapi...", e);
    }

    try {
      // 2. Fallback to Tonapi.io
      const res = await fetch(`https://tonapi.io/v2/accounts/${address}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.balance !== undefined) {
          const bal = parseFloat(data.balance) / 1_000_000_000;
          setWalletBalance(bal);
          setBalanceLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("[TON DEPOSIT] Tonapi fetch failed", e);
    }
    setBalanceLoading(false);
  }, []);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 300_000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [fetchPrice]);

  useEffect(() => {
    if (walletAddress) {
      fetchWalletBalance(walletAddress);
    } else {
      setWalletBalance(null);
    }
  }, [walletAddress, fetchWalletBalance]);

  const isWalletConnected = !!walletAddress;
  const minTon = tonPrice > 0 ? minTonRequired(tonPrice) : 0;

  // Presets for Stars package — calculated dynamically from live price
  const PRESETS = tonPrice > 0 ? [
    { ton: minTon,         label: `${minTon} TON`,  badge: "Min" },
    { ton: Math.ceil(minTon * 5  * 10) / 10, label: "", badge: "" },
    { ton: Math.ceil(minTon * 10 * 10) / 10, label: "", badge: "Popular" },
    { ton: Math.ceil(minTon * 25 * 10) / 10, label: "", badge: "Best Value" },
  ].map(p => ({ ...p, ton: Math.round(p.ton * 100) / 100, label: p.label || `${Math.round(p.ton * 100) / 100} TON` }))
  : [];

  // Active TON amount based on type
  const activeTon = type === "ton" 
    ? parseFloat(customAmount) || 0
    : (useCustom 
        ? parseFloat(customAmount) || 0
        : (selectedPreset !== null && PRESETS[selectedPreset] ? PRESETS[selectedPreset].ton : 0)
      );

  const starsToReceive = tonPrice > 0 ? calcStars(activeTon, tonPrice) : 0;
  const usdValue = activeTon * tonPrice;
  const isValidAmount = type === "ton" 
    ? activeTon > 0 
    : starsToReceive >= MIN_STARS;

  const modalTitle = type === "ton" ? "Deposit" : "Buy Stars";
  
  // Set percentage amount of available wallet balance
  const handleSetAmountPercent = (percent: number) => {
    if (walletBalance === null || walletBalance <= 0) return;
    if (percent === 1.0) {
      // Leave a tiny buffer of 0.01 TON for gas fees so transaction won't fail
      const maxAmount = Math.max(0, walletBalance - 0.01);
      setCustomAmount(maxAmount.toFixed(4));
    } else {
      setCustomAmount((walletBalance * percent).toFixed(4));
    }
    setUseCustom(true);
    setSelectedPreset(null);
  };

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
      // Refresh wallet balance after short delay
      setTimeout(() => {
        if (walletAddress) fetchWalletBalance(walletAddress);
      }, 3000);
      
      setTimeout(() => { onSuccess?.(starsToReceive); onClose(); }, 2500);
    } catch (err: any) {
      if (err?.message?.includes("User rejected")) setTxStatus("idle");
      else { setTxStatus("error"); setTimeout(() => setTxStatus("idle"), 3000); }
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[990] flex items-end justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-app-bg/60 backdrop-blur-sm"
        />

        {/* Sheet */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          drag="y"
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.y > 100) onClose();
          }}
          className="fixed bottom-0 left-0 right-0 z-[999] bg-app-card border-t border-app-border rounded-t-[2.5rem] flex flex-col max-h-[90vh] shadow-app-shadow w-full"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 20px) + 16px)" }}
        >
          {/* Drag Handle */}
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing touch-none shrink-0"
          >
            <div className="w-12 h-1.5 bg-app-border/50 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-8 pb-4 shrink-0">
            <div>
              <h2 className="text-text-main font-black text-xl uppercase tracking-tight">{modalTitle}</h2>
              {/* Live TON price */}
              <div className="flex items-center gap-1.5 mt-0.5">
                {priceLoading ? (
                  <span className="text-text-sub/30 text-[9px] uppercase font-black tracking-widest animate-pulse">Fetching price…</span>
                ) : tonPrice > 0 ? (
                  <>
                    <span className="text-text-sub/50 text-[9px] uppercase font-black tracking-widest">
                      1 TON = ${tonPrice.toFixed(3)}
                    </span>
                    <button onClick={fetchPrice} className="text-text-sub/30 hover:text-app-accent transition-colors">
                      <RefreshCw size={9} />
                    </button>
                  </>
                ) : (
                  <span className="text-amber-400 text-[9px] uppercase font-black tracking-widest">Price unavailable</span>
                )}
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full bg-app-accent/5 hover:bg-app-accent/10 text-app-accent transition-colors active:scale-95"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content Wrapper */}
          <div className="flex-1 overflow-y-auto px-8 pb-6 custom-scrollbar flex flex-col gap-5">
            {/* Wallet connection status row */}
            <div className="flex items-center justify-between text-xs font-bold shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-app-accent/10 flex items-center justify-center border border-app-border">
                  <img src="/ton-transparent.png" alt="TON" className="w-3.5 h-3.5 object-contain" />
                </div>
                <span className="text-text-main font-mono tracking-tight">
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}` : "Not Connected"}
                </span>
              </div>
              <span className="text-text-sub/50 uppercase tracking-widest text-[9px]">Connected Wallet</span>
            </div>

            {/* Wallet connect banner */}
            {!isWalletConnected && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }} 
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 shrink-0"
              >
                <AlertCircle size={16} className="text-amber-400 shrink-0" />
                <div>
                  <p className="text-amber-300 text-[10px] font-black uppercase tracking-wider">Wallet Disconnected</p>
                  <p className="text-amber-300/60 text-[9px] font-bold uppercase tracking-widest mt-0.5">Connect your TON wallet to deposit</p>
                </div>
                <button 
                  onClick={() => tonConnectUI.openModal()} 
                  className="ml-auto text-[10px] font-black text-amber-400 uppercase tracking-widest whitespace-nowrap bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-xl hover:bg-amber-400/20 transition-all active:scale-95"
                >
                  Connect →
                </button>
              </motion.div>
            )}

            {/* ─── Mode 1: DIRECT TON DEPOSIT UI ─── */}
            {type === "ton" && (
              <div className="flex flex-col gap-4">
                {/* Wallet balance & input box */}
                <div className="bg-app-bg/50 border border-app-border rounded-2xl p-5 flex flex-col gap-4">
                  {/* Header: Available Balance & Half/Max */}
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-text-sub/60">Available Balance</span>
                    <div className="flex items-center gap-2 text-text-sub">
                      <Wallet size={12} className="text-text-sub/60" />
                      <span className="font-mono">
                        {balanceLoading ? (
                          <span className="animate-pulse">Loading...</span>
                        ) : walletBalance !== null ? (
                          walletBalance.toFixed(4)
                        ) : (
                          "0.0000"
                        )}
                      </span>
                      {isWalletConnected && walletBalance !== null && (
                        <div className="flex items-center gap-1.5 ml-1 select-none">
                          <button 
                            onClick={() => handleSetAmountPercent(0.5)}
                            className="text-app-accent hover:opacity-80 transition-opacity font-black text-[9px] uppercase tracking-widest bg-app-accent/10 px-1.5 py-0.5 rounded border border-app-border"
                          >
                            Half
                          </button>
                          <button 
                            onClick={() => handleSetAmountPercent(1.0)}
                            className="text-app-accent hover:opacity-80 transition-opacity font-black text-[9px] uppercase tracking-widest bg-app-accent/10 px-1.5 py-0.5 rounded border border-app-border"
                          >
                            Max
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Input Row: Large amount & TON pill */}
                  <div className="flex items-center justify-between gap-4">
                    <input
                      type="number"
                      placeholder="0.0"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedPreset(null);
                      }}
                      className="bg-transparent border-none outline-none text-text-main font-black text-3xl placeholder-text-sub/10 w-full min-w-0"
                    />
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-app-accent/10 border border-app-border/50 select-none shrink-0">
                      <img src="/ton-transparent.png" alt="TON" className="w-4 h-4 object-contain" />
                      <span className="text-text-main font-black text-xs tracking-tight">TON</span>
                    </div>
                  </div>

                  {/* Footer: USD Conversion & "Toncoin" text */}
                  <div className="flex items-center justify-between text-[10px] font-black text-text-sub/40 uppercase tracking-widest">
                    <span>
                      {customAmount && tonPrice > 0 ? (
                        `$${(parseFloat(customAmount) * tonPrice || 0).toFixed(4)}`
                      ) : (
                        "$0.0000"
                      )}
                    </span>
                    <span>Toncoin</span>
                  </div>
                </div>

                {/* TON Presets */}
                <div>
                  <p className="text-[9px] font-black text-text-sub/50 uppercase tracking-[0.2em] mb-2">Quick Presets</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 5, 10, 25].map((presetVal) => {
                      const isSelected = parseFloat(customAmount) === presetVal;
                      return (
                        <button
                          key={presetVal}
                          onClick={() => {
                            setCustomAmount(String(presetVal));
                            setSelectedPreset(presetVal);
                          }}
                          className={`py-2.5 rounded-xl border text-xs font-black transition-all ${
                            isSelected
                              ? "bg-app-accent/20 border-app-accent text-app-accent shadow-[0_0_12px_rgba(0,246,255,0.15)]"
                              : "bg-app-accent/5 border-app-border text-text-sub hover:border-app-accent/30"
                          }`}
                        >
                          {presetVal} TON
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Mode 2: STARS PURCHASE UI ─── */}
            {type === "stars" && (
              <div className="flex flex-col gap-4">
                {/* Min Stars info banner */}
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-app-accent/5 border border-app-border shrink-0">
                  <Zap size={12} className="text-app-accent shrink-0" />
                  <p className="text-text-sub text-[10px] font-black uppercase tracking-widest leading-none">
                    Minimum Purchase: <span className="text-app-accent font-black">{MIN_STARS} Stars</span>
                    {tonPrice > 0 && <span className="text-text-sub/40"> · ≈ {minTon} TON (${(minTon * tonPrice).toFixed(2)})</span>}
                  </p>
                </div>

                {/* Stars presets */}
                {priceLoading ? (
                  <div className="grid grid-cols-2 gap-2.5 pb-2">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className="h-[72px] rounded-2xl bg-app-accent/5 border border-app-border animate-pulse" />
                    ))}
                  </div>
                ) : tonPrice > 0 ? (
                  <div>
                    <p className="text-[9px] font-black text-text-sub/50 uppercase tracking-[0.2em] mb-2">Select Stars Amount</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {PRESETS.map((preset, idx) => {
                        const isSelected = !useCustom && selectedPreset === idx;
                        const s = calcStars(preset.ton, tonPrice);
                        const usd = preset.ton * tonPrice;
                        return (
                          <button 
                            key={idx}
                            onClick={() => {
                              setSelectedPreset(idx);
                              setUseCustom(false);
                              setCustomAmount("");
                            }}
                            className={`relative flex flex-col p-3 rounded-2xl border transition-all text-left ${
                              isSelected
                                ? "bg-app-accent/15 border-app-accent shadow-[0_0_15px_rgba(0,246,255,0.15)] text-app-accent"
                                : "bg-app-accent/5 border-app-border hover:border-app-accent/30 text-text-main"
                            }`}
                          >
                            {preset.badge && (
                              <span className="absolute top-2.5 right-2.5 text-[8px] font-black uppercase tracking-widest text-app-accent bg-app-accent/15 px-1.5 py-0.5 rounded-full border border-app-border select-none">
                                {preset.badge}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <img src="/ton-transparent.png" alt="TON" className="w-3.5 h-3.5 object-contain" />
                              <span className="font-black text-sm">{preset.ton} TON</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-black text-text-sub">
                              <StarIcon size={10} />
                              <span>{s.toLocaleString()} Stars</span>
                            </div>
                            <span className="text-[9px] text-text-sub/30 font-mono mt-0.5">${usd.toFixed(2)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Custom Amount */}
                <div>
                  <p className="text-[9px] font-black text-text-sub/50 uppercase tracking-[0.2em] mb-2">Custom TON Amount</p>
                  <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                    useCustom && customAmount ? "border-app-accent bg-app-accent/5" : "border-app-border bg-app-accent/5"
                  }`}>
                    <img src="/ton-transparent.png" alt="TON" className="w-5 h-5 object-contain shrink-0" />
                    <input
                      type="number"
                      min={minTon}
                      step="0.1"
                      placeholder={`Min ${minTon} TON`}
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setUseCustom(true);
                        setSelectedPreset(null);
                      }}
                      onFocus={() => {
                        setUseCustom(true);
                        setSelectedPreset(null);
                      }}
                      className="flex-1 bg-transparent border-none outline-none text-text-main font-bold text-sm placeholder-text-sub/20"
                    />
                    {useCustom && tonPrice > 0 && activeTon > 0 && (
                      <span className="text-text-sub/50 text-xs font-mono shrink-0">${usdValue.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                {/* Conversion Summary */}
                <AnimatePresence>
                  {activeTon > 0 && tonPrice > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: 8 }}
                      className={`p-4 rounded-2xl border ${
                        isValidAmount
                          ? "bg-app-accent/10 border-app-border"
                          : "bg-red-500/5 border-red-500/20"
                      }`}
                    >
                      {isValidAmount ? (
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-text-sub/50">You send</span>
                            <div className="flex items-center gap-1.5">
                              <img src="/ton-transparent.png" alt="TON" className="w-4 h-4 object-contain" />
                              <span className="text-text-main font-black text-base">{activeTon} TON</span>
                            </div>
                            <span className="text-text-sub/40 text-[9px] font-mono">≈ ${usdValue.toFixed(2)} USD</span>
                          </div>
                          <ChevronRight size={16} className="text-text-sub/20" />
                          <div className="flex flex-col gap-0.5 items-end">
                            <span className="text-[9px] font-black uppercase tracking-widest text-text-sub/50">You receive</span>
                            <div className="flex items-center gap-1">
                              <span className="text-app-accent font-black text-base">{starsToReceive.toLocaleString()}</span>
                              <span className="text-app-accent"><StarIcon size={14} /></span>
                            </div>
                            <span className="text-text-sub/40 text-[9px] font-mono">≈ ${(starsToReceive * STAR_PRICE_USD).toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertCircle size={14} className="text-red-400 shrink-0" />
                          <p className="text-red-400 text-xs font-bold">
                            Below minimum — need at least {MIN_STARS} Stars ({minTon} TON)
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Action Area & CTA */}
            <div className="mt-2 flex flex-col gap-3 shrink-0">
              <motion.button
                whileTap={{ scale: 0.97 }} 
                onClick={handleDeposit}
                disabled={txStatus === "pending" || txStatus === "success" || (isWalletConnected && !isValidAmount)}
                className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all shadow-lg ${
                  txStatus === "success" ? "bg-emerald-500 text-white"
                  : txStatus === "error"  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : !isWalletConnected    ? "bg-app-accent text-app-bg shadow-[0_0_20px_rgba(0,246,255,0.2)]"
                  : !isValidAmount        ? "bg-app-accent/5 border border-app-border text-text-sub/30 cursor-not-allowed"
                  : "bg-app-accent text-app-bg shadow-[0_0_25px_rgba(0,246,255,0.25)] hover:opacity-90"
                }`}
              >
                {txStatus === "pending" && <Loader2 size={16} className="animate-spin" />}
                {txStatus === "success"  && <CheckCircle2 size={16} />}
                {txStatus === "error"    && <AlertCircle size={16} />}
                
                {txStatus === "idle" && (
                  !isWalletConnected ? "Connect Wallet to Deposit"
                  : !isValidAmount ? (
                      type === "ton" ? "Enter TON Amount" : `Min ${MIN_STARS} Stars (${minTon} TON)`
                    )
                  : (
                      type === "ton" ? `Deposit ${activeTon} TON` : `Purchase ${starsToReceive.toLocaleString()} Stars`
                    )
                )}
                {txStatus === "pending" && "Waiting for Signature…"}
                {txStatus === "success" && (
                  type === "ton" ? "Deposit Sent Successfully! 🎉" : `+${starsToReceive.toLocaleString()} Stars Incoming! 🎉`
                )}
                {txStatus === "error"   && "Transaction Failed — Try Again"}
              </motion.button>

              <p className="text-center text-[9px] text-text-sub/30 font-bold uppercase tracking-wider leading-normal">
                {type === "ton" ? (
                  "Transactions credited within ~30s after blockchain confirmation. TON directly funds your active app utility."
                ) : (
                  `Stars credited within ~30s after blockchain confirmation. Rate: $0.013/Star (matches Telegram official) · Min ${MIN_STARS} Stars`
                )}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
