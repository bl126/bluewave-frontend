// Settings overlay component
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, User, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenLanguage: () => void;
    onOpenChangeName: () => void;
}

export default function Settings({ isOpen, onClose, onOpenLanguage, onOpenChangeName }: SettingsProps) {
    const { t } = useLanguage();
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.div
                        className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                       w-full max-w-sm bg-black/70 backdrop-blur-xl border border-cyan-900/50
                       rounded-2xl p-6 text-cyan-200 shadow-[0_0_40px_#00e6ff20]"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-cyan-400 text-xl font-semibold tracking-wide">
                                {t("settings.title")}
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-cyan-300 hover:text-cyan-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Settings Options */}
                        <div className="space-y-3">
                            {/* Change Name */}
                            <button
                                onClick={() => {
                                    onClose();
                                    onOpenChangeName();
                                }}
                                className="w-full bg-black/40 backdrop-blur-md border border-cyan-900/50 
                           rounded-xl p-4 text-left hover:bg-cyan-500/10 transition-all
                           shadow-[0_0_15px_#00e6ff15] group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-cyan-500/20 p-2 rounded-lg group-hover:bg-cyan-500/30 transition-all">
                                        <User className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div>
                                        <div className="text-cyan-300 font-semibold text-sm">{t("settings.change_name")}</div>
                                        <div className="text-cyan-500 text-xs">{t("settings.change_name_desc")}</div>
                                    </div>
                                </div>
                            </button>

                            {/* Language */}
                            <button
                                onClick={() => {
                                    onClose();
                                    onOpenLanguage();
                                }}
                                className="w-full bg-black/40 backdrop-blur-md border border-cyan-900/50 
                           rounded-xl p-4 text-left hover:bg-cyan-500/10 transition-all
                           shadow-[0_0_15px_#00e6ff15] group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-cyan-500/20 p-2 rounded-lg group-hover:bg-cyan-500/30 transition-all">
                                        <Globe className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div>
                                        <div className="text-cyan-300 font-semibold text-sm">{t("settings.language")}</div>
                                        <div className="text-cyan-500 text-xs">{t("settings.language_desc")}</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
