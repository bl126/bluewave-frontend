"use client";

import React from "react";
import { motion } from "framer-motion";
import { Hammer, MessageCircle, ExternalLink } from "lucide-react";
import BluewaveGlobe from "./BluewaveGlobe";

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
                className="relative w-full max-w-sm bg-gradient-to-b from-cyan-950/90 to-black border border-cyan-500/30 rounded-[3rem] overflow-hidden shadow-[0_0_80px_-20px_rgba(6,182,212,0.4)]"
            >
                {/* Ambient Top Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative p-8 flex flex-col items-center text-center">

                    {/* Pulsing Visual */}
                    <div className="w-48 h-48 relative mb-6">
                        <BluewaveGlobe />
                        <motion.div
                            animate={{
                                scale: [1, 1.15, 1],
                                opacity: [0.5, 0.2, 0.5]
                            }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute inset-4 border border-cyan-400/30 rounded-full blur-md"
                        />
                        {/* Maintenance Icon Tag */}
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -bottom-2 -right-2 bg-cyan-500 text-black p-3 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.6)]"
                        >
                            <Hammer size={24} strokeWidth={2.5} />
                        </motion.div>
                    </div>

                    {/* Typography */}
                    <div className="space-y-4 mb-8">
                        <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase italic">
                            Magic in Progress
                        </h2>

                        <div className="flex items-center justify-center gap-2">
                            <div className="h-px w-6 bg-cyan-900" />
                            <span className="text-cyan-400 font-mono font-bold tracking-[0.3em] text-[10px] uppercase">
                                System Evolution
                            </span>
                            <div className="h-px w-6 bg-cyan-900" />
                        </div>

                        <p className="text-sm text-cyan-100/70 font-medium leading-relaxed px-2">
                            Mini app under maintenance, we&apos;re cooking some magic with the app, please give us some time and follow update in the telegram community
                        </p>
                    </div>

                    {/* Action Button */}
                    <div className="w-full space-y-4">
                        <a
                            href={telegramLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative w-full flex items-center justify-center gap-3 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-[0_0_25px_rgba(6,182,212,0.4)]"
                        >
                            <MessageCircle size={20} fill="black" />
                            <span>Join Community</span>
                            <ExternalLink size={14} className="opacity-50" />
                        </a>

                        <div className="flex items-center justify-center gap-2 text-[9px] text-cyan-900 font-bold uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-900 animate-pulse" />
                            Encrypted Protocol Secure
                        </div>
                    </div>
                </div>

                {/* Bottom Detail */}
                <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
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
                        className="absolute w-px h-12 bg-gradient-to-b from-cyan-500/0 via-cyan-500/20 to-cyan-500/0"
                        style={{ left: `${Math.random() * 100}%` }}
                    />
                ))}
            </div>
        </div>
    );
}
