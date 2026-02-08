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
                    className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden text-cyan-200"
                >
                    {/* Header Bar */}
                    <div className="absolute top-0 left-0 right-0 h-16 z-[130] flex items-center justify-between px-6 bg-transparent pointer-events-none">
                        <button
                            onClick={onClose}
                            className="group flex items-center gap-2 text-cyan-400 hover:text-cyan-200 transition-colors pointer-events-auto"
                        >
                            <div className="p-2 rounded-full bg-cyan-950/30 group-hover:bg-cyan-900/50 transition-colors border border-cyan-900/50 shadow-[0_0_15px_-5px_#22d3ee]">
                                <ArrowLeft size={20} />
                            </div>
                        </button>
                    </div>

                    <div className="max-w-md w-full px-6 text-center space-y-8 mt-12">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <h1 className="text-3xl font-bold tracking-tight text-white uppercase italic">
                                {t("menu.about")}
                            </h1>
                        </motion.div>

                        <div className="space-y-6 text-sm leading-relaxed text-cyan-100/90 text-justify">
                            <p>
                                Bluewave is the human presence layer built natively on The Open Network (TON) and Telegram. Our protocol redefines digital participation by transforming everyday consistency into a verifiable, user-owned asset.
                            </p>
                            <p>
                                We believe that your digital presence, your consistency, your reliability, and your contributions, is a valuable asset that should belong to you. In an era dominated by fleeting attention and social hype, Bluewave creates a new foundation for trust and value by rewarding authentic human actions.
                            </p>
                            <p>
                                By completing daily missions, maintaining streaks, and building your network, you contribute to a transparent ecosystem where reputation is earned through proof of presence. This portable reputation layer empowers individuals to own their digital legacy and unlock new opportunities within the decentralized economy.
                            </p>
                            <p>
                                Our privacy-first approach ensures that your identity remains yours, requiring only your Telegram ID to participate. Bluewave is committed to building a sustainable, bot-free environment where real people generate real value.
                            </p>
                        </div>

                        <div className="pt-8 opacity-40">
                            <div className="w-16 h-[1px] bg-cyan-500/50 mx-auto mb-4" />
                            <p className="text-[10px] uppercase tracking-[0.3em] font-mono">
                                Protocol v1.1.0 Snapshot
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
