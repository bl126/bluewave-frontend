"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface TopRightMenuProps {
  onOpenLedger?: () => void;
  onOpenWhitepaper?: () => void;
  isWhitepaperActive?: boolean;
  onOpenRoles?: () => void;
  isRolesActive?: boolean;
}

export default function TopRightMenu({
  onOpenLedger,
  onOpenWhitepaper,
  isWhitepaperActive,
  onOpenRoles,
  isRolesActive,
}: TopRightMenuProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);


  return (
    <div className="fixed top-4 right-4 z-[150]">
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
          className="absolute h-[2px] w-5 bg-app-accent rounded"
        />

        {/* Middle line */}
        <motion.span
          initial={false}
          animate={open ? "open" : "closed"}
          variants={{ closed: { opacity: 1 }, open: { opacity: 0 } }}
          transition={{ duration: 0.14 }}
          className="absolute h-[2px] w-5 bg-app-accent rounded"
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
          className="absolute h-[2px] w-5 bg-app-accent rounded"
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
                bg-app-card/90 backdrop-blur-xl
                border border-app-border
                rounded-xl
                shadow-app-shadow
                overflow-hidden
              "
            >

              <MenuItem
                label={t("menu.whitepaper")}
                onClick={() => { setOpen(false); onOpenWhitepaper?.(); }}
                isActive={isWhitepaperActive}
              />
              <MenuItem
                label={t("menu.ecosystem_roles")}
                onClick={() => { setOpen(false); onOpenRoles?.(); }}
                isActive={isRolesActive}
              />
              <MenuItem label={t("menu.presence_ledger")} onClick={() => { setOpen(false); onOpenLedger?.(); }} />
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
          ? "text-app-accent bg-app-accent/10 shadow-[inset_3px_0_0_0_currentColor]"
          : "text-text-main hover:bg-app-accent/10"
        }
      `}
    >
      {label}
    </button>
  );
}
