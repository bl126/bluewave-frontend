"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, RefreshCw, Globe, Copy, Check } from "lucide-react";
import { useState } from "react";
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
                    className="fixed inset-0 z-[200] flex flex-col bg-black"
                    style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 35px)" }}
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                >
                    {/* Header Bar */}
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-black/80 border-cyan-500/10 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="p-0.5 rounded-lg border w-8 h-8 flex items-center justify-center overflow-hidden bg-cyan-500/10 border-cyan-400/20">
                                <img src="/BwaveScan-logo.png" alt="BwaveScan" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black uppercase tracking-widest leading-none text-cyan-50">BwaveScan</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold uppercase tracking-tighter truncate max-w-[150px] text-cyan-500/50">
                                        {walletConnected && bwId
                                          ? `BW ID: ${bwId}`
                                          : "BW ID: NOT ASSIGNED"}
                                    </span>
                                    {walletConnected && bwId && (
                                        <button
                                            onClick={handleCopyId}
                                            className="transition-colors text-cyan-500/40 hover:text-cyan-400"
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
                                className="p-2 transition-colors text-cyan-400/60 hover:text-cyan-400"
                                title="Open in Browser"
                            >
                                <ExternalLink size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Iframe Container */}
                    <div className="flex-1 relative bg-zinc-950">
                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-black">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="text-cyan-400"
                                >
                                    <RefreshCw size={32} />
                                </motion.div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500/50">Bridging to BwaveScan...</p>
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
                    <div className="p-3 border-t text-center pb-[max(12px,env(safe-area-inset-bottom))] bg-black border-cyan-500/10">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-800">
                            OFFICIAL BWAVESCAN IN-APP INTERFACE
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
