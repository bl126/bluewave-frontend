import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, AlertTriangle, Key, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { postApi } from "@/lib/useApi";

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

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="w-full max-w-sm rounded-[2rem] border border-cyan-500/30 bg-gradient-to-ob from-cyan-950/60 to-black p-6 relative overflow-hidden shadow-[0_0_50px_rgba(0,230,255,0.15)]"
                >
                    {/* Subtle Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-cyan-500/10 blur-[50px] pointer-events-none" />

                    {step === "intro" && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex flex-col items-center text-center pt-2"
                        >
                            <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,230,255,0.3)]">
                                <ShieldCheck className="text-cyan-400 w-8 h-8" />
                            </div>

                            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-3">
                                Secure Your Account
                            </h2>

                            <div className="space-y-4 text-sm text-cyan-50/70 mb-8 bg-black/40 p-4 rounded-2xl border border-white/5">
                                <p>
                                    Your Bluewave ID is tied to your Telegram account. If you lose access to Telegram or get banned, <strong className="text-cyan-400">you will lose your ecosystem progress and yielded tokens.</strong>
                                </p>
                                <div className="flex gap-2 items-start text-orange-400/90 bg-orange-500/10 p-3 rounded-xl border border-orange-500/20 text-left">
                                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                    <p className="text-xs leading-relaxed">
                                        Set a Recovery Password now to securely link your progress in case of emergencies. Support cannot help you without this.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setStep("form")}
                                className="w-full py-4 rounded-xl bg-cyan-500 text-black font-black uppercase tracking-widest text-sm hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(0,230,255,0.4)]"
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
                                <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
                                    <Key className="text-cyan-400 w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-black text-white uppercase tracking-wider">
                                    Recovery Password
                                </h2>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-cyan-400/60 ml-2">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Minimum 6 characters"
                                            className="w-full bg-black/50 border border-cyan-500/30 rounded-xl py-3.5 pl-11 pr-11 text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-cyan-950/30 transition-colors"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-500/50 hover:text-cyan-300 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-cyan-400/60 ml-2">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50" />
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Repeat password"
                                            className="w-full bg-black/50 border border-cyan-500/30 rounded-xl py-3.5 pl-11 pr-11 text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-cyan-950/30 transition-colors"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(v => !v)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-500/50 hover:text-cyan-300 transition-colors"
                                        >
                                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                        className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2 rounded-lg border border-red-500/20"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-xl bg-cyan-500 text-black font-black uppercase tracking-widest text-sm hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(0,230,255,0.2)] mt-auto"
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
                                className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)] text-emerald-400"
                            >
                                <CheckCircle2 className="w-10 h-10" />
                            </motion.div>
                            <h2 className="text-xl font-black text-emerald-400 uppercase tracking-widest mb-2">
                                Secured
                            </h2>
                            <p className="text-sm text-cyan-50/70">
                                Your account recovery password has been saved. You may now continue to the app.
                            </p>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
