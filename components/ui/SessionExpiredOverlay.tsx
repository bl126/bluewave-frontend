// [CODE: FRONTEND_SESSION_EXPIRED_OVERLAY]
// components/ui/SessionExpiredOverlay.tsx
"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, ShieldAlert } from "lucide-react";

export default function SessionExpiredOverlay() {
    const handleReload = () => {
        window.location.reload();
    };

    // Native Back Button Interceptor -> Reload App
    useEffect(() => {
        const handleNativeBack = (e: Event) => {
            e.preventDefault();
            handleReload();
        };
        window.addEventListener("bwNativeBack", handleNativeBack);
        return () => window.removeEventListener("bwNativeBack", handleNativeBack);
    }, []);

    return (
        <div className="fixed inset-0 z-[10000] flex flex-col justify-end overflow-hidden">
            {/* Backdrop: Soft blurred background */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-[8px]"
            />

            {/* Bottom Sheet Modal */}
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ type: "spring", damping: 26, stiffness: 190 }}
                className="relative w-full z-10 overflow-hidden text-text-main flex flex-col rounded-t-[2.5rem]"
                style={{
                  background: "rgba(0, 0, 0, 0.45)",
                  backdropFilter: "blur(30px) saturate(190%)",
                  WebkitBackdropFilter: "blur(30px) saturate(190%)",
                  borderTop: "1px solid rgba(239, 68, 68, 0.15)",
                  boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 -10px 40px rgba(0, 0, 0, 0.5)"
                }}
            >
                {/* Red warning top ambient glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-red-500/10 blur-[60px] rounded-full pointer-events-none" />

                {/* Drag Handle representation */}
                <div className="w-full flex justify-center pt-4 pb-2">
                    <div className="w-12 h-1.5 bg-white/15 rounded-full" />
                </div>

                <div className="relative p-6 px-8 flex flex-col items-center text-center pb-12">
                    {/* Centered Security Icon in custom frosted glass circle */}
                    <div className="w-20 h-20 relative mb-6 flex items-center justify-center">
                        <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1],
                                rotate: [0, 2, -2, 0],
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="relative z-10 p-4 rounded-full border border-red-500/20 bg-white/5 backdrop-blur-md shadow-lg flex items-center justify-center"
                            style={{
                              boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.15)"
                            }}
                        >
                            <ShieldAlert size={36} className="text-red-500 opacity-90" strokeWidth={1.5} />
                        </motion.div>
                    </div>

                    {/* Typography */}
                    <div className="space-y-3 mb-8 max-w-sm">
                        <h2 className="text-2xl font-bold tracking-tight text-white leading-tight" style={{ letterSpacing: "-0.5px" }}>
                            Session Expired
                        </h2>

                        <div className="flex items-center justify-center gap-2">
                            <div className="h-px w-5 bg-red-500/20" />
                            <span className="text-red-400 font-mono font-bold tracking-[0.25em] text-[9px] uppercase">
                                Auth Protection
                            </span>
                            <div className="h-px w-5 bg-red-500/20" />
                        </div>

                        <p className="text-sm text-white/60 font-normal leading-relaxed px-4 pt-1">
                            Your security session has timed out (24h limit). Please reload the app to generate a fresh secure connection.
                        </p>
                    </div>

                    {/* Action Button */}
                    <div className="w-full max-w-xs space-y-4">
                        <button
                            onClick={handleReload}
                            className="group relative w-full flex items-center justify-center gap-2.5 py-4 bg-white text-black font-semibold text-sm rounded-full transition-all active:scale-[0.97] hover:bg-white/95"
                            style={{
                              boxShadow: "0 4px 20px rgba(255, 255, 255, 0.15)"
                            }}
                        >
                            <RefreshCw size={16} className="text-black group-hover:rotate-180 transition-transform duration-500" />
                            <span className="tracking-tight">Reload App</span>
                        </button>

                        <div className="flex items-center justify-center gap-1.5 text-[9px] text-white/30 font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            Secure Session Required
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
