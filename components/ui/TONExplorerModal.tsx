"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Zap, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface TONExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TONExplorerModal({ isOpen, onClose }: TONExplorerModalProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 bg-app-bg/80 backdrop-blur-xl`}
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-app-card border border-app-border rounded-[2.5rem] p-8 overflow-hidden shadow-app-shadow"
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-app-accent/10 blur-[80px] -z-10" />

            {/* Content Swirls */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-app-accent/20 blur-3xl rounded-full" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-app-accent/10 blur-3xl rounded-full" />
            </div>

            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-app-accent/5 hover:bg-app-accent/10 text-app-accent transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center gap-6 text-center">
              {/* Floating Wallet Icon */}
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [-10, 0, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <div className="w-24 h-24 rounded-full bg-app-accent/10 flex items-center justify-center border-2 border-app-accent/50 shadow-app-shadow">
                  <Wallet size={48} className="text-app-accent" />
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-app-accent flex items-center justify-center border-2 border-app-bg shadow-lg"
                >
                  <Sparkles size={14} className="text-app-bg" />
                </motion.div>
              </motion.div>

              <div className="space-y-2">
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-app-accent font-black text-xs uppercase tracking-[0.3em]"
                >
                  Achievement Unlocked
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-black text-text-main uppercase tracking-tight"
                >
                  TON Explorer
                </motion.h2>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full bg-app-bg/50 border border-app-border rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-text-sub text-[10px] font-bold uppercase tracking-widest">Protocol Bonus</span>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-app-accent/10 border border-app-accent/20">
                    <Zap size={12} className="text-app-accent fill-app-accent" />
                    <span className="text-app-accent font-black text-xs">+5% YIELD</span>
                  </div>
                </div>
                <p className="text-sm text-text-sub leading-relaxed font-medium">
                  Your wallet is successfully indexed. You've unlocked permanent yield boost and eligibility for ecosystem snapshots.
                </p>
              </motion.div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-full h-14 bg-app-accent hover:opacity-90 text-app-bg font-black uppercase tracking-widest rounded-2xl transition-all shadow-app-shadow"
              >
                Claim Identity
              </motion.button>

              <p className="text-[10px] text-text-sub/40 font-bold uppercase tracking-widest">
                Official TON Ecosystem Credential
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
