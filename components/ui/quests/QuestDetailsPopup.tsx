"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface QuestDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  details: string;
}

export default function QuestDetailsPopup({ isOpen, onClose, details }: QuestDetailsPopupProps) {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[145] bg-app-bg/80 backdrop-blur-md flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-sm bg-app-card border border-app-border rounded-[2.5rem] overflow-hidden flex flex-col max-h-[70vh] shadow-app-shadow backdrop-blur-2xl"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-app-accent/5 hover:bg-app-accent/10 border border-app-border transition-colors z-10"
            >
              <X size={16} />
            </button>

            <div className="p-4 pt-6 flex flex-col items-center border-b border-app-border text-center shrink-0">
              <h2 className="text-text-main text-lg font-black uppercase tracking-tight">
                {t("missions.quests.details_popup_title")}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pb-6 custom-scrollbar">
              <p className="text-sm text-text-main/80 leading-relaxed whitespace-pre-wrap">{details}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
