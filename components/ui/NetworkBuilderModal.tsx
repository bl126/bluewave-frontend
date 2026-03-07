"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Award, Users, ShieldCheck, Sparkles, Target } from "lucide-react";
import { useEffect, useState } from "react";

interface NetworkBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NetworkBuilderModal({ isOpen, onClose }: NetworkBuilderModalProps) {
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
                    className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px]"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.5, 0.3],
                            }}
                            transition={{ duration: 4, repeat: Infinity }}
                        />
                        <motion.div
                            className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]"
                            animate={{
                                scale: [1.2, 1, 1.2],
                                opacity: [0.5, 0.3, 0.5],
                            }}
                            transition={{ duration: 4, repeat: Infinity }}
                        />
                    </div>

                    <motion.div
                        className="relative w-full max-w-sm bg-cyan-950/20 border border-cyan-500/30 rounded-[2.5rem] p-8 overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)]"
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-cyan-400 transition-colors z-10"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center gap-6">
                            {/* Icon / Badge Visual */}
                            <div className="relative">
                                <motion.div
                                    className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                                    initial={{ rotate: -10, scale: 0.8 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                >
                                    <Target size={48} className="text-white" />
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
                                    className="text-2xl font-black text-white uppercase tracking-tight"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    Network Builder
                                </motion.h2>
                                <motion.p
                                    className="text-cyan-400/70 text-sm font-medium leading-relaxed"
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
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-left">
                                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest leading-none mb-1">Status Unlocked</h4>
                                        <p className="text-white text-xs font-bold leading-none">Network Builder Role Assigned</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
                                    <div className="p-2 rounded-xl bg-white/10 text-cyan-400">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Network Size</h4>
                                        <p className="text-white text-xs font-bold leading-none">10+ Human Nodes</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.button
                                onClick={onClose}
                                className="w-full py-4 mt-2 bg-white text-cyan-950 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-cyan-100 active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
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
