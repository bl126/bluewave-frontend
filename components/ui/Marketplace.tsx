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
          {/* background dim */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* glass card */}
          <motion.div
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                       w-[90%] max-w-sm bg-black/60 backdrop-blur-md border border-cyan-900 
                       rounded-2xl p-6 text-cyan-200 shadow-[0_0_25px_#00e6ff30]
                       flex flex-col items-center justify-center text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* header */}
            <div className="flex justify-center relative w-full mb-4">
              <h2 className="text-cyan-400 text-lg font-semibold tracking-wide">
                MARKETPLACE
              </h2>
              <button
                onClick={onClose}
                className="absolute right-0 text-cyan-300 hover:text-cyan-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* content */}
            <p className="text-sm text-cyan-300/80 mb-3">
              Exchange your presence for value
            </p>

            <motion.p
              className="text-cyan-400 font-semibold text-base"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Coming Soon
            </motion.p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
