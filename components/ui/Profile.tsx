"use client";

import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, MoreVertical, Wallet, ArrowLeft, Eye, EyeOff, Copy, Check, Award, ShieldCheck, UserCheck, Flame, Info, Lock, Plus } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useApi, getApi, postApi } from "@/lib/useApi";
import Settings from "./Settings";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTonAddress, useTonConnectUI, TonConnectButton, toUserFriendlyAddress } from "@tonconnect/ui-react";
import ClaimBoostPopup, { ClaimBoostData } from "./ClaimBoostPopup";
import { findRoleByName } from "@/lib/roles";
import ReferralShareModal from "@/components/ui/ReferralShareModal";
import LevelPopup from "./LevelPopup";
import LevelUpModal from "./LevelUpModal";
import ConnectBluModal from "./ConnectBluModal";
import NetworkPopup from "./NetworkPopup";

// [CODE: FRONTEND_PROFILE_TYPES]
interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
  onOpenRoles: (roleName: string) => void;
  onOpenBwaveScan?: () => void;
  onOpenEcosystemRoles?: () => void;
  onOpenBugsSuggestions?: () => void;
  onOverlayStateChange?: (isActive: boolean) => void;
}

// [CODE: FRONTEND_PROFILE_MAIN_COMPONENT]
export default function Profile({ isOpen, onClose, telegramUser, onOpenRoles, onOpenBwaveScan, onOpenEcosystemRoles, onOpenBugsSuggestions, onOverlayStateChange }: ProfileProps) {
  const { t, language } = useLanguage();

  // Tab State
  type TabId = "bio" | "roles" | "drops";
  const [activeTab, setActiveTab] = useState<TabId>("bio");

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
  const [showEarnings, setShowEarnings] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isLevelPopupOpen, setIsLevelPopupOpen] = useState(false);
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);
  const [isConnectBluOpen, setIsConnectBluOpen] = useState(false);
  const [isNetworkPopupOpen, setIsNetworkPopupOpen] = useState(false);
  const [prevLevel, setPrevLevel] = useState<number | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuDragControls = useDragControls();

  // Stack registration
  useEffect(() => {
    if (!menuOpen) return;
    if (typeof window !== "undefined") {
      (window as any).bwActiveSheets = (window as any).bwActiveSheets || [];
      (window as any).bwActiveSheets.push("profile_menu");
    }
    return () => {
      if (typeof window !== "undefined") {
        (window as any).bwActiveSheets = ((window as any).bwActiveSheets || []).filter(
          (id: string) => id !== "profile_menu"
        );
      }
    };
  }, [menuOpen]);

  // Back listener
  useEffect(() => {
    if (!menuOpen) return;
    const handleNativeBack = (e: Event) => {
      const activeSheets = (window as any).bwActiveSheets || [];
      if (activeSheets[activeSheets.length - 1] === "profile_menu") {
        e.preventDefault();
        setMenuOpen(false);
      }
    };
    window.addEventListener("bwNativeBack", handleNativeBack);
    return () => window.removeEventListener("bwNativeBack", handleNativeBack);
  }, [menuOpen]);

  // [CODE: FRONTEND_TELEGRAM_ID_MANAGEMENT]
  const [telegramId, setTelegramId] = useState<number | null>(telegramUser?.id || null);

  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  useEffect(() => {
    if (!tonConnectUI || !telegramId) return;

    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet?.account?.address && telegramId) {
        let friendlyAddress: string;
        try {
          friendlyAddress = toUserFriendlyAddress(wallet.account.address);
        } catch {
          friendlyAddress = wallet.account.address;
        }
        postApi(`/user/update_profile`, {
          tg_id: telegramId,
          wallet_address: friendlyAddress
        }).then((res) => {
          if (res?.ton_explorer_pending) {
            window.dispatchEvent(new CustomEvent('showTONExplorer'));
          }
          // ⭐ Trigger Recovery Password if not set
          const user = res.user || res;
          if (user && !user.recovery_password_hash) {
            window.dispatchEvent(new CustomEvent('showRecoveryPassword'));
          }
          
          // 🔥 Update Global State
          if (res.user) {
            window.dispatchEvent(new CustomEvent('updateUser', { detail: res.user }));
          }

          mutate();
        }).catch(err => console.error("Wallet sync error:", err));
      }
    });

    return () => unsubscribe();
  }, [tonConnectUI, telegramId]);

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
    // Force revalidation on open — bypasses SWR dedup window for instant fresh data
    if (telegramId && isOpen) mutate(undefined, { revalidate: true });
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
  }, [swrUser]);

  useEffect(() => {
    if (telegramUser) {
      if (telegramUser.id && telegramUser.id !== telegramId) {
        setTelegramId(telegramUser.id);
      }
      setUser((prev: any) => {
        if (!prev || prev.wallet_address !== telegramUser.wallet_address || prev.points_balance !== telegramUser.points_balance) {
          return { ...prev, ...telegramUser };
        }
        return prev;
      });
      setLoading(false);
    }
  }, [telegramUser, telegramId]);

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

  const [level, setLevel] = useState("1");
  useEffect(() => {
    if (swrUser?.level) {
      const currentLevel = parseInt(swrUser.level);
      setLevel(swrUser.level);
      if (prevLevel !== null && currentLevel > prevLevel) {
        setIsLevelUpModalOpen(true);
      }
      setPrevLevel(currentLevel);
    }
  }, [swrUser?.level]);

  const formatMs = (ms: number) => {
    const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
    const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const cooldownRef = useRef<number | null>(null);
  useEffect(() => {
    if (cooldown === null) return;
    setCooldownText(formatMs(cooldown));
    cooldownRef.current = cooldown;
    const interval = setInterval(() => {
      const prev = cooldownRef.current;
      if (!prev || prev <= 1000) {
        setCooldown(null);
        clearInterval(interval);
        return;
      }
      const next = prev - 1000;
      cooldownRef.current = next;
      setCooldown(next);
      setCooldownText(formatMs(next));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown !== null]);

  const handleClaim = async () => {
    if (claiming) return;
    setClaiming(true);
    const result = await postApi(`/claim_referral`, { telegram_id: telegramId });
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
    const data = await getApi(`/notify_usage/${telegramId}`);
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
    try {
      const data = await postApi(`/notify_inactive`, { tg_id: telegramId });
      if (data.blocked) {
        setCooldownText(t("profile.limit_reached"));
        setCooldown(5000);
      } else if (data.sent > 0 || data.sent === 0) {
        const cooldownMs = 4 * 60 * 60 * 1000;
        setCooldown(cooldownMs);
      }
    } catch (e) {
      console.error("Notify error:", e);
    } finally {
      setNotifying(false);
    }
  };

  const isSubSheetOpen = menuOpen || settingsOpen || languageOpen || isReferralModalOpen || isLevelPopupOpen || isNetworkPopupOpen || isConnectBluOpen || isLevelUpModalOpen || isClaimBoostOpen;

  useEffect(() => {
    onOverlayStateChange?.(isSubSheetOpen);
  }, [isSubSheetOpen, onOverlayStateChange]);

  return (
    <motion.div
      className={`fixed inset-0 flex flex-col overflow-hidden text-text-main bg-app-bg/95 backdrop-blur-3xl transition-all duration-300 ${isSubSheetOpen ? "z-[900]" : "z-[120]"}`}
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 20px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="max-w-md mx-auto w-full px-6 pt-6 pb-32">
              {loading && !user && (
                <div className="flex flex-col items-center justify-center pt-20 gap-4">
                  <div className="w-16 h-16 border-4 border-app-accent/20 border-t-app-accent rounded-full animate-spin" />
                  <span className="text-app-accent/80 text-xs font-bold uppercase tracking-widest">{t("profile.loading_protocol")}</span>
                </div>
              )}

              {user && (
                <div className="flex flex-col gap-6">
                  {/* User info card */}
                  <div className="bg-app-card backdrop-blur-xl border border-app-border rounded-[2.5rem] p-6 flex items-center gap-5 relative overflow-hidden pt-10">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-2 border-app-accent/30 overflow-hidden shadow-app-shadow relative z-10">
                        <img
                          src={user.photo_url || `https://ui-avatars.com/api/?name=${user.username}&background=0f172a&color=22d3ee&bold=true`}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {user.streak_days >= 3 && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-app-card border-2 border-app-accent flex items-center justify-center shadow-app-shadow z-20">
                          <Flame size={12} className="text-app-accent" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col items-start gap-1">
                      <div className="flex flex-col">
                        <h2 className="text-text-main text-xl font-black uppercase tracking-tight">
                          {user.name || user.username}
                        </h2>
                        <div className="flex items-center gap-2 py-0.5">
                          <div className="flex items-center gap-1 bg-app-accent/10 px-2 py-1 rounded-lg border border-app-border">
                            <span className="text-text-sub font-mono text-[9px] uppercase tracking-tighter">
                              {t("explore.bw_id_label")}: {user.wallet_address ? (showId ? user.bw_id : `${user.bw_id?.slice(0, 5)}***`) : "NOT ASSIGNED"}
                            </span>
                            {user.wallet_address && (
                              <button onClick={() => setShowId(!showId)} className="text-text-sub hover:text-app-accent">
                                {showId ? <EyeOff size={10} /> : <Eye size={10} />}
                              </button>
                            )}
                          </div>
                          {user.wallet_address && (
                            <button onClick={() => { navigator.clipboard.writeText(user.bw_id); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-1.5 rounded-lg bg-app-accent/10 border border-app-border text-text-sub hover:text-app-accent hover:bg-app-accent/20 transition-all">
                              {copied ? <Check size={12} className="text-app-accent" /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <button
                        ref={menuButtonRef}
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-1.5 rounded-full text-text-sub hover:text-app-accent hover:bg-app-accent/10 transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {menuOpen && (
                      <>
                        {/* Backdrop — above nav */}
                        <motion.div 
                          className="fixed inset-0 z-[998] bg-app-bg/60 backdrop-blur-sm" 
                          onClick={() => setMenuOpen(false)} 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          exit={{ opacity: 0 }} 
                        />
                        {/* Bottom Sheet */}
                        <motion.div
                          initial={{ y: "100%" }}
                          animate={{ y: 0 }}
                          exit={{ y: "100%" }}
                          transition={{ type: "spring", damping: 25, stiffness: 200 }}
                          drag="y"
                          dragControls={menuDragControls}
                          dragListener={false}
                          dragConstraints={{ top: 0 }}
                          dragElastic={0.2}
                          onDragEnd={(_, info) => {
                            if (info.offset.y > 100) setMenuOpen(false);
                          }}
                          className="fixed bottom-0 left-0 right-0 z-[999] bg-app-card border-t border-app-border rounded-t-[2.5rem] flex flex-col max-h-[70vh] shadow-app-shadow text-text-main backdrop-blur-2xl"
                        >
                          {/* Drag Handle */}
                          <div
                            onPointerDown={(e) => menuDragControls.start(e)}
                            className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing touch-none"
                          >
                            <div className="w-12 h-1.5 bg-app-border/50 rounded-full" />
                          </div>

                          <div className="px-8 pb-4">
                            <h3 className="text-app-accent text-sm font-black uppercase tracking-[0.2em] mb-1">
                              Menu
                            </h3>
                            <p className="text-text-sub text-[10px] font-bold uppercase tracking-widest">
                              Protocol Actions
                            </p>
                          </div>

                          <div className="px-6 pb-24 flex flex-col gap-2.5">
                            <button 
                              onClick={() => { setMenuOpen(false); onOpenEcosystemRoles?.(); }} 
                              className="w-full text-left px-5 py-4 text-sm font-bold uppercase tracking-wide text-text-main hover:bg-app-accent/10 transition-colors border border-app-border rounded-2xl bg-app-accent/5"
                            >
                              {t("menu.ecosystem_roles")}
                            </button>
                            <button 
                              onClick={() => { setMenuOpen(false); onOpenBwaveScan?.(); }} 
                              className="w-full text-left px-5 py-4 text-sm font-bold uppercase tracking-wide text-text-main hover:bg-app-accent/10 transition-colors border border-app-border rounded-2xl bg-app-accent/5"
                            >
                              {t("menu.presence_ledger")}
                            </button>
                            <button 
                              onClick={() => { setSettingsOpen(true); setMenuOpen(false); }} 
                              className="w-full text-left px-5 py-4 text-sm font-bold uppercase tracking-wide text-text-main hover:bg-app-accent/10 transition-colors border border-app-border rounded-2xl bg-app-accent/5"
                            >
                              {t("settings.title")}
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-3 gap-2 bg-app-accent/5 border border-app-border rounded-2xl p-1 shrink-0">
                    {(["bio", "roles", "drops"] as TabId[]).map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${activeTab === tab ? "bg-app-accent text-app-bg shadow-app-shadow" : "text-text-sub hover:text-text-main hover:bg-app-accent/10"}`}>
                        {tab === "bio" && t("profile.bio")} {tab === "roles" && t("profile.roles")} {tab === "drops" && t("profile.drops")}
                      </button>
                    ))}
                  </div>

                  <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
                    {activeTab === "bio" && (
                      <>
                        <div className="grid grid-cols-3 gap-3">
                          <button onClick={() => user.wallet_address && setIsLevelPopupOpen(true)} className="bg-app-card backdrop-blur-md border border-app-border rounded-[1.5rem] p-4 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all relative">
                            {user.wallet_address ? (
                                <>
                                    <span className="text-text-main text-lg font-black">{level}</span>
                                    <span className="text-text-sub text-[10px] font-black uppercase tracking-widest">{t("profile.level_label")}</span>
                                </>
                            ) : (
                                <Lock size={16} className="text-text-sub/30" />
                            )}
                          </button>
                          <button 
                            onClick={() => {
                              if (!user.wallet_address) return;
                              if (user.recoverable_streak > 0 && user.streak_recovery_expires_at) {
                                const expiresAt = new Date(user.streak_recovery_expires_at).getTime();
                                if (Date.now() < expiresAt) {
                                  window.dispatchEvent(new CustomEvent("showStreakRecovery"));
                                }
                              }
                            }}
                            className={`bg-app-card backdrop-blur-md border ${user.recoverable_streak > 0 ? 'border-red-500/50 hover:border-red-500/80 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-app-border cursor-default'} rounded-[1.5rem] p-4 flex flex-col items-center justify-center gap-1 relative transition-all active:scale-95`}
                          >
                            {user.wallet_address ? (
                                <>
                                    {user.recoverable_streak > 0 && (
                                        <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 shadow-lg animate-pulse">
                                           <Flame size={12} className="text-white" />
                                        </div>
                                    )}
                                    <span className={`text-xl font-black ${user.recoverable_streak > 0 ? 'text-red-400' : 'text-text-main'}`}>{user.streak_days || 0}</span>
                                    <span className={`${user.recoverable_streak > 0 ? 'text-red-400' : 'text-text-muted'} text-[8px] font-black uppercase tracking-widest`}>{t("profile.streak_label")}</span>
                                </>
                            ) : (
                                <Lock size={16} className="text-text-sub/30" />
                            )}
                          </button>
                          <button
                            onClick={() => user.wallet_address && setIsNetworkPopupOpen(true)}
                            className="bg-app-card backdrop-blur-md border border-app-border rounded-[1.5rem] p-4 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all relative"
                          >
                            {user.wallet_address ? (
                                <>
                                    <span className="text-text-main text-xl font-black">{user.total_referrals || 0}</span>
                                    <span className="text-text-sub text-[8px] font-black uppercase tracking-widest">{t("profile.networks_label")}</span>
                                </>
                            ) : (
                                <Lock size={16} className="text-text-sub/30" />
                            )}
                          </button>
                        </div>

                        {/* Independent Wallet Card */}
                        <div className="relative bg-app-bg/30 backdrop-blur-md border border-app-border rounded-2xl p-1.5 flex items-center shadow-lg group transition-all cursor-pointer hover:border-app-accent/30">
                          {/* Native Button Overlay - High Priority for Deep Links */}
                          {!user?.wallet_address && (
                            <div className="absolute inset-0 opacity-0 z-50">
                              <TonConnectButton style={{ width: '100%', height: '100%' }} />
                            </div>
                          )}
                          <div className="p-3 bg-app-accent/5 rounded-2xl border border-app-border"><img src="/ton-transparent.png" alt="Ton" className="w-8 h-8 object-contain" /></div>
                          <div className="flex-1 px-4 flex flex-col">
                            <span className="text-text-main font-extrabold text-xs uppercase tracking-[0.15em]">{user.wallet_address ? t("profile.connected") : t("profile.connect_wallet")}</span>
                          </div>
                        </div>

                        {/* Independent Earnings Card */}
                        <div className="bg-app-bg/30 border border-app-border backdrop-blur-md rounded-3xl p-6 flex flex-col gap-5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-text-sub text-[10px] font-black uppercase tracking-[0.2em]">{t("profile.network_earnings")}</span>
                              <button onClick={() => setShowEarnings(!showEarnings)} className="text-text-sub/30 hover:text-app-accent transition-colors">
                                {showEarnings ? <EyeOff size={12} /> : <Eye size={12} />}
                              </button>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-text-main text-4xl font-black">{showEarnings ? user.referral_earnings_pending : "*******"}</span>
                              <span className="text-text-sub text-sm font-bold uppercase tracking-widest">$BWAVE</span>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={handleClaim} disabled={claiming || user.referral_earnings_pending === 0} className="flex-1 h-14 bg-app-accent/5 border-2 border-app-border rounded-2xl text-app-accent font-bold uppercase text-xs tracking-widest hover:bg-app-accent/10 disabled:opacity-30 transition-all">{claiming ? t("profile.claiming") : t("profile.claim")}</button>
                            <button onClick={handleNotifyInactive} disabled={notifying || cooldown !== null} className="flex-1 h-14 bg-app-bg/40 border border-app-border rounded-2xl text-text-sub/40 font-bold uppercase text-[10px] leading-tight px-2 hover:text-app-accent transition-all">{notifying ? t("profile.notifying") : (cooldown !== null ? cooldownText : t("profile.notify_inactive_btn"))}</button>
                          </div>
                        </div>

                        {/* Independent Network Builder Card */}
                        <div className="bg-app-card border border-app-border backdrop-blur-md rounded-3xl p-6 flex flex-col gap-5">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                              <span className="text-text-sub text-[10px] font-black uppercase tracking-[0.2em]">{t("profile.network_builder")}</span>
                              <p className="text-text-muted text-[8px] font-bold uppercase leading-tight max-w-[180px]">{t("profile.network_builder_desc")}</p>
                            </div>
                            <button 
                              onClick={() => user.wallet_address ? setIsReferralModalOpen(true) : alert(t("alerts.connect_wallet_ref"))} 
                              className={`px-4 py-2 bg-app-accent/5 border border-app-border rounded-xl text-app-accent font-bold uppercase text-[10px] tracking-widest hover:bg-app-accent/10 transition-all ${!user.wallet_address ? 'opacity-50' : ''}`}
                            >
                              {t("profile.get_link")}
                            </button>
                          </div>
                          <button 
                            onClick={() => user.wallet_address ? setIsConnectBluOpen(true) : alert(t("alerts.connect_wallet_blu"))} 
                            className={`w-full h-14 bg-app-accent text-app-bg rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-app-shadow active:scale-[0.98] transition-all ${!user.wallet_address ? 'grayscale opacity-50' : ''}`}
                          >
                            {t("profile.connect_blu")}
                          </button>
                          <p className="text-text-sub text-[9px] font-black uppercase tracking-[0.2em] mt-8 text-center w-full block">
                            {t("profile.joined_at")}: {(() => {
                              const raw = user.joined_at || user.created_at;
                              if (!raw) return t("profile.protocol_active");
                              const d = new Date(raw);
                              if (isNaN(d.getTime())) return t("profile.protocol_active");
                              return d.toLocaleDateString(language === 'en' ? 'en-GB' : language, { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
                            })()}
                          </p>
                        </div>
                      </>
                    )}

                    {activeTab === "roles" && (
                      <div className="py-4">
                        <div className="grid grid-cols-3 gap-3">
                          {(user.roles || []).map((role: string) => {
                            const roleData = findRoleByName(role);
                            const Icon = roleData?.icon || UserCheck;
                            const translatedName = t(`roles_list.${role}.name`);
                            return (
                              <button
                                key={role}
                                type="button"
                                onClick={() => onOpenRoles(role)}
                                className={`group relative aspect-square bg-gradient-to-br ${roleData?.color || "from-app-accent/5 to-app-accent/5"} border ${roleData?.border || "border-app-accent/10"} rounded-2xl transition-all flex flex-col items-center justify-center gap-2 p-2 shadow-lg active:scale-95`}
                              >
                                <div className={`p-2 rounded-full ${roleData?.text?.replace("text-", "bg-")}/10 ${roleData?.text || "text-app-accent"}`}>
                                  {roleData?.image ? (
                                    <img src={roleData.image} alt={role} className="w-5 h-5 object-contain" />
                                  ) : (
                                    <Icon size={18} />
                                  )}
                                </div>
                                <span className={`text-[8px] font-black ${roleData?.text || "text-app-accent"} uppercase tracking-tighter text-center leading-none`}>
                                  {translatedName.split(" ").map((word: string, i: number) => (
                                    <span key={i} className="block">
                                      {word}
                                    </span>
                                  ))}
                                </span>
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => onOpenEcosystemRoles?.()}
                            className="aspect-square bg-app-bg/30 border border-dashed border-app-border rounded-2xl transition-all flex flex-col items-center justify-center gap-2 p-2 hover:border-app-accent/40 hover:bg-app-accent/5 active:scale-95"
                          >
                            <div className="p-2 rounded-full bg-app-accent/10 text-app-accent">
                              <Plus size={18} strokeWidth={2.5} />
                            </div>
                            <span className="text-[8px] font-black text-text-sub uppercase tracking-tighter text-center leading-snug px-1">
                              {t("profile.get_more_roles")}
                            </span>
                          </button>
                        </div>
                        {(!user.roles || user.roles.length === 0) && (
                          <p className="text-center text-[10px] text-text-sub/60 font-bold uppercase tracking-widest mt-4">
                            {t("profile.no_roles_unlocked")}
                          </p>
                        )}
                      </div>
                    )}

                    {activeTab === "drops" && (
                      <div className={`bg-app-bg/30 border-app-border backdrop-blur-md border rounded-3xl p-8 flex flex-col items-center justify-center gap-6 min-h-[300px] text-center`}>
                        <div className="w-20 h-20 rounded-full bg-app-accent/10 border border-app-border flex items-center justify-center shadow-app-shadow">
                          <Lock size={32} className="text-app-accent" strokeWidth={2} />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-black text-text-main uppercase tracking-widest">{t("profile.protocol_drops")}</h3>
                          <div className="inline-block px-3 py-1 rounded-full bg-app-accent/15 border border-app-border text-app-accent text-[10px] font-black tracking-widest uppercase">{t("profile.locked")}</div>
                        </div>
                        <div className={`bg-app-accent/5 border-app-border border rounded-2xl p-5 space-y-3`}>
                          <p className="text-xs text-text-sub leading-relaxed uppercase tracking-wider">{t("profile.drops_desc")}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </div>
          </div>

          {/* Overlay modals — rendered inside motion.div so they appear above profile */}
          <Settings 
            isOpen={settingsOpen} 
            onClose={() => setSettingsOpen(false)} 
            onOpenLanguage={() => setLanguageOpen(true)} 
            onOpenBugsSuggestions={() => {
              setSettingsOpen(false);
              onOpenBugsSuggestions?.();
            }}
          />
          <LanguageSelector isOpen={languageOpen} onClose={() => setLanguageOpen(false)} />
          <ClaimBoostPopup isOpen={isClaimBoostOpen} data={claimBoostData} onClose={() => setIsClaimBoostOpen(false)} />
          <ReferralShareModal isOpen={isReferralModalOpen} onClose={() => setIsReferralModalOpen(false)} telegramId={telegramId} bwId={user?.bw_id} referralLink={user?.referral_link} />
          <LevelPopup isOpen={isLevelPopupOpen} onClose={() => setIsLevelPopupOpen(false)} user={user} />
          <NetworkPopup 
            isOpen={isNetworkPopupOpen} 
            onClose={() => setIsNetworkPopupOpen(false)} 
            telegramId={telegramId} 
            onOpenReferral={() => setIsReferralModalOpen(true)}
          />
          <ConnectBluModal
            isOpen={isConnectBluOpen}
            onClose={() => setIsConnectBluOpen(false)}
            telegramId={telegramId}
            telegramUser={user}
            isHumanVerified={!!user?.is_human_verified}
            alreadyConnected={user?.telegram_channel || null}
            channelTitle={user?.telegram_channel_title || null}
            channelPhoto={user?.telegram_channel_photo || null}
            channelStarsReceived={user?.channel_stars_received ?? 0}
          />
          <LevelUpModal level={isNaN(parseInt(level)) ? 1 : parseInt(level)} isOpen={isLevelUpModalOpen} onClose={() => setIsLevelUpModalOpen(false)} />

          <AnimatePresence>
            {badgeUnlocked && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-app-accent text-app-bg px-6 py-2 rounded-full font-black uppercase text-xs shadow-app-shadow z-[200]">{t("profile.unlocked")}</motion.div>
            )}
          </AnimatePresence>
    </motion.div>
  );
}
