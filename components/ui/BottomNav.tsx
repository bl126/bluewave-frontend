"use client";

import { motion } from "framer-motion";
import { Home, Rocket, Globe, ShoppingCart, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi } from "@/lib/useApi";
import { useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";

export type TabId = "home" | "missions" | "explore" | "market" | "profile";

interface BottomNavProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    userAvatarUrl?: string | null;
    telegramId?: number | null;
    exploreBadgeCount?: number;
    isVisible?: boolean;
}

export default function BottomNav({ activeTab, onTabChange, userAvatarUrl, telegramId, exploreBadgeCount = 0, isVisible = true }: BottomNavProps) {
    const { t } = useLanguage();
    const { theme } = useTheme();

    // Fetch counts for Mission Badge
    const { data: presenceMissions } = useApi(telegramId ? `/presence/list/${telegramId}` : null);
    const { data: missionsData } = useApi(telegramId ? `/missions/all/${telegramId}` : null);

    const missionBadgeCount = useMemo(() => {
        let count = 0;

        // 1. Presence Missions
        if (Array.isArray(presenceMissions)) {
            count += presenceMissions.filter(
                (pm: any) => pm.status === "inactive" || pm.status === "completed"
            ).length;
        }

        // 2. Normal Missions
        if (missionsData) {
            const finalList = [];
            if (Array.isArray(missionsData.normal)) finalList.push(...missionsData.normal);
            if (Array.isArray(missionsData.daily)) finalList.push(...missionsData.daily);
            if (Array.isArray(missionsData.onboarding)) finalList.push(...missionsData.onboarding);
            if (missionsData.story && typeof missionsData.story === "object" && !Array.isArray(missionsData.story)) {
                finalList.push(missionsData.story);
            }

            count += finalList.filter(
                (m: any) => m.status === "open" || m.status === "claim" || m.status === "waiting"
            ).length;
        }

        return count;
    }, [presenceMissions, missionsData]);

    const tabs = [
        { id: "home", icon: Home, label: t("nav.home") || "Home" },
        { id: "missions", icon: Rocket, label: t("nav.missions") || "Missions" },
        { id: "explore", icon: Globe, label: t("nav.explore") || "Explore" },
        { id: "market", icon: ShoppingCart, label: t("nav.market") || "Market" },
        { id: "profile", idIsProfile: true, label: t("nav.profile") || "Profile" },
    ];

    return (
        <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{
                y: isVisible ? 0 : 120,
                opacity: isVisible ? 1 : 0
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-1/2 -translate-x-1/2 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+12px)] z-[150]
                 flex items-center justify-around w-[90%] max-w-sm 
                 rounded-full p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            style={{
              background: "rgba(28, 28, 30, 0.75)",
              backdropFilter: "blur(30px) saturate(190%)",
              WebkitBackdropFilter: "blur(30px) saturate(190%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 10px 30px rgba(0, 0, 0, 0.5)"
            }}
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id as TabId)}
                        className="relative flex flex-col items-center justify-center flex-1 py-3 group outline-none"
                    >
                        {/* Sliding Active Capsule Highlight wrapping the entire item */}
                        {isActive && (
                            <motion.div
                                layoutId="activePill"
                                className="absolute inset-x-1 inset-y-1 rounded-full z-0"
                                style={{
                                  background: "rgba(255, 255, 255, 0.08)",
                                  border: "1px solid rgba(255, 255, 255, 0.06)",
                                  boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.08)"
                                }}
                                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                            />
                        )}

                        {/* Icon and Text content */}
                        <div className={`relative z-10 flex flex-col items-center gap-0.5 transition-all duration-300 ${isActive ? "text-white opacity-100" : "text-white/40 group-hover:text-white/60"}`}>
                            {tab.idIsProfile ? (
                                <div className={`w-5 h-5 rounded-full overflow-hidden border transition-all duration-300 
                                ${isActive ? "border-white" : "border-white/20 grayscale opacity-60"}`}>
                                    {userAvatarUrl ? (
                                        <img src={userAvatarUrl} alt="profile" className="w-full h-full object-cover pointer-events-none select-none" />
                                    ) : (
                                        <User size={14} className="text-current" fill="currentColor" />
                                    )}
                                </div>
                            ) : (
                                <div className="relative flex items-center justify-center">
                                    {Icon && (
                                      <Icon 
                                        size={18} 
                                        className="relative text-current" 
                                        fill="currentColor"
                                        strokeWidth={isActive ? 2.5 : 2}
                                      />
                                    )}

                                    {/* Mission Badge */}
                                    {tab.id === "missions" && missionBadgeCount > 0 && (
                                        <div className="absolute -top-1.5 -right-3 min-w-[12px] h-[12px] px-0.5 bg-white text-black text-[8px] font-bold rounded-full flex items-center justify-center border border-black/20 shadow-md">
                                            {missionBadgeCount > 9 ? "9+" : missionBadgeCount}
                                        </div>
                                    )}

                                    {/* Explore Badge */}
                                    {tab.id === "explore" && exploreBadgeCount > 0 && (
                                        <div className="absolute -top-1.5 -right-3 min-w-[12px] h-[12px] px-0.5 bg-white text-black text-[8px] font-bold rounded-full flex items-center justify-center border border-black/20 shadow-md">
                                            {exploreBadgeCount > 9 ? "9+" : exploreBadgeCount}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Label: capitalize case layout */}
                            <span className="text-[10px] font-bold tracking-tight mt-0.5 capitalize">
                                {tab.label}
                            </span>
                        </div>
                    </button>
                );
            })}
        </motion.div>
    );
}
