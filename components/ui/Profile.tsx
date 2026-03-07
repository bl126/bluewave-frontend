"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, MoreVertical, Wallet, ArrowLeft, Eye, EyeOff, Copy, Check, Award, ShieldCheck, UserCheck, Flame, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/useApi";
import Settings from "./Settings";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import ClaimBoostPopup, { ClaimBoostData } from "./ClaimBoostPopup";
import { findRoleByName } from "@/lib/roles";

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
  const { t } = useLanguage();

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
  const [menuOpen, setMenuOpen] = useState(false);

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
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notify_inactive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tg_id: telegramId }),
      });
      const data = await res.json();

      if (data.blocked) {
        setCooldownText("Limit Reached");
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex flex-col overflow-hidden text-cyan-200"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px))", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
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
                  <span className="text-cyan-500/50 text-xs font-bold uppercase tracking-widest">{t("profile.loading") || "Loading Protocol..."}</span>
                </div>
              )}

              {user && (
                <div className="flex flex-col gap-6">
                  {/* 1. Static User Info Card */}
                  <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/10 rounded-[2.5rem] p-6 flex items-center gap-5 relative overflow-hidden pt-10">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-2 border-cyan-400/30 overflow-hidden shadow-[0_0_20px_#00e6ff20] relative z-10">
                        <img
                          src={user.photo_url || `https://ui-avatars.com/api/?name=${user.username}&background=0f172a&color=22d3ee&bold=true`}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Streak Badge */}
                      {user.streak_days >= 3 && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_15px_#22d3ee] z-20">
                          <Flame size={12} className="text-cyan-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col items-start gap-1">
                      <div className="flex flex-col">
                        <h2 className="text-white text-xl font-black uppercase tracking-tight">
                          {user.name && user.name.length > 15 ? user.name.slice(0, 12) + "..." : (user.name || user.username)}
                        </h2>
                        <div className="flex items-center gap-1.5 py-0.5">
                          <span className="text-cyan-500/60 font-mono text-[9px] uppercase tracking-tighter">
                            BW ID: {showId ? user.bw_id : `${user.bw_id?.slice(0, 5)}***`}
                          </span>
                          <button onClick={() => setShowId(!showId)} className="text-cyan-500/30 hover:text-cyan-400">
                            {showId ? <EyeOff size={10} /> : <Eye size={10} />}
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(user.bw_id || "");
                              setIdCopied(true);
                              setTimeout(() => setIdCopied(false), 2000);
                            }}
                            className="text-cyan-500/30 hover:text-cyan-400"
                          >
                            {idCopied ? <Check size={10} className="text-cyan-400" /> : <Copy size={10} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ⋮ 3-Dot Menu — bottom-right of card */}
                    <div className="absolute bottom-4 right-4">
                      <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-1.5 rounded-full text-cyan-500/40 hover:text-cyan-400 hover:bg-white/5 transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      <AnimatePresence>
                        {menuOpen && (
                          <>
                            {/* Click outside layer */}
                            <motion.div
                              className="fixed inset-0 z-[140]"
                              onClick={() => setMenuOpen(false)}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            />
                            {/* Dropdown — fixed so it renders above overflow-hidden */}
                            <motion.div
                              initial={{ opacity: 0, y: -4, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -4, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="fixed z-[150] w-44 bg-black/90 backdrop-blur-xl border border-cyan-900/40 rounded-xl shadow-[0_0_20px_#00e6ff30] overflow-hidden"
                              style={{ bottom: "auto", right: "16px", top: "auto", marginTop: "8px" }}
                            >
                              <button
                                onClick={() => {
                                  setMenuOpen(false);
                                  onOpenEcosystemRoles?.();
                                }}
                                className="w-full text-left px-4 py-3 text-xs text-cyan-200 hover:bg-cyan-500/10 transition-colors border-b border-white/5"
                              >
                                Ecosystem Roles
                              </button>
                              <button
                                onClick={() => {
                                  setMenuOpen(false);
                                  onClose();
                                  setTimeout(() => onOpenBwaveScan?.(), 300);
                                }}
                                className="w-full text-left px-4 py-3 text-xs text-cyan-200 hover:bg-cyan-500/10 transition-colors border-b border-white/5"
                              >
                                BwaveScan
                              </button>
                              <button
                                onClick={() => {
                                  setMenuOpen(false);
                                  setSettingsOpen(true);
                                }}
                                className="w-full text-left px-4 py-3 text-xs text-cyan-200 hover:bg-cyan-500/10 transition-colors"
                              >
                                Settings
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* 2. Tab Navigation */}
                  <div className="grid grid-cols-3 gap-2 bg-white/[0.03] border border-white/5 rounded-2xl p-1 shrink-0">
                    {(["bio", "roles", "drops"] as TabId[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200
                          ${activeTab === tab
                            ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                            : "text-cyan-500/40 hover:text-cyan-500/60 hover:bg-white/5"}`}
                      >
                        {tab === "bio" && "Bio"}
                        {tab === "roles" && "Roles"}
                        {tab === "drops" && "Drops"}
                      </button>
                    ))}
                  </div>

                  {/* 3. Tab Content */}
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-5"
                  >
                    {activeTab === "bio" && (
                      <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-[1.5rem] p-4 flex flex-col items-center justify-center gap-1">
                            <span className="text-white text-lg font-black">{level || "1"}</span>
                            <span className="text-cyan-500/50 text-[7px] font-black uppercase tracking-widest">LEVEL</span>
                          </div>
                          <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-[1.5rem] p-4 flex flex-col items-center justify-center gap-1">
                            <span className="text-white text-xl font-black">{user.streak_days || 0}</span>
                            <span className="text-cyan-500/50 text-[8px] font-black uppercase tracking-widest">{t("profile.streak")}</span>
                          </div>
                          <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-[1.5rem] p-4 flex flex-col items-center justify-center gap-1">
                            <span className="text-white text-xl font-black">{user.total_referrals || 0}</span>
                            <span className="text-cyan-500/50 text-[8px] font-black uppercase tracking-widest">NETWORKS</span>
                          </div>
                        </div>

                        {/* Wallet Card */}
                        <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-2xl p-1.5 flex items-center shadow-lg group opacity-60 grayscale hover:grayscale-0 transition-all">
                          <div className="p-3 bg-cyan-500/5 rounded-2xl shadow-inner border border-cyan-500/10">
                            <img src="/ton-transparent.png" alt="Ton" className="w-8 h-8 object-contain" />
                          </div>
                          <div className="flex-1 px-4 flex flex-col">
                            <span className="text-white font-extrabold text-xs uppercase tracking-[0.15em]">{walletAddress ? t("profile.wallet_connected") : t("profile.connect_wallet")}</span>
                            {walletAddress && <span className="text-cyan-500/40 font-mono text-[9px] truncate max-w-[150px]">{walletAddress}</span>}
                            <span className="text-cyan-500/20 text-[8px] font-bold uppercase tracking-widest mt-0.5">COMING SOON</span>
                          </div>
                        </div>

                        {/* Earnings Card */}
                        <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-3xl p-6 flex flex-col gap-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-cyan-500/50 text-[10px] font-black uppercase tracking-[0.2em]">{t("profile.network_earnings")}</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-white text-4xl font-black">{user.referral_earnings_pending}</span>
                              <span className="text-cyan-400/60 text-sm font-bold uppercase tracking-widest">$BWAVE</span>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={handleClaim}
                              disabled={claiming || user.referral_earnings_pending === 0}
                              className="flex-1 h-14 bg-cyan-500/5 border-2 border-cyan-500/20 rounded-2xl text-cyan-400 font-bold uppercase text-xs tracking-widest hover:bg-cyan-500/10 disabled:opacity-30 transition-all"
                            >
                              {claiming ? t("profile.claiming") : t("profile.claim")}
                            </button>
                            <button
                              onClick={handleNotifyInactive}
                              disabled={notifying || cooldown !== null}
                              className="flex-1 h-14 bg-black/40 border border-cyan-950 rounded-2xl text-cyan-500/40 font-bold uppercase text-[10px] leading-tight px-2 hover:text-cyan-400 transition-all"
                            >
                              {cooldown !== null ? cooldownText : t("profile.notify_inactive")}
                            </button>
                          </div>
                        </div>

                        {/* Referral Link Section */}
                        <div className="bg-black/30 backdrop-blur-md border border-cyan-500/10 rounded-3xl p-6 flex flex-col gap-5">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                              <span className="text-cyan-500/50 text-[10px] font-black uppercase tracking-[0.2em]">NETWORK BUILDER</span>
                            </div>
                            <button
                              onClick={() => {
                                const link = user.referral_link || `https://t.me/Bluewave_Ecosystem_bot?start=ref_${telegramId}`;
                                navigator.clipboard.writeText(link);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              }}
                              className="px-4 py-2 bg-cyan-500/5 border border-cyan-500/10 rounded-xl text-cyan-400 font-bold uppercase text-[10px] tracking-widest hover:bg-cyan-500/10 active:scale-95 transition-all"
                            >
                              {copied ? t("profile.copied") : t("profile.copy")}
                            </button>
                          </div>

                          <div className="bg-black/40 border border-cyan-950 rounded-2xl p-4 break-all">
                            <span className="text-cyan-500/60 font-medium text-xs font-mono">
                              {user.referral_link || `https://t.me/Bluewave_Ecosystem_bot?start=ref_${telegramId}`}
                            </span>
                          </div>

                          <div className="flex items-center justify-center gap-3 pt-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/40 shadow-[0_0_5px_#22d3ee40]" />
                            <span className="text-cyan-500/40 text-[11px] font-black uppercase tracking-[0.3em]">
                              {t("profile.joined")}: {new Date(user.joined_at).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/40 shadow-[0_0_5px_#22d3ee40]" />
                          </div>
                        </div>
                      </>
                    )}

                    {activeTab === "roles" && (
                      <div className="py-4">
                        {!user.roles || user.roles.length === 0 ? (
                          <div className="flex flex-col items-center justify-center gap-3 py-10 opacity-30">
                            <ShieldCheck size={40} />
                            <span className="text-xs font-bold uppercase tracking-widest italic">{t("profile.no_roles")}</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-3">
                            {user.roles.map((role: string) => {
                              const roleData = findRoleByName(role);
                              const Icon = roleData?.icon || UserCheck;
                              return (
                                <button
                                  key={role}
                                  onClick={() => onOpenRoles(role)}
                                  className={`group relative aspect-square bg-gradient-to-br ${roleData?.color || 'from-cyan-500/5 to-cyan-500/5'} border ${roleData?.border || 'border-cyan-500/10'} rounded-2xl active:scale-95 transition-all flex flex-col items-center justify-center gap-2 p-2 shadow-lg`}
                                >
                                  <div className={`p-2 rounded-full ${roleData?.text?.replace('text-', 'bg-')}/10 ${roleData?.text || 'text-cyan-400'} group-hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]`}>
                                    <Icon size={18} />
                                  </div>
                                  <span className={`text-[8px] font-black ${roleData?.text || 'text-cyan-400'} uppercase tracking-tighter text-center leading-none`}>
                                    {role.split(' ').map((word, i) => (
                                      <span key={i} className="block">{word}</span>
                                    ))}
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
                        <div className="w-20 h-20 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.15)]">
                          <span className="text-4xl">🎁</span>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-black text-white uppercase tracking-widest">Protocol Drops</h3>
                          <div className="inline-block px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] font-black tracking-widest uppercase">
                            Locked
                          </div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
                          <p className="text-xs text-white/50 leading-relaxed uppercase tracking-wider">
                            Exclusive token deliveries for consistent participants. Keep your signal score high to qualify.
                          </p>
                          <div className="flex items-center justify-center gap-2 text-[9px] text-cyan-500/40 font-black uppercase border-t border-white/5 pt-3">
                            <Info size={10} />
                            Calculating eligibility pool...
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </div>
          </div>

          <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} onOpenLanguage={() => setLanguageOpen(true)} />
          <LanguageSelector isOpen={languageOpen} onClose={() => setLanguageOpen(false)} />
          <ClaimBoostPopup isOpen={isClaimBoostOpen} data={claimBoostData} onClose={() => setIsClaimBoostOpen(false)} />

          <AnimatePresence>
            {badgeUnlocked && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-cyan-500 text-black px-6 py-2 rounded-full font-black uppercase text-xs shadow-[0_0_20px_rgba(6,182,212,0.6)] z-[200]"
              >
                {t("profile.badge_unlocked")}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
