"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, MoreVertical, Wallet, ArrowLeft, Eye, EyeOff, Copy, Check, Award, ShieldCheck, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/useApi";
import Settings from "./Settings";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import ClaimBoostPopup, { ClaimBoostData } from "./ClaimBoostPopup";
import VerifiedHumanRing from "./VerifiedHumanRing";

// [CODE: FRONTEND_PROFILE_TYPES]
interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
  onOpenRoles: (roleName: string) => void;
}

// [CODE: FRONTEND_PROFILE_MAIN_COMPONENT]
export default function Profile({ isOpen, onClose, telegramUser, onOpenRoles }: ProfileProps) {
  const { t } = useLanguage();

  // Use passed telegramUser for immediate UI if available
  const [user, setUser] = useState<any>(telegramUser || null);
  const [loading, setLoading] = useState(!telegramUser);
  const [error, setError] = useState("");
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cooldown, setCooldown] = useState<number | null>(null);
  const [cooldownText, setCooldownText] = useState("00:00:00");
  const [claiming, setClaiming] = useState(false);
  const [badgeUnlocked, setBadgeUnlocked] = useState(false);
  const [claimDone, setClaimDone] = useState(false);
  const [isClaimBoostOpen, setIsClaimBoostOpen] = useState(false);
  const [claimBoostData, setClaimBoostData] = useState<ClaimBoostData | null>(null);

  // Settings overlay states
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [showId, setShowId] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  // [CODE: FRONTEND_TELEGRAM_ID_MANAGEMENT]
  const [telegramId, setTelegramId] = useState<number | null>(telegramUser?.id || null);

  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  useEffect(() => {
    if (walletAddress && telegramId) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      fetch(`${apiBase}/api/user/update_profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tg_id: telegramId,
          wallet_address: walletAddress
        })
      }).catch(err => console.error("Wallet sync error:", err));
    }
  }, [walletAddress, telegramId]);

  useEffect(() => {
    if (!telegramId) {
      const stored = localStorage.getItem("bw_tg_id");
      if (stored) {
        setTelegramId(Number(stored));
      }
    }
  }, [telegramId]);

  const { data: swrUser, error: swrError, loading: swrLoading, mutate } =
    useApi(telegramId ? `/user/${telegramId}` : null);

  useEffect(() => {
    if (telegramId && isOpen) mutate();
  }, [telegramId, isOpen]);

  useEffect(() => {
    if (swrUser) {
      const mergedUser = {
        ...swrUser,
        photo_url: telegramUser?.photo_url || swrUser.photo_url
      };
      setUser(mergedUser);
      setLoading(false);
      setError("");
    }
    if (swrError && !swrUser && !swrLoading && !user) {
      const timeout = setTimeout(() => {
        if (!swrUser && !user) setError("Could not load profile");
      }, 800);
      setLoading(false);
      return () => clearTimeout(timeout);
    }
  }, [swrUser, swrError, swrLoading, user]);

  useEffect(() => {
    if (isOpen && telegramId) {
      loadCooldown();
    }
  }, [isOpen, telegramId]);

  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    const handler = () => {
      setBadgeUnlocked(true);
      setTimeout(() => setBadgeUnlocked(false), 3000);
    };
    window.addEventListener("badgeUnlocked", handler);
    return () => window.removeEventListener("badgeUnlocked", handler);
  }, []);

  const [level, setLevel] = useState("Loading...");
  useEffect(() => {
    if (swrUser?.level) {
      setLevel(swrUser.level);
    }
  }, [swrUser?.level]);

  useEffect(() => {
    if (cooldown === null) return;
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (!prev || prev <= 1000) {
          setCooldown(null);
          return null;
        }
        const next = prev - 1000;
        const h = String(Math.floor(next / 3600000)).padStart(2, "0");
        const m = String(Math.floor((next % 3600000) / 60000)).padStart(2, "0");
        const s = String(Math.floor((next % 60000) / 1000)).padStart(2, "0");
        setCooldownText(`${h}:${m}:${s}`);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleClaim = async () => {
    if (claiming) return;
    setClaiming(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/claim_referral`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id: telegramId }),
    });
    const result = await res.json();
    if (result.claimed) {
      setClaimBoostData({
        base_claimed: result.base_claimed,
        multiplier: result.multiplier,
        total_claimed: result.total_claimed,
        applied_roles: result.applied_roles || []
      });
      setIsClaimBoostOpen(true);
      setUser((prev: any) => ({
        ...prev,
        referral_earnings_pending: 0,
        points_balance: result.new_balance,
      }));
      mutate();
      setClaimDone(true);
      setTimeout(() => {
        setClaimDone(false);
        setClaiming(false);
      }, 2000);
    } else {
      setClaiming(false);
    }
  };

  async function loadCooldown() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notify_usage/${telegramId}`);
    const data = await res.json();
    if (!data.last_sent) {
      setCooldown(null);
      return;
    }
    const lastSent = new Date(data.last_sent).getTime();
    const now = Date.now();
    const cooldownMs = 4 * 60 * 60 * 1000;
    const remaining = lastSent + cooldownMs - now;
    if (remaining > 0) setCooldown(remaining);
    else setCooldown(null);
  }

  const handleNotifyInactive = async () => {
    if (cooldown !== null || notifying) return;
    setNotifying(true);
    setCooldownText("Notifying...");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notify_inactive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id: telegramId }),
      });
      const cooldownMs = 4 * 60 * 60 * 1000;
      setCooldown(cooldownMs);
    } catch (e) {
      console.error("Notify error:", e);
    } finally {
      setNotifying(false);
    }
  };

  const isVerifiedHuman = user?.roles?.includes("Verified Human");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-xl flex flex-col overflow-y-auto text-cyan-200 
                     pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header Bar */}
          <div className="flex justify-between items-center p-6 sticky top-0 z-50 bg-transparent pointer-events-none">
            <button onClick={onClose} className="group pointer-events-auto">
              <div className="p-2 rounded-full bg-cyan-950/30 group-hover:bg-cyan-900/50 transition-colors border border-cyan-900/50 shadow-[0_0_15px_-5px_#22d3ee]">
                <ArrowLeft size={20} className="text-cyan-400 group-hover:text-cyan-200" />
              </div>
            </button>
            <button onClick={() => setSettingsOpen(true)} className="group pointer-events-auto">
              <div className="p-2 rounded-full bg-cyan-950/30 group-hover:bg-cyan-900/50 transition-colors border border-cyan-900/50 shadow-[0_0_15px_-5px_#22d3ee]">
                <MoreVertical size={20} className="text-cyan-400 group-hover:text-cyan-200" />
              </div>
            </button>
          </div>

          <div className="max-w-md mx-auto w-full p-6 pb-24">
            {loading && !user && <div className="space-y-3 animate-pulse"><div className="w-24 h-24 rounded-full bg-cyan-900/30" /></div>}

            {user && (
              <div className="flex flex-col gap-6">
                {/* Header Card */}
                <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/20 rounded-[2rem] p-5 shadow-[0_0_30px_#00e6ff05] flex flex-col items-center gap-5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-50"></div>

                  {/* Avatar Section */}
                  <div className="relative">
                    {isVerifiedHuman ? (
                      <VerifiedHumanRing size="lg">
                        <img
                          src={user.photo_url || "https://ui-avatars.com/api/?name=" + (user.name || user.username || "U") + "&background=0f172a&color=22d3ee&bold=true"}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      </VerifiedHumanRing>
                    ) : (
                      <div className="w-24 h-24 rounded-full border-2 border-cyan-400/30 shadow-[0_0_20px_#00e6ff30] overflow-hidden">
                        <img
                          src={user.photo_url || "https://ui-avatars.com/api/?name=" + (user.name || user.username || "U") + "&background=0f172a&color=22d3ee&bold=true"}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <h2 className="text-cyan-50 font-black text-2xl uppercase tracking-tighter mb-1">
                      {user.first_name || user.name || user.username}
                    </h2>

                    <div className="flex items-center gap-2 mb-4">
                      {isVerifiedHuman && (
                        <button 
                          onClick={() => onOpenRoles("Verified Human")}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 active:scale-95 transition-all"
                        >
                          <UserCheck size={12} className="text-cyan-400" />
                          <span className="text-[9px] font-black uppercase text-cyan-400 tracking-widest">Verified Human</span>
                        </button>
                      )}
                      <div className="px-3 py-1 bg-cyan-500/5 border border-cyan-400/20 rounded-lg flex items-center gap-2">
                        <span className="text-cyan-500/80 font-black text-[10px] uppercase font-mono tracking-tight">
                          BW ID: {showId ? user.bw_id : `${user.bw_id?.slice(0, 5)}***`}
                        </span>
                        <button onClick={() => setShowId(!showId)} className="text-cyan-500/40 hover:text-cyan-400">
                          {showId ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {user.roles?.map((role: string) => (
                        role !== "Verified Human" && (
                          <button 
                            key={role} 
                            onClick={() => onOpenRoles(role)}
                            className="px-3 py-1 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 active:scale-95 transition-all"
                          >
                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{role}</span>
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                    <div className="text-cyan-50 text-2xl font-black leading-none">{user.streak_days}</div>
                    <div className="text-cyan-500/60 text-[10px] font-black uppercase tracking-[0.2em]">{t("profile.streak")}</div>
                  </div>
                  <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                    <div className="text-cyan-50 text-2xl font-black leading-none">{user.total_referrals || 0}</div>
                    <div className="text-cyan-500/60 text-[10px] font-black uppercase tracking-[0.2em]">{t("profile.total_networks")}</div>
                  </div>
                </div>

                {/* Wallet Card - HIDDEN (Not yet ready) */}
                {/* 
                <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-2xl p-1.5 flex items-center shadow-lg">
                  <div className="p-4 bg-cyan-500/5 rounded-2xl shrink-0"><Wallet className="w-6 h-6 text-cyan-400" /></div>
                  <div className="flex-1 px-4 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-cyan-100 font-extrabold text-xs uppercase tracking-wider">{walletAddress ? t("profile.wallet_connected") : t("profile.connect_wallet")}</span>
                      {walletAddress && <span className="text-cyan-500/50 font-mono text-[9px] truncate max-w-[140px]">{walletAddress}</span>}
                    </div>
                  </div>
                </div>
                */}

                {/* Earnings Card */}
                <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-3xl p-5 flex flex-col gap-4">
                  <h3 className="text-cyan-500/70 text-[11px] font-black uppercase tracking-widest">{t("profile.network_earnings")}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-cyan-50 text-3xl font-black">{user.referral_earnings_pending}</span>
                    <span className="text-cyan-500/80 text-xs font-black tracking-widest">$BWAVE</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleClaim} disabled={claiming || user.referral_earnings_pending === 0} className="flex-1 py-3 text-cyan-400 font-black border border-cyan-500/30 rounded-xl uppercase text-xs">
                      {claiming ? t("profile.claiming") : t("profile.claim")}
                    </button>
                    <button onClick={handleNotifyInactive} disabled={notifying || cooldown !== null} className="flex-1 py-3 text-cyan-500/50 font-black border border-cyan-500/10 rounded-xl uppercase text-xs">
                      {cooldown !== null ? cooldownText : t("profile.notify_inactive")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} onOpenLanguage={() => setLanguageOpen(true)} />
          <LanguageSelector isOpen={languageOpen} onClose={() => setLanguageOpen(false)} />
          <ClaimBoostPopup isOpen={isClaimBoostOpen} data={claimBoostData} onClose={() => setIsClaimBoostOpen(false)} />

          <AnimatePresence>
            {badgeUnlocked && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-cyan-500 text-black px-6 py-2 rounded-full font-black uppercase text-xs shadow-glow">
                {t("profile.badge_unlocked")}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
