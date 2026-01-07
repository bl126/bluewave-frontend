"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TopRightMenuProps {
  onOpenAbout?: () => void;
  onOpenLedger?: () => void;
  onOpenFAQ?: () => void;
  onOpenStats?: () => void;
}

export default function TopRightMenu({
  onOpenAbout,
  onOpenLedger,
  onOpenFAQ,
  onOpenStats,
}: TopRightMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex flex-col justify-between w-7 h-5"
      >
        <span className="h-[2px] w-full bg-cyan-400 rounded" />
        <span className="h-[2px] w-full bg-cyan-400 rounded" />
        <span className="h-[2px] w-full bg-cyan-400 rounded" />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="
              absolute right-0 mt-3 w-52
              bg-black/70 backdrop-blur-md
              border border-cyan-900
              rounded-xl
              shadow-[0_0_25px_#00e6ff30]
              overflow-hidden
            "
          >
            <MenuItem label="About BlueWave" onClick={() => { setOpen(false); onOpenAbout?.(); }} />
            <MenuItem label="Presence Ledger" onClick={() => { setOpen(false); onOpenLedger?.(); }} />
            <MenuItem label="FAQ" onClick={() => { setOpen(false); onOpenFAQ?.(); }} />
            <MenuItem label="Stats" onClick={() => { setOpen(false); onOpenStats?.(); }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="
        w-full text-left px-4 py-3 text-sm
        text-cyan-200
        hover:bg-cyan-500/10
        transition-colors
      "
    >
      {label}
    </button>
  );
}
