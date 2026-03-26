// [CODE: FRONTEND_SESSION_EXPIRED_OVERLAY]
// components/ui/SessionExpiredOverlay.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { RefreshCw, ShieldAlert, LogOut } from "lucide-react";

export default function SessionExpiredOverlay() {
    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 overflow-hidden">
            {/* Heavy Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/98 backdrop-blur-2xl"
            />

            {/* Main Modal Card */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-sm bg-gradient-to-b from-red-950/40 to-black border border-red-500/30 rounded-[3rem] overflow-hidden shadow-[0_0_100px_-20px_rgba(239,68,68,0.4)]"
            >
                {/* Ambient Top Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-500/20 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative p-8 flex flex-col items-center text-center">
                    {/* Centered Security Icon */}
                    <div className="w-24 h-24 relative mb-6 flex items-center justify-center">
                        <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0],
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="relative z-10 bg-red-500 text-white p-5 rounded-3xl shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                        >
                            <ShieldAlert size={40} strokeWidth={2.5} />
                        </motion.div>
                    </div>

                    {/* Typography */}
                    <div className="space-y-4 mb-10">
                        <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase">
                            Session Expired
                        </h2>

                        <div className="flex items-center justify-center gap-2">
                            <div className="h-px w-6 bg-red-900" />
                            <span className="text-red-400 font-mono font-bold tracking-[0.3em] text-[10px] uppercase">
                                Auth Protection
                            </span>
                            <div className="h-px w-6 bg-red-900" />
                        </div>

                        <p className="text-sm text-red-100/70 font-medium leading-relaxed px-4">
                            Your security session has timed out (24h limit). Please reload the app to generate a fresh connection.
                        </p>
                    </div>

                    {/* Action Button */}
                    <div className="w-full space-y-4">
                        <button
                            onClick={handleReload}
                            className="group relative w-full flex items-center justify-center gap-3 py-4 bg-white hover:bg-gray-100 text-black font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                        >
                            <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                            <span>Reload App</span>
                        </button>

                        <div className="flex items-center justify-center gap-2 text-[9px] text-red-900 font-bold uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-900 animate-pulse" />
                            Secure Session Required
                        </div>
                    </div>
                </div>

                {/* Bottom Detail */}
                <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-red-500 to-transparent" />
            </motion.div>

            {/* Background Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0.1, y: Math.random() * 1000 }}
                        animate={{
                            y: [null, -100],
                            opacity: [0.05, 0.2, 0.05],
                        }}
                        transition={{
                            duration: 8 + Math.random() * 10,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                        }}
                        className="absolute w-px h-16 bg-gradient-to-b from-red-500/0 via-red-500/20 to-red-500/0"
                        style={{ left: `${Math.random() * 100}%` }}
                    />
                ))}
            </div>
        </div>
    );
}
