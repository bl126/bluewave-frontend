"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, Loader2, CheckCircle2, AlertCircle, Zap, ChevronRight, RefreshCw, Wallet, ArrowRightLeft } from "lucide-react";
import { useTonConnectUI, useTonAddress, toUserFriendlyAddress } from "@tonconnect/ui-react";
import { createPortal } from "react-dom";
import { postApi, getApi } from "@/lib/useApi";
import { beginCell } from "@ton/core";
import ConvertModal from "./ConvertModal";
import {
  fetchTonPriceUsd,
  getCachedTonPriceUsd,
  isTonPriceCacheFresh,
} from "@/lib/tonPriceCache";


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

const friendlyToRaw = (address: string): string => {
  try {
    if (address.includes(":")) return address.toLowerCase().trim();
    const base64 = address.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const workchain = binary.charCodeAt(1);
    const wc = workchain === 255 ? -1 : workchain;
    let hex = "";
    for (let i = 2; i < 34; i++) {
      hex += binary.charCodeAt(i).toString(16).padStart(2, "0");
    }
    return `${wc}:${hex}`.toLowerCase();
  } catch {
    return address.toLowerCase().trim();
  }
};

const isSameAddress = (addr1: string, addr2: string) => {
  if (!addr1 || !addr2) return false;
  return friendlyToRaw(addr1) === friendlyToRaw(addr2);
};

const StarIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);

// ─── Types ───────────────────────────────────────────────────────────────────
type DepositType = "ton_direct" | "ton" | "stars";
type TxStatus = "idle" | "pending" | "success" | "error";

interface DepositModalProps {
  type: DepositType;
  telegramUser: any;
  onClose: () => void;
  onSuccess?: (tonAmount?: number, starsAmount?: number) => void;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function DepositModal({ type, telegramUser, onClose, onSuccess }: DepositModalProps) {
  const [tonConnectUI] = useTonConnectUI();
  const walletAddress = useTonAddress();
  const dragControls = useDragControls();

  const [tonPrice, setTonPrice] = useState<number>(() => getCachedTonPriceUsd());
  const [priceRefreshing, setPriceRefreshing] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [useCustom, setUseCustom] = useState(true);
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [depositNotice, setDepositNotice] = useState<string | null>(null);

  // Live Wallet Balance states
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // User app balances (ton_balance, stars_balance)
  const [userTonBalance, setUserTonBalance] = useState<number>(() => {
    const fromProp = parseFloat(String(telegramUser?.ton_balance ?? 0));
    return Number.isFinite(fromProp) ? fromProp : 0;
  });
  const [isConvertOpen, setIsConvertOpen] = useState(false);

  // ─── Fetch Live TON Price ────────────────────────────────────────────────
  const fetchPrice = useCallback(async (silent = false) => {
    if (!silent) setPriceRefreshing(true);
    try {
      const price = await fetchTonPriceUsd();
      if (price > 0) setTonPrice(price);
    } catch {
      const cached = getCachedTonPriceUsd();
      if (cached > 0) setTonPrice(cached);
    } finally {
      setPriceRefreshing(false);
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
      console.warn("[TON TOPUP] Toncenter v3 fetch failed, trying Tonapi...", e);
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
      console.warn("[TON TOPUP] Tonapi fetch failed", e);
    }
    setBalanceLoading(false);
  }, []);

  useEffect(() => {
    if (!isTonPriceCacheFresh()) fetchPrice(true);
    else fetchPrice(true);
    const interval = setInterval(() => fetchPrice(true), 300_000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  const priceReady = tonPrice > 0;

  // Fetch fresh in-app TON balance for Buy Stars modal (GET only — POST was failing silently)
  useEffect(() => {
    if (type !== "stars") return;
    const tid = telegramUser?.id ?? telegramUser?.tg_id;
    if (!tid) return;

    getApi(`/user/${tid}`)
      .then((res: any) => {
        if (res?.error) return;
        const bal = parseFloat(res.ton_balance ?? 0);
        if (Number.isFinite(bal)) setUserTonBalance(bal);
      })
      .catch(() => {});
  }, [telegramUser?.id, telegramUser?.tg_id, telegramUser?.ton_balance, type]);

  // DB registered wallet check
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

  // Presets for Stars package (badge tag removed completely per user request)
  const PRESETS = tonPrice > 0 ? [
    { ton: minTon },
    { ton: Math.ceil(minTon * 5  * 10) / 10 },
    { ton: Math.ceil(minTon * 10 * 10) / 10 },
    { ton: Math.ceil(minTon * 25 * 10) / 10 },
  ].map(p => ({ ...p, ton: Math.round(p.ton * 100) / 100 }))
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

  const depositToken = telegramUser?.deposit_token || "";
  const isTopupBlocked = isWalletMismatch || !dbWallet || !depositToken;
  const isCtaDisabled =
    txStatus === "pending" ||
    txStatus === "success" ||
    isTopupBlocked ||
    !priceReady ||
    priceRefreshing ||
    (isWalletConnected && !isValidAmount);

  const modalTitle = type === "ton" || type === "ton_direct" ? "Topup Gram" : "Buy Stars";
  
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

  const pollBalanceAfterDeposit = async (
    tid: number,
    beforeTon: number,
    beforeStars: number,
    expectedTon?: number,
    expectedStars?: number
  ): Promise<boolean> => {
    const maxAttempts = 20;
    const intervalMs = 3000;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, intervalMs));
      try {
        const res = await getApi(`/user/${tid}`);
        if (res?.error) continue;
        const ton = parseFloat(res.ton_balance ?? 0);
        const stars = Number(res.stars_balance ?? 0);
        const tonOk = expectedTon != null ? ton >= beforeTon + expectedTon - 0.0001 : ton > beforeTon;
        const starsOk = expectedStars != null ? stars >= beforeStars + expectedStars : stars > beforeStars;
        if (type === "ton_direct" || type === "ton") {
          if (tonOk) return true;
        } else if (starsOk) {
          return true;
        }
      } catch {
        /* retry */
      }
    }
    return false;
  };

  const handleTopup = async () => {
    if (isWalletMismatch) return;
    if (!walletAddress) { tonConnectUI.openModal(); return; }
    if (!dbWallet) return;
    if (!depositToken) return;
    if (!isValidAmount || txStatus === "pending") return;

    setDepositNotice(null);
    setTxStatus("pending");
    const tid = telegramUser?.id ?? telegramUser?.tg_id;
    const beforeTon = userTonBalance;
    const beforeStars = Number(telegramUser?.stars_balance ?? 0);

    try {
      const tgId = telegramUser?.id || 0;
      const bwId = telegramUser?.bw_id || "";
      const mode = type === "ton_direct" ? "ton_direct" : "buy_stars";
      // token = secret UUID from DB; attacker cannot guess tg_id+bw_id alone
      const commentPayload = `tg_id:${tgId}|bw_id:${bwId}|token:${depositToken.toLowerCase()}|mode:${mode}`;

      // Encode as TON text comment cell and serialize to Base64 Bag of Cells (BoC)
      const cell = beginCell()
        .storeUint(0, 32) // opcode 0x00000000 prefix for text comments
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
      if (walletAddress) fetchWalletBalance(walletAddress);

      const credited = tid
        ? await pollBalanceAfterDeposit(
            Number(tid),
            beforeTon,
            beforeStars,
            type === "ton_direct" || type === "ton" ? activeTon : undefined,
            type === "stars" ? starsToReceive : undefined
          )
        : false;

      if (credited) {
        if (type === "ton_direct" || type === "ton") {
          onSuccess?.(activeTon, undefined);
        } else {
          onSuccess?.(undefined, starsToReceive);
        }
        onClose();
      } else {
        setTxStatus("idle");
        setDepositNotice(
          "Payment sent. Balance may take up to a minute to update. Pull to refresh your profile if it does not appear."
        );
      }
    } catch (err: any) {
      if (err?.message?.includes("User rejected")) setTxStatus("idle");
      else { setTxStatus("error"); setTimeout(() => setTxStatus("idle"), 3000); }
    }
  };

  const blockOutsideDismiss = txStatus === "pending" || txStatus === "success";

  const tryDismiss = () => {
    if (blockOutsideDismiss) return;
    onClose();
  };

  useEffect(() => {
    const handleNativeBack = (e: Event) => {
      if (blockOutsideDismiss) return;
      e.preventDefault();
      onClose();
    };
    window.addEventListener("bwNativeBack", handleNativeBack, true);
    return () => window.removeEventListener("bwNativeBack", handleNativeBack, true);
  }, [onClose, blockOutsideDismiss]);

  const portal = createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[990] pointer-events-auto">
        {/* Full-screen shield — blocks taps on Explore / nav behind modal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={tryDismiss}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute inset-0 z-0 bg-app-bg/75 backdrop-blur-md cursor-default"
        />

        {/* Sheet */}
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
          onDragEnd={(_, info) => {
            if (blockOutsideDismiss) return;
            if (info.offset.y > 100) tryDismiss();
          }}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 z-10 bg-app-card border-t border-app-border rounded-t-[2.5rem] flex flex-col max-h-[90vh] shadow-app-shadow w-full pointer-events-auto backdrop-blur-2xl"
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
                {priceReady ? (
                  <>
                    <span className="text-text-sub text-[11px] uppercase font-bold tracking-wide">
                      1 Gram = ${tonPrice.toFixed(3)}
                      {priceRefreshing ? " · updating…" : ""}
                    </span>
                    <button onClick={() => fetchPrice(false)} className="text-text-sub hover:text-app-accent transition-colors">
                      <RefreshCw size={10} className={priceRefreshing ? "animate-spin" : ""} />
                    </button>
                  </>
                ) : (
                  <span className="text-amber-400 text-[11px] uppercase font-bold tracking-wide animate-pulse">
                    Updating live rate…
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content Wrapper */}
          <div className="flex-1 overflow-y-auto px-8 pb-6 custom-scrollbar flex flex-col gap-5">
            {/* Wallet connection status row */}
            <div className="flex items-center justify-between text-xs font-bold shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-app-accent/10 flex items-center justify-center border border-app-border">
                  <img src="/gram icon.png" alt="Gram" className="w-3.5 h-3.5 object-contain" />
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

            {/* Wallet mismatch warning banner (high visibility, clean) */}
            {!depositToken && (
              <p className="text-[10px] text-amber-400/90 font-medium px-1 mb-2">
                Deposit security token missing. Close and reopen the app to refresh your session.
              </p>
            )}
            {!dbWallet && walletAddress && (
              <p className="text-[10px] text-amber-400/90 font-medium px-1 mb-2">
                Syncing wallet to your account… wait a moment, then try again.
              </p>
            )}
            {depositNotice && (
              <p className="text-[10px] text-cyan-400/90 font-medium px-1 mb-2">{depositNotice}</p>
            )}
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

            {/* ─── Mode 1: DIRECT TON TOPUP UI (ton_direct or ton) ─── */}
            {(type === "ton" || type === "ton_direct") && (
              <div className="flex flex-col gap-4">
                {/* Wallet balance & input box */}
                <div className="bg-app-bg/30 border border-app-border rounded-2xl p-5 flex flex-col gap-4">
                  {/* Header: Available Balance & Half/Max */}
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

                  {/* Input Row: Large amount & TON pill */}
                  <div className="flex items-center justify-between gap-4">
                    <input
                      type="number"
                      placeholder="0.0"
                      value={customAmount}
                      disabled={isWalletMismatch}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedPreset(null);
                      }}
                      className="bg-transparent border-none outline-none text-text-main font-black text-3xl placeholder-text-main/20 w-full min-w-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-app-accent/10 border border-app-border/50 select-none shrink-0">
                      <img src="/gram icon.png" alt="Gram" className="w-4 h-4 object-contain" />
                      <span className="text-text-main font-black text-xs tracking-tight">Gram</span>
                    </div>
                  </div>

                  {/* Footer: USD Conversion & "Toncoin" text */}
                  <div className="flex items-center justify-between text-[10px] font-black text-text-main uppercase tracking-widest">
                    <span className="text-text-main font-bold">
                      {customAmount && tonPrice > 0 ? (
                        `$${(parseFloat(customAmount) * tonPrice || 0).toFixed(4)}`
                      ) : (
                        "$0.0000"
                      )}
                    </span>
                    <span className="text-text-main/60">Gram</span>
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
                          disabled={isWalletMismatch}
                          onClick={() => {
                            setCustomAmount(String(presetVal));
                            setSelectedPreset(presetVal);
                          }}
                          className={`py-2.5 rounded-xl border text-xs font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                            isSelected
                              ? "bg-app-accent/20 border-app-accent text-app-accent shadow-[0_0_12px_rgba(0,246,255,0.15)]"
                              : "bg-app-accent/5 border-app-border/50 text-text-main hover:border-app-accent/55"
                          }`}
                        >
                          {presetVal} Gram
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
                  <p className="text-text-main text-[10px] font-black uppercase tracking-widest leading-none">
                    Minimum Purchase: <span className="text-app-accent font-black">{MIN_STARS} Stars</span>
                    {tonPrice > 0 && <span className="text-text-main/70"> · ≈ {minTon} Gram (${(minTon * tonPrice).toFixed(2)})</span>}
                  </p>
                </div>

                {/* Stars presets */}
                {!priceReady ? (
                  <div className="rounded-2xl border border-app-border bg-app-accent/5 px-4 py-6 text-center">
                    <p className="text-readable-sm">Loading live rates…</p>
                    <p className="text-readable-muted mt-1">Top-up unlocks when the rate is ready</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] font-bold text-text-main uppercase tracking-[0.2em] mb-2">Select Stars Amount</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {PRESETS.map((preset, idx) => {
                        const isSelected = !useCustom && selectedPreset === idx;
                        const s = calcStars(preset.ton, tonPrice);
                        const usd = preset.ton * tonPrice;
                        return (
                          <button 
                            key={idx}
                            disabled={isWalletMismatch}
                            onClick={() => {
                              setSelectedPreset(idx);
                              setUseCustom(false);
                              setCustomAmount("");
                            }}
                            className={`relative flex flex-col p-3.5 rounded-2xl border transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed ${
                              isSelected
                                ? "bg-app-accent/15 border-app-accent shadow-[0_0_15px_rgba(0,246,255,0.15)] text-app-accent"
                                : "bg-app-accent/5 border-app-border hover:border-app-accent/50 text-text-main"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <img src="/gram icon.png" alt="Gram" className="w-3.5 h-3.5 object-contain" />
                              <span className="font-black text-sm text-text-main">{preset.ton} Gram</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-black text-text-main">
                              <StarIcon size={10} />
                              <span>{s.toLocaleString()} Stars</span>
                            </div>
                            <span className="text-[10px] text-text-main/80 font-mono mt-0.5">${usd.toFixed(2)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom Amount */}
                <div>
                  <p className="text-[10px] font-bold text-text-main uppercase tracking-[0.2em] mb-2">Custom TON Amount</p>
                  <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                    useCustom && customAmount ? "border-app-accent bg-app-accent/5" : "border-app-border bg-app-accent/5"
                  }`}>
                    <img src="/gram icon.png" alt="Gram" className="w-5 h-5 object-contain shrink-0" />
                    <input
                      type="number"
                      min={minTon}
                      step="0.1"
                      placeholder={`Min ${minTon} Gram`}
                      value={customAmount}
                      disabled={isWalletMismatch}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setUseCustom(true);
                        setSelectedPreset(null);
                      }}
                      onFocus={() => {
                        setUseCustom(true);
                        setSelectedPreset(null);
                      }}
                      className="flex-1 bg-transparent border-none outline-none text-text-main font-bold text-sm placeholder-text-main/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    {useCustom && tonPrice > 0 && activeTon > 0 && (
                      <span className="text-text-main font-mono shrink-0">${usdValue.toFixed(2)}</span>
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
                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-main/70">You send</span>
                            <div className="flex items-center gap-1.5">
                              <img src="/gram icon.png" alt="Gram" className="w-4 h-4 object-contain" />
                              <span className="text-text-main font-black text-base">{activeTon} Gram</span>
                            </div>
                            <span className="text-text-main/90 text-[9px] font-mono">≈ ${usdValue.toFixed(2)} USD</span>
                          </div>
                          <ChevronRight size={16} className="text-text-main/30" />
                          <div className="flex flex-col gap-0.5 items-end">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-main/70">You receive</span>
                            <div className="flex items-center gap-1">
                              <span className="text-app-accent font-black text-base">{starsToReceive.toLocaleString()}</span>
                              <span className="text-app-accent"><StarIcon size={14} /></span>
                            </div>
                            <span className="text-text-main/90 text-[9px] font-mono">≈ ${(starsToReceive * STAR_PRICE_USD).toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertCircle size={14} className="text-red-400 shrink-0" />
                          <p className="text-red-400 text-xs font-bold">
                            Below minimum — need at least {MIN_STARS} Stars ({minTon} Gram)
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* ─── Convert button: only in stars mode when user has TON balance ─── */}
                {type === "stars" && userTonBalance > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setIsConvertOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-app-accent/10 to-purple-500/10 border border-app-accent/30 hover:border-app-accent/60 text-app-accent font-black uppercase tracking-widest text-[11px] transition-all active:scale-95"
                  >
                    <ArrowRightLeft size={14} />
                    Convert {userTonBalance.toFixed(4)} Gram → Stars
                  </motion.button>
                )}

              </div>
            )}

            {/* Action Area & CTA */}
            <div className="mt-2 flex flex-col gap-3 shrink-0">
              <motion.button
                whileTap={isCtaDisabled ? undefined : { scale: 0.97 }}
                onClick={handleTopup}
                disabled={isCtaDisabled}
                className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all shadow-lg ${
                  txStatus === "success" ? "bg-emerald-500 text-white"
                  : txStatus === "error"  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : isTopupBlocked        ? "bg-app-accent/5 border border-amber-500/30 text-amber-400/70 cursor-not-allowed"
                  : !isWalletConnected    ? "bg-app-accent text-app-bg shadow-[0_0_20px_rgba(0,246,255,0.2)]"
                  : !isValidAmount        ? "bg-app-accent/5 border border-app-border text-text-main/40 cursor-not-allowed"
                  : "bg-app-accent text-app-bg shadow-[0_0_25px_rgba(0,246,255,0.25)] hover:opacity-90"
                }`}
              >
                {txStatus === "pending" && <Loader2 size={16} className="animate-spin" />}
                {txStatus === "success"  && <CheckCircle2 size={16} />}
                {txStatus === "error"    && <AlertCircle size={16} />}
                
                {txStatus === "idle" && (
                  isTopupBlocked ? "Connect Registered Wallet"
                  : !isWalletConnected ? "Connect Wallet to Topup"
                  : !isValidAmount ? (
                      type === "ton" || type === "ton_direct" ? "Enter Gram Amount" : `Min ${MIN_STARS} Stars (${minTon} Gram)`
                    )
                  : (
                      type === "ton" || type === "ton_direct" ? `Topup ${activeTon} Gram` : `Purchase ${starsToReceive.toLocaleString()} Stars`
                    )
                )}
                {txStatus === "pending" && "Waiting for Signature…"}
                {txStatus === "success" && (
                  type === "ton" || type === "ton_direct" ? "Topup Sent Successfully! 🎉" : `+${starsToReceive.toLocaleString()} Stars Incoming! 🎉`
                )}
                {txStatus === "error"   && "Transaction Failed — Try Again"}
              </motion.button>

              <p className="text-center text-[10px] text-text-main/60 font-bold uppercase tracking-wider leading-normal">
                {type === "ton" || type === "ton_direct" ? (
                  "Gram credited to your in-app balance within ~30s after blockchain confirmation."
                ) : (
                  `Stars credited within ~30s after blockchain confirmation. Rate: $0.013/Star · Min ${MIN_STARS} Stars`
                )}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );

  // ConvertModal rendered separately (not inside the portal, to avoid z-index stacking)
  return (
    <>
      {portal}
      {type === "stars" && (
        <ConvertModal
          isOpen={isConvertOpen}
          onClose={() => setIsConvertOpen(false)}
          tonBalance={userTonBalance}
          tonPrice={tonPrice}
          telegramUser={telegramUser}
          onSuccess={(tonSpent, starsEarned) => {
            const newTon = Math.max(0, userTonBalance - tonSpent);
            const newStars = (telegramUser?.stars_balance || 0) + starsEarned;
            setUserTonBalance(newTon);
            setIsConvertOpen(false);
            window.dispatchEvent(
              new CustomEvent("updateUser", {
                detail: { ton_balance: newTon, stars_balance: newStars },
              })
            );
            onSuccess?.(undefined, starsEarned);
          }}
        />
      )}
    </>
  );
}
