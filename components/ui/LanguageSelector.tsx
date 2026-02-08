// Language selector overlay component
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useState, useEffect } from "react";
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
    { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
    { code: "th", name: "Thai", nativeName: "ภาษาไทย", flag: "🇹🇭" },
    { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
    { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
    { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
];

export default function LanguageSelector({ isOpen, onClose }: LanguageSelectorProps) {
    const { language, setLanguage, t } = useLanguage();

    const handleSelectLanguage = (code: string) => {
        setLanguage(code);
        // onClose(); // Optional: close upon selection
    };

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
                       rounded-2xl p-6 text-cyan-200 shadow-[0_0_40px_#00e6ff20]
                       max-h-[80vh] overflow-y-auto"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-cyan-400 text-xl font-semibold tracking-wide">
                                {t("language.title")}
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-cyan-300 hover:text-cyan-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Language List */}
                        <div className="space-y-3">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleSelectLanguage(lang.code)}
                                    className={`w-full bg-black/40 backdrop-blur-md border rounded-xl p-4 
                             text-left transition-all shadow-[0_0_15px_#00e6ff15]
                             ${language === lang.code
                                            ? "border-cyan-400 bg-cyan-500/10"
                                            : "border-cyan-900/50 hover:bg-cyan-500/5"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{lang.flag}</span>
                                            <div>
                                                <div className="text-cyan-300 font-semibold text-base">
                                                    {lang.nativeName}
                                                </div>
                                                <div className="text-cyan-500 text-xs">
                                                    {lang.name}
                                                </div>
                                            </div>
                                        </div>
                                        {language === lang.code && (
                                            <div className="bg-cyan-400 rounded-full p-1">
                                                <Check className="w-4 h-4 text-black" />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
