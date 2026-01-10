"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TopRightMenuProps {
  onOpenAbout?: () => void;
  onOpenLedger?: () => void;
  onOpenFAQ?: () => void;
  onOpenStats?: () => void;
  onOpenWhitepaper?: () => void;
  isWhitepaperActive?: boolean;
}

export default function TopRightMenu({
  onOpenAbout,
  onOpenLedger,
  onOpenFAQ,
  onOpenStats,
  onOpenWhitepaper,
  isWhitepaperActive,
}: TopRightMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Hamburger */}
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="relative w-6 h-6 flex items-center justify-center"
      >
        {/* Top line */}
        <motion.span
          initial={false}
          animate={open ? "open" : "closed"}
          variants={{
            closed: { rotate: 0, y: -6 },
            open: { rotate: 45, y: 0 },
          }}
          transition={{ duration: 0.18 }}
          style={{ originX: 0.5, originY: 0.5 }}
          className="absolute h-[2px] w-5 bg-cyan-400 rounded"
        />

        {/* Middle line */}
        <motion.span
          initial={false}
          animate={open ? "open" : "closed"}
          variants={{ closed: { opacity: 1 }, open: { opacity: 0 } }}
          transition={{ duration: 0.14 }}
          className="absolute h-[2px] w-5 bg-cyan-400 rounded"
        />

        {/* Bottom line */}
        <motion.span
          initial={false}
          animate={open ? "open" : "closed"}
          variants={{
            closed: { rotate: 0, y: 6 },
            open: { rotate: -45, y: 0 },
          }}
          transition={{ duration: 0.18 }}
          style={{ originX: 0.5, originY: 0.5 }}
          className="absolute h-[2px] w-5 bg-cyan-400 rounded"
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            {/* Click outside layer */}
            <motion.div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="
                absolute right-0 mt-3 w-52 z-50
                bg-black/70 backdrop-blur-md
                border border-cyan-900
                rounded-xl
                shadow-[0_0_25px_#00e6ff30]
                overflow-hidden
              "
            >

              <MenuItem label="About BlueWave" onClick={() => { setOpen(false); onOpenAbout?.(); }} />
              <MenuItem label="Presence Ledger" onClick={() => { setOpen(false); onOpenLedger?.(); }} />
              <MenuItem
                label="Whitepaper v1.0"
                onClick={() => { setOpen(false); onOpenWhitepaper?.(); }}
                isActive={isWhitepaperActive}
              />
              <MenuItem label="FAQ" onClick={() => { setOpen(false); onOpenFAQ?.(); }} />
              <MenuItem label="Stats" onClick={() => { setOpen(false); onOpenStats?.(); }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  isActive,
}: {
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-4 py-3 text-sm transition-all duration-300
        ${isActive
          ? "text-cyan-50 bg-cyan-900/40 shadow-[inset_3px_0_0_0_#22d3ee]"
          : "text-cyan-200 hover:bg-cyan-500/10"
        }
      `}
    >
      {label}
    </button>
  );
}
