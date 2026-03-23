"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Send, Twitter, Check, Loader2, ChevronRight } from "lucide-react";
import { useState } from "react";
import { postApi } from "@/lib/useApi";

interface ConnectBluModalProps {
    isOpen: boolean;
    onClose: () => void;
    telegramId: number | null;
    isHumanVerified: boolean;
    alreadyConnected?: string | null; // channel username if already connected
}

export default function ConnectBluModal({
    isOpen,
    onClose,
    telegramId,
    isHumanVerified,
    alreadyConnected,
}: ConnectBluModalProps) {
    const [view, setView] = useState<"main" | "telegram">("main");
    const [channelInput, setChannelInput] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(!!alreadyConnected);
    const [error, setError] = useState("");

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
            } else {
                setError(res.error || "Verification failed. Make sure Blu bot is an admin.");
            }
        } catch {
            setError("Connection error. Please try again.");
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
                        <div className="w-full max-w-sm bg-gradient-to-b from-[#0a1a25] to-[#040c12] border border-cyan-500/30 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-6 pb-4">
                                <div>
                                    <h2 className="text-white font-black text-lg uppercase tracking-tight">Connect Blu</h2>
                                    <p className="text-cyan-500/50 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">Bluewave Intelligence Agent</p>
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
                                                    <p className="text-white font-black text-sm uppercase tracking-wide">Connect Telegram Channel</p>
                                                    <p className="text-cyan-500/50 text-[10px] font-bold uppercase tracking-wider mt-0.5">Link your channel to Blu Agent</p>
                                                </div>
                                                <ChevronRight size={16} className="text-cyan-500/30 group-hover:text-cyan-400 transition-colors" />
                                            </button>

                                            {/* Connect X — Coming Soon */}
                                            <div className="w-full flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4 opacity-50 cursor-not-allowed relative overflow-hidden">
                                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                    <Twitter size={22} className="text-white/40" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="text-white/50 font-black text-sm uppercase tracking-wide">Connect X</p>
                                                    <p className="text-white/20 text-[10px] font-bold uppercase tracking-wider mt-0.5">Social verification</p>
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/30">
                                                    Coming Soon
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
                                                ← Back
                                            </button>

                                            {/* VERIFIED human view */}
                                            {isHumanVerified ? (
                                                <div className="flex flex-col gap-4">
                                                    {/* Criteria */}
                                                    <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-2xl p-4 flex flex-col gap-3">
                                                        <p className="text-cyan-400 text-[10px] font-black uppercase tracking-widest">Requirements</p>
                                                        <ul className="space-y-2 text-xs text-cyan-100/70 font-medium">
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-cyan-500 font-black">01</span>
                                                                Add{" "}
                                                                <button
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText("@blu_presencebot");
                                                                        const btn = document.getElementById("copy-bot-btn");
                                                                        if (btn) {
                                                                            btn.innerText = "COPIED!";
                                                                            setTimeout(() => btn.innerText = "COPY", 2000);
                                                                        }
                                                                    }}
                                                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold hover:bg-cyan-500/20 transition-all active:scale-95"
                                                                >
                                                                    @blu_presencebot
                                                                    <span id="copy-bot-btn" className="text-[7px] bg-cyan-500 text-black px-1 rounded ml-1">COPY</span>
                                                                </button>{" "}
                                                                as an admin in your channel.
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-cyan-500 font-black">02</span>
                                                                Grant permissions: Post Messages & Delete Messages.
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-cyan-500 font-black">03</span>
                                                                Enter your channel username below and tap Verify.
                                                            </li>
                                                        </ul>
                                                    </div>

                                                    {/* Benefits */}
                                                    <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
                                                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Agent Benefits</p>
                                                        <ul className="space-y-1 text-[11px] text-white/50 font-medium">
                                                            <li>• Verified Human Distribution</li>
                                                            <li>• Advanced channel analytics</li>
                                                            <li>• Sentiment tracking & AI insights</li>
                                                        </ul>
                                                    </div>

                                                    {/* Input + Button */}
                                                    {!verified ? (
                                                        <div className="flex flex-col gap-3">
                                                            <input
                                                                type="text"
                                                                placeholder="@yourchannel"
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
                                                                {verifying ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : "Verify Channel"}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button disabled className="w-full py-3.5 bg-green-500/20 border border-green-500/40 text-green-400 font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-2 cursor-default">
                                                            <Check size={16} />
                                                            Done
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                /* NOT VERIFIED human view */
                                                <div className="flex flex-col items-center text-center gap-6 py-4">
                                                    <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                                        <Bot size={32} className="text-cyan-400" />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <h3 className="text-white font-black text-base uppercase tracking-wide">Verified Humans Only</h3>
                                                        <p className="text-cyan-100/50 text-xs leading-relaxed max-w-xs">
                                                            Connecting your Telegram channel is reserved for <span className="text-cyan-400 font-bold">Verified Humans</span>. Stay consistent with your <span className="text-cyan-400 font-bold">Presence</span> and <span className="text-cyan-400 font-bold">Social</span> missions and build your network to pass BlueWave Human Verification.
                                                        </p>
                                                    </div>
                                                    <div className="w-full h-px bg-cyan-500/10" />
                                                    <p className="text-cyan-500/30 text-[9px] font-black uppercase tracking-widest">Complete missions → Get Verified → Connect Channel</p>
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
