"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";


interface MarketplaceProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
}

export default function Marketplace({ isOpen, onClose, telegramUser }: MarketplaceProps) {
  const { t } = useLanguage();
  return (
    <>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-6 text-cyan-200"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 20px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* content */}
            <div className="flex flex-col items-center justify-center h-full w-full gap-6 relative px-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,230,255,0.03)_0%,transparent_60%)] pointer-events-none" />

              {/* Skeleton Grid */}
              <div className="w-full max-w-sm flex flex-col gap-4 opacity-40 animate-pulse">
                {/* Simulated Tabs */}
                <div className="flex justify-center gap-3 w-full mb-2">
                  <div className="h-6 w-20 rounded-full bg-cyan-900/40 border border-cyan-800/30"></div>
                  <div className="h-6 w-24 rounded-full bg-cyan-900/20 border border-cyan-800/20"></div>
                  <div className="h-6 w-16 rounded-full bg-cyan-900/20 border border-cyan-800/20"></div>
                </div>

                {/* Simulated Square Grid */}
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="aspect-square rounded-2xl bg-cyan-950/30 border border-cyan-800/20"></div>
                  <div className="aspect-square rounded-2xl bg-cyan-950/30 border border-cyan-800/20"></div>
                  <div className="aspect-square rounded-2xl bg-cyan-950/30 border border-cyan-800/20"></div>
                  <div className="aspect-square rounded-2xl bg-cyan-950/30 border border-cyan-800/20"></div>
                </div>
              </div>

              {/* Tiny Status Text */}
              <motion.p
                className="text-[10px] sm:text-xs text-cyan-500/80 font-semibold tracking-widest uppercase mt-4"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {t("marketplace.beta_phase")}
              </motion.p>
            </div>

            {/* ── Ghost Mode Gate ── */}
            {!telegramUser?.wallet_address && (
                <div className="absolute inset-0 z-[150] flex flex-col items-center justify-center p-8 text-center bg-black/40 backdrop-blur-2xl">
                    <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
                        <span className="text-3xl text-cyan-400">🔒</span>
                    </div>
                    
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Marketplace Locked</h2>
                    <p className="text-cyan-500/60 text-xs font-bold uppercase tracking-widest mb-8 leading-relaxed max-w-[240px]">
                        Link your TON wallet to access the exclusive asset distribution layer.
                    </p>

                    <button 
                        onClick={() => {
                            onClose();
                            window.dispatchEvent(new CustomEvent("setActiveTab", { detail: "profile" }));
                        }}
                        className="px-8 py-4 bg-cyan-500 text-black rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-95 transition-all"
                    >
                        Connect TON Wallet
                    </button>
                </div>
            )}
          </motion.div>
        </>
      )}
    </>
  );
}
