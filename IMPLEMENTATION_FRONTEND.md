# Frontend Implementation - Dual Balance System

## 📝 File 1: Updated DepositModal.tsx

**Path:** `bluewave-frontend/components/ui/DepositModal.tsx`

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, Loader2, CheckCircle2, AlertCircle, Zap, ChevronRight, RefreshCw, Wallet, ArrowRightLeft } from "lucide-react";
import { useTonConnectUI, useTonAddress, toUserFriendlyAddress } from "@tonconnect/ui-react";
import { createPortal } from "react-dom";
import { postApi } from "@/lib/useApi";
import { beginCell } from "@ton/core";
import ConvertModal from "./ConvertModal";  // NEW


// ─── Config ──────────────────────────────────────────────────────────────────
const DEPOSIT_WALLET = process.env.NEXT_PUBLIC_DEPOSIT_WALLET || "";
const STAR_PRICE_USD = 0.013;
const MIN_STARS      = 100;
const MIN_DEPOSIT_TON    = 0.01;

// ... [EXISTING HELPER FUNCTIONS - Keep all existing functions like calcStars, minTonRequired, etc.] ...

type DepositType = "ton_direct" | "stars";
type TxStatus = "idle" | "pending" | "success" | "error";

interface DepositModalProps {
  type: DepositType;
  telegramUser: any;
  onClose: () => void;
  onSuccess?: (tonAmount?: number, starsAmount?: number) => void;
}

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

  // NEW: Convert Modal
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [userTonBalance, setUserTonBalance] = useState<number>(0);
  const [userStarsBalance, setUserStarsBalance] = useState<number>(0);

  useEffect(() => { setMounted(true); }, []);

  // Fetch prices and balances (keep existing)
  const fetchPrice = useCallback(async () => {
    setPriceLoading(true);
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd"
      );
      const data = await res.json();
      setTonPrice(data["the-open-network"]?.usd || 0);
    } catch {
      setTonPrice(0);
    } finally {
      setPriceLoading(false);
    }
  }, []);

  const fetchWalletBalance = useCallback(async (address: string) => {
    if (!address) {
      setWalletBalance(null);
      return;
    }
    setBalanceLoading(true);
    try {
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
      console.warn("[TON TOPUP] Toncenter v3 fetch failed, trying Tonapi...", e);
    }

    try {
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
      console.warn("[TON TOPUP] Tonapi fetch failed", e);
    }
    setBalanceLoading(false);
  }, []);

  // NEW: Fetch user balances from app
  useEffect(() => {
    if (telegramUser?.id && type === "stars") {
      // Get user's current ton_balance and stars_balance
      postApi(`/user/${telegramUser.id}`, {})
        .then((res: any) => {
          setUserTonBalance(res.ton_balance || 0);
          setUserStarsBalance(res.stars_balance || 0);
        })
        .catch((err) => console.warn("Failed to fetch user balances:", err));
    }
  }, [telegramUser?.id, type]);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 300_000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  // ... [EXISTING CODE for wallet address checking, isSameAddress, etc.] ...
  const dbWallet = telegramUser?.wallet_address;
  const isMatched = !!dbWallet && !!walletAddress && isSameAddress(walletAddress, dbWallet);
  const activeWalletAddress = isMatched ? dbWallet : (walletAddress || dbWallet);
  const isWalletConnected = !!activeWalletAddress;
  const isWalletMismatch = !!dbWallet && !!walletAddress && !isMatched;

  useEffect(() => {
    if (activeWalletAddress) {
      fetchWalletBalance(activeWalletAddress);
    } else {
      setWalletBalance(null);
    }
  }, [activeWalletAddress, fetchWalletBalance]);

  const minTon = tonPrice > 0 ? minTonRequired(tonPrice) : 0;

  const PRESETS = tonPrice > 0 ? [
    { ton: minTon },
    { ton: Math.ceil(minTon * 5  * 10) / 10 },
    { ton: Math.ceil(minTon * 10 * 10) / 10 },
    { ton: Math.ceil(minTon * 25 * 10) / 10 },
  ].map(p => ({ ...p, ton: Math.round(p.ton * 100) / 100 }))
  : [];

  const activeTon = type === "ton_direct"
    ? parseFloat(customAmount) || 0
    : (useCustom 
        ? parseFloat(customAmount) || 0
        : (selectedPreset !== null && PRESETS[selectedPreset] ? PRESETS[selectedPreset].ton : 0)
      );

  const starsToReceive = tonPrice > 0 ? calcStars(activeTon, tonPrice) : 0;
  const usdValue = activeTon * tonPrice;
  const isValidAmount = type === "ton_direct" 
    ? activeTon > 0 
    : starsToReceive >= MIN_STARS;

  const modalTitle = type === "ton_direct" ? "Topup TON" : "Buy Stars";

  const handleSetAmountPercent = (percent: number) => {
    if (walletBalance === null || walletBalance <= 0) return;
    if (percent === 1.0) {
      const maxAmount = Math.max(0, walletBalance - 0.01);
      setCustomAmount(maxAmount.toFixed(4));
    } else {
      setCustomAmount((walletBalance * percent).toFixed(4));
    }
    setUseCustom(true);
    setSelectedPreset(null);
  };

  const handleTopup = async () => {
    if (!walletAddress) { tonConnectUI.openModal(); return; }
    if (!isValidAmount || txStatus === "pending") return;

    setTxStatus("pending");
    try {
      const tgId = telegramUser?.id || 0;
      const bwId = telegramUser?.bw_id || "";
      
      // NEW: Add mode to comment
      const mode = type === "ton_direct" ? "ton_direct" : "buy_stars";
      const commentPayload = `tg_id:${tgId}|bw_id:${bwId}|mode:${mode}`;

      const cell = beginCell()
        .storeUint(0, 32)
        .storeStringTail(commentPayload)
        .endCell();
      const payloadBase64 = cell.toBoc().toString("base64");

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: DEPOSIT_WALLET,
          amount: String(Math.round(activeTon * 1_000_000_000)),
          payload: payloadBase64,
        }],
      });

      setTxStatus("success");
      setTimeout(() => {
        if (walletAddress) fetchWalletBalance(walletAddress);
      }, 3000);
      
      setTimeout(() => { 
        onSuccess?.(
          type === "ton_direct" ? activeTon : undefined,
          type === "stars" ? starsToReceive : undefined
        ); 
        onClose(); 
      }, 2500);
    } catch (err: any) {
      if (err?.message?.includes("User rejected")) setTxStatus("idle");
      else { setTxStatus("error"); setTimeout(() => setTxStatus("idle"), 3000); }
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[990] flex items-end justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-app-bg/60 backdrop-blur-sm"
        />

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
              <div className="flex items-center gap-1.5 mt-0.5">
                {priceLoading ? (
                  <span className="text-text-main text-[10px] uppercase font-black tracking-widest animate-pulse">Fetching price…</span>
                ) : tonPrice > 0 ? (
                  <>
                    <span className="text-text-main text-[10px] uppercase font-black tracking-widest">
                      1 TON = ${tonPrice.toFixed(3)}
                    </span>
                    <button onClick={fetchPrice} className="text-text-main hover:text-app-accent transition-colors">
                      <RefreshCw size={9} />
                    </button>
                  </>
                ) : (
                  <span className="text-amber-400 text-[10px] uppercase font-black tracking-widest">Price unavailable</span>
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
            {/* Existing wallet connection UI */}
            <div className="flex items-center justify-between text-xs font-bold shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-app-accent/10 flex items-center justify-center border border-app-border">
                  <img src="/ton-transparent.png" alt="TON" className="w-3.5 h-3.5 object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="text-text-main font-mono tracking-tight">
                    {activeWalletAddress ? `${activeWalletAddress.slice(0, 6)}...${activeWalletAddress.slice(-6)}` : "Not Connected"}
                  </span>
                  {walletAddress && (
                    <button
                      onClick={() => tonConnectUI.disconnect()}
                      className="text-red-400 hover:text-red-300 text-[8px] uppercase tracking-wider text-left transition-colors font-black mt-0.5"
                    >
                      [Disconnect]
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-text-main font-bold uppercase tracking-widest text-[9px]">
                  {walletAddress ? "Connected Wallet" : dbWallet ? "Registered Wallet" : "No Wallet"}
                </span>
                {isWalletMismatch && (
                  <span className="text-amber-400 text-[8px] uppercase tracking-widest font-black mt-0.5 animate-pulse">
                    Mismatch detected
                  </span>
                )}
              </div>
            </div>

            {/* Mismatch warning */}
            {isWalletMismatch && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }} 
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2.5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 shrink-0 text-left"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-400 shrink-0" />
                  <span className="text-amber-400 text-[10px] font-black uppercase tracking-wider">Different Wallet Connected</span>
                </div>
                <p className="text-text-main text-[11px] font-medium leading-relaxed">
                  Your profile has registered wallet: <span className="font-mono text-app-accent font-bold break-all">{dbWallet}</span>.
                  You are currently connected with: <span className="font-mono text-app-accent font-bold break-all">{walletAddress}</span>.
                  Please disconnect and connect your registered wallet to avoid topup flagging.
                </p>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => tonConnectUI.disconnect()}
                    className="w-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-[9px] uppercase tracking-wider font-black py-2 rounded-xl transition-all"
                  >
                    Disconnect Mismatched Wallet
                  </button>
                </div>
              </motion.div>
            )}

            {/* Wallet connect banner */}
            {!isWalletConnected && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }} 
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 shrink-0 text-left"
              >
                <AlertCircle size={16} className="text-amber-400 shrink-0" />
                <div>
                  <p className="text-amber-300 text-[10px] font-black uppercase tracking-wider">Wallet Disconnected</p>
                  <p className="text-amber-300/80 text-[9px] font-bold uppercase tracking-widest mt-0.5">Connect your TON wallet to topup</p>
                </div>
                <button 
                  onClick={() => tonConnectUI.openModal()} 
                  className="ml-auto text-[10px] font-black text-amber-400 uppercase tracking-widest whitespace-nowrap bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-xl hover:bg-amber-400/20 transition-all active:scale-95"
                >
                  Connect →
                </button>
              </motion.div>
            )}

            {/* ─── TON DIRECT MODE ─── */}
            {type === "ton_direct" && (
              <div className="flex flex-col gap-4">
                {/* Wallet balance & input box */}
                <div className="bg-app-bg/30 border border-app-border rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-text-main font-bold">Available Balance</span>
                    <div className="flex items-center gap-2 text-text-main font-bold">
                      <Wallet size={12} className="text-text-main shrink-0" />
                      <span className="font-mono">
                        {balanceLoading ? (
                          <span className="animate-pulse">Loading...</span>
                        ) : walletBalance !== null ? (
                          walletBalance.toFixed(4)
                        ) : (
                          "0.0000"
                        )}
                      </span>
                      {isWalletConnected && walletBalance !== null && !isWalletMismatch && (
                        <div className="flex items-center gap-1.5 ml-1 select-none">
                          <button 
                            onClick={() => handleSetAmountPercent(0.5)}
                            className="text-app-accent hover:opacity-80 transition-opacity font-black text-[9px] uppercase tracking-widest bg-app-accent/10 px-2 py-0.5 rounded border border-app-border"
                          >
                            Half
                          </button>
                          <button 
                            onClick={() => handleSetAmountPercent(1.0)}
                            className="text-app-accent hover:opacity-80 transition-opacity font-black text-[9px] uppercase tracking-widest bg-app-accent/10 px-2 py-0.5 rounded border border-app-border"
                          >
                            Max
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <input
                      type="number"
                      placeholder="0.0"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedPreset(null);
                      }}
                      className="bg-transparent border-none outline-none text-text-main font-black text-3xl placeholder-text-main/20 w-full min-w-0"
                    />
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-app-accent/10 border border-app-border/50 select-none shrink-0">
                      <img src="/ton-transparent.png" alt="TON" className="w-4 h-4 object-contain" />
                      <span className="text-text-main font-black text-xs tracking-tight">TON</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-black text-text-main uppercase tracking-widest">
                    <span className="text-text-main font-bold">
                      {customAmount && tonPrice > 0 ? (
                        `$${(parseFloat(customAmount) * tonPrice || 0).toFixed(4)}`
                      ) : (
                        "$0.0000"
                      )}
                    </span>
                    <span className="text-text-main/60">Toncoin</span>
                  </div>
                </div>

                {/* TON Presets */}
                <div>
                  <p className="text-[10px] font-bold text-text-main uppercase tracking-[0.2em] mb-2">Quick Presets</p>
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
                              : "bg-app-accent/5 border-app-border/50 text-text-main hover:border-app-accent/55"
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

            {/* ─── STARS MODE ─── */}
            {type === "stars" && (
              <div className="flex flex-col gap-4">
                {/* Min Stars info */}
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-app-accent/5 border border-app-border shrink-0">
                  <Zap size={12} className="text-app-accent shrink-0" />
                  <p className="text-text-main text-[10px] font-black uppercase tracking-widest leading-none">
                    Minimum Purchase: <span className="text-app-accent font-black">{MIN_STARS} Stars</span>
                    {tonPrice > 0 && <span className="text-text-main/70"> · ≈ {minTon} TON (${(minTon * tonPrice).toFixed(2)})</span>}
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
                    <p className="text-[10px] font-bold text-text-main uppercase tracking-[0.2em] mb-2">Select Stars Amount</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {PRESETS.map((preset, idx) => {
                        const isSelected = !useCustom && selectedPreset === idx;
                        const presetStars = calcStars(preset.ton, tonPrice);
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setCustomAmount(String(preset.ton));
                              setSelectedPreset(idx);
                              setUseCustom(false);
                            }}
                            className={`py-4 px-3 rounded-2xl border transition-all text-left ${
                              isSelected
                                ? "bg-app-accent/20 border-app-accent shadow-[0_0_12px_rgba(0,246,255,0.15)]"
                                : "bg-app-accent/5 border-app-border/50 hover:border-app-accent/55"
                            }`}
                          >
                            <div className="text-xs font-black text-text-main uppercase tracking-tight">
                              {presetStars:,} ⭐
                            </div>
                            <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${
                              isSelected ? "text-app-accent" : "text-text-main/60"
                            }`}>
                              {preset.ton} TON
                            </div>
                            <div className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${
                              isSelected ? "text-app-accent/80" : "text-text-main/40"
                            }`}>
                              ${(preset.ton * tonPrice).toFixed(2)} USD
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Custom amount input */}
                <div>
                  <p className="text-[10px] font-bold text-text-main uppercase tracking-[0.2em] mb-2">Custom Amount</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Enter TON amount"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setUseCustom(true);
                        setSelectedPreset(null);
                      }}
                      className="flex-1 bg-app-bg/50 border border-app-border rounded-xl px-4 py-3 text-text-main font-mono text-sm placeholder-text-main/40 focus:border-app-accent outline-none transition-colors"
                    />
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-app-accent/10 border border-app-border/50 select-none">
                      <img src="/ton-transparent.png" alt="TON" className="w-4 h-4 object-contain" />
                      <span className="text-text-main font-black text-xs">TON</span>
                    </div>
                  </div>
                  {customAmount && tonPrice > 0 && (
                    <div className="mt-2 flex items-center justify-between text-[10px] font-black text-text-main/60 uppercase tracking-widest">
                      <span>{starsToReceive:,} Stars</span>
                      <span>${(parseFloat(customAmount) * tonPrice).toFixed(2)} USD</span>
                    </div>
                  )}
                </div>

                {/* NEW: Convert Button (only if user has TON balance) */}
                {userTonBalance > 0 && (
                  <button
                    onClick={() => setIsConvertOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-app-accent/10 to-purple-500/10 border border-app-accent/30 hover:border-app-accent/60 text-app-accent font-black uppercase tracking-widest text-[11px] transition-all active:scale-95"
                  >
                    <ArrowRightLeft size={14} />
                    Convert {userTonBalance.toFixed(4)} TON to Stars
                  </button>
                )}
              </div>
            )}

            {/* Action Button */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleTopup}
                disabled={!isValidAmount || txStatus === "pending"}
                className={`flex-1 h-14 font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 ${
                  !isValidAmount || txStatus === "pending"
                    ? "bg-app-accent/30 text-app-bg/60 cursor-not-allowed"
                    : txStatus === "success"
                    ? "bg-green-500 text-app-bg"
                    : txStatus === "error"
                    ? "bg-red-500 text-app-bg"
                    : "bg-app-accent hover:opacity-90 text-app-bg shadow-app-shadow active:scale-95"
                }`}
              >
                {txStatus === "pending" && <Loader2 size={18} className="animate-spin" />}
                {txStatus === "success" && <CheckCircle2 size={18} />}
                {txStatus === "error" && <AlertCircle size={18} />}
                <span>
                  {txStatus === "pending" ? "Processing..." : 
                   txStatus === "success" ? "Success!" :
                   txStatus === "error" ? "Failed" :
                   type === "ton_direct" ? "Send TON" : "Send & Convert"}
                </span>
              </button>
            </div>
          </div>

          {/* Convert Modal (appears inside DepositModal) */}
          {type === "stars" && userTonBalance > 0 && (
            <ConvertModal
              isOpen={isConvertOpen}
              onClose={() => setIsConvertOpen(false)}
              tonBalance={userTonBalance}
              tonPrice={tonPrice}
              telegramUser={telegramUser}
              onSuccess={(tonSpent, starsEarned) => {
                setUserTonBalance(prev => prev - tonSpent);
                setUserStarsBalance(prev => prev + starsEarned);
                setIsConvertOpen(false);
              }}
            />
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
```

---

## 📝 File 2: New ConvertModal.tsx

**Path:** `bluewave-frontend/components/ui/ConvertModal.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRightLeft, Loader2, CheckCircle2, AlertCircle, Zap } from "lucide-react";

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

  // Update stars preview when amount changes
  useEffect(() => {
    if (amount && tonPrice > 0) {
      const tonAmount = parseFloat(amount);
      const usdValue = tonAmount * tonPrice;
      const stars = Math.floor(usdValue / STAR_PRICE_USD);
      setStarsPreview(stars);
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

  const handleConvert = async () => {
    setConvertStatus("loading");
    setErrorMsg("");

    try {
      const response = await fetch("/api/user/convert_ton_to_stars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_id: telegramUser.id,
          ton_amount: parseFloat(amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setConvertStatus("error");
        setErrorMsg(data.error || "Conversion failed");
        return;
      }

      setConvertStatus("success");
      setTimeout(() => {
        onSuccess?.(data.ton_spent, data.stars_earned);
        setTimeout(() => {
          setAmount("");
          setConvertStatus("idle");
          onClose();
        }, 1000);
      }, 2000);
    } catch (err) {
      setConvertStatus("error");
      setErrorMsg("Network error - please try again");
    }
  };

  const minTonNeeded = (MIN_STARS * STAR_PRICE_USD) / tonPrice;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-app-bg/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-app-card border border-app-border rounded-[2.5rem] p-8 overflow-hidden shadow-app-shadow"
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-app-accent/10 blur-[80px] -z-10" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-app-accent/5 hover:bg-app-accent/10 text-app-accent transition-colors"
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
                  <h3 className="text-2xl font-black text-text-main uppercase tracking-tight">
                    Convert TON
                  </h3>
                  <p className="text-text-sub text-[11px] font-bold uppercase tracking-widest mt-1">
                    to Bluewave Stars
                  </p>
                </div>
              </div>

              {/* Current Balance Info */}
              <div className="bg-app-bg/50 border border-app-border rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-text-sub text-[10px] font-bold uppercase tracking-widest">Available TON</p>
                  <p className="text-text-main font-black text-lg mt-1">{tonBalance.toFixed(4)} TON</p>
                </div>
                <div className="text-right">
                  <p className="text-text-sub text-[10px] font-bold uppercase tracking-widest">USD Value</p>
                  <p className="text-text-main font-black text-lg mt-1">${(tonBalance * tonPrice).toFixed(2)}</p>
                </div>
              </div>

              {/* Amount Input */}
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
                    className="w-full bg-app-bg/50 border border-app-border rounded-xl px-4 py-3 text-text-main font-mono text-lg placeholder-text-main/40 focus:border-app-accent outline-none transition-colors"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <img src="/ton-transparent.png" alt="TON" className="w-5 h-5" />
                    <span className="text-text-main font-black text-sm">TON</span>
                  </div>
                </div>
              </div>

              {/* Min/Max Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setAmount(minTonNeeded.toFixed(4))}
                  className="flex-1 text-[9px] font-black uppercase tracking-widest py-2 px-3 rounded-lg bg-app-accent/10 border border-app-accent/30 text-app-accent hover:bg-app-accent/20 transition-colors"
                >
                  Min ({minTonNeeded.toFixed(4)} TON)
                </button>
                <button
                  onClick={() => setAmount(tonBalance.toFixed(4))}
                  className="flex-1 text-[9px] font-black uppercase tracking-widest py-2 px-3 rounded-lg bg-app-accent/10 border border-app-accent/30 text-app-accent hover:bg-app-accent/20 transition-colors"
                >
                  Max ({tonBalance.toFixed(4)} TON)
                </button>
              </div>

              {/* Preview */}
              {amount && tonPrice > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-app-accent/10 to-purple-500/10 border border-app-accent/20 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <img src="/ton-transparent.png" alt="TON" className="w-4 h-4" />
                      <span className="text-text-main font-black text-sm">{parseFloat(amount).toFixed(4)} TON</span>
                    </div>
                    <ArrowRightLeft size={16} className="text-app-accent" />
                    <div className="flex items-center gap-2">
                      <span className="text-app-accent font-black text-sm">{starsPreview:,} ⭐</span>
                    </div>
                  </div>
                  <div className="text-[9px] font-bold text-text-main/60 uppercase tracking-widest">
                    @ ${tonPrice.toFixed(2)}/TON = ${(parseFloat(amount) * tonPrice).toFixed(2)} USD
                  </div>
                  {starsPreview < MIN_STARS && amount && (
                    <div className="mt-2 flex items-center gap-1.5 text-amber-400">
                      <Zap size={12} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">
                        Below minimum {MIN_STARS} stars
                      </span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
                >
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <span className="text-red-400 text-[10px] font-bold">{errorMsg}</span>
                </motion.div>
              )}

              {/* Status Message */}
              {convertStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30"
                >
                  <CheckCircle2 size={16} className="text-green-400" />
                  <span className="text-green-400 text-[10px] font-bold uppercase tracking-widest">Conversion Successful!</span>
                </motion.div>
              )}

              {/* Convert Button */}
              <button
                onClick={handleConvert}
                disabled={!isValidAmount() || convertStatus !== "idle"}
                className={`w-full h-12 font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
                  !isValidAmount() || convertStatus !== "idle"
                    ? "bg-app-accent/30 text-app-bg/60 cursor-not-allowed"
                    : convertStatus === "success"
                    ? "bg-green-500 text-app-bg"
                    : "bg-app-accent hover:opacity-90 text-app-bg shadow-app-shadow active:scale-95"
                }`}
              >
                {convertStatus === "loading" && <Loader2 size={16} className="animate-spin" />}
                {convertStatus === "success" && <CheckCircle2 size={16} />}
                <span>
                  {convertStatus === "loading" ? "Converting..." :
                   convertStatus === "success" ? "Success!" :
                   "Convert to Stars"}
                </span>
              </button>

              {/* Help Text */}
              <p className="text-[9px] text-text-main/50 text-center font-bold uppercase tracking-widest">
                Conversion is instant and saves on blockchain fees
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

