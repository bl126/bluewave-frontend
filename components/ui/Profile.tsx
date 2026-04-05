"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, MoreVertical, Wallet, ArrowLeft, Eye, EyeOff, Copy, Check, Award, ShieldCheck, UserCheck, Flame, Info, Lock } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useApi, getApi, postApi } from "@/lib/useApi";
import Settings from "./Settings";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTonAddress, useTonConnectUI, TonConnectButton, toUserFriendlyAddress } from "@tonconnect/ui-react";
import ClaimBoostPopup, { ClaimBoostData } from "./ClaimBoostPopup";
import { findRoleByName } from "@/lib/roles";
import ReferralShareModal from "@/components/ui/ReferralShareModal";
import LevelPopup from "./LevelPopup";
import LevelUpModal from "./LevelUpModal";
import ConnectBluModal from "./ConnectBluModal";

// [CODE: FRONTEND_PROFILE_TYPES]
interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
  onOpenRoles: (roleName: string) => void;
  onOpenBwaveScan?: () => void;
  onOpenEcosystemRoles?: () => void;
}

// [CODE: FRONTEND_PROFILE_MAIN_COMPONENT]
export default function Profile({ isOpen, onClose, telegramUser, onOpenRoles, onOpenBwaveScan, onOpenEcosystemRoles }: ProfileProps) {
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
  const [prevLevel, setPrevLevel] = useState<number | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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

  return (
    <>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex flex-col overflow-hidden text-cyan-200"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 20px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="max-w-md mx-auto w-full px-6 pt-6 pb-32">
              {loading && !user && (
                <div className="flex flex-col items-center justify-center pt-20 gap-4">
                  <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                  <span className="text-cyan-400/80 text-xs font-bold uppercase tracking-widest">{t("profile.loading_protocol")}</span>
                </div>
              )}

              {user && (
                <div className="flex flex-col gap-6">
                  {/* User info card */}
                  <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/10 rounded-[2.5rem] p-6 flex items-center gap-5 relative overflow-hidden pt-10">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-2 border-cyan-400/30 overflow-hidden shadow-[0_0_20px_#00e6ff20] relative z-10">
                        <img
                          src={user.photo_url || `https://ui-avatars.com/api/?name=${user.username}&background=0f172a&color=22d3ee&bold=true`}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {user.streak_days >= 3 && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_15px_#22d3ee] z-20">
                          <Flame size={12} className="text-cyan-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col items-start gap-1">
                      <div className="flex flex-col">
                        <h2 className="text-white text-xl font-black uppercase tracking-tight">
                          {user.name || user.username}
                        </h2>
                        <div className="flex items-center gap-2 py-0.5">
                          <div className="flex items-center gap-1 bg-cyan-500/10 px-2 py-1 rounded-lg border border-cyan-500/20">
                            <span className="text-cyan-400/80 font-mono text-[9px] uppercase tracking-tighter">
                              {t("explore.bw_id_label")}: {user.wallet_address ? (showId ? user.bw_id : `${user.bw_id?.slice(0, 5)}***`) : "NOT ASSIGNED"}
                            </span>
                            {user.wallet_address && (
                              <button onClick={() => setShowId(!showId)} className="text-cyan-400/50 hover:text-cyan-400">
                                {showId ? <EyeOff size={10} /> : <Eye size={10} />}
                              </button>
                            )}
                          </div>
                          {user.wallet_address && (
                            <button onClick={() => { navigator.clipboard.writeText(user.bw_id); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/20 transition-all">
                              {copied ? <Check size={12} className="text-cyan-400" /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <button
                        ref={menuButtonRef}
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-1.5 rounded-full text-cyan-400/70 hover:text-cyan-400 hover:bg-white/10 transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {menuOpen && (
                      <>
                        <motion.div className="fixed inset-0 z-[140]" onClick={() => setMenuOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="fixed z-[150] w-44 bg-black/90 backdrop-blur-xl border border-cyan-900/40 rounded-xl shadow-[0_0_20px_#00e6ff30] overflow-hidden"
                          style={{ top: menuButtonRef.current ? menuButtonRef.current.getBoundingClientRect().bottom + 8 : 'auto', right: '24px' }}
                        >
                          <button onClick={() => { setMenuOpen(false); onOpenEcosystemRoles?.(); }} className="w-full text-left px-4 py-3 text-xs text-cyan-200 hover:bg-cyan-500/10 transition-colors border-b border-white/5">{t("menu.ecosystem_roles")}</button>
                          <button onClick={() => { setMenuOpen(false); onOpenBwaveScan?.(); }} className="w-full text-left px-4 py-3 text-xs text-cyan-200 hover:bg-cyan-500/10 transition-colors border-b border-white/5">{t("menu.presence_ledger")}</button>
                          <button onClick={() => { setSettingsOpen(true); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-xs text-cyan-200 hover:bg-cyan-500/10 transition-colors">{t("settings.title")}</button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-3 gap-2 bg-white/[0.03] border border-white/5 rounded-2xl p-1 shrink-0">
                    {(["bio", "roles", "drops"] as TabId[]).map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${activeTab === tab ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]" : "text-cyan-400/70 hover:text-cyan-400/90 hover:bg-white/10"}`}>
                        {tab === "bio" && t("profile.bio")} {tab === "roles" && t("profile.roles")} {tab === "drops" && t("profile.drops")}
                      </button>
                    ))}
                  </div>

                  <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
                    {activeTab === "bio" && (
                      <>
                        <div className="grid grid-cols-3 gap-3">
                          <button onClick={() => user.wallet_address && setIsLevelPopupOpen(true)} className="bg-black/30 backdrop-blur-md border border-cyan-500/20 rounded-[1.5rem] p-4 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all relative">
                            {user.wallet_address ? (
                                <>
                                    <span className="text-white text-lg font-black">{level}</span>
                                    <span className="text-cyan-400/80 text-[7px] font-black uppercase tracking-widest">{t("profile.level_label")}</span>
                                </>
                            ) : (
                                <Lock size={16} className="text-cyan-500/30" />
                            )}
                          </button>
                          <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-[1.5rem] p-4 flex flex-col items-center justify-center gap-1 relative">
                            {user.wallet_address ? (
                                <>
                                    <span className="text-white text-xl font-black">{user.streak_days || 0}</span>
                                    <span className="text-cyan-500/50 text-[8px] font-black uppercase tracking-widest">{t("profile.streak_label")}</span>
                                </>
                            ) : (
                                <Lock size={16} className="text-cyan-500/30" />
                            )}
                          </div>
                          <div className="bg-black/30 backdrop-blur-md border border-cyan-500/20 rounded-[1.5rem] p-4 flex flex-col items-center justify-center gap-1 relative">
                            {user.wallet_address ? (
                                <>
                                    <span className="text-white text-xl font-black">{user.total_referrals || 0}</span>
                                    <span className="text-cyan-400/80 text-[8px] font-black uppercase tracking-widest">{t("profile.networks_label")}</span>
                                </>
                            ) : (
                                <Lock size={16} className="text-cyan-500/30" />
                            )}
                          </div>
                        </div>

                        {/* Independent Wallet Card */}
                        <div className="relative bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-2xl p-1.5 flex items-center shadow-lg group transition-all cursor-pointer hover:border-cyan-500/30">
                          {/* Native Button Overlay - High Priority for Deep Links */}
                          {!user?.wallet_address && (
                            <div className="absolute inset-0 opacity-0 z-50">
                              <TonConnectButton style={{ width: '100%', height: '100%' }} />
                            </div>
                          )}
                          <div className="p-3 bg-cyan-500/5 rounded-2xl border border-cyan-500/10"><img src="/ton-transparent.png" alt="Ton" className="w-8 h-8 object-contain" /></div>
                          <div className="flex-1 px-4 flex flex-col">
                            <span className="text-white font-extrabold text-xs uppercase tracking-[0.15em]">{user.wallet_address ? t("profile.connected") : t("profile.connect_wallet")}</span>
                          </div>
                        </div>

                        {/* Independent Earnings Card */}
                        <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-3xl p-6 flex flex-col gap-5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-cyan-400/80 text-[10px] font-black uppercase tracking-[0.2em]">{t("profile.network_earnings")}</span>
                              <button onClick={() => setShowEarnings(!showEarnings)} className="text-cyan-500/30 hover:text-cyan-400 transition-colors">
                                {showEarnings ? <EyeOff size={12} /> : <Eye size={12} />}
                              </button>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-white text-4xl font-black">{showEarnings ? user.referral_earnings_pending : "*******"}</span>
                              <span className="text-cyan-400/60 text-sm font-bold uppercase tracking-widest">$BWAVE</span>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={handleClaim} disabled={claiming || user.referral_earnings_pending === 0} className="flex-1 h-14 bg-cyan-500/5 border-2 border-cyan-500/20 rounded-2xl text-cyan-400 font-bold uppercase text-xs tracking-widest hover:bg-cyan-500/10 disabled:opacity-30 transition-all">{claiming ? t("profile.claiming") : t("profile.claim")}</button>
                            <button onClick={handleNotifyInactive} disabled={notifying || cooldown !== null} className="flex-1 h-14 bg-black/40 border border-cyan-950 rounded-2xl text-cyan-500/40 font-bold uppercase text-[10px] leading-tight px-2 hover:text-cyan-400 transition-all">{notifying ? t("profile.notifying") : (cooldown !== null ? cooldownText : t("profile.notify_inactive_btn"))}</button>
                          </div>
                        </div>

                        {/* Independent Network Builder Card */}
                        <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-3xl p-6 flex flex-col gap-5">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                              <span className="text-cyan-400/80 text-[10px] font-black uppercase tracking-[0.2em]">{t("profile.network_builder")}</span>
                              <p className="text-cyan-400/50 text-[8px] font-bold uppercase leading-tight max-w-[180px]">{t("profile.network_builder_desc")}</p>
                            </div>
                            <button 
                              onClick={() => user.wallet_address ? setIsReferralModalOpen(true) : alert("Please connect your wallet to generate a referral link.")} 
                              className={`px-4 py-2 bg-cyan-500/5 border border-cyan-500/10 rounded-xl text-cyan-400 font-bold uppercase text-[10px] tracking-widest hover:bg-cyan-500/10 transition-all ${!user.wallet_address ? 'opacity-50' : ''}`}
                            >
                              {t("profile.get_link")}
                            </button>
                          </div>
                          <button 
                            onClick={() => user.wallet_address ? setIsConnectBluOpen(true) : alert("Please connect your wallet to access Blu configurations.")} 
                            className={`w-full h-14 bg-cyan-500 text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-[0_0_20px_rgba(6,182,212,0.2)] active:scale-[0.98] transition-all ${!user.wallet_address ? 'grayscale opacity-50' : ''}`}
                          >
                            {t("profile.connect_blu")}
                          </button>
                          <p className="text-cyan-400/70 text-[9px] font-black uppercase tracking-[0.2em] mt-8 text-center w-full block">
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
                        {!user.roles || user.roles.length === 0 ? (
                          <div className="flex flex-col items-center justify-center gap-3 py-10 opacity-70"><ShieldCheck size={40} /><span className="text-xs font-bold uppercase tracking-widest italic">{t("profile.no_roles_unlocked")}</span></div>
                        ) : (
                          <div className="grid grid-cols-3 gap-3">
                            {user.roles.map((role: string) => {
                              const roleData = findRoleByName(role);
                              const Icon = roleData?.icon || UserCheck;
                              const translatedName = t(`roles_list.${role}.name`);
                              return (
                                <button key={role} onClick={() => onOpenRoles(role)} className={`group relative aspect-square bg-gradient-to-br ${roleData?.color || 'from-cyan-500/5 to-cyan-500/5'} border ${roleData?.border || 'border-cyan-500/10'} rounded-2xl transition-all flex flex-col items-center justify-center gap-2 p-2 shadow-lg`}>
                                  <div className={`p-2 rounded-full ${roleData?.text?.replace('text-', 'bg-')}/10 ${roleData?.text || 'text-cyan-400'}`}>
                                    {roleData?.image ? <img src={roleData.image} alt={role} className="w-5 h-5 object-contain" /> : <Icon size={18} />}
                                  </div>
                                  <span className={`text-[8px] font-black ${roleData?.text || 'text-cyan-400'} uppercase tracking-tighter text-center leading-none`}>
                                    {translatedName.split(' ').map((word: string, i: number) => (<span key={i} className="block">{word}</span>))}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "drops" && (
                      <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-3xl p-8 flex flex-col items-center justify-center gap-6 min-h-[300px] text-center">
                        <div className="w-20 h-20 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.15)]"><span className="text-4xl">🎁</span></div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-black text-white uppercase tracking-widest">{t("profile.protocol_drops")}</h3>
                          <div className="inline-block px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] font-black tracking-widest uppercase">{t("profile.locked")}</div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
                          <p className="text-xs text-white/50 leading-relaxed uppercase tracking-wider">{t("profile.drops_desc")}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </div>
          </div>

          {/* Overlay modals — rendered inside motion.div so they appear above profile */}
          <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} onOpenLanguage={() => setLanguageOpen(true)} />
          <LanguageSelector isOpen={languageOpen} onClose={() => setLanguageOpen(false)} />
          <ClaimBoostPopup isOpen={isClaimBoostOpen} data={claimBoostData} onClose={() => setIsClaimBoostOpen(false)} />
          <ReferralShareModal isOpen={isReferralModalOpen} onClose={() => setIsReferralModalOpen(false)} telegramId={telegramId} bwId={user?.bw_id} referralLink={user?.referral_link} />
          <LevelPopup isOpen={isLevelPopupOpen} onClose={() => setIsLevelPopupOpen(false)} user={user} />
          <ConnectBluModal
            isOpen={isConnectBluOpen}
            onClose={() => setIsConnectBluOpen(false)}
            telegramId={telegramId}
            isHumanVerified={!!user?.is_human_verified}
            alreadyConnected={user?.telegram_channel || null}
            channelTitle={user?.telegram_channel_title || null}
            channelPhoto={user?.telegram_channel_photo || null}
          />
          <LevelUpModal level={isNaN(parseInt(level)) ? 1 : parseInt(level)} isOpen={isLevelUpModalOpen} onClose={() => setIsLevelUpModalOpen(false)} />

          <AnimatePresence>
            {badgeUnlocked && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-cyan-500 text-black px-6 py-2 rounded-full font-black uppercase text-xs shadow-[0_0_20px_rgba(6,182,212,0.6)] z-[200]">{t("profile.unlocked")}</motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  );
}
