"use client";

import { motion } from "framer-motion";
import { Home, Rocket, Globe, ShoppingCart, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi } from "@/lib/useApi";
import { useMemo } from "react";

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
            className="absolute left-1/2 -translate-x-1/2 bottom-[calc(max(1.5rem,env(safe-area-inset-bottom))+10px)] z-[150]
                 flex items-center justify-around w-[94%] max-w-md bg-app-bg/40 backdrop-blur-xl
                 rounded-[2rem] p-1.5 shadow-app-shadow border border-app-border"
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
                                className="absolute inset-x-1 inset-y-1 bg-app-accent/10 border border-app-border rounded-2xl z-0"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}

                        {/* Icon/Avatar Container */}
                        <div className={`relative z-10 flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? "scale-110" : "scale-100 opacity-40 group-hover:opacity-60"}`}>
                            {tab.idIsProfile ? (
                                <div className={`w-6 h-6 rounded-full overflow-hidden border-2 transition-all duration-300 
                                ${isActive ? "border-app-accent shadow-app-shadow" : "border-app-border grayscale"}`}>
                                    {userAvatarUrl ? (
                                        <img src={userAvatarUrl} alt="profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={16} className="text-app-accent" />
                                    )}
                                </div>
                            ) : (
                                <div className="relative">
                                    {isActive && <div className="absolute inset-0 blur-md bg-app-accent/40 rounded-full" />}
                                    {Icon && <Icon size={20} className={`relative transition-colors ${isActive ? "text-app-accent" : "text-text-main"}`} />}

                                    {/* Mission Badge */}
                                    {tab.id === "missions" && missionBadgeCount > 0 && (
                                        <div className="absolute -top-1 -right-3 min-w-[14px] h-[14px] px-1 bg-app-accent text-black text-[9px] font-black rounded-full flex items-center justify-center shadow-app-shadow border border-black/20">
                                            {missionBadgeCount > 9 ? "9+" : missionBadgeCount}
                                        </div>
                                    )}

                                    {/* Explore Badge */}
                                    {tab.id === "explore" && exploreBadgeCount > 0 && (
                                        <div className="absolute -top-1 -right-3 min-w-[14px] h-[14px] px-1 bg-app-accent text-black text-[9px] font-black rounded-full flex items-center justify-center shadow-app-shadow border border-black/20">
                                            {exploreBadgeCount > 9 ? "9+" : exploreBadgeCount}
                                        </div>
                                    )}
                                </div>
                            )}

                            <span className={`text-[9px] font-black uppercase tracking-tighter transition-all 
                               ${isActive ? "text-text-main" : "text-text-sub"}`}>
                                {tab.label}
                            </span>
                        </div>
                    </button>
                );
            })}
        </motion.div>
    );
}
