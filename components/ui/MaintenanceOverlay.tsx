"use client";

import React from "react";
import { motion } from "framer-motion";
import { Hammer, MessageCircle, ExternalLink } from "lucide-react";

export default function MaintenanceOverlay() {
    const telegramLink = "https://t.me/bluewaveprotocol";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 overflow-hidden">
            {/* Heavy Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />

            {/* Main Modal Card */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-sm bg-app-card border border-app-border rounded-[3rem] overflow-hidden shadow-app-shadow"
            >
                {/* Ambient Top Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-app-accent/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative p-8 flex flex-col items-center text-center">

                    {/* Centered Hammer Icon */}
                    <div className="w-24 h-24 relative mb-6 flex items-center justify-center">
                        <div className="absolute inset-0 bg-app-accent/20 blur-2xl rounded-full" />
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, -10, 0]
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="relative z-10 bg-app-accent text-app-bg p-5 rounded-3xl shadow-app-shadow"
                        >
                            <Hammer size={40} strokeWidth={2.5} />
                        </motion.div>
                    </div>

                    {/* Typography */}
                    <div className="space-y-4 mb-8">
                        <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase italic">
                            Magic in Progress
                        </h2>

                        <div className="flex items-center justify-center gap-2">
                            <div className="h-px w-6 bg-app-border" />
                            <span className="text-app-accent font-mono font-bold tracking-[0.3em] text-[10px] uppercase">
                                System Evolution
                            </span>
                            <div className="h-px w-6 bg-app-border" />
                        </div>

                        <p className="text-sm text-text-sub font-medium leading-relaxed px-2">
                            Mini app under maintenance, we&apos;re cooking some magic with the app, please give us some time and follow update in the telegram community
                        </p>
                    </div>

                    {/* Action Button */}
                    <div className="w-full space-y-4">
                        <a
                            href={telegramLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative w-full flex items-center justify-center gap-3 py-4 bg-app-accent hover:opacity-90 text-app-bg font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-app-shadow"
                        >
                            <MessageCircle size={20} fill="currentColor" />
                            <span>Join Community</span>
                            <ExternalLink size={14} className="opacity-50" />
                        </a>

                        <div className="flex items-center justify-center gap-2 text-[9px] text-text-sub/40 font-bold uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-app-border animate-pulse" />
                            Encrypted Protocol Secure
                        </div>
                    </div>
                </div>

                {/* Bottom Detail */}
                <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-app-accent to-transparent opacity-50" />
            </motion.div>

            {/* Background Micro-details */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0.1, y: Math.random() * 1000 }}
                        animate={{
                            y: [null, -100],
                            opacity: [0.1, 0.3, 0.1]
                        }}
                        transition={{
                            duration: 5 + Math.random() * 10,
                            repeat: Infinity,
                            delay: Math.random() * 5
                        }}
                        className="absolute w-px h-12 bg-gradient-to-b from-app-accent/0 via-app-accent/20 to-app-accent/0"
                        style={{ left: `${Math.random() * 100}%` }}
                    />
                ))}
            </div>
        </div>
    );
}
