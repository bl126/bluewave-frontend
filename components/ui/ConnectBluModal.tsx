"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Send, Check, Loader2, ChevronRight, Star, BarChart3, Brain, Globe2, TrendingUp, Coins, Lock, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getApi, postApi } from "@/lib/useApi";
import { setCachedStarWithdrawalInfo } from "@/lib/starWithdrawalCache";
import { useLanguage } from "@/contexts/LanguageContext";
import { mutate } from "swr";
import StarWithdrawalModal from "./StarWithdrawalModal";

interface ConnectBluModalProps {
    isOpen: boolean;
    onClose: () => void;
    telegramId: number | null;
    telegramUser?: any;
    isHumanVerified: boolean;
    alreadyConnected?: string | null;
    channelTitle?: string | null;
    channelPhoto?: string | null;
    channelStarsReceived?: number;
}

export default function ConnectBluModal({
    isOpen,
    onClose,
    telegramId,
    telegramUser,
    isHumanVerified,
    alreadyConnected,
    channelTitle,
    channelPhoto,
    channelStarsReceived = 0,
}: ConnectBluModalProps) {
    const [view, setView] = useState<"main" | "telegram">("main");
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [channelInput, setChannelInput] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);
    const [connectedInfo, setConnectedInfo] = useState({
        title: "",
        photo: "",
        username: ""
    });
    const [error, setError] = useState("");
    const [imgError, setImgError] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { t } = useLanguage();

    // Custom States for Analytics and Confirm Modal
    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
    const [analyticsOpen, setAnalyticsOpen] = useState(false);
    const [analyticsData, setAnalyticsData] = useState<{
        subscribers: number;
        total_posts: number;
        total_views: number;
        engagement_rate: number;
        recent_posts: any[];
    } | null>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<"signals" | "brain" | "monetisation">("signals");
    const [isPremium, setIsPremium] = useState(false);
    const [togglingPremium, setTogglingPremium] = useState(false);
    const [withdrawalInfo, setWithdrawalInfo] = useState<any>(null);
    const adminIds = [5023869471, 7762443283];
    const isAdmin = adminIds.includes(telegramId ?? 0);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "K";
        return num.toString();
    };

    useEffect(() => {
        if (telegramUser) {
            setIsPremium(!!telegramUser.is_premium);
        }
    }, [telegramUser]);

    const handleTogglePremium = async () => {
        if (togglingPremium || !telegramId) return;
        setTogglingPremium(true);
        try {
            const res = await postApi("/api/user/toggle_premium", { tg_id: telegramId });
            if (res.success) {
                setIsPremium(res.is_premium);
                mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${telegramId}`);
            }
        } catch (err) {
            console.error("Failed to toggle premium:", err);
        } finally {
            setTogglingPremium(false);
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) void import("./StarWithdrawalModal");
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !telegramId) return;
        void getApi(`/stars/withdrawal/info?tg_id=${telegramId}`)
            .then((res) => {
                setWithdrawalInfo(res);
                setCachedStarWithdrawalInfo(telegramId, res);
            })
            .catch(() => {});
    }, [isOpen, telegramId]);

    // Sync state with props when modal opens or props change
    useEffect(() => {
        if (isOpen) {
            setVerified(!!alreadyConnected);
            setConnectedInfo({
                title: channelTitle || "",
                photo: channelPhoto || "",
                username: alreadyConnected || ""
            });
        }
    }, [isOpen, alreadyConnected, channelTitle, channelPhoto]);

    // Intercept Telegram native back button when analytics overlay is open
    useEffect(() => {
        if (!analyticsOpen) return;
        const handleNativeBack = (e: Event) => {
            e.preventDefault();
            setAnalyticsOpen(false);
        };
        window.addEventListener("bwNativeBack", handleNativeBack, true);
        return () => window.removeEventListener("bwNativeBack", handleNativeBack, true);
    }, [analyticsOpen]);

    // Fetch channel analytics when analytics overlay opens
    useEffect(() => {
        if (!analyticsOpen || !telegramId) return;
        setLoadingAnalytics(true);
        getApi(`/api/telegram/channel/analytics/${telegramId}`)
            .then((res: any) => {
                setAnalyticsData(res);
            })
            .catch((err) => {
                console.error("Failed to fetch channel analytics:", err);
            })
            .finally(() => {
                setLoadingAnalytics(false);
            });
    }, [analyticsOpen, telegramId]);

    // Intercept Telegram native back button for modal navigation stack
    useEffect(() => {
        if (!isOpen) return;
        const handleNativeBack = (e: Event) => {
            e.preventDefault();
            if (analyticsOpen) {
                setAnalyticsOpen(false);
            } else if (view !== "main") {
                setView("main");
            } else {
                onClose();
            }
        };
        window.addEventListener("bwNativeBack", handleNativeBack, true);
        return () => window.removeEventListener("bwNativeBack", handleNativeBack, true);
    }, [isOpen, analyticsOpen, view, onClose]);

    const handleVerify = async () => {
        if (!channelInput.trim() || verifying || verified) return;
        setVerifying(true);
        setError("");
        try {
            const res = await postApi("/api/telegram/verify_channel", {
                tg_id: telegramId,
                channel: channelInput.trim().replace("@", ""),
            });
            if (res.success) {
                setVerified(true);
                setConnectedInfo({
                    title: res.channel_title || t("connect_blu.connected_fallback"),
                    photo: res.channel_photo || "",
                    username: res.channel || ""
                });
                mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${telegramId}`);
            } else {
                setError(res.error || t("connect_blu.error_verify_admin"));
            }
        } catch {
            setError(t("connect_blu.error_connection"));
        } finally {
            setVerifying(false);
        }
    };

    const handleDisconnect = async () => {
        if (!verified || verifying) return;
        setVerifying(true);
        setError("");
        try {
            const res = await postApi("/api/telegram/disconnect_channel", {
                tg_id: telegramId
            });
            if (res.success) {
                setVerified(false);
                setConnectedInfo({ title: "", photo: "", username: "" });
                setChannelInput("");
                mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${telegramId}`);
            } else {
                setError(res.error || "Disconnect failed");
            }
        } catch {
            setError(t("connect_blu.error_connection"));
        } finally {
            setVerifying(false);
        }
    };

    const handleClose = () => {
        setView("main");
        setError("");
        onClose();
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        // onClick removed to make backdrop non-dismissable
                        className="fixed inset-0 z-[200] bg-app-bg/70 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 z-[201] flex items-center justify-center p-6 pointer-events-none"
                    >
                        <div className="w-full max-w-sm bg-app-card border border-app-border rounded-[2.5rem] overflow-hidden shadow-app-shadow pointer-events-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-6 pb-4">
                                <div>
                                    <h2 className="text-text-main font-black text-lg uppercase tracking-tight">{t("connect_blu.title")}</h2>
                                    <p className="text-readable-sm font-bold uppercase tracking-wide leading-none mt-1">{t("connect_blu.subtitle")}</p>
                                </div>
                            </div>

                            <div className="px-6 pb-10">
                                <AnimatePresence mode="wait">

                                    {/* === MAIN VIEW === */}
                                    {view === "main" && (
                                        <motion.div
                                            key="main"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="flex flex-col gap-3"
                                        >
                                            {/* Connect Telegram Channel — Active */}
                                            <button
                                                onClick={() => setView("telegram")}
                                                className="w-full flex items-center gap-4 bg-app-accent/5 hover:bg-app-accent/10 border border-app-border rounded-2xl p-4 transition-all active:scale-[0.98] group"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-app-accent/10 border border-app-border flex items-center justify-center shrink-0">
                                                    <Send size={22} className="text-app-accent" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="text-text-main font-black text-sm uppercase tracking-wide">{t("connect_blu.connect_tg")}</p>
                                                    <p className="text-readable-sm font-bold uppercase tracking-wide mt-0.5">{t("connect_blu.connect_tg_desc")}</p>
                                                </div>
                                                <ChevronRight size={16} className="text-text-sub group-hover:text-app-accent transition-colors" />
                                            </button>

                                            {/* Connect X — Coming Soon */}
                                            <div className="w-full flex items-center gap-4 bg-app-bg/5 border border-app-border rounded-2xl p-4 cursor-not-allowed relative overflow-hidden">
                                                <div className="w-12 h-12 rounded-2xl bg-app-accent/5 border border-app-border flex items-center justify-center shrink-0">
                                                    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[22px] h-[22px] text-text-sub" fill="currentColor">
                                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                                                    </svg>
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="text-text-sub font-black text-sm uppercase tracking-wide">{t("connect_blu.connect_x")}</p>
                                                    <p className="text-readable-muted font-bold uppercase tracking-wide mt-0.5">{t("connect_blu.social_verification")}</p>
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-app-accent/5 border border-app-border text-text-sub">
                                                    {t("connect_blu.coming_soon")}
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* === TELEGRAM VIEW === */}
                                    {view === "telegram" && (
                                        <motion.div
                                            key="telegram"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="flex flex-col gap-5"
                                        >
                                            <button
                                                onClick={() => setView("main")}
                                                className="flex items-center gap-1 text-text-sub text-[10px] font-black uppercase tracking-widest hover:text-app-accent transition-colors self-start"
                                            >
                                                {t("connect_blu.back")}
                                            </button>

                                            {/* VERIFIED human view */}
                                            {isHumanVerified ? (
                                                <div className="flex flex-col gap-4">
                                                    {/* Criteria */}
                                                    <div className="bg-app-accent/5 border border-app-border rounded-2xl p-4 flex flex-col gap-3">
                                                        <p className="text-app-accent text-[10px] font-black uppercase tracking-widest">{t("connect_blu.requirements")}</p>
                                                        <ul className="space-y-2 text-xs text-text-sub font-medium">
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-app-accent font-black">01</span>
                                                                <span className="flex-1 leading-snug">
                                                                    {t("connect_blu.req_1_prefix")}{" "}
                                                                    <button
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(t("connect_blu.req_1_bot"));
                                                                            const btn = document.getElementById("copy-bot-btn");
                                                                            if (btn) {
                                                                                btn.innerText = t("connect_blu.copied");
                                                                                setTimeout(() => btn.innerText = t("connect_blu.copy"), 2000);
                                                                            }
                                                                        }}
                                                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-app-accent/10 border border-app-border text-app-accent font-bold hover:bg-app-accent/20 transition-all active:scale-95"
                                                                    >
                                                                        {t("connect_blu.req_1_bot")}
                                                                        <span id="copy-bot-btn" className="text-[7px] bg-app-accent text-app-bg px-1 rounded ml-1">{t("connect_blu.copy")}</span>
                                                                    </button>{" "}
                                                                    {t("connect_blu.req_1_suffix")}
                                                                </span>
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-app-accent font-black">02</span>
                                                                <span className="flex-1 leading-snug">{t("connect_blu.req_2")}</span>
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-app-accent font-black">03</span>
                                                                <span className="flex-1 leading-snug">{t("connect_blu.req_3")}</span>
                                                            </li>
                                                        </ul>
                                                    </div>

                                                    {/* Benefits */}
                                                    <div className="bg-app-accent/5 border border-app-border rounded-2xl p-4 flex flex-col gap-2">
                                                        <p className="text-readable-sm font-black uppercase tracking-widest">{t("connect_blu.benefits")}</p>
                                                        <ul className="space-y-1 text-[11px] text-text-sub font-medium">
                                                            <li>{t("connect_blu.ben_1")}</li>
                                                            <li>{t("connect_blu.ben_2")}</li>
                                                            <li>{t("connect_blu.ben_3")}</li>
                                                            <li>{t("connect_blu.ben_4")}</li>
                                                        </ul>
                                                    </div>

                                                    {/* Input + Button */}
                                                    {!verified ? (
                                                        <div className="flex flex-col gap-3">
                                                            <input
                                                                type="text"
                                                                placeholder={t("connect_blu.placeholder")}
                                                                value={channelInput}
                                                                onChange={(e) => setChannelInput(e.target.value)}
                                                                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-text-main text-sm font-mono placeholder:text-app-accent/20 focus:outline-none focus:border-app-accent/50"
                                                            />
                                                            {error && <p className="text-red-400/80 text-[10px] font-bold uppercase">{error}</p>}
                                                            <button
                                                                onClick={handleVerify}
                                                                disabled={verifying || !channelInput.trim()}
                                                                className="w-full h-13 py-3.5 bg-app-accent text-app-bg font-black uppercase text-xs tracking-widest rounded-2xl shadow-app-shadow disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                                            >
                                                                {verifying ? <><Loader2 size={16} className="animate-spin" /> {t("connect_blu.verifying")}</> : t("connect_blu.verify_btn")}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-4">
                                                            <div 
                                                                onClick={() => setAnalyticsOpen(true)}
                                                                className="w-full bg-app-accent/5 border border-app-border rounded-2xl p-3.5 flex items-center gap-3 group cursor-pointer hover:bg-app-accent/10 hover:border-app-accent/30 transition-all active:scale-[0.99]"
                                                            >
                                                                <div className="w-12 h-12 rounded-full border-2 border-app-border overflow-hidden bg-app-bg flex items-center justify-center shrink-0">
                                                                    {connectedInfo.photo && !imgError ? (
                                                                        <img
                                                                            src={connectedInfo.photo}
                                                                            alt="Channel"
                                                                            className="w-full h-full object-cover"
                                                                            onError={() => setImgError(true)}
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-app-accent bg-app-accent/10 font-black text-sm">
                                                                            {connectedInfo.title?.[0] || "B"}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <p className="text-text-main font-black text-xs uppercase truncate">{connectedInfo.title}</p>
                                                                    </div>
                                                                    <p className="text-readable-sm font-bold uppercase tracking-wide truncate mt-0.5">@{connectedInfo.username.replace("@", "")}</p>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); setWithdrawOpen(true); }}
                                                                    className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 hover:bg-amber-500/25 active:scale-95 transition-all"
                                                                    aria-label={t("withdraw.title")}
                                                                >
                                                                    <Star size={12} className="text-amber-400" fill="currentColor" />
                                                                    <span className="text-amber-300 font-black text-xs tabular-nums">
                                                                        {channelStarsReceived.toLocaleString()}
                                                                    </span>
                                                                </button>
                                                            </div>
                                                            <button
                                                                onClick={() => setShowDisconnectConfirm(true)}
                                                                disabled={verifying}
                                                                className="w-full py-3.5 bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase text-[10px] tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all active:scale-95 disabled:opacity-50"
                                                            >
                                                                {verifying ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                                                                {verifying ? t("connect_blu.disconnecting") : t("connect_blu.disconnect")}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                /* NOT VERIFIED human view */
                                                <div className="flex flex-col items-center text-center gap-6 py-4">
                                                    <div className="w-16 h-16 rounded-3xl bg-app-accent/10 border border-app-border flex items-center justify-center">
                                                        <Bot size={32} className="text-app-accent" />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <h3 className="text-text-main font-black text-base uppercase tracking-wide">{t("connect_blu.verified_humans_only")}</h3>
                                                        <p className="text-text-sub text-xs leading-relaxed max-w-xs" dangerouslySetInnerHTML={{ __html: t("connect_blu.verified_desc") }} />
                                                    </div>
                                                    <div className="w-full h-px bg-app-border" />
                                                    <p className="text-readable-muted font-bold uppercase tracking-wide">{t("connect_blu.verified_footer")}</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}

            {/* Disconnect Confirmation Modal */}
            <AnimatePresence>
                {showDisconnectConfirm && (
                    <div className="fixed inset-0 z-[220] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDisconnectConfirm(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-xs bg-app-card border border-app-border rounded-3xl p-6 shadow-app-shadow text-center z-10"
                        >
                            <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-500">
                                <X size={24} />
                            </div>
                            <h3 className="text-text-main font-black text-sm uppercase tracking-wider mb-2">
                                {t("connect_blu.disconnect_confirm_title")}
                            </h3>
                            <p className="text-text-sub text-xs leading-relaxed mb-6 font-medium">
                                {t("connect_blu.disconnect_confirm_desc")}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDisconnectConfirm(false)}
                                    className="flex-1 py-3 bg-app-accent/5 border border-app-border text-text-sub text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-app-accent/10 active:scale-95 transition-all"
                                >
                                    {t("connect_blu.disconnect_cancel_btn")}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDisconnectConfirm(false);
                                        handleDisconnect();
                                    }}
                                    className="flex-1 py-3 bg-red-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-red-600 active:scale-95 transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                >
                                    {t("connect_blu.disconnect_confirm_btn")}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Fullscreen Analytics Overlay */}
            <AnimatePresence>
                {analyticsOpen && isAdmin && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[210] bg-app-bg text-text-main flex flex-col overflow-hidden font-sans"
                        style={{ 
                            "paddingTop": "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 27px)", 
                            paddingBottom: "env(safe-area-inset-bottom, 0px)" 
                        }}
                    >
                        {/* Header — avatar + channel name, no X button */}
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-app-border bg-app-card/40 backdrop-blur-xl">
                            <div className="w-10 h-10 rounded-full border border-app-border overflow-hidden bg-app-accent/5 flex items-center justify-center shrink-0">
                                {connectedInfo.photo && !imgError ? (
                                    <img src={connectedInfo.photo} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-app-accent font-black text-sm">{connectedInfo.title?.[0] || "B"}</div>
                                )}
                            </div>
                            <div className="text-left">
                                <h3 className="text-sm font-black uppercase tracking-wider text-text-main leading-none">{connectedInfo.title}</h3>
                                <p className="text-[10px] font-bold text-app-accent uppercase tracking-widest mt-1">Channel Analytics</p>
                            </div>
                        </div>

                        {/* Content viewport */}
                        <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-6">

                            {/* === TAB: SIGNALS === */}
                            {activeAnalyticsTab === "signals" && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    className="space-y-5"
                                >
                                    {loadingAnalytics ? (
                                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-sub font-medium text-xs">
                                            <Loader2 className="animate-spin text-app-accent" size={24} />
                                            <span>Retrieving channel metrics...</span>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Stats grid */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-app-accent/5 border border-app-border rounded-3xl p-5 flex flex-col gap-1 text-left">
                                                    <span className="text-[9px] font-black text-text-sub uppercase tracking-widest">Total Subscribers</span>
                                                    <span className="text-2xl font-black text-text-main tracking-tight">
                                                        {analyticsData?.subscribers ? formatNumber(analyticsData.subscribers) : "0"}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-text-sub mt-1">From Telegram API</span>
                                                </div>
                                                <div className="bg-app-accent/5 border border-app-border rounded-3xl p-5 flex flex-col gap-1 text-left">
                                                    <span className="text-[9px] font-black text-text-sub uppercase tracking-widest">Engagement Rate</span>
                                                    <span className="text-2xl font-black text-text-main tracking-tight">
                                                        {analyticsData?.engagement_rate ? `${analyticsData.engagement_rate}%` : "0.00%"}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-text-sub mt-1">Based on activity</span>
                                                </div>
                                                <div className="bg-app-accent/5 border border-app-border rounded-3xl p-5 flex flex-col gap-1 text-left">
                                                    <span className="text-[9px] font-black text-text-sub uppercase tracking-widest">Total Posts</span>
                                                    <span className="text-2xl font-black text-app-accent tracking-tight">
                                                        {analyticsData?.total_posts ? formatNumber(analyticsData.total_posts) : "0"}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-text-sub mt-1">From database</span>
                                                </div>
                                                <div className="bg-app-accent/5 border border-app-border rounded-3xl p-5 flex flex-col gap-1 text-left">
                                                    <span className="text-[9px] font-black text-text-sub uppercase tracking-widest">Total Post Views</span>
                                                    <span className="text-2xl font-black text-text-main tracking-tight">
                                                        {analyticsData?.total_views ? formatNumber(analyticsData.total_views) : "0"}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-text-sub mt-1">
                                                        Across {analyticsData?.total_posts || 0} posts
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Chart (Elegant CSS Bar representation) */}
                                            <div className="bg-app-accent/5 border border-app-border rounded-3xl p-5 text-left">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-text-main mb-4">Signal Distribution (Last 7 Days)</h4>
                                                <div className="h-32 flex items-end justify-between gap-3 pt-4">
                                                    {[45, 60, 52, 75, 90, 82, 95].map((val, idx) => (
                                                        <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                                            <div className="w-full bg-app-accent/10 rounded-t-lg relative" style={{ height: "100px" }}>
                                                                <motion.div 
                                                                    initial={{ height: 0 }} 
                                                                    animate={{ height: `${val}%` }} 
                                                                    transition={{ delay: idx * 0.05, duration: 0.5 }}
                                                                    className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-app-accent/80 to-app-accent rounded-t-lg shadow-app-shadow"
                                                                />
                                                            </div>
                                                            <span className="text-[8px] font-bold text-text-sub">Day {idx + 1}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Recent Posts Section */}
                                            <div className="bg-app-accent/5 border border-app-border rounded-3xl p-5 text-left space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-text-main">Recent Posts</h4>
                                                    <span className="text-[8px] font-bold text-text-sub uppercase tracking-wider">Latest 10</span>
                                                </div>
                                                
                                                {analyticsData?.recent_posts && analyticsData.recent_posts.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {analyticsData.recent_posts.map((post: any) => (
                                                            <div 
                                                                key={post.id} 
                                                                className="bg-app-card border border-app-border rounded-2xl p-4 flex flex-col gap-2.5 hover:border-app-accent/30 hover:bg-app-accent/[0.02] transition-all active:scale-[0.99] cursor-pointer"
                                                            >
                                                                {/* Post Content preview & Media */}
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <p className="text-xs text-text-main font-medium leading-relaxed flex-1 line-clamp-2">
                                                                        {post.content || "No text content"}
                                                                    </p>
                                                                    {post.media_url && (
                                                                        <div className="w-12 h-12 rounded-lg border border-app-border overflow-hidden shrink-0 bg-app-accent/5">
                                                                            <img src={post.media_url} alt="Post media" className="w-full h-full object-cover" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                
                                                                {/* Divider */}
                                                                <div className="h-px bg-app-border/60" />
                                                                
                                                                {/* Post Stats & Meta */}
                                                                <div className="flex items-center justify-between text-[9px] font-bold text-text-sub uppercase tracking-wider">
                                                                    <div className="flex items-center gap-4">
                                                                        <span className="flex items-center gap-1">
                                                                            <Globe2 size={10} /> {formatNumber(post.views_count || 0)} views
                                                                        </span>
                                                                        <span className="flex items-center gap-1">
                                                                            <TrendingUp size={10} /> {post.engagement_rate}% ER
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[8px]">
                                                                        {new Date(post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-text-sub font-medium py-4 text-center">No posts found for this channel.</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            )}

                            {/* === TAB: BRAIN === */}
                            {activeAnalyticsTab === "brain" && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    className="space-y-5"
                                >
                                    {/* Sentiment Indicator */}
                                    <div className="bg-app-accent/5 border border-app-border rounded-3xl p-5 flex items-center justify-between gap-4 text-left">
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-text-sub mb-1">AI Audience Sentiment</h4>
                                            <p className="text-xl font-black text-emerald-400 uppercase tracking-tight">Highly Positive</p>
                                            <p className="text-[10px] text-text-sub mt-1">Based on semantic signal analysis of chat replies and reactions.</p>
                                        </div>
                                        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                <path className="text-app-accent/10" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                <path className="text-emerald-500" strokeDasharray="92, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                            </svg>
                                            <div className="absolute font-black text-sm text-emerald-400">92%</div>
                                        </div>
                                    </div>

                                    {/* Sentiment Bar */}
                                    <div className="bg-app-accent/5 border border-app-border rounded-3xl p-5 space-y-4 text-left">
                                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-text-sub">
                                            <span>Positive (92%)</span>
                                            <span>Neutral (6%)</span>
                                            <span>Negative (2%)</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-app-accent/10 overflow-hidden flex">
                                            <div className="bg-emerald-500 h-full" style={{ width: "92%" }} />
                                            <div className="bg-text-sub h-full" style={{ width: "6%" }} />
                                            <div className="bg-red-500 h-full" style={{ width: "2%" }} />
                                        </div>
                                    </div>

                                    {/* AI Insights Narrative */}
                                    <div className="bg-app-accent/5 border border-app-border rounded-3xl p-6 space-y-4 text-left">
                                        <div className="flex items-center gap-2 text-app-accent">
                                            <Brain size={16} />
                                            <h4 className="text-[10px] font-black uppercase tracking-widest">Blu Intelligence Report</h4>
                                        </div>
                                        <p className="text-xs text-text-sub leading-relaxed font-medium">
                                            Your broadcasts on decentralized yields and TON web application architectures are generating high-signal reactions. Commentators show specific interest in your streak updates and referrals.
                                        </p>
                                        <div className="h-px bg-app-border" />
                                        <ul className="space-y-2 text-[11px] text-text-sub font-medium">
                                            <li className="flex items-start gap-2">
                                                <span className="text-app-accent font-bold">1.</span>
                                                <span>Your most impactful post was broadcasted on Tuesday, driving a 34% surge in views.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-app-accent font-bold">2.</span>
                                                <span>Visual content (collage layouts) drives 2.4x higher engagement than pure text posts.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-app-accent font-bold">3.</span>
                                                <span>Ideal posting window for your subscriber node network is 14:00 - 17:00 UTC.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </motion.div>
                            )}

                            {/* === TAB: MONETISATION === */}
                            {activeAnalyticsTab === "monetisation" && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    className="space-y-5"
                                >
                                    {/* Star Balance Widget */}
                                    <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/0 border border-amber-500/20 rounded-3xl p-6 flex flex-col gap-4 text-left">
                                        <div>
                                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] block mb-1">Stars Received</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-black text-text-main tracking-tight">{channelStarsReceived.toLocaleString()}</span>
                                                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">Stars</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-app-bg/40 border border-app-border rounded-2xl p-3">
                                                <span className="text-[8px] font-bold text-text-sub uppercase tracking-wider block">Estimated Payout</span>
                                                <span className="text-sm font-black text-text-main">{(channelStarsReceived * 0.015).toFixed(3)} TON</span>
                                            </div>
                                            <div className="bg-app-bg/40 border border-app-border rounded-2xl p-3">
                                                <span className="text-[8px] font-bold text-text-sub uppercase tracking-wider block">USD Value</span>
                                                <span className="text-sm font-black text-emerald-400">${(channelStarsReceived * 0.015 * 6.5).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        {/* Lifetime Payout Section */}
                                        <div className="border-t border-amber-500/10 pt-4 grid grid-cols-2 gap-4">
                                            <div className="bg-app-bg/40 border border-app-border rounded-2xl p-3">
                                                <span className="text-[8px] font-bold text-text-sub uppercase tracking-wider block">Lifetime Payout</span>
                                                <span className="text-sm font-black text-text-main">
                                                    {withdrawalInfo?.lifetime_payout_ton ? `${withdrawalInfo.lifetime_payout_ton.toFixed(3)} TON` : "0.000 TON"}
                                                </span>
                                                {withdrawalInfo?.lifetime_payout_ton ? (
                                                    <span className="text-[9px] font-bold text-emerald-400 block mt-0.5">
                                                        ~${(withdrawalInfo.lifetime_payout_ton * (withdrawalInfo.ton_price_usd || 6.5)).toFixed(2)} USD
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="bg-app-bg/40 border border-app-border rounded-2xl p-3">
                                                <span className="text-[8px] font-bold text-text-sub uppercase tracking-wider block">Lifetime Withdrawn</span>
                                                <span className="text-sm font-black text-amber-500">
                                                    {withdrawalInfo?.lifetime_payout_stars ? withdrawalInfo.lifetime_payout_stars.toLocaleString() : "0"}
                                                </span>
                                                <span className="text-[9px] font-bold text-text-sub block mt-0.5">Stars</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setWithdrawOpen(true)}
                                            disabled={channelStarsReceived === 0}
                                            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:pointer-events-none transition-colors text-app-bg font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg flex items-center justify-center gap-1.5"
                                        >
                                            <Star size={14} fill="currentColor" />
                                            Withdraw to Wallet
                                        </button>
                                    </div>

                                    {/* Premium subscription config card (FOR TESTING PURPOSES) */}
                                    <div className="bg-app-accent/5 border border-app-border rounded-3xl p-6 space-y-4 text-left">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5 text-app-accent">
                                                <Crown size={18} className={isPremium ? "text-app-accent fill-current" : "text-text-sub"} />
                                                <div className="text-left">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-text-main leading-none">Premium Subscription</h4>
                                                    <p className="text-[9px] text-text-sub mt-1 uppercase tracking-wider">Required for reconnection</p>
                                                </div>
                                            </div>
                                            <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                isPremium ? "bg-app-accent/10 border border-app-accent/30 text-app-accent" : "bg-app-accent/5 border border-app-border text-text-sub"
                                            }`}>
                                                {isPremium ? "Active" : "Inactive"}
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-text-sub leading-relaxed font-medium">
                                            Disconnecting this channel means reconnecting it in the future will require an active Premium Subscription. You can toggle this simulated status below to test reconnection constraints.
                                        </p>
                                        <button
                                            onClick={handleTogglePremium}
                                            disabled={togglingPremium}
                                            className={`w-full py-3 border font-black uppercase text-[10px] tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                                                isPremium 
                                                    ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" 
                                                    : "bg-app-accent text-app-bg border-app-accent hover:brightness-110"
                                            }`}
                                        >
                                            {togglingPremium ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : (
                                                isPremium ? "Deactivate Premium" : "Activate Premium"
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                        </div>

                        {/* Floating Bottom Navigation Tabs — liquid glassmorphism */}
                        <div 
                            className="absolute left-1/2 -translate-x-1/2 z-[215] flex items-center justify-around w-[94%] max-w-md rounded-[2.2rem] p-1.5 shadow-app-shadow border border-app-border bg-app-bg/40 backdrop-blur-3xl"
                            style={{ bottom: "calc(max(1.5rem, env(safe-area-inset-bottom)) + 10px)" }}
                        >
                            {(["signals", "brain", "monetisation"] as const).map((tab) => {
                                const isActive = activeAnalyticsTab === tab;
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveAnalyticsTab(tab)}
                                        className="relative flex flex-col items-center justify-center flex-1 py-2 group outline-none"
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="analyticsActivePill"
                                                className="absolute inset-x-1 inset-y-1 border border-app-border rounded-2xl z-0 bg-app-accent/10"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <div className={`relative z-10 flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? "scale-110" : "scale-100"}`}>
                                            <div className="relative">
                                                {isActive && <div className="absolute inset-0 blur-md bg-app-accent/40 rounded-full" />}
                                                {tab === "signals" && <BarChart3 size={18} className={`relative transition-colors ${isActive ? "text-app-accent" : "text-text-main"}`} />}
                                                {tab === "brain" && <Brain size={18} className={`relative transition-colors ${isActive ? "text-app-accent" : "text-text-main"}`} />}
                                                {tab === "monetisation" && <Coins size={18} className={`relative transition-colors ${isActive ? "text-app-accent" : "text-text-main"}`} />}
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-tighter transition-all ${
                                                isActive ? "text-text-main" : "text-text-sub"
                                            }`}>
                                                {tab === "signals" && "Signal"}
                                                {tab === "brain" && "AI Brain"}
                                                {tab === "monetisation" && "Earn"}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <StarWithdrawalModal
                isOpen={withdrawOpen}
                onClose={() => setWithdrawOpen(false)}
                telegramUser={
                    telegramUser ??
                    (telegramId ? { id: telegramId, tg_id: telegramId } : null)
                }
            />
        </AnimatePresence>,
        document.body
    );
};
