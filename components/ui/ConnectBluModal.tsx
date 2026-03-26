"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Send, Check, Loader2, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { postApi } from "@/lib/useApi";
import { useLanguage } from "@/contexts/LanguageContext";

interface ConnectBluModalProps {
    isOpen: boolean;
    onClose: () => void;
    telegramId: number | null;
    isHumanVerified: boolean;
    alreadyConnected?: string | null;
    channelTitle?: string | null;
    channelPhoto?: string | null;
}

export default function ConnectBluModal({
    isOpen,
    onClose,
    telegramId,
    isHumanVerified,
    alreadyConnected,
    channelTitle,
    channelPhoto,
}: ConnectBluModalProps) {
    const [view, setView] = useState<"main" | "telegram">("main");
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
    const { t } = useLanguage();

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

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 z-[201] flex items-center justify-center p-6 pointer-events-none"
                    >
                        <div className="w-full max-w-sm bg-black border border-cyan-500/20 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)] pointer-events-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-6 pb-4">
                                <div>
                                    <h2 className="text-white font-black text-lg uppercase tracking-tight">{t("connect_blu.title")}</h2>
                                    <p className="text-cyan-500/50 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">{t("connect_blu.subtitle")}</p>
                                </div>
                                <button onClick={handleClose} className="p-2 rounded-xl bg-white/5 text-cyan-500/40 hover:text-cyan-400 transition-colors">
                                    <X size={18} />
                                </button>
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
                                                className="w-full flex items-center gap-4 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 transition-all active:scale-[0.98] group"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                                                    <Send size={22} className="text-cyan-400" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="text-white font-black text-sm uppercase tracking-wide">{t("connect_blu.connect_tg")}</p>
                                                    <p className="text-cyan-500/50 text-[10px] font-bold uppercase tracking-wider mt-0.5">{t("connect_blu.connect_tg_desc")}</p>
                                                </div>
                                                <ChevronRight size={16} className="text-cyan-500/30 group-hover:text-cyan-400 transition-colors" />
                                            </button>

                                            {/* Connect X — Coming Soon */}
                                            <div className="w-full flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4 opacity-50 cursor-not-allowed relative overflow-hidden">
                                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[22px] h-[22px] text-white/40" fill="currentColor">
                                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                                                    </svg>
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="text-white/50 font-black text-sm uppercase tracking-wide">{t("connect_blu.connect_x")}</p>
                                                    <p className="text-white/20 text-[10px] font-bold uppercase tracking-wider mt-0.5">{t("connect_blu.social_verification")}</p>
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/30">
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
                                                className="flex items-center gap-1 text-cyan-500/50 text-[10px] font-black uppercase tracking-widest hover:text-cyan-400 transition-colors self-start"
                                            >
                                                {t("connect_blu.back")}
                                            </button>

                                            {/* VERIFIED human view */}
                                            {isHumanVerified ? (
                                                <div className="flex flex-col gap-4">
                                                    {/* Criteria */}
                                                    <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-2xl p-4 flex flex-col gap-3">
                                                        <p className="text-cyan-400 text-[10px] font-black uppercase tracking-widest">{t("connect_blu.requirements")}</p>
                                                        <ul className="space-y-2 text-xs text-cyan-100/70 font-medium">
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-cyan-500 font-black">01</span>
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
                                                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold hover:bg-cyan-500/20 transition-all active:scale-95"
                                                                    >
                                                                        {t("connect_blu.req_1_bot")}
                                                                        <span id="copy-bot-btn" className="text-[7px] bg-cyan-500 text-black px-1 rounded ml-1">{t("connect_blu.copy")}</span>
                                                                    </button>{" "}
                                                                    {t("connect_blu.req_1_suffix")}
                                                                </span>
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-cyan-500 font-black">02</span>
                                                                <span className="flex-1 leading-snug">{t("connect_blu.req_2")}</span>
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-cyan-500 font-black">03</span>
                                                                <span className="flex-1 leading-snug">{t("connect_blu.req_3")}</span>
                                                            </li>
                                                        </ul>
                                                    </div>

                                                    {/* Benefits */}
                                                    <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
                                                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{t("connect_blu.benefits")}</p>
                                                        <ul className="space-y-1 text-[11px] text-white/50 font-medium">
                                                            <li>{t("connect_blu.ben_1")}</li>
                                                            <li>{t("connect_blu.ben_2")}</li>
                                                            <li>{t("connect_blu.ben_3")}</li>
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
                                                                className="w-full bg-black/50 border border-cyan-500/20 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-cyan-500/20 focus:outline-none focus:border-cyan-500/50"
                                                            />
                                                            {error && <p className="text-red-400/80 text-[10px] font-bold uppercase">{error}</p>}
                                                            <button
                                                                onClick={handleVerify}
                                                                disabled={verifying || !channelInput.trim()}
                                                                className="w-full h-13 py-3.5 bg-cyan-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                                            >
                                                                {verifying ? <><Loader2 size={16} className="animate-spin" /> {t("connect_blu.verifying")}</> : t("connect_blu.verify_btn")}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-4">
                                                            <div className="w-full bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-3.5 flex items-center gap-3 group">
                                                                <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 overflow-hidden bg-black flex items-center justify-center shrink-0">
                                                                    {connectedInfo.photo && !imgError ? (
                                                                        <img
                                                                            src={connectedInfo.photo}
                                                                            alt="Channel"
                                                                            className="w-full h-full object-cover"
                                                                            onError={() => setImgError(true)}
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-cyan-500 bg-cyan-500/10 font-black text-sm">
                                                                            {connectedInfo.title?.[0] || "B"}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <p className="text-white font-black text-xs uppercase truncate">{connectedInfo.title}</p>
                                                                        <div className="p-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 opacity-40">
                                                                            <Check size={8} className="text-cyan-400" />
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-cyan-500/40 text-[9px] font-bold uppercase tracking-widest truncate mt-0.5">@{connectedInfo.username.replace("@", "")}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={handleDisconnect}
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
                                                    <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                                        <Bot size={32} className="text-cyan-400" />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <h3 className="text-white font-black text-base uppercase tracking-wide">{t("connect_blu.verified_humans_only")}</h3>
                                                        <p className="text-cyan-100/50 text-xs leading-relaxed max-w-xs" dangerouslySetInnerHTML={{ __html: t("connect_blu.verified_desc") }} />
                                                    </div>
                                                    <div className="w-full h-px bg-cyan-500/10" />
                                                    <p className="text-cyan-500/30 text-[9px] font-black uppercase tracking-widest">{t("connect_blu.verified_footer")}</p>
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
        </AnimatePresence>
    );
}
