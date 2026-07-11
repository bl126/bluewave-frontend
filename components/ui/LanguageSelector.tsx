"use client";
/**
 * 🌐 Premium Language Selector
 * Redesigned to match the "Level Card" / Modal aesthetic.
 */
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Check, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";

interface LanguageSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
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

export default function LanguageSelector({ isOpen, onClose, onComplete }: LanguageSelectorProps) {
    const { language, setLanguage, t } = useLanguage();
    const dragControls = useDragControls();

    const handleSelectLanguage = (code: string) => {
        setLanguage(code);
        setTimeout(() => {
            onClose();
            if (onComplete) onComplete();
        }, 300); // Small delay for visual feedback
    };

    // Stack registration
    useEffect(() => {
        if (!isOpen) return;
        if (typeof window !== "undefined") {
            (window as any).bwActiveSheets = (window as any).bwActiveSheets || [];
            (window as any).bwActiveSheets.push("language");
        }
        return () => {
            if (typeof window !== "undefined") {
                (window as any).bwActiveSheets = ((window as any).bwActiveSheets || []).filter(
                    (id: string) => id !== "language"
                );
            }
        };
    }, [isOpen]);

    // Back listener
    useEffect(() => {
        if (!isOpen) return;
        const handleNativeBack = (e: Event) => {
            const activeSheets = (window as any).bwActiveSheets || [];
            if (activeSheets[activeSheets.length - 1] === "language") {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener("bwNativeBack", handleNativeBack);
        return () => window.removeEventListener("bwNativeBack", handleNativeBack);
    }, [isOpen, onClose]);

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
                        className="fixed inset-0 z-[1018] bg-app-bg/70 backdrop-blur-sm"
                    />

                    {/* Sheet Container */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        drag="y"
                        dragControls={dragControls}
                        dragListener={false}
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100) onClose();
                        }}
                        className="fixed bottom-0 left-0 right-0 z-[1019] bg-app-card border-t border-app-border rounded-t-[2.5rem] flex flex-col max-h-[70vh] shadow-app-shadow text-text-main backdrop-blur-2xl"
                    >
                        {/* Drag Handle */}
                        <div
                            onPointerDown={(e) => dragControls.start(e)}
                            className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing touch-none"
                        >
                            <div className="w-12 h-1.5 bg-app-border/50 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pb-4">
                            <div>
                                <h2 className="text-text-main font-black text-lg uppercase tracking-tight">{t("language.title")}</h2>
                                <p className="text-text-sub text-[10px] font-bold uppercase tracking-widest leading-none mt-1">Ecosystem Localization</p>
                            </div>
                        </div>

                        {/* Language List */}
                        <div className="px-5 pb-24 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-2.5">
                                {languages.map((lang) => {
                                    const isActive = language === lang.code;
                                    return (
                                        <button
                                            key={lang.code}
                                            onClick={() => handleSelectLanguage(lang.code)}
                                            className={`flex items-center gap-2.5 border rounded-2xl p-2 transition-all active:scale-[0.98] group relative overflow-hidden ${isActive
                                                ? "bg-app-accent/10 border-app-accent/40 shadow-app-shadow"
                                                : "bg-app-bg/5 border-app-border hover:border-app-accent/20"
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${isActive
                                                ? "bg-app-accent/20 border-app-accent/30"
                                                : "bg-app-accent/5 border-app-border"
                                                }`}>
                                                <span className="text-lg">{lang.flag}</span>
                                            </div>

                                            <div className="flex-1 text-left min-w-0">
                                                <p className={`font-black text-[10px] uppercase tracking-wide truncate transition-colors ${isActive ? "text-text-main" : "text-text-sub group-hover:text-text-main"
                                                    }`}>
                                                    {lang.nativeName}
                                                </p>
                                                <p className="text-text-sub/40 text-[8px] font-bold uppercase tracking-wider mt-0.5 truncate">
                                                    {lang.name}
                                                </p>
                                            </div>

                                            {isActive && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute top-1 right-1 w-4 h-4 rounded-full bg-app-accent flex items-center justify-center shadow-app-shadow"
                                                >
                                                    <Check size={10} className="text-app-bg stroke-[3px]" />
                                                </motion.div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer hint */}
                        <div className="px-8 py-4 bg-app-bg/5 border-t border-app-border flex items-center gap-3">
                            <Globe size={14} className="text-text-sub/30" />
                            <p className="text-[9px] text-text-sub/40 font-bold uppercase tracking-widest leading-tight">
                                The Bluewave protocol adapts to your regional identity for localized signal processing.
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
