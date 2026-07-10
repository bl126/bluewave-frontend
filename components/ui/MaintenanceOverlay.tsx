"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageCircle, ExternalLink, Settings, Sparkles } from "lucide-react";

export default function MaintenanceOverlay() {
    const telegramLink = "https://t.me/bluewaveprotocol";

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end overflow-hidden">
            {/* Backdrop: Soft blurred dark background allowing the app background/globe to show through */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-[8px]"
            />

            {/* Bottom Sheet Modal using Frosted / Liquid Glass principles */}
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 26, stiffness: 190 }}
                className="relative w-full z-10 overflow-hidden text-text-main flex flex-col rounded-t-[2.5rem]"
                style={{
                  background: "rgba(28, 28, 30, 0.75)",
                  backdropFilter: "blur(30px) saturate(190%)",
                  WebkitBackdropFilter: "blur(30px) saturate(190%)",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 -10px 40px rgba(0, 0, 0, 0.5)"
                }}
            >
                {/* Specular Liquid Glow: Soft ambient gradient behind the sheet contents */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none" />

                {/* Drag Handle */}
                <div className="w-full flex justify-center pt-4 pb-2">
                    <div className="w-12 h-1.5 bg-white/15 rounded-full" />
                </div>

                <div className="relative p-6 px-8 flex flex-col items-center text-center pb-12">
                    
                    {/* Clean Gear Icon with custom glass emblem */}
                    <div className="w-20 h-20 relative mb-6 flex items-center justify-center">
                        <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
                        <motion.div
                            animate={{
                                rotate: 360
                            }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            className="relative z-10 p-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-lg flex items-center justify-center"
                            style={{
                              boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.2)"
                            }}
                        >
                            <Settings size={36} className="text-white opacity-90" strokeWidth={1.5} />
                        </motion.div>
                        
                        {/* Sparkle micro-badge */}
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute -top-1 -right-1 bg-cyan-500 text-black p-1 rounded-full border border-black"
                        >
                          <Sparkles size={10} />
                        </motion.div>
                    </div>

                    {/* Clean Text Hierarchy */}
                    <div className="space-y-3 mb-8 max-w-sm">
                        <h2 className="text-2xl font-bold tracking-tight text-white leading-tight" style={{ letterSpacing: "-0.5px" }}>
                            Magic in Progress
                        </h2>

                        <div className="flex items-center justify-center gap-2">
                            <div className="h-px w-5 bg-white/10" />
                            <span className="text-white/40 font-mono font-bold tracking-[0.25em] text-[9px] uppercase">
                                System Evolution
                            </span>
                            <div className="h-px w-5 bg-white/10" />
                        </div>

                        <p className="text-sm text-white/60 font-normal leading-relaxed px-4 pt-1">
                            Mini app under maintenance. We are cooking some magic behind the scenes. Please follow updates in our community channel.
                        </p>
                    </div>

                    {/* Capsule Action Button with active scale changes */}
                    <div className="w-full max-w-xs space-y-4">
                        <a
                            href={telegramLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative w-full flex items-center justify-center gap-2.5 py-4 bg-white text-black font-semibold text-sm rounded-full transition-all active:scale-[0.97] hover:bg-white/95"
                            style={{
                              boxShadow: "0 4px 20px rgba(255, 255, 255, 0.15)"
                            }}
                        >
                            <MessageCircle size={18} fill="currentColor" className="text-black" />
                            <span className="tracking-tight">Join Community</span>
                            <ExternalLink size={12} className="opacity-40 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>

                        <div className="flex items-center justify-center gap-1.5 text-[9px] text-white/30 font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                            Encrypted Protocol Secure
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}
