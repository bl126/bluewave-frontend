"use client";
import { useLanguage } from "@/contexts/LanguageContext";

import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Star } from "lucide-react";

interface RoleDetailModalProps {
  role: any | null;
  onClose: () => void;
}

export default function RoleDetailModal({ role, onClose }: RoleDetailModalProps) {
  const { t } = useLanguage();
  if (!role) return null;

  return (
    <AnimatePresence>
      {role && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[500] bg-app-bg/80 backdrop-blur-sm"
          />

          {/* Popup */}
          <div className="fixed inset-0 z-[510] flex items-center justify-center p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              className="relative w-full max-w-sm rounded-[2rem] border border-app-border bg-app-card p-7 flex flex-col items-center gap-5 shadow-app-shadow overflow-hidden pointer-events-auto"
            >
              {/* X Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-app-accent/5 hover:bg-app-accent/10 border border-app-border transition-colors"
              >
                <X size={16} className="text-text-sub" />
              </button>

              {/* Role Icon */}
              <div className={`p-5 rounded-[1.75rem] bg-gradient-to-br ${role.color} border-2 ${role.border} flex items-center justify-center`}>
                {role.image ? (
                  <img src={role.image} alt={role.name} className="w-14 h-14 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                ) : (
                  <role.icon className={`w-14 h-14 ${role.text}`} />
                )}
              </div>

              {/* Name & Multiplier */}
              <div className="text-center space-y-2">
                <h2 className={`text-2xl font-black uppercase tracking-tight ${role.text}`}>
                  {t(`roles_list.${role.name}.name`) || role.name}
                </h2>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                  <Flame className="text-orange-400" size={13} />
                  <span className="text-orange-400 font-black text-xs tracking-widest">{role.boost} {t("roles_overlay.yield_boost")}</span>
                </div>
              </div>

              {/* Credential & Protocol Access */}
              <div className="w-full space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-sub block">{t("roles_overlay.credential")}</span>
                  <p className="text-sm text-text-main/75 font-medium leading-relaxed">
                    {t(`roles_list.${role.name}.desc`) || role.desc}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-app-accent/5 border border-app-border space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-app-accent/60 flex items-center gap-1.5">
                    <Star size={10} className="text-yellow-400" /> {t("roles_overlay.protocol_access")}
                  </span>
                  <p className="text-sm text-text-main/85 font-semibold leading-snug">
                    {t(`roles_list.${role.name}.benefit`) || role.benefit}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
