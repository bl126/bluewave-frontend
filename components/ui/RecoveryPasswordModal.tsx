import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, AlertTriangle, Key, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { postApi } from "@/lib/useApi";
import { useTheme } from "@/contexts/ThemeContext";

interface RecoveryPasswordModalProps {
    isOpen: boolean;
    telegramId: number;
    onSuccess: () => void;
}

export default function RecoveryPasswordModal({ isOpen, telegramId, onSuccess }: RecoveryPasswordModalProps) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<"intro" | "form" | "success">("intro");
    const { theme } = useTheme();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await postApi("/user/set_recovery_password", {
                telegram_id: telegramId,
                password
            });

            if (data.error) {
                throw new Error(data.error);
            }

            setStep("success");

            // Haptic feedback
            const tg = (window as any).Telegram?.WebApp;
            if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");

            setTimeout(() => {
                onSuccess();
            }, 2500);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Native Back Button Interceptor -> Close App (mandatory lock screen)
    useEffect(() => {
        if (!isOpen) return;
        const handleNativeBack = (e: Event) => {
            e.preventDefault();
            const tg = (window as any).Telegram?.WebApp;
            if (tg) {
                tg.close();
            }
        };
        window.addEventListener("bwNativeBack", handleNativeBack);
        return () => window.removeEventListener("bwNativeBack", handleNativeBack);
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex flex-col justify-end overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[8px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Bottom Sheet Modal using Frosted / Liquid Glass principles */}
                    <motion.div
                        className="relative w-full z-10 overflow-hidden text-text-main flex flex-col rounded-t-[2.5rem] pb-safe"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 26, stiffness: 190 }}
                        style={{
                          background: "rgba(0, 0, 0, 0.45)",
                          backdropFilter: "blur(30px) saturate(190%)",
                          WebkitBackdropFilter: "blur(30px) saturate(190%)",
                          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                          boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 -10px 40px rgba(0, 0, 0, 0.5)"
                        }}
                    >
                        {/* Specular Liquid Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-app-accent/5 blur-[60px] rounded-full pointer-events-none" />

                        {/* Drag Handle */}
                        <div className="w-full flex justify-center pt-4 pb-2">
                            <div className="w-12 h-1.5 bg-white/15 rounded-full" />
                        </div>

                        <div className="relative p-6 px-8 flex flex-col pb-12">
                            {step === "intro" && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex flex-col items-center text-center pt-2"
                                >
                                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-lg"
                                         style={{ boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.15)" }}>
                                        <ShieldCheck className="text-white opacity-95 w-8 h-8" strokeWidth={1.5} />
                                    </div>

                                    <h2 className="text-2xl font-bold tracking-tight text-white leading-tight mb-3" style={{ letterSpacing: "-0.5px" }}>
                                        Secure Your Account
                                    </h2>

                                    <div className="space-y-4 text-sm text-white/70 mb-8 bg-white/5 p-4 rounded-2xl border border-white/5 text-center leading-relaxed">
                                        <p>
                                            Your Bluewave ID is tied to your Telegram account. If you lose access to Telegram, <strong className="text-white">you will lose your ecosystem progress and yielded tokens.</strong>
                                        </p>
                                        <div className="flex gap-3 items-start text-orange-400/90 bg-orange-500/10 p-3.5 rounded-xl border border-orange-500/20 text-left">
                                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                            <p className="text-xs leading-relaxed font-semibold uppercase tracking-tight">
                                                Set a Recovery Password now to securely link your progress in case of emergencies. Support cannot help you without this.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setStep("form")}
                                        className="w-full max-w-xs py-4 bg-white text-black font-semibold text-sm rounded-full transition-all active:scale-[0.97] hover:bg-white/95"
                                        style={{
                                          boxShadow: "0 4px 20px rgba(255, 255, 255, 0.15)"
                                        }}
                                    >
                                        Set Password Now
                                    </button>
                                </motion.div>
                            )}

                            {step === "form" && (
                                <motion.form
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onSubmit={handleSubmit}
                                    className="flex flex-col pt-2"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-md">
                                            <Key className="text-white opacity-85 w-5 h-5" strokeWidth={1.5} />
                                        </div>
                                        <h2 className="text-xl font-bold text-white tracking-tight" style={{ letterSpacing: "-0.4px" }}>
                                            Recovery Password
                                        </h2>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-bold uppercase tracking-wider text-white/50 ml-2">New Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="Minimum 6 characters"
                                                    className="w-full bg-black/45 border border-white/10 rounded-xl py-3.5 pl-11 pr-11 text-white text-sm focus:outline-none focus:border-white/30 focus:bg-white/5 transition-colors"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(v => !v)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-bold uppercase tracking-wider text-white/50 ml-2">Confirm Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                                <input
                                                    type={showConfirm ? "text" : "password"}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Repeat password"
                                                    className="w-full bg-black/45 border border-white/10 rounded-xl py-3.5 pl-11 pr-11 text-white text-sm focus:outline-none focus:border-white/30 focus:bg-white/5 transition-colors"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirm(v => !v)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                                >
                                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                                className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2.5 rounded-xl border border-red-500/20"
                                            >
                                                {error}
                                            </motion.div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 bg-white text-black font-semibold text-sm rounded-full transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/95"
                                        style={{
                                          boxShadow: "0 4px 20px rgba(255, 255, 255, 0.15)"
                                        }}
                                    >
                                        {loading ? "Saving..." : "Save Securely"}
                                    </button>
                                </motion.form>
                            )}

                            {step === "success" && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center text-center py-8"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                                        className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-lg text-emerald-400"
                                    >
                                        <CheckCircle2 className="w-10 h-10 text-emerald-500 opacity-95" strokeWidth={1.5} />
                                    </motion.div>
                                    <h2 className="text-2xl font-bold tracking-tight text-white leading-tight mb-2" style={{ letterSpacing: "-0.5px" }}>
                                        Secured
                                    </h2>
                                    <p className="text-sm text-white/60 leading-relaxed px-4 pt-1 max-w-xs">
                                        Your account recovery password has been saved. You may now continue to the app.
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
