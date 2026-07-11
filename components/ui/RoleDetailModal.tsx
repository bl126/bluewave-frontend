"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Star } from "lucide-react";
import { useEffect } from "react";

interface RoleDetailModalProps {
  role: any | null;
  onClose: () => void;
}

export default function RoleDetailModal({ role, onClose }: RoleDetailModalProps) {
  const { t } = useLanguage();

  // Native Back Button Interceptor -> Close modal
  useEffect(() => {
    if (!role) return;
    const handleNativeBack = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    window.addEventListener("bwNativeBack", handleNativeBack);
    return () => window.removeEventListener("bwNativeBack", handleNativeBack);
  }, [role, onClose]);

  return (
    <AnimatePresence>
      {role && (
        <div className="fixed inset-0 z-[500] flex flex-col justify-end overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-[8px]"
          />

          {/* Bottom Sheet Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 190 }}
            className="relative w-full z-10 overflow-hidden text-text-main flex flex-col rounded-t-[2.5rem] pb-safe"
            style={{
              background: "rgba(10, 10, 12, 0.88)",
              backdropFilter: "blur(40px) saturate(210%)",
              WebkitBackdropFilter: "blur(40px) saturate(210%)",
              borderTop: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 -10px 40px rgba(0, 0, 0, 0.5)"
            }}
          >
            {/* Specular Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-app-accent/5 blur-[60px] rounded-full pointer-events-none" />

            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 bg-white/15 rounded-full" />
            </div>

            <div className="relative p-6 px-8 flex flex-col items-center gap-6 pb-12">
              {/* Role Icon inside gradient box */}
              <div className={`p-4.5 rounded-[1.75rem] bg-gradient-to-br ${role.color} border-2 ${role.border} flex items-center justify-center shadow-md`}>
                {role.image ? (
                  <img src={role.image} alt={role.name} className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] pointer-events-none select-none" />
                ) : (
                  <role.icon className={`w-12 h-12 ${role.text}`} />
                )}
              </div>

              {/* Name & Multiplier */}
              <div className="text-center space-y-2">
                <h2 className={`text-2xl font-bold uppercase tracking-tight ${role.text}`}>
                  {t(`roles_list.${role.name}.name`) || role.name}
                </h2>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                  <Flame className="text-orange-400 fill-orange-400/20" size={13} />
                  <span className="text-orange-400 font-bold text-[11px] uppercase tracking-wider">{role.boost} {t("roles_overlay.yield_boost")}</span>
                </div>
              </div>

              {/* Credential & Protocol Access */}
              <div className="w-full max-w-xs space-y-4">
                <div className="space-y-1 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 block">
                    {t("roles_overlay.credential")}
                  </span>
                  <p className="text-sm text-white/70 font-normal leading-relaxed">
                    {t(`roles_list.${role.name}.desc`) || role.desc}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/50 flex items-center justify-center gap-1.5">
                    <Star size={11} className="text-yellow-400 fill-yellow-400" /> 
                    {t("roles_overlay.protocol_access")}
                  </span>
                  <p className="text-sm text-white font-semibold leading-relaxed">
                    {t(`roles_list.${role.name}.benefit`) || role.benefit}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={onClose}
                className="w-full max-w-xs py-4 bg-white text-black font-semibold text-sm rounded-full transition-all active:scale-[0.97] hover:bg-white/95"
                style={{
                  boxShadow: "0 4px 20px rgba(255, 255, 255, 0.15)"
                }}
              >
                Close Details
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
