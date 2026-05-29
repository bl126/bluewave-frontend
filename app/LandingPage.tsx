// [CODE: FRONTEND_LANDING_PAGE_COMPONENT]
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import BluewaveGlobe from "@/components/ui/BluewaveGlobe";
import MissionCenter from "@/components/ui/MissionCenter";
import Explore from "@/components/ui/Explore";
import Marketplace from "@/components/ui/Marketplace";
import Profile from "@/components/ui/Profile";
import BottomNav, { TabId } from "@/components/ui/BottomNav";
import LanguageSelector from "@/components/ui/LanguageSelector";
import BugsSuggestions from "@/components/ui/BugsSuggestions";


import LoadingScreen from "./LoadingScreen";
import RolesOverlay from "@/components/ui/RolesOverlay";
import RecoveryPasswordModal from "@/components/ui/RecoveryPasswordModal";
import StreakCelebrationModal from "@/components/ui/StreakCelebrationModal";
import StreakRecoveryModal from "@/components/ui/StreakRecoveryModal";
import VerifiedHumanModal from "@/components/ui/VerifiedHumanModal";
import TONExplorerModal from "@/components/ui/TONExplorerModal";
import BwaveScanOverlay from "@/components/ui/BwaveScanOverlay";
import RoleDetailModal from "@/components/ui/RoleDetailModal";
import RoleCelebrationModal from "@/components/ui/RoleCelebrationModal";
import NetworkBuilderModal from "@/components/ui/NetworkBuilderModal";
import { findRoleByName } from "@/lib/roles";
import { useLanguage } from "@/contexts/LanguageContext";
import { mutate } from "swr";
import { getApi, postApi, useSync } from "@/lib/useApi";
import MaintenanceOverlay from "@/components/ui/MaintenanceOverlay";
import WalletRelinkOverlay from "@/components/ui/WalletRelinkOverlay";
import BalancePill from "@/components/ui/BalancePill";
import BluButton from "@/components/ui/BluButton";
import DailyAIPopup from "@/components/ui/DailyAIPopup";
import PortalButton from "@/components/portal/PortalButton";
import PortalContainer from "@/components/portal/PortalContainer";
import CocoonOverlay from "@/components/ui/CocoonOverlay";
import { useTonConnectUI, toUserFriendlyAddress } from "@tonconnect/ui-react";

// [CODE: FRONTEND_LANDING_PAGE_MAIN_COMPONENT]
export default function LandingPage() {
  const { t } = useLanguage();
  const [tonConnectUI] = useTonConnectUI();

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

  // Preload top-up + withdrawal modals and TON price for instant open
  useEffect(() => {
    void import("@/components/ui/DepositModal");
    void import("@/components/ui/StarWithdrawalModal");
    void import("@/lib/tonPriceCache").then((m) => m.fetchTonPriceUsd());
  }, []);

  // [CODE: FRONTEND_STATE_MANAGEMENT]
  // 👤 Store Telegram user info
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [fallbackUsername, setFallbackUsername] = useState<string>("");
  const [balance, setBalance] = useState<number | null>(null);
  const [isMissionOpen, setMissionOpen] = useState(false);
  const [isExploreOpen, setExploreOpen] = useState(false);
  const [isMarketOpen, setMarketOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [isRolesOpen, setRolesOpen] = useState(false);
  const [selectedRoleName, setSelectedRoleName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [isBwaveScanOpen, setBwaveScanOpen] = useState(false);

  // 🔐 Recovery Password State
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // 🔥 Streak Celebration State
  const [isStreakCelebrationOpen, setIsStreakCelebrationOpen] = useState(false);
  const [streakCelebrationData, setStreakCelebrationData] = useState({ days: 0, reward: 0 });

  // 🧊 Streak Recovery State
  const [isStreakRecoveryOpen, setIsStreakRecoveryOpen] = useState(false);

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

  // 🛡️ Wallet Relink State
  const [isWalletRelinkRequired, setIsWalletRelinkRequired] = useState(false);

  // 🏆 Role Celebration State
  const [pendingRoles, setPendingRoles] = useState<string[]>([]);
  const [currentCelebratingRole, setCurrentCelebratingRole] = useState<string | null>(null);
  const [initialProfile, setInitialProfile] = useState<any>(null);

  // 🤖 Daily AI Reward State
  const [isAIPopupOpen, setIsAIPopupOpen] = useState(false);
  const [aiPointsAwarded, setAIPointsAwarded] = useState(0);

  // 🤖 Blu Expansion State
  const [isBluExpanded, setIsBluExpanded] = useState(false);

  // 🔔 Explore Notifications Count (Global State)
  const [unreadExploreCount, setUnreadExploreCount] = useState(0);

  // 🧭 Navigation Visibility
  const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);

  // 🥚 Cocoon State
  const [isCocoonOpen, setCocoonOpen] = useState(false);

  // 🐛 Bugs & Suggestions State
  const [isBugsSuggestionsOpen, setIsBugsSuggestionsOpen] = useState(false);

  // 🌀 Portal State
  const [isPortalOpen, setIsPortalOpen] = useState(false);

  // 🎯 Pending Mission Count
  const [pendingMissionCount, setPendingMissionCount] = useState(0);
  const [socialMissionCount, setSocialMissionCount] = useState(0);
  const [presenceMissionCount, setPresenceMissionCount] = useState(0);

  // 💬 Welcome / Guidance Bubble
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(false);
  const [welcomeBubbleDismissed, setWelcomeBubbleDismissed] = useState(false);

  const ADMIN_IDS = [5023869471];
  const isAdmin = telegramUser?.id ? ADMIN_IDS.includes(Number(telegramUser.id)) : (process.env.NODE_ENV === "development");

  const isAnyOverlayOpen = isProfileOpen || isMissionOpen || isExploreOpen || isMarketOpen || isRolesOpen || isBwaveScanOpen || showRecoveryModal || !!selectedRoleData || isHumanModalOpen || isNetworkBuilderModalOpen || isTONModalOpen || isStreakCelebrationOpen || isMaintenanceMode || isWalletRelinkRequired || !!currentCelebratingRole || isAIPopupOpen || isBluExpanded || showLanguageSelector || showTour || isCocoonOpen || isBugsSuggestionsOpen;

  // [CODE: TELEGRAM_BACK_BUTTON]
  // 🔙 Sync Telegram's native Back Button with overlay state
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.BackButton) return;

    const handleBack = () => {
      if (isMaintenanceMode || isWalletRelinkRequired) {
        tg.close();
        return;
      }

      // 0. Dispatch Native Interceptor Event
      const backEvent = new CustomEvent("bwNativeBack", { cancelable: true });
      window.dispatchEvent(backEvent);
      if (backEvent.defaultPrevented) return; // Signal intercepted (e.g. by Explore modal)

      // 1. Nested Overlays/Modals (Stack-aware early returns)
      if (isBugsSuggestionsOpen) {
        setIsBugsSuggestionsOpen(false);
        setProfileOpen(true);
        setActiveTab("profile");
        return;
      }
      if (selectedRoleData) {
        setSelectedRoleData(null);
        return;
      }
      if (isBwaveScanOpen) {
        setBwaveScanOpen(false);
        return;
      }
      if (isRolesOpen) {
        setRolesOpen(false);
        return;
      }
      if (isCocoonOpen) {
        setCocoonOpen(false);
        return;
      }
      if (isBluExpanded) {
        setIsBluExpanded(false);
        return;
      }
      if (isStreakRecoveryOpen) {
        setIsStreakRecoveryOpen(false);
        return;
      }
      if (isStreakCelebrationOpen) {
        // Streak reward must be claimed via the modal button — not back or backdrop
        return;
      }
      if (isHumanModalOpen) {
        handleClearHumanVerification();
        return;
      }
      if (isNetworkBuilderModalOpen) {
        handleClearNetworkBuilder();
        return;
      }
      if (isTONModalOpen) {
        handleClearTONExplorer();
        return;
      }
      if (currentCelebratingRole) {
        handleClearRoleCelebration(currentCelebratingRole);
        return;
      }
      if (isAIPopupOpen) {
        handleClearAIPopup();
        return;
      }

      // 2. Top-Level Overlays (Close and return to Home)
      if (activeTab !== "home") {
        setMissionOpen(false);
        setExploreOpen(false);
        setMarketOpen(false);
        setProfileOpen(false);
        setActiveTab("home");
        return;
      }

      // 3. App Exit
      tg.close();
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
  }, [
    isAnyOverlayOpen, isRolesOpen, isBwaveScanOpen, isBluExpanded, isMaintenanceMode,
    selectedRoleData, isStreakCelebrationOpen, isHumanModalOpen, isNetworkBuilderModalOpen,
    isTONModalOpen, currentCelebratingRole, isAIPopupOpen, activeTab, isCocoonOpen, isBugsSuggestionsOpen
  ]);

  // 🔗 Global wallet synchronization listener
  useEffect(() => {
    if (!tonConnectUI || !telegramUser?.id) return;

    // Guard: If the Telegram User ID switched on the same device, force disconnect
    if (typeof window !== "undefined") {
      const connectedTgId = localStorage.getItem("bluewave_connected_tg_id");
      if (connectedTgId && connectedTgId !== String(telegramUser.id)) {
        console.log("[GLOBAL WALLET SYNC] Telegram User ID changed on device. Disconnecting wallet session.");
        tonConnectUI.disconnect();
        localStorage.removeItem("bluewave_connected_tg_id");
        return;
      }
    }

    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet?.account?.address) {
        if (typeof window !== "undefined") {
          localStorage.setItem("bluewave_connected_tg_id", String(telegramUser.id));
        }

        let friendlyAddress: string;
        try {
          friendlyAddress = toUserFriendlyAddress(wallet.account.address);
        } catch {
          friendlyAddress = wallet.account.address;
        }

        const dbWallet = telegramUser?.wallet_address;
        const friendlyToRaw = (address: string): string => {
          try {
            if (address.includes(":")) return address.toLowerCase().trim();
            const base64 = address.replace(/-/g, "+").replace(/_/g, "/");
            const binary = atob(base64);
            const workchain = binary.charCodeAt(1);
            const wc = workchain === 255 ? -1 : workchain;
            let hex = "";
            for (let i = 2; i < 34; i++) {
              hex += binary.charCodeAt(i).toString(16).padStart(2, "0");
            }
            return `${wc}:${hex}`.toLowerCase();
          } catch {
            return address.toLowerCase().trim();
          }
        };

        const isSameAddr = (a1: string, a2: string) => {
          if (!a1 || !a2) return false;
          return friendlyToRaw(a1) === friendlyToRaw(a2);
        };

        if (!dbWallet) {
          console.log("[GLOBAL WALLET SYNC] Wallet connected for first time. Syncing to DB:", friendlyAddress);
          postApi(`/user/update_profile`, {
            tg_id: telegramUser.id,
            wallet_address: friendlyAddress
          })
          .then((res) => {
            const user = res?.user || res;
            if (user) {
              setTelegramUser((prev: any) => ({
                ...prev,
                ...user,
                id: user.tg_id || prev?.id || prev?.tg_id,
                wallet_address: user.wallet_address || friendlyAddress
              }));
            }
          })
          .catch(err => console.error("[GLOBAL WALLET SYNC] Failed to sync wallet to DB:", err));
        } else if (!isSameAddr(friendlyAddress, dbWallet)) {
          console.warn("[GLOBAL WALLET SYNC] Wallet mismatch detected. Current connected:", friendlyAddress, "DB registered:", dbWallet);
        }
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("bluewave_connected_tg_id");
        }
      }
    });

    return () => unsubscribe();
  }, [tonConnectUI, telegramUser?.id, telegramUser?.wallet_address]);

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  // ⭐ Unified Initialization: Profile + Auth + Data Preloading
  useEffect(() => {
    if (typeof window === "undefined") return;

    // ── 🚀 INSTANT HYDRATION ──────────────────────────────────────────────
    // Load last session's data from localStorage ONLY if it matches the current Telegram user
    const startupTime = Date.now();
    try {
      const tg = (window as any).Telegram?.WebApp;
      const liveTgId = tg?.initDataUnsafe?.user?.id;
      const cacheKey = liveTgId ? `bw_init_cache_${liveTgId}` : "bw_init_cache";
      const cached = window.localStorage.getItem(cacheKey);

      if (cached) {
        const data = JSON.parse(cached);
        if (data.profile) {
          const u = data.profile;
          
          // Cache identity is now guaranteed by keys.

          setTelegramUser({
            id: Number(u.tg_id),
            tg_id: Number(u.tg_id),
            username: u.username,
            first_name: u.name,
            photo_url: u.photo_url || null,
            points_balance: u.points_balance ?? 0,
            referral_earnings_pending: u.referral_earnings_pending ?? 0,
            total_referrals: u.total_referrals ?? 0,
            wallet_address: u.wallet_address,
            is_human_verified: !!u.is_human_verified,
            presence_score: u.presence_score ?? 0,
            lifetime_entropy: u.lifetime_entropy ?? 0,
            bw_id: u.bw_id,
            deposit_token: u.deposit_token,
            joined_at: u.joined_at,
            ton_balance: parseFloat(u.ton_balance ?? 0) || 0,
            stars_balance: Number(u.stars_balance ?? 0) || 0,
            stars_withdrawable: Number(u.stars_withdrawable ?? 0) || 0,
            wallet_relink_required: u.wallet_relink_required || false,
            has_recovery_password: u.has_recovery_password || false,
          });
          setBalance(u.points_balance ?? 0);
          setUnreadExploreCount(data.unread_explore_notifications || 0);

          if (u.wallet_relink_required) {
            setIsWalletRelinkRequired(true);
          }

          // NOTE: Recovery password check is intentionally NOT done from cache.
          // The cache may not have has_recovery_password (old format) and would
          // incorrectly show the modal for everyone. This check runs after live /init.

          // 🕒 Enforce 1 second branding delay even with cache
          const elapsed = Date.now() - startupTime;
          const delay = Math.max(0, 1000 - elapsed);
          setTimeout(() => {
            setIsLoading(false);
            console.log("🚀 INSTANT_STARTUP: Transitioned from cache after branding delay.");
          }, delay);
        }
      }
    } catch (e) {
      console.warn("Hydration postponed or failed:", e);
    }
    // ──────────────────────────────────────────────────────────────────────

    (async () => {
      try {
        const tg = (window as any).Telegram?.WebApp;
        let tgUser = tg?.initDataUnsafe?.user;

        // 1. Determine Telegram ID (STRICT prioritization)
        // If we don't have a live tgUser yet, we MUST wait for it rather than guessing from localStorage
        if (!tgUser?.id) {
          await new Promise(resolve => setTimeout(resolve, 800));
          tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
        }

        const effectiveTgId = tgUser?.id;

        if (!effectiveTgId) {
          console.warn("No Telegram ID found. Retrying...");
          setTimeout(() => window.location.reload(), 2000);
          return;
        }

        // 🔗 Capture start_param (Referrer or Post Linking)
        const startParam = tg?.initDataUnsafe?.start_param;
        let referrerId = null;
        let actionPostId = null;
        let actionQuestSlug = null;
        if (startParam) {
            if (startParam.startsWith("ref_")) {
                referrerId = startParam.replace("ref_", "");
            } else if (startParam.startsWith("post_")) {
                actionPostId = startParam.replace("post_", "");
            } else if (startParam.startsWith("quest_")) {
                actionQuestSlug = startParam.replace("quest_", "");
            }
        }
        if (actionQuestSlug) {
            window.localStorage.setItem("bw_pending_quest_slug", actionQuestSlug);
        }

        // 📢 Post-link Referral: resolve the post author as the referrer
        // If opened via a post share link, the post author gets referral credit
        // if this is a new user who later activates their wallet.
        if (actionPostId && !referrerId) {
            try {
                const postData = await getApi(`/explore/post/${actionPostId}`);
                if (postData?.tg_id && String(postData.tg_id) !== String(effectiveTgId)) {
                    referrerId = String(postData.tg_id);
                    console.log(`📢 POST_REFERRAL: Post ${actionPostId} author ${referrerId} set as referrer`);
                }
            } catch (e) {
                // Non-blocking: if we can't fetch the post, just continue without referrer
                console.warn("Post referral lookup failed:", e);
            }
        }

        const savedTgId = String(effectiveTgId);
        window.localStorage.setItem("bw_tg_id", savedTgId); // Keep cache in sync with reality

        // 2. Fetch unified initial state from backend (Now with Auto-Registration)
        const initUrl = referrerId ? `/init/${savedTgId}?referrer_id=${referrerId}` : `/init/${savedTgId}`;
        const data = await getApi(initUrl);

        if (data.error) {
          if (data.error === "TOO_FAST") {
            console.warn("Rate limited. Retrying in 1.2s...");
            setTimeout(() => { window.location.reload(); }, 1200);
            return;
          }

          if (data.error === "AUTH_REQUIRED" || data.error === "IDENTITY_MISMATCH") {
            console.warn("Auth error. Clearing stale cache...", data.error);
            window.localStorage.removeItem("bw_tg_id");
            window.localStorage.removeItem("bw_init_cache");
            setTimeout(() => window.location.reload(), 1000);
            return;
          }

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

        // 3.5 Wallet Relink Check
        if (user.wallet_relink_required) {
          setIsWalletRelinkRequired(true);
          setIsLoading(false);
        }

        // 3.6 Recovery Password Check (Only if wallet connected)
        if (!user.has_recovery_password && user.wallet_address) {
          setShowRecoveryModal(true);
          setIsLoading(false);
        }

        // 4. Check for Wallet Activation (The new Unified Gate)
        const isGhost = !user.wallet_address;
        
        if (isGhost) {
          console.log("Ghost user detected. Preparing onboarding sequence...");
          // If they haven't seen the onboarding sequence yet, show it
          const hasSeenSequence = window.localStorage.getItem(`bw_seen_onboarding_${savedTgId}`);
          if (!hasSeenSequence) {
            setShowLanguageSelector(true);
          }
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
        const finalUser = {
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
          deposit_token: user.deposit_token,
          joined_at: user.joined_at,
          wallet_address: user.wallet_address,
          recovery_password_hash: user.recovery_password_hash,
          has_recovery_password: user.has_recovery_password || false,
          human_verification_pending: user.human_verification_pending || false,
          network_builder_pending: user.network_builder_pending || false,
          is_human_verified: !!user.is_human_verified,
          presence_score: user.presence_score ?? 0,
          lifetime_entropy: user.lifetime_entropy ?? 0,
          unread_explore_notifications: data.unread_explore_notifications || 0,
          recoverable_streak: user.recoverable_streak || 0,
          streak_recovery_expires_at: user.streak_recovery_expires_at || null,
          ton_balance: parseFloat(user.ton_balance ?? 0) || 0,
          stars_balance: Number(user.stars_balance ?? 0) || 0,
          stars_withdrawable: Number(user.stars_withdrawable ?? 0) || 0,
          wallet_relink_required: user.wallet_relink_required || false,
        };

        setTelegramUser(finalUser);
        setBalance(user.points_balance ?? 0);
        setUnreadExploreCount(data.unread_explore_notifications || 0);
        setInitialProfile(user);

        // Update local cache for next "Instant Startup" (Per-User)
        const cacheKey = savedTgId ? `bw_init_cache_${savedTgId}` : "bw_init_cache";
        window.localStorage.setItem(cacheKey, JSON.stringify(data));
        window.localStorage.setItem("bw_tg_id", savedTgId);

        // 🔥 Initial check for pending rewards from init data
        if (user.recoverable_streak > 0 && user.streak_recovery_expires_at) {
          const expiresAt = new Date(user.streak_recovery_expires_at).getTime();
          if (Date.now() < expiresAt) {
            setTimeout(() => setIsStreakRecoveryOpen(true), 1500);
          }
        } 
        
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

        /* [BLU_FREEZE] Mark off AI rewards
        if (user.pending_ai_rewards && user.pending_ai_rewards.length > 0) {
          const sum = user.pending_ai_rewards.reduce((acc: number, cur: any) => acc + (cur.action_data?.points_awarded || 0), 0);
          if (sum > 0) {
            setAIPointsAwarded(sum);
            setTimeout(() => setIsAIPopupOpen(true), 2500);
          }
        }
        */

        setBalance(user.points_balance ?? null);
        
        // 🎯 Set pending mission count
        if (data.missions) {
          const m = data.missions;
          let social = 0;
          
          const countPending = (list: any[]) => {
            if (!Array.isArray(list)) return 0;
            return list.filter(item => item.status !== "done").length;
          };

          social += countPending(m.normal);
          social += countPending(m.daily);
          social += countPending(m.onboarding);
          if (m.story && m.story.status !== "done") social += 1;

          setSocialMissionCount(social);
        }

        if (data.presence && Array.isArray(data.presence)) {
          const pPending = data.presence.filter((pm: any) => pm.status === "inactive" || pm.status === "completed").length;
          setPresenceMissionCount(pPending);
        }

        setBalance(user.points_balance ?? null);

        // ⭐ SEED SWR Cache & Persistent Storage
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        mutate(`${apiUrl}/api/user/${tgIdNum}`, user, false);
        mutate(`${apiUrl}/api/missions/all/${tgIdNum}`, data.missions, false);
        mutate(`${apiUrl}/api/presence/list/${tgIdNum}`, data.presence, false);
        
        // 🏆 Persistent Leaderboard Cache
        if (data.leaderboard) {
          mutate(`${apiUrl}/api/leaderboard`, data.leaderboard, false);
          mutate(`${apiUrl}/api/leaderboard?tg_id=${tgIdNum}`, data.leaderboard, false);
          window.localStorage.setItem(`bw_leaderboard_cache_${tgIdNum}`, JSON.stringify(data.leaderboard));
        }
 
        // 🚀 Pre-fetch Explore Feed & Cache
        getApi(`/explore/feed?tg_id=${tgIdNum}&tab=foryou&offset=0`)
          .then(posts => {
            if (posts && Array.isArray(posts)) {
              mutate(`${apiUrl}/api/explore/feed?tg_id=${tgIdNum}&tab=foryou&offset=0`, posts, false);
              window.localStorage.setItem(`bw_feed_foryou_${tgIdNum}`, JSON.stringify(posts));
            }
          }).catch(() => { });

        // Enforce a minimum 1s branding delay for non-cached loads
        const elapsed = Date.now() - startupTime;
        const delay = Math.max(0, 1000 - elapsed);

        // All ready
        setTimeout(() => {
          setIsLoading(false);
          console.log("Initialization complete after delay.");
          // ⭐ If actionPostId is set, navigate user immediately to the explore feed
          if (actionPostId) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("setActiveTab", { detail: "explore" }));
            }, 300);
          }
        }, delay);
      } catch (err) {
        console.error("Initialization error:", err);
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

    const handleTONPop = () => {
      setIsTONModalOpen(true);
    };

    const handleRecoveryPop = () => {
      setShowRecoveryModal(true);
    };

    const handleStreakRecoveryPop = () => {
      setIsStreakRecoveryOpen(true);
    };

    const handleUpdateUser = (e: any) => {
      const newUser = e.detail;
      if (!newUser) return;
      
      setTelegramUser((prev: any) => ({
        ...prev,
        ...newUser,
        // Ensure mapping consistency if the backend object differs slightly
        id: newUser.tg_id || prev?.id,
        wallet_address: newUser.wallet_address || prev?.wallet_address,
        is_human_verified: !!newUser.is_human_verified,
        presence_score: newUser.presence_score !== undefined ? newUser.presence_score : prev?.presence_score,
        lifetime_entropy: newUser.lifetime_entropy !== undefined ? newUser.lifetime_entropy : prev?.lifetime_entropy,
      }));
      
      if (newUser.points_balance !== undefined) {
        setBalance(newUser.points_balance);
      }
    };

    window.addEventListener('showStreakCelebration' as any, handleStreakPop);
    window.addEventListener('showStreakRecovery' as any, handleStreakRecoveryPop);
    window.addEventListener('showHumanVerification' as any, handleHumanPop);
    window.addEventListener('showNetworkBuilder' as any, handleNetworkPop);
    window.addEventListener('showTONExplorer' as any, handleTONPop);
    window.addEventListener('showRecoveryPassword' as any, handleRecoveryPop);
    window.addEventListener('updateUser' as any, handleUpdateUser);
    return () => {
      window.removeEventListener('showStreakCelebration' as any, handleStreakPop);
      window.removeEventListener('showStreakRecovery' as any, handleStreakRecoveryPop);
      window.removeEventListener('showHumanVerification' as any, handleHumanPop);
      window.removeEventListener('showNetworkBuilder' as any, handleNetworkPop);
      window.removeEventListener('showTONExplorer' as any, handleTONPop);
      window.removeEventListener('showRecoveryPassword' as any, handleRecoveryPop);
      window.removeEventListener('updateUser' as any, handleUpdateUser);
    };
  }, []);

  const [questDetailOpen, setQuestDetailOpen] = useState(false);

  useEffect(() => {
    const onQuestDetail = (e: Event) => setQuestDetailOpen(!!(e as CustomEvent).detail);
    window.addEventListener("questDetailOpen", onQuestDetail);
    return () => window.removeEventListener("questDetailOpen", onQuestDetail);
  }, []);

  // 📜 Hide bottom nav on scroll (Explore feed + quest detail)
  useEffect(() => {
    const handleScrollDir = (e: any) => {
      if (!isExploreOpen && !questDetailOpen) return;
      const direction = e.detail;
      if (direction === "down") {
        setIsBottomNavVisible(false);
      } else {
        setIsBottomNavVisible(true);
      }
    };
    window.addEventListener("scrollDirectionChanged" as any, handleScrollDir);
    return () => window.removeEventListener("scrollDirectionChanged" as any, handleScrollDir);
  }, [isExploreOpen, questDetailOpen]);

  useEffect(() => {
    if (!isExploreOpen && !questDetailOpen) {
      setIsBottomNavVisible(true);
    }
  }, [isExploreOpen, questDetailOpen]);

  // 🔗 Deep link: startapp=quest_{slug} → Mission Center + quest detail
  useEffect(() => {
    if (!telegramUser?.id || isLoading) return;
    const slug = window.localStorage.getItem("bw_pending_quest_slug");
    if (!slug) return;
    window.localStorage.removeItem("bw_pending_quest_slug");
    setActiveTab("missions");
    setMissionOpen(true);
    setExploreOpen(false);
    setMarketOpen(false);
    setProfileOpen(false);
    const t = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("openQuestBySlug", { detail: slug }));
    }, 400);
    return () => window.clearTimeout(t);
  }, [telegramUser?.id, isLoading]);

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

  const handleClearAIPopup = async () => {
    setIsAIPopupOpen(false);
    try {
      if (telegramUser?.tg_id) {
        // We'll create this endpoint in the backend to mark AI notifications as read
        await postApi("/user/clear_ai_rewards", { telegram_id: telegramUser.tg_id });
      }
    } catch (e) {
      console.error("Clear AI Rewards error:", e);
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

  // 🔄 Listen for programmatic tab changes (e.g. from Ghost Mode gates requesting wallet connection)
  useEffect(() => {
    const handleSetTab = (event: any) => {
      const tab = event.detail;
      setActiveTab(tab);
      setMissionOpen(tab === "missions");
      setExploreOpen(tab === "explore");
      setMarketOpen(tab === "market");
      setProfileOpen(tab === "profile");
    };
    window.addEventListener("setActiveTab", handleSetTab);
    return () => window.removeEventListener("setActiveTab", handleSetTab);
  }, []);

  /* [BLU_FREEZE] Mark off Daily AI Reward logic
  // 🔁 Listen for global balance updates (unchanged)
  useEffect(() => {
    const handleBalanceUpdate = (event: any) => {
      setBalance(event.detail);
    };
    window.addEventListener("updateBalance", handleBalanceUpdate);
    return () => window.removeEventListener("updateBalance", handleBalanceUpdate);
  }, []);
  */

  // 🔄 Consolidated Synchronization (Heartbeat)
  // Instead of multiple separate polls, we use a single lightweight endpoint.
  const { data: syncData } = useSync(telegramUser?.id || null);

  useEffect(() => {
    if (!syncData || syncData.error) return;

    if (syncData.points_balance !== undefined) {
      setBalance(syncData.points_balance);
    }
    if (syncData.unread_explore_notifications !== undefined) {
      setUnreadExploreCount(syncData.unread_explore_notifications);
    }
    
    // Sync SWR Cache Atomicly
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (telegramUser?.id) {
      if (syncData.presence) {
        mutate(`${apiUrl}/api/presence/list/${telegramUser.id}`, syncData.presence, false);
      }
      // Update basic profile fields in cache
      mutate(`${apiUrl}/api/user/${telegramUser.id}`, (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          points_balance: syncData.points_balance ?? prev.points_balance,
          streak_days: syncData.streak_days ?? prev.streak_days,
          recoverable_streak: syncData.recoverable_streak ?? prev.recoverable_streak,
          streak_recovery_expires_at: syncData.streak_recovery_expires_at ?? prev.streak_recovery_expires_at,
        };
      }, false);
    }
  }, [syncData, telegramUser?.id]);

  // 🏁 Called when Ecosystem Tour completes
  const handleTourComplete = () => {
    setShowTour(false);
    if (telegramUser?.id) {
        window.localStorage.setItem(`bw_seen_onboarding_${telegramUser.id}`, "true");
    }
  };

  // 💬 Welcome Bubble: show after loading completes, dismiss after 10s
  useEffect(() => {
    if (isLoading || welcomeBubbleDismissed || !telegramUser) return;
    // Only show if no critical modal is already open
    if (isStreakCelebrationOpen || isHumanModalOpen || isNetworkBuilderModalOpen || isTONModalOpen || !!currentCelebratingRole || isAIPopupOpen) return;
    setShowWelcomeBubble(true);
    const timer = setTimeout(() => {
      setShowWelcomeBubble(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, [isLoading, telegramUser?.id]);

  const handleDismissWelcomeBubble = () => {
    setShowWelcomeBubble(false);
    setWelcomeBubbleDismissed(true);
  };

  // Derive bubble message
  const isNewUser = !telegramUser?.wallet_address;
  const totalPending = socialMissionCount + presenceMissionCount;
  const welcomeBubbleMessage = isNewUser
    ? "Welcome to the Wave 🌊 Let me guide you on your journey."
    : totalPending > 0
      ? `You have ${totalPending} pending mission${totalPending > 1 ? 's' : ''} in ${presenceMissionCount > 0 ? 'presence' : ''}${presenceMissionCount > 0 && socialMissionCount > 0 ? ' & ' : ''}${socialMissionCount > 0 ? 'social' : ''}. Don't miss out!`
      : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ backgroundColor: "var(--app-bg)" }}>
      {/* 🌍 Background Globe */}
      <div className="absolute inset-0">
        <BluewaveGlobe />
      </div>
      {/* 💰 Floating Balance Pill */}
      {!isLoading && (
        <BalancePill
          balance={balance}
          isVisible={!isBwaveScanOpen}
          telegramUser={telegramUser}
          onGoToProfile={() => {
            setActiveTab("profile");
            setProfileOpen(true);
            setExploreOpen(false);
            setMissionOpen(false);
            setMarketOpen(false);
          }}
        />
      )}

      {/* 🤖 BLU AI Assistant Button */}
      {!isLoading && !isMaintenanceMode && (
        <BluButton
          isExpanded={isBluExpanded}
          onToggleExpand={setIsBluExpanded}
          telegramUser={telegramUser}
          balance={balance}
          pendingMissionCount={pendingMissionCount}
          socialMissionCount={socialMissionCount}
          presenceMissionCount={presenceMissionCount}
          onOpenCocoon={() => setCocoonOpen(true)}
          onNavigateToTab={(tab) => {
            setActiveTab(tab);
            setMissionOpen(tab === "missions");
            setExploreOpen(tab === "explore");
            setMarketOpen(tab === "market");
            setProfileOpen(tab === "profile");
            setIsBluExpanded(false);
          }}
          welcomeBubble={showWelcomeBubble && welcomeBubbleMessage ? {
            message: welcomeBubbleMessage,
            isNewUser: isNewUser,
            onDismiss: handleDismissWelcomeBubble
          } : null}
        />
      )}

      {/* 🌀 Portal Ring Button */}
      {!isLoading && !isMaintenanceMode && isAdmin && !isPortalOpen && (
        <PortalButton onClick={() => setIsPortalOpen(true)} />
      )}

      {/* 🌀 Portal Space Overlay */}
      {isPortalOpen && (
        <PortalContainer onClose={() => setIsPortalOpen(false)} />
      )}

      {/* 🧭 Navigation Bar */}
      {!isLoading && !isBwaveScanOpen && !isRolesOpen && !isBluExpanded && (
        <BottomNav
          activeTab={activeTab}
          telegramId={telegramUser?.id}
          exploreBadgeCount={unreadExploreCount}
          isVisible={isBottomNavVisible}
          onTabChange={(tab) => {
            setActiveTab(tab);
            // Sync legacy booleans for lazy-rendering compatibility
            setMissionOpen(tab === "missions");
            setExploreOpen(tab === "explore");
            setMarketOpen(tab === "market");
            setProfileOpen(tab === "profile");
          }}
          userAvatarUrl={telegramUser?.photo_url}
        />
      )}

      {/* 🎯 Overlays (Lazy-rendered to save API calls) */}
      <AnimatePresence mode="sync">
        {activeTab === "missions" && (
          <MissionCenter
            key="missions"
            isOpen={isMissionOpen}
            onClose={() => { setMissionOpen(false); setActiveTab("home"); }}
            telegramUser={telegramUser}
            isHumanVerified={!!telegramUser?.is_human_verified}
          />
        )}
        {activeTab === "explore" && (
          <Explore
            key="explore"
            isOpen={isExploreOpen}
            onClose={() => {
              setExploreOpen(false);
              setActiveTab("home");
            }}
            telegramUser={telegramUser}
            onGoToProfile={() => {
              setActiveTab("profile");
              setProfileOpen(true);
            }}
          />
        )}
        {activeTab === "market" && (
          <Marketplace key="market" isOpen={isMarketOpen} onClose={() => { setMarketOpen(false); setActiveTab("home"); }} telegramUser={telegramUser} />
        )}
        {activeTab === "profile" && (
          <Profile
            key="profile"
            isOpen={isProfileOpen}
            onClose={() => { setProfileOpen(false); setActiveTab("home"); }}
            telegramUser={telegramUser}
            onOpenRoles={(roleName: string) => {
              const role = findRoleByName(roleName);
              if (role) setSelectedRoleData(role);
            }}
            onOpenBwaveScan={() => setBwaveScanOpen(true)}
            onOpenEcosystemRoles={() => {
              setRolesOpen(true);
            }}
            onOpenBugsSuggestions={() => {
              setProfileOpen(false);
              setIsBugsSuggestionsOpen(true);
            }}
          />
        )}
        {isBugsSuggestionsOpen && (
          <BugsSuggestions
            key="bugs-suggestions"
            isOpen={isBugsSuggestionsOpen}
            onClose={() => {
              setIsBugsSuggestionsOpen(false);
              setProfileOpen(true);
              setActiveTab("profile");
            }}
            telegramUser={telegramUser}
          />
        )}
      </AnimatePresence>

      {/* 🌀 Loading Screen */}
      <AnimatePresence>
        {isMaintenanceMode && <MaintenanceOverlay key="maintenance" />}
      </AnimatePresence>

      {/* 🛡️ Wallet Relink Locked Screen */}
      <AnimatePresence>
        {isWalletRelinkRequired && (
          <WalletRelinkOverlay
            key="relink"
            bwId={telegramUser?.bw_id || ""}
            onVerified={() => {
              setIsWalletRelinkRequired(false);
              
              // Disconnect active wallet session to force a fresh re-linking
              try {
                if (tonConnectUI && tonConnectUI.connected) {
                  tonConnectUI.disconnect();
                }
              } catch (err) {
                console.error("Error disconnecting wallet during relink:", err);
              }
              
              if (telegramUser) {
                setTelegramUser((prev: any) => ({
                  ...prev,
                  wallet_relink_required: false,
                  wallet_address: null
                }));
              }
              // Mutate SWR cache
              if (telegramUser?.id) {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                mutate(`${apiUrl}/api/user/${telegramUser.id}`);
              }
            }}
          />
        )}
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

      {/* 🧭 Onboarding Sequence */}
      <LanguageSelector
        isOpen={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        onComplete={() => {
            setShowLanguageSelector(false);
            if (telegramUser?.id) {
                window.localStorage.setItem(`bw_seen_onboarding_${telegramUser.id}`, "true");
            }
        }}
      />

      {/* 🛡️ Recovery Password LOCK SCREEN */}
      <RecoveryPasswordModal
        isOpen={showRecoveryModal}
        onSuccess={() => {
          setShowRecoveryModal(false);
          setTelegramUser((prev: any) => prev ? { ...prev, has_recovery_password: true } : null);
          if (telegramUser?.id) {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            mutate(`${apiUrl}/api/user/${telegramUser.id}`, { ...telegramUser, has_recovery_password: true }, false);
          }
        }}
        telegramId={telegramUser?.tg_id || 0}
      />

      <StreakRecoveryModal
        isOpen={isStreakRecoveryOpen}
        onClose={() => setIsStreakRecoveryOpen(false)}
        telegramId={telegramUser?.id}
        recoverableStreak={telegramUser?.recoverable_streak || 0}
        expiresAt={telegramUser?.streak_recovery_expires_at || ''}
        pointsBalance={telegramUser?.points_balance || 0}
      />

      {/* 🔥 Streak Celebration Modal */}
      <StreakCelebrationModal
        isOpen={isStreakCelebrationOpen}
        onClose={handleClearStreakReward}
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
        walletConnected={!!telegramUser?.wallet_address}
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

      {/* [BLU_FREEZE] DailyAIPopup disabled
      isAIPopupOpen && (
        <DailyAIPopup
          pointsAwarded={aiPointsAwarded}
          onClose={handleClearAIPopup}
        />
      )
      */}

      {/* 🥚 Cocoon Overlay */}
      <CocoonOverlay 
        isOpen={isCocoonOpen}
        onClose={() => setCocoonOpen(false)}
      />
    </div>
  );
}
