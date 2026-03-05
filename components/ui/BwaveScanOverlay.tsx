"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";

interface BwaveScanOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    bwId?: string;
}

export default function BwaveScanOverlay({ isOpen, onClose, bwId }: BwaveScanOverlayProps) {
    const [isLoading, setIsLoading] = useState(true);

    // Construct the deep-link URL. If bwId is present, we try to focus on it.
    const baseUrl = "https://bwavescan.xyz";
    const finalUrl = bwId ? `${baseUrl}/?id=${bwId}` : baseUrl;

    const handleOpenExternal = () => {
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.openLink) {
            tg.openLink(finalUrl);
        } else {
            window.open(finalUrl, "_blank");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[200] bg-black flex flex-col pt-[env(safe-area-inset-top)]"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                >
                    {/* Header Bar */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/10 bg-black/80 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-400/20">
                                <ShieldCheck size={18} className="text-cyan-400" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-cyan-50 text-xs font-black uppercase tracking-widest leading-none">BwaveScan</span>
                                <span className="text-cyan-500/50 text-[10px] font-bold uppercase tracking-tighter mt-1 truncate max-w-[150px]">
                                    {bwId ? `ID: ${bwId}` : "Ecosystem Ledger"}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleOpenExternal}
                                className="p-2 text-cyan-400/60 hover:text-cyan-400 transition-colors"
                                title="Open in Browser"
                            >
                                <ExternalLink size={18} />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Iframe Container */}
                    <div className="flex-1 relative bg-zinc-950">
                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black z-10">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="text-cyan-400"
                                >
                                    <RefreshCw size={32} />
                                </motion.div>
                                <p className="text-cyan-500/50 text-[10px] font-black uppercase tracking-widest">Bridging to BwaveScan...</p>
                            </div>
                        )}

                        <iframe
                            src={finalUrl}
                            className="w-full h-full border-none"
                            onLoad={() => setIsLoading(false)}
                            allow="clipboard-write"
                            title="BwaveScan Viewer"
                        />
                    </div>

                    {/* Footer Safety Bar */}
                    <div className="p-3 bg-black border-t border-cyan-500/10 text-center pb-[max(12px,env(safe-area-inset-bottom))]">
                        <p className="text-[9px] text-cyan-800 font-bold uppercase tracking-widest">
                            Official BwaveScan Interface 🌊 Security Guaranteed
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
