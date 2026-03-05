"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, RefreshCw, Globe, Copy, Check } from "lucide-react";
import { useState } from "react";

interface BwaveScanOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    bwId?: string;
}

export default function BwaveScanOverlay({ isOpen, onClose, bwId }: BwaveScanOverlayProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [idCopied, setIdCopied] = useState(false);

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

    const handleCopyId = async () => {
        if (!bwId) return;
        try {
            await navigator.clipboard.writeText(bwId);
            setIdCopied(true);
            const tg = (window as any).Telegram?.WebApp;
            if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
            setTimeout(() => setIdCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy ID:", err);
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
                            <div className="p-0.5 rounded-lg bg-cyan-500/10 border border-cyan-400/20 w-8 h-8 flex items-center justify-center overflow-hidden">
                                <img src="/BwaveScan-logo.png" alt="BwaveScan" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-cyan-50 text-xs font-black uppercase tracking-widest leading-none">BwaveScan</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-cyan-500/50 text-[10px] font-bold uppercase tracking-tighter truncate max-w-[150px]">
                                        {bwId ? `BW ID: ${bwId}` : "Ecosystem Ledger"}
                                    </span>
                                    {bwId && (
                                        <button
                                            onClick={handleCopyId}
                                            className="text-cyan-500/40 hover:text-cyan-400 transition-colors"
                                        >
                                            {idCopied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                                        </button>
                                    )}
                                </div>
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
                            OFFICIAL BWAVESCAN IN-APP INTERFACE
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
