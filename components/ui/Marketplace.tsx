"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface MarketplaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Marketplace({ isOpen, onClose }: MarketplaceProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-6 text-cyan-200 
                       pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-cyan-400 transition-colors z-[130]"
            >
              <X size={20} />
            </button>

            {/* content */}
            <div className="flex flex-col items-center justify-center h-full w-full gap-4 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,230,255,0.05)_0%,transparent_50%)] pointer-events-none" />

              <h3 className="text-xl md:text-2xl font-black text-cyan-300 uppercase tracking-widest leading-relaxed px-4">
                Exchange your presence for value
              </h3>

              <motion.div
                className="px-6 py-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 font-bold text-sm tracking-wider uppercase mt-2 shadow-[0_0_20px_#00e6ff20]"
                animate={{
                  boxShadow: ["0 0 10px #00e6ff10", "0 0 20px #00e6ff40", "0 0 10px #00e6ff10"],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Coming soon in beta
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
