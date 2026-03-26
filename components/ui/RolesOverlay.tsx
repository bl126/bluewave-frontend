"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ROLE_CATEGORIES } from "@/lib/roles";
import RoleDetailModal from "./RoleDetailModal";

interface RolesOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoleName?: string | null;
}

export default function RolesOverlay({ isOpen, onClose, initialRoleName }: RolesOverlayProps) {
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<any>(null);

  // Sync initialRoleName when opening
  useEffect(() => {
    if (isOpen && initialRoleName) {
      // Find the role in all categories
      const allRoles = ROLE_CATEGORIES.flatMap(cat => cat.roles);
      const found = allRoles.find(r => r.name === initialRoleName);
      if (found) {
        setSelectedRole(found);
      }
    } else if (!isOpen) {
      setSelectedRole(null);
    }
  }, [isOpen, initialRoleName]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[210] bg-black backdrop-blur-3xl flex flex-col overflow-y-auto"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 25px)" }}
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="max-w-2xl mx-auto w-full p-6 pb-24 flex flex-col gap-10">
              {/* Header & Intro */}
              <div className="space-y-4 pt-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight text-center">{t("roles_overlay.title")}</h2>

                <div className="text-sm leading-relaxed space-y-4 bg-cyan-950/20 p-5 rounded-2xl border border-cyan-500/20">
                  <p className="text-white/80">
                    <strong className="text-cyan-300">{t("roles_overlay.desc_1").split('attributes')[0]}attributes</strong> {t("roles_overlay.desc_1").split('attributes')[1]}
                  </p>
                  <p className="text-white/55">
                    {t("roles_overlay.desc_2")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-cyan-500/50 tracking-widest">{t("roles_overlay.dist_label")}</span>
                    <span className="text-sm font-black text-white leading-tight">{t("roles_overlay.dist_val")}</span>
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-cyan-500/50 tracking-widest">{t("roles_overlay.assign_label")}</span>
                    <span className="text-sm font-black text-white leading-tight">{t("roles_overlay.assign_val")}</span>
                  </div>
                </div>
              </div>

              {/* Role Grid Categories */}
              {ROLE_CATEGORIES.map((category, idx) => (
                <div key={idx} className="flex flex-col gap-6">
                  <div className="flex flex-col">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{t(`roles_cats.${category.title}.title`) || category.title}</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-cyan-400/60 mt-1">{t(`roles_cats.${category.title}.desc`) || category.description}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {category.roles.map((role, ridx) => {
                      const Icon = role.icon;
                      return (
                        <motion.button
                          key={ridx}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedRole(role)}
                          className={`aspect-square bg-gradient-to-br ${role.color} border ${role.border} rounded-3xl p-3 flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden group shadow-[0_0_30px_#00e6ff05]`}
                        >
                          <div className="p-2.5 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/5 flex items-center justify-center">
                            {role.image ? (
                              <img src={role.image} alt={role.name} className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
                            ) : (
                              <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${role.text}`} />
                            )}
                          </div>
                          <span className={`font-black text-[10px] sm:text-[11px] uppercase tracking-tighter text-center leading-none px-1 overflow-hidden text-ellipsis w-full ${role.text}`}>
                            {t(`roles_list.${role.name}.name`) || role.name}
                          </span>
                          <div className="absolute top-1 right-1 px-1 py-0.5 rounded-lg bg-black/40 border border-white/5 backdrop-blur-md">
                            <span className="text-orange-400 font-black text-[8px] flex items-center gap-0.5">
                              <Flame size={8} /> {role.boost.replace("+", "")}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence >

      <RoleDetailModal role={selectedRole} onClose={() => setSelectedRole(null)} />
    </>
  );
}