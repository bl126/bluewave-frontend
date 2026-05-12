"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Lock } from "lucide-react";


interface MarketplaceProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
}

export default function Marketplace({ isOpen, onClose, telegramUser }: MarketplaceProps) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  return (
    <>
      {isOpen && (
        <>
          <motion.div
            className={`fixed inset-0 z-[120] flex flex-col items-center justify-center text-center p-6 text-text-main ${theme === 'light' ? 'bg-white' : 'bg-app-bg/95 backdrop-blur-3xl'}`}
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 20px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* content */}
            <div className="flex flex-col items-center justify-center h-full w-full gap-6 relative px-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent-glow)_0%,transparent_60%)] pointer-events-none" />

              {/* Skeleton Grid */}
              <div className="w-full max-w-sm flex flex-col gap-4 opacity-40 animate-pulse">
                {/* Simulated Tabs */}
                <div className="flex justify-center gap-3 w-full mb-2">
                  <div className="h-6 w-20 rounded-full bg-app-accent/10 border border-app-border"></div>
                  <div className="h-6 w-24 rounded-full bg-app-accent/5 border border-app-border"></div>
                  <div className="h-6 w-16 rounded-full bg-app-accent/5 border border-app-border"></div>
                </div>

                {/* Simulated Square Grid */}
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="aspect-square rounded-2xl bg-app-accent/5 border border-app-border"></div>
                  <div className="aspect-square rounded-2xl bg-app-accent/5 border border-app-border"></div>
                  <div className="aspect-square rounded-2xl bg-app-accent/5 border border-app-border"></div>
                  <div className="aspect-square rounded-2xl bg-app-accent/5 border border-app-border"></div>
                </div>
              </div>

              {/* Tiny Status Text */}
              <motion.p
                className="text-[10px] sm:text-xs text-text-sub font-semibold tracking-widest uppercase mt-4"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {t("marketplace.beta_phase")}
              </motion.p>
            </div>

            {/* ── Ghost Mode Gate ── */}
            {!telegramUser?.wallet_address && (
                <div className={`absolute inset-0 z-[150] flex flex-col items-center justify-center p-8 text-center backdrop-blur-2xl ${theme === 'light' ? 'bg-white/40' : 'bg-app-bg/40'}`}>
                    <div className="w-20 h-20 rounded-full bg-app-accent/10 border border-app-border flex items-center justify-center mb-6 shadow-app-shadow">
                        <Lock size={32} className="text-app-accent animate-pulse" />
                    </div>
                    
                    <h2 className="text-2xl font-black text-text-main uppercase tracking-tighter mb-2">{t("ghost.sector_encrypted")}</h2>
                    <p className="text-text-sub text-xs font-bold uppercase tracking-widest mb-8 leading-relaxed max-w-[240px]">
                        {t("ghost.connect_prompt")}
                    </p>

                    <button 
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent("setActiveTab", { detail: "profile" }));
                        }}
                        className="px-8 py-4 bg-app-accent text-app-bg rounded-2xl font-black text-sm uppercase tracking-widest shadow-app-shadow active:scale-95 transition-all"
                    >
                        {t("ghost.connect_btn")}
                    </button>
                </div>
            )}
          </motion.div>
        </>
      )}
    </>
  );
}
