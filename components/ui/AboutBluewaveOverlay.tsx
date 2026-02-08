"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Info } from "lucide-react";
import React, { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface AboutBluewaveOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AboutBluewaveOverlay({ isOpen, onClose }: AboutBluewaveOverlayProps) {
    const { t } = useLanguage();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden text-cyan-200"
                >
                    {/* Header Bar */}
                    <div className="absolute top-0 left-0 right-0 h-16 z-[110] flex items-center justify-between px-6 bg-transparent pointer-events-none">
                        <button
                            onClick={onClose}
                            className="group flex items-center gap-2 text-cyan-400 hover:text-cyan-200 transition-colors pointer-events-auto"
                        >
                            <div className="p-2 rounded-full bg-cyan-950/30 group-hover:bg-cyan-900/50 transition-colors border border-cyan-900/50">
                                <ArrowLeft size={20} />
                            </div>
                            <span className="text-sm font-medium tracking-wide uppercase hidden sm:block">{t("stats.back")}</span>
                        </button>
                    </div>

                    <div className="max-w-md w-full px-6 text-center space-y-8">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_30px_#00e6ff20]">
                                <Info size={48} className="text-cyan-400" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-white uppercase italic">
                                {t("menu.about")}
                            </h1>
                        </motion.div>

                        <div className="space-y-6 text-sm leading-relaxed text-cyan-100/80">
                            <p>
                                Bluewave is the human presence layer built natively on The Open Network (TON) and Telegram.
                            </p>
                            <p>
                                We believe that your digital presence — your consistency, your reliability, and your contributions — is a valuable asset that should belong to you.
                            </p>
                            <p>
                                By rewarding everyday human actions over fleeting attention or social hype, Bluewave creates a new foundation for trust and value in the web3 era.
                            </p>
                        </div>

                        <div className="pt-8 opacity-40">
                            <div className="w-16 h-[1px] bg-cyan-500/50 mx-auto mb-4" />
                            <p className="text-[10px] uppercase tracking-[0.3em] font-mono">
                                Protocol Version 1.1.0
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
