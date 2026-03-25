"use client";
/**
 * 🌐 Premium Language Selector
 * Redesigned to match the "Level Card" / Modal aesthetic.
 */
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LanguageSelectorProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Language {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
}

const languages: Language[] = [
    { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
    { code: "zh", name: "Chinese", nativeName: "简体中文", flag: "🇨🇳" },
    { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
    { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
    { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
    { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
    { code: "th", name: "Thai", nativeName: "ภาษาไทย", flag: "🇹🇭" },
];

export default function LanguageSelector({ isOpen, onClose }: LanguageSelectorProps) {
    const { language, setLanguage, t } = useLanguage();

    const handleSelectLanguage = (code: string) => {
        setLanguage(code);
        setTimeout(onClose, 300); // Small delay for visual feedback
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 z-[201] flex items-center justify-center p-6 pointer-events-none"
                    >
                        <div className="w-full max-w-sm bg-black border border-cyan-500/20 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)] pointer-events-auto flex flex-col max-h-[85vh]">

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-6 pb-4">
                                <div>
                                    <h2 className="text-white font-black text-lg uppercase tracking-tight">{t("language.title")}</h2>
                                    <p className="text-cyan-500/50 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">Ecosystem Localization</p>
                                </div>
                                <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-cyan-500/40 hover:text-cyan-400 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Language List */}
                            <div className="px-6 pb-10 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                                {languages.map((lang) => {
                                    const isActive = language === lang.code;
                                    return (
                                        <button
                                            key={lang.code}
                                            onClick={() => handleSelectLanguage(lang.code)}
                                            className={`w-full flex items-center gap-3 border rounded-2xl p-2.5 transition-all active:scale-[0.98] group relative overflow-hidden ${isActive
                                                ? "bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                                                : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${isActive
                                                ? "bg-cyan-500/20 border-cyan-500/30"
                                                : "bg-white/5 border-white/10"
                                                }`}>
                                                <span className="text-xl">{lang.flag}</span>
                                            </div>

                                            <div className="flex-1 text-left">
                                                <p className={`font-black text-sm uppercase tracking-wide transition-colors ${isActive ? "text-white" : "text-white/40 group-hover:text-white/60"
                                                    }`}>
                                                    {lang.nativeName}
                                                </p>
                                                <p className="text-cyan-500/30 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                                                    {lang.name}
                                                </p>
                                            </div>

                                            {isActive && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                                >
                                                    <Check size={14} className="text-black stroke-[3px]" />
                                                </motion.div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Footer hint */}
                            <div className="px-8 py-4 bg-white/[0.02] border-t border-white/5 flex items-center gap-3">
                                <Globe size={14} className="text-cyan-500/30" />
                                <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest leading-tight">
                                    The Bluewave protocol adapts to your regional identity for localized signal processing.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
