"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Zap, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

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
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-gradient-to-b from-sky-900/40 to-black border border-sky-400/30 rounded-[2.5rem] p-8 overflow-hidden shadow-[0_0_80px_rgba(56,189,248,0.15)]"
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-sky-500/10 blur-[80px] -z-10" />

            {/* Content Swirls */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/20 blur-3xl rounded-full" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X size={20} className="text-white/40" />
            </button>

            <div className="flex flex-col items-center gap-6 text-center">
              {/* Floating Wallet Icon */}
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [-10, 0, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <div className="w-24 h-24 rounded-full bg-sky-500/20 flex items-center justify-center border-2 border-sky-400/50 shadow-[0_0_30px_rgba(56,189,248,0.3)]">
                  <Wallet size={48} className="text-sky-400" />
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-black"
                >
                  <Sparkles size={14} className="text-white" />
                </motion.div>
              </motion.div>

              <div className="space-y-2">
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sky-400 font-black text-xs uppercase tracking-[0.3em]"
                >
                  Achievement Unlocked
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-black text-white uppercase tracking-tight"
                >
                  TON Explorer
                </motion.h2>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Protocol Bonus</span>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <Zap size={12} className="text-orange-400 fill-orange-400" />
                    <span className="text-orange-400 font-black text-xs">+5% YIELD</span>
                  </div>
                </div>
                <p className="text-sm text-white/70 leading-relaxed font-medium">
                  Your wallet is successfully indexed. You've unlocked permanent yield boost and eligibility for ecosystem snapshots.
                </p>
              </motion.div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-full h-14 bg-sky-500 hover:bg-sky-400 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_30px_rgba(56,189,248,0.4)]"
              >
                Claim Identity
              </motion.button>

              <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                Official TON Ecosystem Credential
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
