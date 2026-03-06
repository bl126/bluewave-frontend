"use client";

import { motion } from "framer-motion";
import { Home, Rocket, BarChart3, ShoppingCart, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export type TabId = "home" | "missions" | "leaderboard" | "market" | "profile";

interface BottomNavProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    userAvatarUrl?: string | null;
}

export default function BottomNav({ activeTab, onTabChange, userAvatarUrl }: BottomNavProps) {
    const { t } = useLanguage();

    const tabs = [
        { id: "home", icon: Home, label: t("nav.home") || "Home" },
        { id: "missions", icon: Rocket, label: t("nav.missions") || "Missions" },
        { id: "leaderboard", icon: BarChart3, label: t("nav.leaderboard") || "Chart" },
        { id: "market", icon: ShoppingCart, label: t("nav.market") || "Market" },
        { id: "profile", idIsProfile: true, label: t("nav.profile") || "Profile" },
    ];

    return (
        <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute left-1/2 -translate-x-1/2 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[150]
                 flex items-center justify-around w-[94%] max-w-md bg-black/40 backdrop-blur-xl
                 rounded-[2rem] p-1.5 shadow-[0_0_30px_rgba(0,230,255,0.15)] border border-cyan-500/10"
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id as TabId)}
                        className="relative flex flex-col items-center justify-center flex-1 py-2 group outline-none"
                    >
                        {/* Sliding Active Indicator */}
                        {isActive && (
                            <motion.div
                                layoutId="activePill"
                                className="absolute inset-x-1 inset-y-1 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl z-0"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}

                        {/* Icon/Avatar Container */}
                        <div className={`relative z-10 flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? "scale-110" : "scale-100 opacity-40 group-hover:opacity-60"}`}>
                            {tab.idIsProfile ? (
                                <div className={`w-6 h-6 rounded-full overflow-hidden border-2 transition-all duration-300 
                                ${isActive ? "border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" : "border-cyan-500/20 grayscale"}`}>
                                    {userAvatarUrl ? (
                                        <img src={userAvatarUrl} alt="profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={16} className="text-cyan-400" />
                                    )}
                                </div>
                            ) : (
                                <div className="relative">
                                    {isActive && <div className="absolute inset-0 blur-md bg-cyan-400/40 rounded-full" />}
                                    {Icon && <Icon size={20} className={`relative transition-colors ${isActive ? "text-cyan-400" : "text-cyan-100"}`} />}
                                </div>
                            )}

                            <span className={`text-[9px] font-black uppercase tracking-tighter transition-all 
                               ${isActive ? "text-cyan-100" : "text-cyan-500/60"}`}>
                                {tab.label}
                            </span>
                        </div>
                    </button>
                );
            })}
        </motion.div>
    );
}
