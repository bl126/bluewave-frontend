// Settings overlay component
"use client";

import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Globe, Moon, Zap, Palette, MessageSquare, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect } from "react";

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenLanguage: () => void;
    onOpenBugsSuggestions: () => void;
}

export default function Settings({ isOpen, onClose, onOpenLanguage, onOpenBugsSuggestions }: SettingsProps) {
    const { t } = useLanguage();
    const { theme, setTheme } = useTheme();
    const dragControls = useDragControls();

    // Stack registration
    useEffect(() => {
        if (!isOpen) return;
        if (typeof window !== "undefined") {
            (window as any).bwActiveSheets = (window as any).bwActiveSheets || [];
            (window as any).bwActiveSheets.push("settings");
        }
        return () => {
            if (typeof window !== "undefined") {
                (window as any).bwActiveSheets = ((window as any).bwActiveSheets || []).filter(
                    (id: string) => id !== "settings"
                );
            }
        };
    }, [isOpen]);

    // Back listener
    useEffect(() => {
        if (!isOpen) return;
        const handleNativeBack = (e: Event) => {
            const activeSheets = (window as any).bwActiveSheets || [];
            if (activeSheets[activeSheets.length - 1] === "settings") {
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
                    {/* Backdrop — above nav */}
                    <motion.div
                        className="fixed inset-0 bg-app-bg/60 backdrop-blur-sm z-[1008]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Sheet — above nav */}
                    <motion.div
                        className="fixed bottom-0 left-0 right-0 z-[1009] bg-app-card border-t border-app-border rounded-t-[2.5rem] flex flex-col max-h-[70vh] shadow-app-shadow text-text-main"
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
                    >
                        {/* Drag Handle */}
                        <div
                            onPointerDown={(e) => dragControls.start(e)}
                            className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing touch-none"
                        >
                            <div className="w-12 h-1.5 bg-app-border/50 rounded-full" />
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-app-accent text-xl font-black uppercase tracking-tight">
                                    {t("settings.title")}
                                </h2>
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

                                {/* Bugs & Suggestions */}
                                <button
                                    onClick={() => {
                                        onClose();
                                        onOpenBugsSuggestions();
                                    }}
                                    className="w-full bg-app-accent/5 border border-app-border 
                                rounded-2xl p-4 text-left hover:bg-app-accent/10 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-app-accent/10 p-2.5 rounded-xl group-hover:bg-app-accent/20 transition-all">
                                            <MessageSquare className="w-5 h-5 text-app-accent" />
                                        </div>
                                        <div>
                                            <div className="text-text-main font-bold text-sm uppercase tracking-tight">Bugs & Suggestions</div>
                                            <div className="text-text-sub text-[10px] uppercase font-black tracking-widest">Report issues or suggest ideas</div>
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
                                            { id: 'dim', icon: Moon, label: 'Dim' },
                                            { id: 'original', icon: Zap, label: 'Night' },
                                            { id: 'glass', icon: Sparkles, label: 'Glass' }
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
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
