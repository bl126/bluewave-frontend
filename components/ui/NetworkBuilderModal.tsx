"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Award, Users, ShieldCheck, Sparkles, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface NetworkBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NetworkBuilderModal({ isOpen, onClose }: NetworkBuilderModalProps) {
    const { theme } = useTheme();
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setShowContent(true), 300);
            return () => clearTimeout(timer);
        } else {
            setShowContent(false);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={`fixed inset-0 z-[200] flex items-center justify-center p-6 ${theme === 'light' ? 'bg-white' : 'bg-app-bg/90 backdrop-blur-xl'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            className="absolute top-1/4 left-1/4 w-64 h-64 bg-app-accent/10 rounded-full blur-[100px]"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.5, 0.3],
                            }}
                            transition={{ duration: 4, repeat: Infinity }}
                        />
                        <motion.div
                            className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-app-accent/5 rounded-full blur-[100px]"
                            animate={{
                                scale: [1.2, 1, 1.2],
                                opacity: [0.5, 0.3, 0.5],
                            }}
                            transition={{ duration: 4, repeat: Infinity }}
                        />
                    </div>

                    <motion.div
                        className="relative w-full max-w-sm bg-app-card border border-app-border rounded-[2.5rem] p-8 overflow-hidden shadow-app-shadow"
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full bg-app-accent/5 hover:bg-app-accent/10 text-app-accent transition-colors z-10"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center gap-6">
                            {/* Icon / Badge Visual */}
                            <div className="relative">
                                <motion.div
                                    className="w-24 h-24 rounded-3xl bg-app-accent flex items-center justify-center shadow-app-shadow"
                                    initial={{ rotate: -10, scale: 0.8 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                >
                                    <Target size={48} className="text-app-bg" />
                                </motion.div>

                                {/* Floating particles */}
                                <motion.div
                                    className="absolute -top-2 -right-2 text-yellow-400"
                                    animate={{ y: [-5, 5, -5], opacity: [0, 1, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Sparkles size={24} />
                                </motion.div>
                            </div>

                            <div className="space-y-2">
                                <motion.h2
                                    className="text-2xl font-black text-text-main uppercase tracking-tight"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    Network Builder
                                </motion.h2>
                                <motion.p
                                    className="text-text-sub text-sm font-medium leading-relaxed"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    Congratulations! You've successfully built a network of 10+ humans.
                                    Your influence in the ecosystem is growing!
                                </motion.p>
                            </div>

                            <motion.div
                                className="w-full grid grid-cols-1 gap-3 pt-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-app-accent/10 border border-app-border text-left">
                                    <div className="p-2 rounded-xl bg-app-accent/20 text-app-accent">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-app-accent uppercase tracking-widest leading-none mb-1">Status Unlocked</h4>
                                        <p className="text-text-main text-xs font-bold leading-none">Network Builder Role Assigned</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-app-accent/5 border border-app-border text-left">
                                    <div className="p-2 rounded-xl bg-app-accent/10 text-app-accent">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-text-sub/40 uppercase tracking-widest leading-none mb-1">Network Size</h4>
                                        <p className="text-text-main text-xs font-bold leading-none">10+ Human Nodes</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.button
                                onClick={onClose}
                                className="w-full py-4 mt-2 bg-app-accent text-app-bg rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-app-accent/80 active:scale-[0.98] transition-all shadow-app-shadow"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                Continue Building
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
