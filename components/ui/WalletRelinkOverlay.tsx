"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Key, Lock, Eye, EyeOff, CheckCircle2, MessageCircle, ExternalLink, AlertTriangle, Loader2 } from "lucide-react";

interface WalletRelinkOverlayProps {
    bwId: string;
    onVerified: () => void;
}

export default function WalletRelinkOverlay({ bwId: initialBwId, onVerified }: WalletRelinkOverlayProps) {
    const [bwId, setBwId] = useState(initialBwId || "");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
    const [step, setStep] = useState<"form" | "success">("form");
    
    // Lockout state
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutRemaining, setLockoutRemaining] = useState(0);

    const supportLink = "https://t.me/Bluewavesupport1";

    // 1. Sync pre-filled BW ID if it updates from props
    useEffect(() => {
        if (initialBwId) {
            setBwId(initialBwId);
        }
    }, [initialBwId]);

    // 2. Local Lockout Check (on Mount and BW ID change)
    useEffect(() => {
        if (!bwId) return;

        const checkLockout = () => {
            const lockoutKey = `relink_lockout_${bwId}`;
            const storedLockout = localStorage.getItem(lockoutKey);
            
            if (storedLockout) {
                const expiry = parseInt(storedLockout, 10);
                const now = Math.floor(Date.now() / 1000);
                
                if (now < expiry) {
                    setIsLocked(true);
                    setLockoutRemaining(expiry - now);
                    return true;
                } else {
                    // Lockout expired
                    localStorage.removeItem(lockoutKey);
                    localStorage.removeItem(`relink_attempts_${bwId}`);
                    setIsLocked(false);
                    setLockoutRemaining(0);
                    setAttemptsLeft(5);
                }
            } else {
                setIsLocked(false);
                setLockoutRemaining(0);
            }
            return false;
        };

        const active = checkLockout();

        // If locked, start a countdown interval
        if (active) {
            const interval = setInterval(() => {
                const expired = checkLockout();
                if (!expired) {
                    clearInterval(interval);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [bwId]);

    // Format lockout timer display (MM:SS)
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bwId.trim()) {
            setError("BW ID is required.");
            return;
        }
        if (!password) {
            setError("Password is required.");
            return;
        }

        setLoading(true);
        setError(null);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const url = `${apiUrl}/api/user/verify_wallet_relink`;

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    bw_id: bwId.trim(),
                    password: password
                })
            });

            const json = await res.json();

            if (!res.ok) {
                // Handle rate-limiting / lockout from server
                if (res.status === 403 && json.detail?.error === "LOCKED") {
                    const remaining = json.detail.remaining_seconds || 1800;
                    const expiry = Math.floor(Date.now() / 1000) + remaining;
                    
                    localStorage.setItem(`relink_lockout_${bwId}`, expiry.toString());
                    setIsLocked(true);
                    setLockoutRemaining(remaining);
                    throw new Error(json.detail.message || "Too many failed attempts. Account locked.");
                }

                // Handle credentials mismatch
                if (res.status === 401 && json.detail?.error === "INVALID_CREDENTIALS") {
                    const left = json.detail.attempts_left !== undefined ? json.detail.attempts_left : 5;
                    setAttemptsLeft(left);
                    
                    // Sync attempts with local storage
                    const localAttempts = 5 - left;
                    localStorage.setItem(`relink_attempts_${bwId}`, localAttempts.toString());

                    if (left <= 0) {
                        const expiry = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
                        localStorage.setItem(`relink_lockout_${bwId}`, expiry.toString());
                        setIsLocked(true);
                        setLockoutRemaining(1800);
                        throw new Error("Too many failed attempts. Try again in 30 minutes or contact support.");
                    }

                    throw new Error(`Incorrect password. ${left} attempts remaining.`);
                }

                throw new Error(json.detail?.message || json.detail || "Verification failed. Check credentials.");
            }

            // Success! Clear local attempts/lockout
            localStorage.removeItem(`relink_lockout_${bwId}`);
            localStorage.removeItem(`relink_attempts_${bwId}`);
            
            setStep("success");

            // Telegram haptic feedback
            const tg = (window as any).Telegram?.WebApp;
            if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");

            setTimeout(() => {
                onVerified();
            }, 2500);

        } catch (err: any) {
            setError(err.message || "An error occurred during verification.");
            
            // Telegram error haptic feedback
            const tg = (window as any).Telegram?.WebApp;
            if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 overflow-hidden">
            {/* Dark heavy backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/95 backdrop-blur-xl pointer-events-auto"
            />

            {/* Main overlay modal card */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-sm bg-app-card border border-app-border rounded-[3rem] overflow-hidden shadow-app-shadow pointer-events-auto z-10"
            >
                {/* Subtle Amber Top Glow for Alert/Verification focus */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-app-accent/5 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative p-8 flex flex-col items-center">
                    
                    <AnimatePresence mode="wait">
                        {isLocked ? (
                            /* Lockout Screen */
                            <motion.div
                                key="locked"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex flex-col items-center text-center w-full"
                            >
                                <div className="w-20 h-20 relative mb-6 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse" />
                                    <div className="relative z-10 bg-red-500/10 border border-red-500/30 text-red-500 p-5 rounded-3xl shadow-app-shadow">
                                        <Lock size={36} className="animate-bounce" />
                                    </div>
                                </div>

                                <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase mb-3">
                                    Security Lockout
                                </h2>

                                <div className="flex items-center justify-center gap-2 mb-6">
                                    <div className="h-px w-6 bg-app-border" />
                                    <span className="text-red-400 font-mono font-bold tracking-[0.3em] text-[10px] uppercase animate-pulse">
                                        System Locked
                                    </span>
                                    <div className="h-px w-6 bg-app-border" />
                                </div>

                                <div className="w-full bg-red-500/5 border border-red-500/10 rounded-2xl p-5 mb-8 space-y-4">
                                    <p className="text-xs text-text-sub font-medium leading-relaxed">
                                        Too many failed password attempts. For security, please try again in:
                                    </p>
                                    <div className="text-4xl font-mono font-black text-red-400 tracking-wider">
                                        {formatTime(lockoutRemaining)}
                                    </div>
                                    <p className="text-[10px] text-text-sub/50 leading-relaxed font-semibold">
                                        Your assets are safe. If you forgot your password, please contact support directly.
                                    </p>
                                </div>

                                <div className="w-full space-y-4">
                                    <a
                                        href={supportLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative w-full flex items-center justify-center gap-3 py-4 bg-app-accent hover:opacity-90 text-app-bg font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-app-shadow text-sm"
                                    >
                                        <MessageCircle size={18} fill="currentColor" />
                                        <span>Contact Support</span>
                                        <ExternalLink size={12} className="opacity-50" />
                                    </a>

                                    <div className="flex items-center justify-center gap-2 text-[9px] text-text-sub/40 font-bold uppercase tracking-widest">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                        Locked for 30 minutes
                                    </div>
                                </div>
                            </motion.div>
                        ) : step === "form" ? (
                            /* Form Entry Screen */
                            <motion.form
                                key="form"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onSubmit={handleVerify}
                                className="flex flex-col items-center w-full"
                            >
                                <div className="w-20 h-20 relative mb-6 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-app-accent/20 blur-2xl rounded-full" />
                                    <div className="relative z-10 bg-app-accent text-app-bg p-5 rounded-3xl shadow-app-shadow">
                                        <ShieldAlert size={36} strokeWidth={2.5} />
                                    </div>
                                </div>

                                <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase text-center mb-1">
                                    Wallet Recovery
                                </h2>
                                <p className="text-[10px] text-app-accent font-mono font-bold tracking-[0.2em] uppercase mb-6 text-center">
                                    Action Required
                                </p>

                                <p className="text-xs text-text-sub font-medium leading-relaxed text-center mb-6 px-2">
                                    Your wallet was unlinked by administration. Verify your identity with your <strong>Recovery Password</strong> to reconnect your wallet.
                                </p>

                                <div className="w-full space-y-4 mb-6">
                                    {/* BW ID Field (Pre-filled, disabled/read-only for security) */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-app-accent/60 ml-2">
                                            Bluewave ID
                                        </label>
                                        <div className="relative">
                                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-app-accent/40" />
                                            <input
                                                type="text"
                                                value={bwId}
                                                disabled
                                                className="w-full bg-app-bg/30 border border-app-border/40 text-text-sub/50 font-mono font-bold rounded-xl py-3.5 pl-11 pr-4 text-sm focus:outline-none cursor-not-allowed opacity-80"
                                            />
                                        </div>
                                    </div>

                                    {/* Password Field */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center px-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-app-accent/60">
                                                Recovery Password
                                            </label>
                                            {attemptsLeft !== null && (
                                                <span className="text-[9px] text-red-400 font-bold uppercase tracking-widest animate-pulse">
                                                    {attemptsLeft} attempts remaining
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-app-accent/50" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Enter recovery password"
                                                className="w-full bg-app-bg/50 border border-app-border rounded-xl py-3.5 pl-11 pr-11 text-text-main text-sm focus:outline-none focus:border-app-accent focus:bg-app-accent/5 transition-all duration-200"
                                                required
                                                disabled={loading}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(v => !v)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-sub/50 hover:text-app-accent transition-colors"
                                                disabled={loading}
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-400 text-xs font-bold text-center bg-red-500/10 py-3 px-4 rounded-xl border border-red-500/20 leading-relaxed"
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 rounded-xl bg-app-accent text-app-bg font-black uppercase tracking-widest text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-app-shadow flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Verifying...</span>
                                        </>
                                    ) : (
                                        <span>Verify & Reconnect</span>
                                    )}
                                </button>
                                
                                <div className="mt-4 flex items-center justify-center gap-2 text-[9px] text-text-sub/40 font-bold uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 rounded-full bg-app-border animate-pulse" />
                                    Encrypted Verification Protocol
                                </div>
                            </motion.form>
                        ) : (
                            /* Success Screen */
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center text-center py-8 w-full"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", delay: 0.1 }}
                                    className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)] text-emerald-400"
                                >
                                    <CheckCircle2 className="w-12 h-12 animate-pulse" />
                                </motion.div>
                                <h2 className="text-2xl font-black text-emerald-500 uppercase tracking-widest mb-3">
                                    Verified
                                </h2>
                                <p className="text-xs text-text-sub px-4 font-semibold leading-relaxed">
                                    Identity verified successfully! You can now link a new wallet to your BW ID.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>

                {/* Ambient Bottom Detail */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${isLocked ? "from-transparent via-red-500 to-transparent opacity-40 animate-pulse" : "from-transparent via-app-accent to-transparent opacity-50"}`} />
            </motion.div>
        </div>
    );
}
