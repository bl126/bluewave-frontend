// Change Name overlay component
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChangeNameProps {
    isOpen: boolean;
    onClose: () => void;
    currentName: string;
    onSave: (newName: string) => void;
}

export default function ChangeName({ isOpen, onClose, currentName, onSave }: ChangeNameProps) {
    const { t } = useLanguage();
    const [name, setName] = useState(currentName);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) return;

        setSaving(true);
        await onSave(name.trim());
        setSaving(false);
        onClose();
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
                       rounded-2xl p-6 text-cyan-200 shadow-[0_0_40px_#00e6ff20]"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-cyan-400 text-xl font-semibold tracking-wide">
                                {t("change_name.title")}
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-cyan-300 hover:text-cyan-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Input */}
                        <div className="mb-6">
                            <label className="text-cyan-400 text-sm font-semibold mb-2 block">
                                {t("change_name.label")}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/40 backdrop-blur-md border border-cyan-900/50 
                           rounded-lg px-4 py-3 text-cyan-300 placeholder-cyan-700
                           focus:outline-none focus:border-cyan-400 transition-all
                           shadow-[0_0_15px_#00e6ff15]"
                                placeholder={t("change_name.placeholder")}
                                maxLength={50}
                            />
                            <div className="text-cyan-500 text-xs mt-1">
                                {name.length}/50 {t("change_name.characters")}
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-cyan-900/50 text-cyan-300 
                           rounded-lg hover:bg-cyan-500/10 transition-all text-sm font-semibold"
                            >
                                {t("change_name.cancel")}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!name.trim() || saving}
                                className="flex-1 px-4 py-2 bg-cyan-500/20 border border-cyan-400 
                           text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-all
                           shadow-[0_0_10px_#00e6ff30] text-sm font-semibold
                           disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? t("change_name.saving") : t("change_name.save")}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
