// Settings overlay component
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, User, Globe, Sun, Moon, Zap, Palette } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenLanguage: () => void;
}

export default function Settings({ isOpen, onClose, onOpenLanguage }: SettingsProps) {
    const { t } = useLanguage();
    const { theme, setTheme } = useTheme();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-app-bg/50 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.div
                        className="fixed z-[500] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                       w-full max-w-[340px] bg-app-card backdrop-blur-xl border border-app-border
                       rounded-[2rem] p-6 text-text-main shadow-app-shadow"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-app-accent text-xl font-black uppercase tracking-tight">
                                {t("settings.title")}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl bg-app-accent/5 text-text-sub hover:text-app-accent transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Settings Options */}
                        <div className="space-y-4">
                            {/* Language */}
                            <button
                                onClick={() => {
                                    onClose();
                                    onOpenLanguage();
                                }}
                                className="w-full bg-app-accent/5 border border-app-border 
                           rounded-2xl p-4 text-left hover:bg-app-accent/10 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-app-accent/10 p-2.5 rounded-xl group-hover:bg-app-accent/20 transition-all">
                                        <Globe className="w-5 h-5 text-app-accent" />
                                    </div>
                                    <div>
                                        <div className="text-text-main font-bold text-sm uppercase tracking-tight">{t("settings.language")}</div>
                                        <div className="text-text-sub text-[10px] uppercase font-black tracking-widest">{t("settings.language_desc")}</div>
                                    </div>
                                </div>
                            </button>

                            {/* Theme Selection */}
                            <div className="bg-white/5 border border-[var(--border)] rounded-2xl p-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-[var(--accent)]/10 p-2.5 rounded-xl">
                                        <Palette className="w-5 h-5 text-[var(--accent)]" />
                                    </div>
                                    <div>
                                        <div className="text-[var(--text-main)] font-bold text-sm uppercase tracking-tight">Appearance</div>
                                        <div className="text-[var(--text-sub)] text-[10px] uppercase font-black tracking-widest">Select your interface style</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 bg-app-bg/20 p-1 rounded-xl">
                                    {[
                                        { id: 'light', icon: Sun, label: 'Light' },
                                        { id: 'dim', icon: Moon, label: 'Dim' },
                                        { id: 'original', icon: Zap, label: 'Night' }
                                    ].map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => setTheme(mode.id as any)}
                                            className={`flex flex-col items-center gap-1.5 py-2 rounded-lg transition-all ${
                                                theme === mode.id 
                                                ? 'bg-app-accent text-app-bg shadow-lg' 
                                                : 'text-text-sub hover:text-text-main hover:bg-app-accent/5'
                                            }`}
                                        >
                                            <mode.icon size={18} strokeWidth={theme === mode.id ? 3 : 2} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">{mode.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
