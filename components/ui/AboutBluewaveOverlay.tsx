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
                    className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-3xl flex flex-col text-cyan-200
                               pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
                >
                    {/* Header Bar */}
                    <div className="absolute top-0 left-0 right-0 h-20 z-[130] flex items-center px-6 bg-transparent pointer-events-none">
                        <button
                            onClick={onClose}
                            className="group flex items-center gap-2 text-cyan-400 hover:text-cyan-200 transition-colors pointer-events-auto"
                        >
                            <div className="p-2.5 rounded-full bg-cyan-950/30 group-hover:bg-cyan-900/50 transition-colors border border-cyan-900/50 shadow-[0_0_15px_-5px_#22d3ee]">
                                <ArrowLeft size={20} />
                            </div>
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pt-12 pb-12">
                        <div className="max-w-md mx-auto px-6 space-y-12">

                            {/* Hero Section */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-center space-y-4"
                            >
                                <div className="inline-flex p-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_40px_#22d3ee10] mb-2">
                                    <Info size={32} className="text-cyan-400" />
                                </div>
                                <h1 className="text-3xl font-black tracking-tighter text-white uppercase">
                                    {t("menu.about")}
                                </h1>
                                <div className="w-12 h-1 bg-cyan-500/30 mx-auto rounded-full" />
                            </motion.div>

                            {/* Body Content */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="space-y-8 text-sm sm:text-base leading-relaxed text-cyan-100/80 text-justify font-medium"
                            >
                                <p className="bg-white/5 border border-white/5 p-5 rounded-2xl backdrop-blur-sm">
                                    Bluewave is the human presence layer built natively on The Open Network (TON) and Telegram. Our protocol redefines digital participation by transforming everyday consistency into a verifiable, user-owned asset.
                                </p>

                                <div className="space-y-6 px-2">
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
                            </motion.div>

                            {/* Decorative Footer */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="pt-8 text-center"
                            >
                                <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mx-auto mb-6" />
                                <p className="text-[10px] uppercase tracking-[0.4em] font-black text-cyan-500/60">
                                    Protocol v1.1.0 Snapshot
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
