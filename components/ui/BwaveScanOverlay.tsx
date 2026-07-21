"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, RefreshCw, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface BwaveScanOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    bwId?: string;
    walletConnected?: boolean;
}

export default function BwaveScanOverlay({ isOpen, onClose, bwId, walletConnected = false }: BwaveScanOverlayProps) {
    const { theme } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [idCopied, setIdCopied] = useState(false);

    // Telegram Native Back Button Integration
    useEffect(() => {
        if (!isOpen) return;
        const tg = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;
        if (tg?.BackButton) {
            tg.BackButton.show();
            const handleTgBack = () => {
                onClose();
            };
            tg.BackButton.onClick(handleTgBack);
            return () => {
                tg.BackButton.offClick(handleTgBack);
                if (!((window as any).bwActiveSheets?.length > 0)) {
                    tg.BackButton.hide();
                }
            };
        }
    }, [isOpen, onClose]);

    // Construct the deep-link URL. If bwId is present, we try to focus on it.
    const baseUrl = "https://bwavescan.xyz";
    const finalUrl = bwId ? `${baseUrl}/?id=${bwId}&theme=${theme}` : `${baseUrl}/?theme=${theme}`;

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
                    className="fixed inset-0 z-[200] flex flex-col bg-zinc-950/95 text-white backdrop-blur-3xl"
                    style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 35px)" }}
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                >
                    {/* Header Bar (Glass aesthetic) */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-black/45 backdrop-blur-2xl shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="p-1 rounded-xl border border-white/15 w-9 h-9 flex items-center justify-center overflow-hidden bg-white/5 shadow-inner">
                                <img src="/BwaveScan-logo.png" alt="BwaveScan" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black uppercase tracking-widest leading-none text-white">BwaveScan</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider truncate max-w-[160px] text-white/60">
                                        {walletConnected && bwId
                                          ? `BW ID: ${bwId}`
                                          : "BW ID: NOT ASSIGNED"}
                                    </span>
                                    {walletConnected && bwId && (
                                        <button
                                            onClick={handleCopyId}
                                            className="transition-colors text-white/40 hover:text-white active:scale-90"
                                        >
                                            {idCopied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleOpenExternal}
                                className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                                title="Open in Browser"
                            >
                                <ExternalLink size={18} />
                            </button>

                            <button
                                onClick={onClose}
                                className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                                title="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Iframe Container */}
                    <div className="flex-1 relative bg-zinc-950">
                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-black/80 backdrop-blur-xl">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="text-cyan-400"
                                >
                                    <RefreshCw size={32} />
                                </motion.div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Bridging to BwaveScan...</p>
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

                    {/* Footer Glass Safety Bar */}
                    <div className="p-3.5 border-t text-center pb-[max(14px,env(safe-area-inset-bottom))] bg-black/50 border-white/10 backdrop-blur-2xl">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/50">
                            OFFICIAL BWAVESCAN IN-APP INTERFACE
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
