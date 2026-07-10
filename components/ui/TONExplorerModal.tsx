"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Wallet } from "lucide-react";
import { useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface TONExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TONExplorerModal({ isOpen, onClose }: TONExplorerModalProps) {
  const { theme } = useTheme();

  // Native Back Button Interceptor -> Close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleNativeBack = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    window.addEventListener("bwNativeBack", handleNativeBack);
    return () => window.removeEventListener("bwNativeBack", handleNativeBack);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex flex-col justify-end overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[8px]"
            onClick={onClose}
          />

          {/* Bottom Sheet Modal Container using Frosted / Liquid Glass principles */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 190 }}
            className="relative w-full z-10 overflow-hidden text-text-main flex flex-col rounded-t-[2.5rem] pb-safe"
            style={{
              background: "rgba(28, 28, 30, 0.75)",
              backdropFilter: "blur(30px) saturate(190%)",
              WebkitBackdropFilter: "blur(30px) saturate(190%)",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 -10px 40px rgba(0, 0, 0, 0.5)"
            }}
          >
            {/* Specular Liquid Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-app-accent/5 blur-[60px] rounded-full pointer-events-none" />

            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 bg-white/15 rounded-full" />
            </div>

            <div className="relative p-6 px-8 flex flex-col items-center text-center pb-12">
              {/* Floating Wallet Icon inside frosted glass circle */}
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [-8, 0, -8] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative mb-6"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-lg"
                     style={{ boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.15)" }}>
                  <Wallet size={36} className="text-white opacity-95" strokeWidth={1.5} />
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-white flex items-center justify-center border border-black shadow-md"
                >
                  <Sparkles size={12} className="text-black" />
                </motion.div>
              </motion.div>

              <div className="space-y-1.5 mb-6">
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/40 font-mono font-bold text-[9px] uppercase tracking-[0.25em]"
                >
                  Achievement Unlocked
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-white tracking-tight leading-tight"
                  style={{ letterSpacing: "-0.5px" }}
                >
                  TON Explorer
                </motion.h2>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full max-w-xs bg-white/5 border border-white/5 rounded-2xl p-5 space-y-3 mb-8 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Protocol Bonus</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/10 border border-white/10">
                    <Zap size={11} className="text-white opacity-80" />
                    <span className="text-white font-bold text-[10px] tracking-tight">+5% YIELD</span>
                  </div>
                </div>
                <p className="text-xs text-white/60 leading-relaxed font-normal">
                  Your wallet is successfully indexed. You've unlocked permanent yield boost and eligibility for ecosystem snapshots.
                </p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={onClose}
                className="w-full max-w-xs py-4 bg-white text-black font-semibold text-sm rounded-full transition-all active:scale-[0.97] hover:bg-white/95"
                style={{
                  boxShadow: "0 4px 20px rgba(255, 255, 255, 0.15)"
                }}
              >
                Claim Identity
              </motion.button>

              <p className="mt-4 text-[9px] text-white/30 font-bold uppercase tracking-wider">
                Official TON Ecosystem Credential
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
