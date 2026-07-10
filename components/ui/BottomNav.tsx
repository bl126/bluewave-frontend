"use client";

import { motion } from "framer-motion";
import { User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi } from "@/lib/useApi";
import { useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";

export type TabId = "home" | "missions" | "explore" | "market" | "profile";

/* ─── Clean Bold iOS-style SVG Icons ─── */

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {active ? (
      /* Filled home */
      <path d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V15C15 14.4477 14.5523 14 14 14H10C9.44772 14 9 14.4477 9 15V21H4C3.44772 21 3 20.5523 3 20V10.5Z" fill="currentColor" />
    ) : (
      /* Outlined home */
      <path d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V15C15 14.4477 14.5523 14 14 14H10C9.44772 14 9 14.4477 9 15V21H4C3.44772 21 3 20.5523 3 20V10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    )}
  </svg>
);

const MissionsIcon = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {active ? (
      /* Filled rocket */
      <>
        <path d="M12 2C12 2 7.5 6.5 7.5 12C7.5 14.5 8.5 16.5 10 18H14C15.5 16.5 16.5 14.5 16.5 12C16.5 6.5 12 2 12 2Z" fill="currentColor" />
        <path d="M10 18V21C10 21.5523 10.4477 22 11 22H13C13.5523 22 14 21.5523 14 21V18" fill="currentColor" />
        <path d="M7.5 12C7.5 12 5 13 4.5 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16.5 12C16.5 12 19 13 19.5 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ) : (
      /* Outlined rocket */
      <>
        <path d="M12 2C12 2 7.5 6.5 7.5 12C7.5 14.5 8.5 16.5 10 18H14C15.5 16.5 16.5 14.5 16.5 12C16.5 6.5 12 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 18V21C10 21.5523 10.4477 22 11 22H13C13.5523 22 14 21.5523 14 21V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.5 12C7.5 12 5 13 4.5 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16.5 12C16.5 12 19 13 19.5 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      </>
    )}
  </svg>
);

const ExploreIcon = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {active ? (
      /* Filled compass */
      <>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M16.24 7.76L14.12 14.12L7.76 16.24L9.88 9.88L16.24 7.76Z" fill="currentColor" />
      </>
    ) : (
      /* Outlined compass */
      <>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M16.24 7.76L14.12 14.12L7.76 16.24L9.88 9.88L16.24 7.76Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </>
    )}
  </svg>
);

const MarketIcon = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {active ? (
      /* Filled bag */
      <>
        <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 6H21" stroke="rgba(0,0,0,0.2)" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke="rgba(0,0,0,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ) : (
      /* Outlined bag */
      <>
        <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    )}
  </svg>
);

/* ─── Component ─── */

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

    const navTabs = [
        { id: "home" as TabId, label: t("nav.home") || "Home", IconComponent: HomeIcon },
        { id: "missions" as TabId, label: t("nav.missions") || "Missions", IconComponent: MissionsIcon },
        { id: "explore" as TabId, label: t("nav.explore") || "Explore", IconComponent: ExploreIcon },
        { id: "market" as TabId, label: t("nav.market") || "Market", IconComponent: MarketIcon },
    ];

    const isProfileActive = activeTab === "profile";

    return (
        <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{
                y: isVisible ? 0 : 120,
                opacity: isVisible ? 1 : 0
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-1/2 -translate-x-1/2 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+8px)] z-[150]
                 flex items-center gap-2 w-[92%] max-w-md"
        >
            {/* ─── Main Nav Bar (rounded pill capsule) ─── */}
            <div
                className="flex-1 flex items-center justify-around rounded-full p-1.5"
                style={{
                    background: "rgba(0, 0, 0, 0.55)",
                    backdropFilter: "blur(40px) saturate(180%)",
                    WebkitBackdropFilter: "blur(40px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 10px 30px rgba(0, 0, 0, 0.5)"
                }}
            >
                {navTabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const IconComp = tab.IconComponent;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className="relative flex flex-col items-center justify-center flex-1 py-2.5 group outline-none"
                        >
                            {/* Tall oval active capsule fill */}
                            {isActive && (
                                <motion.div
                                    layoutId="activePill"
                                    className="absolute inset-x-0.5 inset-y-0.5 rounded-full z-0"
                                    style={{
                                        background: "rgba(255, 255, 255, 0.08)",
                                        border: "1px solid rgba(255, 255, 255, 0.06)",
                                        boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.08)"
                                    }}
                                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                />
                            )}

                            {/* Icon + Label */}
                            <div className={`relative z-10 flex flex-col items-center gap-0.5 transition-all duration-300 ${isActive ? "text-white opacity-100" : "text-white/35 group-hover:text-white/55"}`}>
                                <div className="relative flex items-center justify-center">
                                    <IconComp active={isActive} />

                                    {/* Mission Badge */}
                                    {tab.id === "missions" && missionBadgeCount > 0 && (
                                        <div className="absolute -top-1 -right-2.5 min-w-[14px] h-[14px] px-0.5 bg-white text-black text-[8px] font-bold rounded-full flex items-center justify-center border border-black/20 shadow-md">
                                            {missionBadgeCount > 9 ? "9+" : missionBadgeCount}
                                        </div>
                                    )}

                                    {/* Explore Badge */}
                                    {tab.id === "explore" && exploreBadgeCount > 0 && (
                                        <div className="absolute -top-1 -right-2.5 min-w-[14px] h-[14px] px-0.5 bg-white text-black text-[8px] font-bold rounded-full flex items-center justify-center border border-black/20 shadow-md">
                                            {exploreBadgeCount > 9 ? "9+" : exploreBadgeCount}
                                        </div>
                                    )}
                                </div>

                                {/* Label */}
                                <span className="text-[10px] font-semibold tracking-tight mt-0.5 capitalize">
                                    {tab.label}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ─── Profile Avatar (Outside the nav bar, standalone circle) ─── */}
            <button
                onClick={() => onTabChange("profile")}
                className={`relative shrink-0 w-[52px] h-[52px] rounded-full overflow-hidden transition-all duration-300 active:scale-95 ${
                    isProfileActive 
                        ? "ring-2 ring-white ring-offset-2 ring-offset-black/80 shadow-[0_0_15px_rgba(255,255,255,0.15)]" 
                        : "ring-1 ring-white/15 opacity-70 grayscale-[30%]"
                }`}
                style={{
                    background: "rgba(28, 28, 30, 0.75)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)"
                }}
            >
                {userAvatarUrl ? (
                    <img
                        src={userAvatarUrl}
                        alt="profile"
                        className="w-full h-full object-cover pointer-events-none select-none"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <User size={22} className="text-white/60" />
                    </div>
                )}
            </button>
        </motion.div>
    );
}
