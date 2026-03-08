// [CODE: FRONTEND_LANDING_PAGE_COMPONENT]
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import BluewaveGlobe from "@/components/ui/BluewaveGlobe";
import MissionCenter from "@/components/ui/MissionCenter";
import Leaderboard from "@/components/ui/Leaderboard";
import Marketplace from "@/components/ui/Marketplace";
import Profile from "@/components/ui/Profile";
import OnboardingModal from "@/components/ui/OnboardingModal";
import BottomNav, { TabId } from "@/components/ui/BottomNav";

import LoadingScreen from "./LoadingScreen";
import RolesOverlay from "@/components/ui/RolesOverlay";
import RecoveryPasswordModal from "@/components/ui/RecoveryPasswordModal";
import StreakCelebrationModal from "@/components/ui/StreakCelebrationModal";
import VerifiedHumanModal from "@/components/ui/VerifiedHumanModal";
import TONExplorerModal from "@/components/ui/TONExplorerModal";
import BwaveScanOverlay from "@/components/ui/BwaveScanOverlay";
import RoleDetailModal from "@/components/ui/RoleDetailModal";
import RoleCelebrationModal from "@/components/ui/RoleCelebrationModal";
import NetworkBuilderModal from "@/components/ui/NetworkBuilderModal";
import { findRoleByName } from "@/lib/roles";
import { useLanguage } from "@/contexts/LanguageContext";
import { mutate } from "swr";
import { getApi, postApi } from "@/lib/useApi";
import MaintenanceOverlay from "@/components/ui/MaintenanceOverlay";
import BalancePill from "@/components/ui/BalancePill";
import BluButton from "@/components/ui/BluButton";


// [CODE: FRONTEND_LANDING_PAGE_MAIN_COMPONENT]
export default function LandingPage() {
  const { t } = useLanguage();

  // [CODE: FRONTEND_TELEGRAM_WEBAPP_INIT]
  // ⭐ ENSURE Telegram WebApp is initialized + request full screen
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand(); // Expand to max height (all Telegram versions)
        // 🖥️ Request true full screen (Telegram 8.0+ / Bot API 8.0+)
        if (typeof tg.requestFullscreen === "function") {
          tg.requestFullscreen();
        }
        if (tg.disableVerticalSwipes) {
          tg.disableVerticalSwipes();
        }
        console.log("Telegram WebApp initialized:", tg.initDataUnsafe);
      } catch (e) {
        console.error("WebApp init error:", e);
      }
    }
  }, []);

  // [CODE: FRONTEND_STATE_MANAGEMENT]
  // 👤 Store Telegram user info
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isMissionOpen, setMissionOpen] = useState(false);
  const [isLeaderboardOpen, setLeaderboardOpen] = useState(false);
  const [isMarketOpen, setMarketOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [isRolesOpen, setRolesOpen] = useState(false);
  const [selectedRoleName, setSelectedRoleName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [isBwaveScanOpen, setBwaveScanOpen] = useState(false);

  // 🔐 Recovery Password State
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // 🔥 Streak Celebration State
  const [isStreakCelebrationOpen, setIsStreakCelebrationOpen] = useState(false);
  const [streakCelebrationData, setStreakCelebrationData] = useState({ days: 0, reward: 0 });

  // 🛡️ Human Verification State
  const [isHumanModalOpen, setIsHumanModalOpen] = useState(false);

  // 🌐 Network Builder State
  const [isNetworkBuilderModalOpen, setIsNetworkBuilderModalOpen] = useState(false);

  // 💎 TON Explorer State
  const [isTONModalOpen, setIsTONModalOpen] = useState(false);


  // 🏆 Role Detail Modal State
  const [selectedRoleData, setSelectedRoleData] = useState<any>(null);

  // 🛡️ Maintenance State
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // 🏆 Role Celebration State
  const [pendingRoles, setPendingRoles] = useState<string[]>([]);
  const [currentCelebratingRole, setCurrentCelebratingRole] = useState<string | null>(null);

  const isAnyOverlayOpen = isProfileOpen || isMissionOpen || isLeaderboardOpen || isMarketOpen || isRolesOpen || isBwaveScanOpen || showRecoveryModal || !!selectedRoleData || isHumanModalOpen || isNetworkBuilderModalOpen || isTONModalOpen || isStreakCelebrationOpen || isMaintenanceMode || !!currentCelebratingRole;

  // [CODE: TELEGRAM_BACK_BUTTON]
  // 🔙 Sync Telegram's native Back Button with overlay state
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.BackButton) return;

    const handleBack = () => {
      if (isBwaveScanOpen) {
        setBwaveScanOpen(false);
        return;
      }
      if (isRolesOpen) {
        setRolesOpen(false);
        return;
      }
      // Close all other overlays and return to home
      setMissionOpen(false);
      setLeaderboardOpen(false);
      setMarketOpen(false);
      setProfileOpen(false);
      setRolesOpen(false);
      setBwaveScanOpen(false);
      setSelectedRoleData(null);
      setIsNetworkBuilderModalOpen(false);
      setActiveTab("home");
    };

    if (isAnyOverlayOpen) {
      tg.BackButton.show();
      tg.BackButton.onClick(handleBack);
    } else {
      tg.BackButton.hide();
    }

    return () => {
      tg.BackButton.offClick(handleBack);
    };
  }, [isAnyOverlayOpen, isRolesOpen, isBwaveScanOpen]);

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  // ⭐ Unified Initialization: Profile + Auth + Data Preloading
  useEffect(() => {
    if (typeof window === "undefined") return;

    (async () => {
      try {
        const tg = (window as any).Telegram?.WebApp;
        const tgUser = tg?.initDataUnsafe?.user;

        // 1. Determine Telegram ID (Prioritize live WebApp data)
        let effectiveTgId = tgUser?.id || window.localStorage.getItem("bw_tg_id");

        if (!effectiveTgId) {
          // In some cases (slow script load), wait a bit and try again once
          await new Promise(resolve => setTimeout(resolve, 500));
          const retryTg = (window as any).Telegram?.WebApp;
          effectiveTgId = retryTg?.initDataUnsafe?.user?.id || window.localStorage.getItem("bw_tg_id");
        }

        if (!effectiveTgId) {
          console.warn("No Telegram ID found. Redirecting to onboarding...");
          setOnboardingOpen(true);
          setIsLoading(false);
          return;
        }

        const savedTgId = String(effectiveTgId);

        // 2. Fetch unified initial state from backend
        // This endpoint returns { profile, missions, presence, leaderboard }
        const data = await getApi(`/init/${savedTgId}`);
        if (data.error) {
          if (data.error === "TOO_FAST") {
            console.warn("Rate limited. Retrying in 1.2s...");
            setTimeout(() => { window.location.reload(); }, 1200);
            return;
          }
          // User not found or auth error -> show onboarding
          setOnboardingOpen(true);
          setIsLoading(false);
          return;
        }
        const user = data.profile;

        // 3. Maintenance Check (Bypass for Admins)
        const ADMIN_IDS = [5023869471]; // Primary Admin
        if (data.maintenance && !ADMIN_IDS.includes(Number(savedTgId))) {
          setIsMaintenanceMode(true);
          setIsLoading(false);
          return;
        }

        // 4. If onboarding not completed in DB -> force onboarding
        if (!user.first_login_completed) {
          setOnboardingOpen(true);
          setIsLoading(false);
          return;
        }

        // 4. Success Logged In -> Prepare App State
        const tgIdNum = Number(savedTgId);
        window.localStorage.setItem("bw_tg_id", savedTgId);

        // SYNC fresh Telegram photo if available
        const livePhoto = tg?.initDataUnsafe?.user?.photo_url;
        if (livePhoto && livePhoto !== user.photo_url) {
          postApi(`/user/update_profile`, { tg_id: tgIdNum, photo_url: livePhoto })
            .catch(err => console.error("Photo sync error:", err));
        }

        // Populate global state
        setTelegramUser({
          id: tgIdNum,
          tg_id: tgIdNum,
          username: user.username,
          first_name: tg?.initDataUnsafe?.user?.first_name || user.name,
          photo_url: livePhoto || user.photo_url || null,
          points_balance: user.points_balance ?? 0,
          referral_earnings_pending: user.referral_earnings_pending ?? 0,
          total_referrals: user.total_referrals ?? 0,
          inactive_referrals_cache: user.inactive_referrals_cache ?? 0,
          streak: user.streak_days ?? 0,
          bw_id: user.bw_id,
          joined_at: user.joined_at,
          human_verification_pending: user.human_verification_pending || false,
          network_builder_pending: user.network_builder_pending || false,
          ton_explorer_pending: user.ton_explorer_pending || false,
        });

        // 🔥 Initial check for pending rewards from init data
        if (user.streak_reward_pending) {
          setStreakCelebrationData({
            days: user.streak_days || 0,
            reward: user.streak_reward_amount || 0
          });
          setTimeout(() => setIsStreakCelebrationOpen(true), 1500);
        } else if (user.human_verification_pending) {
          setTimeout(() => setIsHumanModalOpen(true), 1500);
        } else if (user.network_builder_pending) {
          setTimeout(() => setIsNetworkBuilderModalOpen(true), 1500);
        } else if (user.ton_explorer_pending) {
          setTimeout(() => setIsTONModalOpen(true), 1500);
        }

        if (user.pending_role_notifications?.length > 0) {
          setPendingRoles(user.pending_role_notifications);
          // Show the first one after a short delay
          setTimeout(() => setCurrentCelebratingRole(user.pending_role_notifications[0]), 2000);
        }

        setBalance(user.points_balance ?? null);

        // Invalidate cache for sub-queries
        if (tgIdNum > 0) {
          getApi(`/user/has_recovery_password/${tgIdNum}`)
            .then(data => {
              if (data.has_password === false && !data.error) {
                setShowRecoveryModal(true);
              }
            })
            .catch(err => console.error("Error checking recovery password:", err));
        }

        // ⭐ SEED SWR Cache
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        mutate(`${apiUrl}/api/user/${tgIdNum}`, user, false);
        mutate(`${apiUrl}/api/missions/all/${tgIdNum}`, data.missions, false);
        mutate(`${apiUrl}/api/presence/list/${tgIdNum}`, data.presence, false);
        mutate(`${apiUrl}/api/leaderboard`, data.leaderboard, false);
        mutate(`${apiUrl}/api/leaderboard?tg_id=${tgIdNum}`, data.leaderboard, false);

        // All ready
        setIsLoading(false);
      } catch (err) {
        console.error("Initialization error:", err);
        setOnboardingOpen(true);
        setIsLoading(false);
      }
    })();
  }, [apiBase]);

  // Remove the redundant browser block useEffect (merged above)

  // [CODE: FRONTEND_EVENT_LISTENERS]
  useEffect(() => {
    const handleStreakPop = (e: any) => {
      const { days, reward } = e.detail;
      setStreakCelebrationData({ days, reward });
      setIsStreakCelebrationOpen(true);
    };

    const handleHumanPop = () => {
      setIsHumanModalOpen(true);
    };

    const handleNetworkPop = () => {
      setIsNetworkBuilderModalOpen(true);
    };

    window.addEventListener('showStreakCelebration' as any, handleStreakPop);
    window.addEventListener('showHumanVerification' as any, handleHumanPop);
    window.addEventListener('showNetworkBuilder' as any, handleNetworkPop);
    return () => {
      window.removeEventListener('showStreakCelebration' as any, handleStreakPop);
      window.removeEventListener('showHumanVerification' as any, handleHumanPop);
      window.removeEventListener('showNetworkBuilder' as any, handleNetworkPop);
    };
  }, []);

  const handleClearStreakReward = async () => {
    setIsStreakCelebrationOpen(false);
    try {
      if (telegramUser?.tg_id) {
        const data = await postApi("/user/clear_streak_reward", { telegram_id: telegramUser.tg_id });
        if (data.error) throw new Error(data.error);

        // Sequence: Check human verification -> then TON explorer
        if (telegramUser.human_verification_pending) {
          setTimeout(() => setIsHumanModalOpen(true), 500);
        } else if (telegramUser.ton_explorer_pending) {
          setTimeout(() => setIsTONModalOpen(true), 500);
        }
      }
    } catch (e) {
      console.error("Clear streak error:", e);
    }
  };

  const handleClearHumanVerification = async () => {
    setIsHumanModalOpen(false);
    try {
      if (telegramUser?.tg_id) {
        const data = await postApi("/user/clear_human_verification", { telegram_id: telegramUser.tg_id });
        if (data.error) throw new Error(data.error);

        // After human verification, check if there's a pending Network Builder reward
        if (telegramUser.network_builder_pending) {
          setTimeout(() => setIsNetworkBuilderModalOpen(true), 500);
        } else if (telegramUser.ton_explorer_pending) {
          setTimeout(() => setIsTONModalOpen(true), 500);
        }
      }
    } catch (e) {
      console.error("Clear human verification error:", e);
    }
  };

  const handleClearNetworkBuilder = async () => {
    setIsNetworkBuilderModalOpen(false);
    try {
      if (telegramUser?.tg_id) {
        const data = await postApi("/user/clear_network_builder_celebration", { telegram_id: telegramUser.tg_id });
        if (data.error) throw new Error(data.error);

        // After network builder, check if there's a pending TON explorer reward
        if (telegramUser.ton_explorer_pending) {
          setTimeout(() => setIsTONModalOpen(true), 500);
        }
      }
    } catch (e) {
      console.error("Clear network builder error:", e);
    }
  };

  const handleClearTONExplorer = async () => {
    setIsTONModalOpen(false);
    try {
      if (telegramUser?.tg_id) {
        const data = await postApi("/user/clear_ton_explorer_reward", { telegram_id: telegramUser.tg_id });
        if (data.error) throw new Error(data.error);
      }
    } catch (e) {
      console.error("Clear TON explorer error:", e);
    }
  };

  const handleClearRoleCelebration = async (role: string) => {
    setCurrentCelebratingRole(null);
    try {
      if (telegramUser?.tg_id) {
        await postApi("/user/clear_role_notification", { telegram_id: telegramUser.tg_id, role });

        // Check if there are more pending roles
        const nextRoles = pendingRoles.filter(r => r !== role);
        setPendingRoles(nextRoles);

        if (nextRoles.length > 0) {
          setTimeout(() => setCurrentCelebratingRole(nextRoles[0]), 500);
        }
      }
    } catch (e) {
      console.error("Clear role notification error:", e);
    }
  };

  // 💰 Fetch balance (unchanged)
  const fetchBalance = async (tgId: number) => {
    try {
      const data = await getApi(`/balance/${tgId}`);
      if (data.balance !== undefined) setBalance(data.balance);
    } catch (e) {
      console.error("Error fetching balance:", e);
    }
  };

  // Update balance after login (Only needed for subsequent updates, not initial load)
  useEffect(() => {
    // skip initial - already got it from user fetch
  }, [telegramUser]);

  // 🔁 Listen for global balance updates (unchanged)
  useEffect(() => {
    const handleBalanceUpdate = (event: any) => {
      setBalance(event.detail);
    };
    window.addEventListener("updateBalance", handleBalanceUpdate);
    return () => window.removeEventListener("updateBalance", handleBalanceUpdate);
  }, []);

  // 🔄 Refresh balance every 60s (unchanged)
  useEffect(() => {
    if (!telegramUser?.id) return;
    const interval = setInterval(() => fetchBalance(telegramUser.id), 60000);
    return () => clearInterval(interval);
  }, [telegramUser]);

  // 🔥 NEW: Called when onboarding completes successfully
  const handleOnboardingComplete = (user: any) => {
    const tgId = user.tg_id;

    // Save for future auto-login
    if (typeof window !== "undefined") {
      window.localStorage.setItem("bw_tg_id", String(tgId));
    }

    // Set user into state
    setTelegramUser({
      id: tgId,
      tg_id: tgId,
      username: user.username,
      first_name: user.first_name,
      photo_url: user.photo_url || null,
      points_balance: user.points_balance ?? null,
    });

    setBalance(user.points_balance ?? null);

    setOnboardingOpen(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ backgroundColor: "black" }}>
      {/* 🌍 Background Globe */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <BluewaveGlobe />
      </div>
      {/* 💰 Floating Balance Pill */}
      {!onboardingOpen && !isLoading && (
        <BalancePill
          balance={balance}
          isVisible={!isBwaveScanOpen}
        />
      )}

      {/* 🤖 BLU AI Assistant Button */}
      {!onboardingOpen && !isLoading && !isMaintenanceMode && (
        <BluButton />
      )}

      {/* 🧭 Navigation Bar */}
      {!onboardingOpen && !isLoading && !isBwaveScanOpen && !isRolesOpen && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            // Sync legacy booleans for lazy-rendering compatibility
            setMissionOpen(tab === "missions");
            setLeaderboardOpen(tab === "leaderboard");
            setMarketOpen(tab === "market");
            setProfileOpen(tab === "profile");
          }}
          userAvatarUrl={telegramUser?.photo_url}
        />
      )}

      {/* 🎯 Overlays (Lazy-rendered to save API calls) */}
      {isMissionOpen && (
        <MissionCenter isOpen={isMissionOpen} onClose={() => { setMissionOpen(false); setActiveTab("home"); }} telegramUser={telegramUser} />
      )}
      {isLeaderboardOpen && (
        <Leaderboard isOpen={isLeaderboardOpen} onClose={() => { setLeaderboardOpen(false); setActiveTab("home"); }} telegramUser={telegramUser} />
      )}
      {isMarketOpen && (
        <Marketplace isOpen={isMarketOpen} onClose={() => { setMarketOpen(false); setActiveTab("home"); }} />
      )}
      {isProfileOpen && (
        <Profile
          isOpen={isProfileOpen}
          onClose={() => { setProfileOpen(false); setActiveTab("home"); }}
          telegramUser={telegramUser}
          onOpenRoles={(roleName: string) => {
            const role = findRoleByName(roleName);
            if (role) setSelectedRoleData(role);
          }}
          onOpenBwaveScan={() => setBwaveScanOpen(true)}
          onOpenEcosystemRoles={() => {
            setProfileOpen(false);
            setActiveTab("home");
            setTimeout(() => setRolesOpen(true), 300);
          }}
        />
      )}

      {/* 🌀 Loading Screen */}
      <AnimatePresence>
        {isMaintenanceMode && <MaintenanceOverlay key="maintenance" />}
      </AnimatePresence>

      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="fixed inset-0 z-[100]">
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🏆 Roles Overlay */}
      <RolesOverlay
        isOpen={isRolesOpen}
        onClose={() => {
          setRolesOpen(false);
          setSelectedRoleName(null);
        }}
        initialRoleName={selectedRoleName}
      />

      {/* 🔐 Onboarding LOCK SCREEN */}
      <OnboardingModal
        isOpen={onboardingOpen}
        onComplete={handleOnboardingComplete}
        autoUsername={telegramUser?.username}
      />

      {/* 🛡️ Recovery Password LOCK SCREEN */}
      <RecoveryPasswordModal
        isOpen={showRecoveryModal}
        onSuccess={() => setShowRecoveryModal(false)}
        telegramId={telegramUser?.tg_id || 0}
      />

      {/* 🔥 Streak Celebration Modal */}
      <StreakCelebrationModal
        isOpen={isStreakCelebrationOpen}
        onClose={() => {
          setIsStreakCelebrationOpen(false);
          handleClearStreakReward();
        }}
        streakDays={streakCelebrationData.days}
        rewardAmount={streakCelebrationData.reward}
      />

      {/* 🛡️ Human Verification Modal */}
      <VerifiedHumanModal
        isOpen={isHumanModalOpen}
        onClose={handleClearHumanVerification}
      />

      {/* 🌐 Network Builder Modal */}
      <NetworkBuilderModal
        isOpen={isNetworkBuilderModalOpen}
        onClose={handleClearNetworkBuilder}
      />

      {/* 💎 TON Explorer Modal */}
      <TONExplorerModal
        isOpen={isTONModalOpen}
        onClose={handleClearTONExplorer}
      />

      <BwaveScanOverlay
        isOpen={isBwaveScanOpen}
        onClose={() => setBwaveScanOpen(false)}
        bwId={telegramUser?.bw_id}
      />

      {currentCelebratingRole && (
        <RoleCelebrationModal
          isOpen={!!currentCelebratingRole}
          roleName={currentCelebratingRole}
          onClose={() => handleClearRoleCelebration(currentCelebratingRole)}
        />
      )}

      <RoleDetailModal
        role={selectedRoleData}
        onClose={() => setSelectedRoleData(null)}
      />
    </div>
  );
}
