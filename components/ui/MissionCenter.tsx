"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Clock, Lock, Gift } from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi, getApi, postApi } from "@/lib/useApi";
import { useTheme } from "@/contexts/ThemeContext";
import { canAdminQuests } from "@/lib/questAccess";
import ClaimBoostPopup, { ClaimBoostData } from "./ClaimBoostPopup";
import QuestTabPanel from "./quests/QuestTabPanel";

// [CODE: FRONTEND_MISSION_CENTER_TYPES]
interface MissionCenterProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
  isHumanVerified: boolean;
}

interface Mission {
  id: string;
  name: string;
  points: number;
  url: string;
  status: string;
}

interface PresenceMission {
  type: string; // 1h, 4h, 24h
  status: "inactive" | "active" | "completed";
  reward: number;
  duration_seconds: number;
  activated_at?: number; // timestamp ms
  expires_at?: number;   // timestamp ms
}

// [CODE: PRESENCE_CARD_COMPONENT]
// A specialized card for the 3 presence missions
function PresenceCard({
  mission,
  onActivate,
  onClaim,
  loadingId
}: {
  mission: PresenceMission;
  onActivate: (type: string) => void;
  onClaim: (type: string) => void;
  loadingId: string | null;
}) {
  const { t } = useLanguage();

  // Calculate progress for active missions
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (mission.status !== "active" || !mission.activated_at || !mission.expires_at) {
      setProgress(mission.status === "completed" ? 100 : 0);
      return;
    }

    const updateProgress = () => {
      const now = Date.now();
      const start = mission.activated_at!;
      const end = mission.expires_at!;
      const total = end - start;
      const current = now - start;
      const pct = Math.min(100, Math.max(0, (current / total) * 100));
      setProgress(pct);
    };

    updateProgress();
    const timer = setInterval(updateProgress, 1000); // Update every second for smooth bar
    return () => clearInterval(timer);
  }, [mission]);

  // Visuals based on state
  const isActive = mission.status === "active";
  const isCompleted = mission.status === "completed";
  const isLoading = loadingId === mission.type;

  return (
    <div className={`
      relative overflow-hidden rounded-2xl border transition-all duration-300 backdrop-blur-md
      ${isActive ? "border-white/20 bg-white/10 shadow-lg shadow-black/10" : ""}
      ${isCompleted ? "border-white/30 bg-white/20 shadow-lg shadow-black/20 animate-pulse" : ""}
      ${mission.status === "inactive" ? "border-white/10 bg-white/5" : ""}
    `}>
      {/* Background Progress Bar (Fill) */}
      {(isActive || isCompleted) && (
        <div
          className="absolute inset-0 bg-white/10 transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      )}

      <div className="relative p-6 flex items-center justify-between z-10 w-full">
        <div className="flex-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{mission.type} Mission</span>
        </div>

        <button
          onClick={() => {
            if (isCompleted) onClaim(mission.type);
            else if (mission.status === "inactive") onActivate(mission.type);
          }}
          disabled={isActive || isLoading}
          className={`
            py-3.5 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 duration-200
            ${isCompleted
              ? "bg-white text-black shadow-md border border-white/20 hover:bg-white/95"
              : isActive
                ? "bg-transparent text-white/40 cursor-not-allowed border border-white/5"
                : "bg-white/10 text-white border border-white/10 hover:bg-white/20"
            }
          `}
        >
          {isLoading ? t("profile.wait") :
            isCompleted ? t("presence.claim_reward").replace("{{amount}}", (mission.reward || 0).toString()) :
              isActive ? t("missions.syncing").toUpperCase() :
                t("presence.activate")}
        </button>
      </div>

      {/* Active Glow Line */}
      {isActive && (
        <div className="absolute bottom-0 left-0 h-[2px] bg-white shadow-[0_0_10px_#ffffff]"
          style={{ width: `${progress}%`, transition: "width 1s linear" }}
        />
      )}
    </div>
  );
}


// [CODE: FRONTEND_MISSION_CENTER_MAIN_COMPONENT]
export default function MissionCenter({ isOpen, onClose, telegramUser, isHumanVerified }: MissionCenterProps) {
  const { t } = useLanguage();
  const telegram_id = telegramUser?.id;

  // [CODE: MISSION_STATE]
  const [optimisticPresence, setOptimisticPresence] = useState<Record<string, any>>({});
  const [optimisticSocial, setOptimisticSocial] = useState<Record<string, any>>({});

  const [presenceLoadingId, setPresenceLoadingId] = useState<string | null>(null);
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);

  if (!telegram_id && isOpen) {
    return (
      <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center text-app-accent bg-app-bg/95 backdrop-blur-xl">
        <div className="w-8 h-8 border-2 border-app-accent/20 border-t-app-accent rounded-full animate-spin mb-4" />
        <span className="text-xs font-bold uppercase tracking-wide text-text-sub">{t("missions.synchronizing")}</span>
      </div>
    );
  }

  // Claim Boost Popup states
  const [isClaimBoostOpen, setIsClaimBoostOpen] = useState(false);
  const [claimBoostData, setClaimBoostData] = useState<ClaimBoostData | null>(null);
  const [pendingBalanceUpdate, setPendingBalanceUpdate] = useState<number | null>(null);
  const [pendingStreakData, setPendingStreakData] = useState<{ days: number, reward: number } | null>(null);

  const [claimCooldown, setClaimCooldown] = useState(false);
  const [error, setError] = useState("");
  const [popup, setPopup] = useState<string | null>(null);

  // 🚀 PRE-CACHED story deeplink data (fetched at load, used instantly on click)
  const storyDataRef = useRef<{ poster_url: string; caption: string; ref_link: string } | null>(null);

  // [CODE: FETCH_DATA]
  // 1. Fetch Presence Missions (Pre-fetched in background once telegram_id exists)
  const { data: presenceMissionsData, loading: presenceLoading, mutate: mutatePresence, error: presenceError } =
    useApi(telegram_id ? `/presence/list/${telegram_id}` : null);

  // 2. Fetch Normal Missions (Pre-fetched in background)
  const { data: missionsData, loading: missionsLoading, mutate: mutateMissions, error: missionsError } =
    useApi(telegram_id ? `/missions/all/${telegram_id}` : null);

  // 3. Fetch User Profile for Roles (Multiplier Logic)
  const { data: userProfile } = useApi(telegram_id ? `/user/${telegram_id}` : null);

  // 4. Multiplier Utility (Matches Backend Logic)
  const getOptimisticBoost = (roles: string[]) => {
    let multiplier = 1.0;
    const appliedRoles: string[] = [];
    if (!roles || !Array.isArray(roles)) return { multiplier, appliedRoles };

    const BOOST_MAP: Record<string, number> = {
      "Bluewave Core": 1.00, "Community Moderator": 0.25, "Verified Partner": 0.20,
      "Verified Human": 0.10, "Presence Holder": 0.10, "Genesis Member": 0.15,
      "Beta Explorer": 0.10, "New Wave": 0.01, "Active Human": 0.05,
      "Network Builder": 0.10, "Contributor": 0.08, "OG": 0.15,
      "Super OG": 0.25, "Content Creator": 0.25, "Best Commentator": 0.10,
      "Meme Architect": 0.25, "X Supporter": 0.05, "X Raider": 0.10,
      "X Ambassador": 0.20, "TON Explorer": 0.05, "Signal Guardian": 0.15,
      "Human Legend": 0.50, "LEVEL 1": 0.01, "LEVEL 2": 0.05,
      "LEVEL 3": 0.10, "LEVEL 4": 0.20, "LEVEL 5": 0.50
    };

    roles.forEach(role => {
      if (BOOST_MAP[role]) {
        multiplier += BOOST_MAP[role];
        appliedRoles.push(role);
      }
    });

    return { multiplier, appliedRoles };
  };

  // 5. Derived Presence Missions
  const presenceMissions = useMemo(() => {
    if (!Array.isArray(presenceMissionsData)) return [];
    return presenceMissionsData.map((m: PresenceMission) => ({
      ...m,
      ...(optimisticPresence[m.type] || {})
    }));
  }, [presenceMissionsData, optimisticPresence]);

  // 4. Derived Social/Normal Missions
  const missions = useMemo(() => {
    if (!missionsData) return [];
    let finalList: Mission[] = [];
    if (Array.isArray(missionsData.normal)) finalList.push(...missionsData.normal);
    if (Array.isArray(missionsData.daily)) finalList.push(...missionsData.daily);
    if (Array.isArray(missionsData.onboarding)) finalList.push(...missionsData.onboarding);
    if (missionsData.story && typeof missionsData.story === "object" && !Array.isArray(missionsData.story) && Object.keys(missionsData.story).length > 0) {
      finalList.push(missionsData.story);
    }

    // Merge optimistic updates
    finalList = finalList.map((m: Mission) => ({
      ...m,
      ...(optimisticSocial[m.id] || {})
    }));

    // Sort onboarding first
    const onboardingIds = ["join_channel", "join_news", "join_community", "join_bwavescan"];
    return finalList.sort((a, b) =>
      (onboardingIds.includes(a.id) ? -1 : 1) - (onboardingIds.includes(b.id) ? -1 : 1)
    );
  }, [missionsData, optimisticSocial]);

  const loading = presenceLoading || missionsLoading;

  useEffect(() => {
    // 1. Check for errors inside data objects (common for getApi results)
    const pError = presenceMissionsData?.error;
    const mError = missionsData?.error;

    if (pError || mError) {
      setError(pError || mError);
    } 
    // 2. Check for SWR level errors (network/status code errors)
    else if (presenceError || missionsError) {
      const err = presenceError || missionsError;
      const msg = typeof err === "string" ? err : (err?.message || "Sync Error");
      setError(msg);
    } 
    // 3. Clear error if data is valid
    else if (presenceMissionsData && missionsData) {
      setError("");
    }
  }, [presenceMissionsData, missionsData, presenceError, missionsError]);

  // Story Prefetch
  useEffect(() => {
    if (missionsData?.story && missionsData.story.status !== "done" && !storyDataRef.current && telegram_id) {
      getApi(`/story/deeplink/${telegram_id}`)
        .then(dlData => {
          storyDataRef.current = dlData;
        })
        .catch(e => console.error("STORY_PREFETCH: Failed", e));
    }
  }, [missionsData, telegram_id]);

  // Refresh data in background (no revalidate: true to keep it instant)
  const loadData = async () => {
    mutatePresence();
    mutateMissions();
  };


  // [CODE: PRESENCE_HANDLERS]
  const handleActivatePresence = async (type: string) => {
    if (presenceLoadingId) return; // Prevent multiple clicks
    // Lock only this presence card's loading state
    setPresenceLoadingId(type);

    try {
      const data = await postApi(`/presence/activate`, { tg_id: telegram_id, mission_type: type });

      if (data.success) {
        const mission = presenceMissionsData?.find((m: any) => m.type === type);
        const duration = mission?.duration_seconds || 3600;

        // Optimistically update local state so UI reflects activation immediately
        setOptimisticPresence(prev => ({
          ...prev,
          [type]: {
            status: "active",
            activated_at: Date.now(),
            expires_at: Date.now() + (duration * 1000)
          }
        }));

        setPresenceLoadingId(null); // Unlock UI immediately

        // If it was a 1h mission and a bonus was awarded, update balance
        if (data.new_balance !== undefined) {
          window.dispatchEvent(
            new CustomEvent("updateBalance", { detail: data.new_balance })
          );
        }

        // Handle streak celebration if awarded
        if (data.streak_info?.bonus_awarded) {
          window.dispatchEvent(new CustomEvent("showStreakCelebration", {
            detail: { days: data.streak_info.new_streak, reward: 200 }
          }));
        }

        // Refresh list to get new state (background)
        mutatePresence();
      } else {
        setPresenceLoadingId(null);
        setPopup(t("presence.error_activate"));
        setTimeout(() => setPopup(null), 2500);
      }
    } catch (e) {
      console.error(e);
      setPresenceLoadingId(null);
    }
  };

  const handleClaimPresence = async (type: string) => {
    if (presenceLoadingId) return;
    setPresenceLoadingId(type);

    // ── INSTANT POPUP (Optimistic) ─────────────────────────────────────────
    // Find the mission's base reward from the already-loaded presenceMissions list.
    // We show the popup IMMEDIATELY with this value so users see feedback in <100ms.
    const missionData = presenceMissions.find((m: any) => m.type === type);
    const baseReward = missionData?.reward || 0;
    
    // 🎭 [OPTIMISTIC_UPGRADE] Calculate real multiplier from known roles
    const { multiplier: optMultiplier, appliedRoles: optRoles } = getOptimisticBoost(userProfile?.roles || []);
    const optTotal = Math.floor(baseReward * optMultiplier);

    // Optimistically update the balance on the UI for immediate gratification
    const currentBalance = telegramUser?.points_balance || 0;
    window.dispatchEvent(
      new CustomEvent("updateBalance", { detail: currentBalance + optTotal })
    );

    setClaimBoostData({
      base_claimed: baseReward,
      multiplier: optMultiplier,
      total_claimed: optTotal,
      applied_roles: optRoles,
      is_loading: true
    });
    setIsClaimBoostOpen(true);

    // Optimistically mark the card as claimed immediately
    setOptimisticPresence(prev => ({ ...prev, [type]: { status: "inactive" } }));

    const MAX_RETRIES = 3;
    let attempt = 0;
    let success = false;
    let lastError = null;

    while (attempt < MAX_RETRIES && !success) {
      try {
        const data = await postApi(`/presence/claim`, { tg_id: telegram_id, mission_type: type });

        if (data.success) {
          success = true;
          setPresenceLoadingId(null);

          // Silently update the already-open popup with exact values from the backend
          const totalReward = data.total_reward;
          const multiplier = data.multiplier || 1.0;
          if (totalReward !== undefined) {
            const derivedBase = data.base_reward !== undefined
              ? data.base_reward
              : Math.round(totalReward / multiplier);
            setClaimBoostData({
              base_claimed: derivedBase,
              multiplier: multiplier,
              total_claimed: totalReward,
              applied_roles: data.applied_roles || [],
              is_loading: false
            });
          }

          // Update balance after popup animation completes
          if (data.new_balance !== undefined) {
            setPendingBalanceUpdate(data.new_balance);
          }

          // Streak celebration
          const streakChanged = data.streak_changed ?? data.streak_info?.streak_changed;
          const streakBonusAwarded = (data.bonus_points > 0) || data.streak_info?.bonus_awarded;
          if (streakChanged && streakBonusAwarded) {
            setPendingStreakData({
              days: data.new_streak ?? data.streak_days,
              reward: data.bonus_points || 200
            });
          }

          mutatePresence(); // Sync accurate state in background
        } else {
          // Logic error (e.g. NOT_FINISHED) shouldn't retry
          throw new Error(data.error || "CLAIM_FAILED");
        }
      } catch (e: any) {
        lastError = e;
        if (e.message === "NOT_FINISHED" || e.message === "NO_MISSION" || e.message === "ALREADY_CLAIMED") {
          break; // Don't retry logic errors
        }
        attempt++;
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // simple exponential-ish backoff
        }
      }
    }

    if (!success) {
      console.error("Final claim failure after retries:", lastError);
      // ── Rollback on definitive failure ──────────────────────────────────
      setIsClaimBoostOpen(false);
      setClaimBoostData(null);
      setPresenceLoadingId(null);
      // Restore card to its real state
      setOptimisticPresence(prev => { const n = { ...prev }; delete n[type]; return n; });
      
      const errMsg = lastError?.message === "NOT_FINISHED"
        ? "Mission not complete yet — timer still running."
        : lastError?.message === "NO_MISSION"
          ? "No active mission found."
          : "Claim failed after multiple attempts. Please try again.";
      setPopup(errMsg);
      setTimeout(() => setPopup(null), 3000);
    }
  };



  // [CODE: NORMAL_MISSION_HANDLERS] (Kept from previous version)
  const handleOpen = async (id: string) => {
    if (!telegram_id) return;

    // 👤 Find mission for URL lookup
    const m = (missions as Mission[]).find((mi: Mission) => mi.id === id);
    const tg = (window as any).Telegram?.WebApp;

    // 📳 Haptic Feedback (Immediate response to touch)
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");

    // 🚀 1. INSTANT LINK OPEN (Prioritize user gesture context)
    // Story Post skips the standard link opener to call specialized shareToStory logic below
    if (m?.url && id !== "story_post") {
      if (tg?.openTelegramLink && m.url.includes("t.me/")) {
        tg.openTelegramLink(m.url);
      } else {
        if (tg?.openLink) tg.openLink(m.url);
        else window.open(m.url, "_blank");
      }
    }

    // 2. UI STATE & BACKGROUND LOGGING
    const isStory = id === "story_post";
    const isOnboarding = id === "join_channel" || id === "join_news" || id === "join_community" || id === "join_bwavescan";
    const isDaily = id === "invite_daily"; // We keep the variable but remove it from the auto-claim logic

    setOptimisticSocial(prev => ({ ...prev, [id]: { status: "waiting" } }));

    if (isStory) {
      // 🎭 Story Logic (Fetch fresh deeplink if needed)
      const cached = storyDataRef.current;

      const triggerStoryShare = (data: { poster_url: string; caption: string; ref_link: string; deeplink?: string }) => {
        if (!data.poster_url) return;
        
        // A. Primary: Native Telegram Story Editor
        // This opens the editor with the poster, caption, and a clickable referral widget
        if (tg && typeof tg.shareToStory === 'function') {
          try {
            tg.shareToStory(data.poster_url, {
              text: data.caption,
              widget_link: {
                url: data.ref_link,
                name: "Bluewave Protocol"
              }
            });
            setPopup(t("missions.story_hint")); // "Wait for story to be posted..."
          } catch (e) {
            console.error("STORY_EDITOR_FAIL:", e);
            // Fallback to standard share link if editor fails
            if (data.deeplink) {
              if (tg.openTelegramLink) tg.openTelegramLink(data.deeplink);
              else if (tg.openLink) tg.openLink(data.deeplink);
            }
          }
        } 
        // B. Fallback: Standard Share Link
        else if (data.deeplink) {
          if (tg?.openTelegramLink && data.deeplink.includes("t.me/")) {
            tg.openTelegramLink(data.deeplink);
          } else {
            if (tg?.openLink) tg.openLink(data.deeplink);
            else window.open(data.deeplink, "_blank");
          }
        }
        // C. Last Resort: Raw Poster Link
        else {
          if (tg?.openLink) tg.openLink(data.poster_url);
          else window.open(data.poster_url, "_blank");
        }
        
        setTimeout(() => setPopup(null), 5000);
      };

      if (cached?.poster_url) {
        triggerStoryShare(cached);
      } else {
        getApi(`/story/deeplink/${telegram_id}`).then(dlData => {
          storyDataRef.current = dlData;
          triggerStoryShare(dlData);
        }).catch(e => {
            console.error("STORY_ASYNC_FAIL:", e);
            setPopup(t("missions.error_story"));
            setTimeout(() => setPopup(null), 3000);
            setOptimisticSocial(prev => { const n = { ...prev }; delete n[id]; return n; });
        });
      }

      // Verification delay (Wait for story to propagate)
      setTimeout(() => {
        setOptimisticSocial(prev => ({ ...prev, [id]: { status: "claim" } }));
      }, 15000);
      return;
    }

    if (isOnboarding) {
      setTimeout(() => {
        setOptimisticSocial(prev => ({ ...prev, [id]: { status: "claim" } }));
      }, 3000);
      return;
    }

    if (isDaily) {
      // For daily invite missions, we DO NOT set status to 'claim' optimistically.
      // The user must actually invite people, and we wait for the backend to sync the 'claim' status.
      return;
    }

    // 📝 Normal Mission Logging (Fire and forget)
    postApi(`/mission/open`, { telegram_id, mission_id: id }).catch(e => {
        console.error("MISSION_LOG_FAIL:", e);
        // We don't roll back the UI for simple logging failures to ensure the user can still claim later.
    });

    setTimeout(() => {
      setOptimisticSocial(prev => ({ ...prev, [id]: { status: "claim" } }));
    }, 5000);
  };

  const handleClaim = async (id: string) => {
    if (claimCooldown || claimingMissionId) return;
    setClaimingMissionId(id);
    setClaimCooldown(true);

    // ── INSTANT SUCCESS (Optimistic) ─────────────────────────────────────────
    setOptimisticSocial(prev => ({ ...prev, [id]: { status: "done" } }));
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");

    const MAX_RETRIES = 3;
    let attempt = 0;
    let success = false;
    let lastError = null;

    while (attempt < MAX_RETRIES && !success) {
      try {
        let endpoint = "/claim_mission";
        let payload: any = { telegram_id, mission_id: id };

        if (id === "join_channel" || id === "join_news" || id === "join_community" || id === "join_bwavescan") endpoint = "/claim/onboarding";
        else if (id === "invite_daily") { endpoint = "/claim/daily"; payload = { telegram_id }; }
        else if (id === "story_post") { endpoint = "/claim/story_post"; payload = { telegram_id }; }

        const result = await postApi(endpoint, payload);

        if (result.claimed) {
          success = true;
          window.dispatchEvent(new CustomEvent("updateBalance", { detail: result.new_balance }));

          // Sync from server in background to confirm
          mutateMissions();

          if (result.streak_info?.bonus_awarded) {
            window.dispatchEvent(new CustomEvent("showStreakCelebration", {
              detail: { days: result.streak_days, reward: 200 }
            }));
          }
        } else {
          throw new Error(result.error || "NOT_COMPLETED");
        }
      } catch (e: any) {
        lastError = e;
        // Logic errors (not completed, invalid story, etc) shouldn't retry
        if (e.message === "NOT_COMPLETED" || e.message === "INVALID_STORY" || e.message === "ALREADY_CLAIMED") {
          break;
        }
        attempt++;
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 800 * attempt));
        }
      }
    }

    if (!success) {
      console.error("Final social claim failure:", lastError);
      // ── Rollback on failure ──────────────────────────────────────────────
      setOptimisticSocial(prev => { const n = { ...prev }; delete n[id]; return n; });
      setPopup(t("missions.popup_complete") || "Not completed");
      setTimeout(() => setPopup(null), 2500);
    }

    setClaimingMissionId(null);
    setTimeout(() => setClaimCooldown(false), 1000);
  };


  // ── Badge Counts ──────────────────────────────────────────
  type TabId = "presence" | "social" | "quest" | "earn";
  const [activeTab, setActiveTab] = useState<TabId>("presence");
  const [questDetailOpen, setQuestDetailOpen] = useState(false);

  const TABS: TabId[] = ["presence", "social", "quest", "earn"];

  const isQuestAdmin = canAdminQuests(telegram_id, telegramUser?.bw_id);
  useApi(isOpen && isQuestAdmin ? `/quests?filter=waves` : null, {
    revalidateOnFocus: false,
    dedupingInterval: 120000,
  });

  useEffect(() => {
    const onQuestDetail = (e: Event) => {
      setQuestDetailOpen(!!(e as CustomEvent).detail);
    };
    window.addEventListener("questDetailOpen", onQuestDetail);

    const handleOpenBySlug = (e: Event) => {
      const slug = (e as CustomEvent).detail;
      if (slug) {
        (window as any).bwPendingQuestSlug = slug;
      }
      setActiveTab("quest");
    };
    window.addEventListener("openQuestBySlug", handleOpenBySlug);

    if (typeof window !== "undefined") {
      const localSlug = window.localStorage.getItem("bw_pending_quest_slug");
      if (localSlug) {
        (window as any).bwPendingQuestSlug = localSlug;
        setActiveTab("quest");
      } else if ((window as any).bwPendingQuestSlug) {
        setActiveTab("quest");
      }
    }

    return () => {
      window.removeEventListener("questDetailOpen", onQuestDetail);
      window.removeEventListener("openQuestBySlug", handleOpenBySlug);
    };
  }, []);

  const presenceBadge = Array.isArray(presenceMissions) ? (presenceMissions as PresenceMission[]).filter(
    (pm: PresenceMission) => pm.status === "inactive" || pm.status === "completed"
  ).length : 0;

  const socialBadge = Array.isArray(missions) ? (missions as Mission[]).filter(
    (m: Mission) => m.status === "open" || m.status === "claim" || m.status === "waiting"
  ).length : 0;


  return (
    <>
      <motion.div
        className={`fixed inset-0 flex flex-col text-text-main bg-app-bg/60 backdrop-blur-2xl transition-all duration-300 ${isClaimBoostOpen || questDetailOpen ? "z-[900]" : "z-[120]"}`}
        style={{ paddingTop: 0, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >


          {/* ── Ghost Mode Gate ── */}
          {!telegramUser?.wallet_address && (
            <div className="absolute inset-0 z-[150] flex flex-col items-center justify-center p-8 text-center bg-app-bg/40 backdrop-blur-2xl">
              <div className="w-20 h-20 rounded-full bg-app-accent/10 border border-app-border flex items-center justify-center mb-6 shadow-app-shadow">
                <Lock size={32} className="text-app-accent animate-pulse" />
              </div>
              
              <h2 className="text-2xl font-black text-text-main uppercase tracking-tighter mb-2">{t("ghost.sector_encrypted")}</h2>
              <p className="text-app-accent/60 text-xs font-bold uppercase tracking-widest mb-8 leading-relaxed max-w-[240px]">
                {t("ghost.connect_prompt")}
              </p>

              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("setActiveTab", { detail: "profile" }));
                }}
                className="px-8 py-4 bg-app-accent text-app-bg rounded-2xl font-black text-sm uppercase tracking-widest shadow-app-shadow active:scale-95 transition-all"
              >
                {t("ghost.connect_btn")}
              </button>
            </div>
          )}

          {/* Frosted Header Background */}
          <div 
            className="fixed top-0 left-0 right-0 z-[130] pointer-events-none"
            style={{
              height: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 72px)",
              background: "rgba(0, 0, 0, 0.55)",
              backdropFilter: "blur(40px) saturate(180%)",
              WebkitBackdropFilter: "blur(40px) saturate(180%)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.05)"
            }}
          />

          {/* ── Tab Bar ── */}
          <div 
            className="fixed top-0 left-0 right-0 z-[135] flex items-center justify-between w-full px-6 pb-4 shrink-0 gap-1.5"
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 12px)",
            }}
          >
            {(["presence", "social", "quest", "earn"] as TabId[]).map((tab) => {
              const isActive = activeTab === tab;
              const badge = tab === "presence" ? presenceBadge : tab === "social" ? socialBadge : 0;
              const isEarn = tab === "earn";
              const isQuest = tab === "quest";
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all duration-200
                    ${isEarn || isQuest
                      ? isActive
                        ? "bg-white/10 border border-white/20 text-white"
                        : "bg-transparent border border-white/5 text-white/30 hover:border-white/10"
                      : isActive
                        ? "bg-white/15 border border-white/20 text-white shadow-md"
                        : "bg-transparent border border-white/10 text-white/60 hover:border-white/25 hover:text-white"
                    }`}
                >
                  {tab === "presence" && t("missions.tabs.presence")}
                  {tab === "social" && t("missions.tabs.social")}
                  {tab === "quest" && t("missions.tabs.quest")}
                  {tab === "earn" && t("missions.tabs.earn")}
                  {badge > 0 && tab !== "earn" && tab !== "quest" && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-black text-[9px] font-black flex items-center justify-center leading-none shadow-[0_0_8px_rgba(255,255,255,0.3)] border border-white/10">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Tab Content (Swipeable) ── */}
          <div
            className="flex-1 overflow-y-auto"
            onTouchStart={(e) => {
              (e.currentTarget as any)._touchStartX = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (questDetailOpen) return;
              const startX = (e.currentTarget as any)._touchStartX;
              if (startX === undefined) return;
              const diff = startX - e.changedTouches[0].clientX;
              const THRESHOLD = 60;
              if (Math.abs(diff) < THRESHOLD) return;
              const idx = TABS.indexOf(activeTab);
              if (diff > 0 && idx < TABS.length - 1) setActiveTab(TABS[idx + 1]);
              if (diff < 0 && idx > 0) setActiveTab(TABS[idx - 1]);
            }}
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 80px)"
            }}
          >
            <div className="max-w-md mx-auto w-full px-6 pb-32 space-y-4 pt-2">

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs text-center font-bold">
                  {(error === "AUTH_REQUIRED" || error === "AUTH_EXPIRED") ? t("missions.session_expired") : error}
                </div>
              )}

              {/* PRESENCE TAB */}
              {activeTab === "presence" && (
                <motion.div
                  key="presence"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {presenceMissions.map((pm: PresenceMission) => (
                    <PresenceCard
                      key={pm.type}
                      mission={pm}
                      onActivate={handleActivatePresence}
                      onClaim={handleClaimPresence}
                      loadingId={presenceLoadingId}
                    />
                  ))}
                  {presenceMissions.length === 0 && loading && (
                    <div className="animate-pulse space-y-3">
                      <div className="h-20 bg-app-card rounded-2xl border border-app-border" />
                      <div className="h-20 bg-app-card rounded-2xl border border-app-border" />
                      <div className="h-20 bg-app-card rounded-2xl border border-app-border" />
                    </div>
                  )}
                  {presenceMissions.length === 0 && !loading && (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-50">
                        <Clock size={20} className="text-white/85" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-text-main uppercase tracking-widest">{t("presence.system_offline")}</p>
                        <p className="text-[10px] text-text-sub max-w-[200px] leading-relaxed">
                          {t("presence.sync_error_desc")}
                        </p>
                      </div>
                      <button
                        onClick={() => mutatePresence()}
                        className="h-10 px-4 bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-white/20 transition-all font-mono"
                      >
                        {t("presence.retry_sync")}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* SOCIAL TAB */}
              {activeTab === "social" && (
                <motion.div
                  key="social"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {missions.map((m) => (
                    <div
                      key={m.id}
                      className={`flex justify-between items-center px-4 py-3 rounded-xl border transition-all duration-200
                        ${m.status === "done"
                          ? "border-white/5 bg-white/5 opacity-55"
                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                        }`}
                    >
                      <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-tighter">{m.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-black text-white/60">+{m.points} $BWAVE</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {m.status === "claim" && (
                          <button
                            onClick={() => handleClaim(m.id)}
                            disabled={claimingMissionId === m.id}
                            className="h-10 px-4 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-white/95 transition-all flex items-center gap-1.5 active:scale-95 border border-white/20"
                          >
                            {claimingMissionId === m.id ? t("missions.claiming").toUpperCase() : t("missions.claim")}
                          </button>
                        )}
                        {m.status === "waiting" && (
                          <button
                            className="h-10 px-4 bg-white/10 border border-white/10 text-white/50 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-wait opacity-50"
                          >
                            <Clock size={12} className="animate-spin" />
                            {t("missions.verifying").toUpperCase()}
                          </button>
                        )}
                        {m.status === "open" && m.id !== "invite_daily" && (
                          <button
                            onClick={() => handleOpen(m.id)}
                            className="h-10 px-6 bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-1.5 active:scale-95"
                          >
                            {t("missions.open")}
                          </button>
                        )}
                        {m.status === "done" && (
                          <div className="px-3 py-1.5 text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-1">
                            <Check size={12} /> {t("missions.done")}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && missions.length === 0 && (
                    <div className="space-y-3 animate-pulse">
                      {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl border border-white/10" />)}
                    </div>
                  )}
                  {!loading && missions.length === 0 && !error && (
                    <div className="py-20 text-center opacity-30 italic text-xs uppercase tracking-widest text-white/40">
                      {t("missions.no_missions") || "No social missions available"}
                    </div>
                  )}
                </motion.div>
              )}
              {activeTab === "quest" && (
                <QuestTabPanel
                  telegramUser={telegramUser}
                  isHumanVerified={isHumanVerified}
                  isMissionOpen={isOpen}
                  onToast={(msg) => {
                    setPopup(msg);
                    setTimeout(() => setPopup(null), 2500);
                  }}
                />
              )}

              {/* EARN DROP TAB */}
              {activeTab === "earn" && (
                <motion.div
                  key="earn"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center justify-center pt-12 pb-8 text-center gap-5"
                >
                  <div className="w-20 h-20 rounded-full bg-app-accent/10 border border-app-border flex items-center justify-center shadow-app-shadow">
                    <Gift size={36} className="text-app-accent" strokeWidth={2} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase tracking-widest text-text-main">{t("missions.earn_drop.title")}</h3>
                    <div className="inline-block px-3 py-1 rounded-full bg-app-accent/15 border border-app-border text-app-accent text-[10px] font-black tracking-widest uppercase">
                      {t("missions.earn_drop.coming_soon")}
                    </div>
                  </div>
                  <div className="max-w-xs bg-app-accent/5 border border-app-border rounded-2xl p-5 space-y-3">
                    <p className="text-sm text-text-main/70 leading-relaxed">
                      {t("missions.earn_drop.desc")}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-text-sub font-semibold border-t border-app-border pt-3">
                      <Clock size={12} className="text-app-accent" />
                      {t("missions.earn_drop.active_hint")}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Toast Popup */}
              <AnimatePresence>
                {popup && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-1/3 left-1/2 -translate-x-1/2 z-[200]
                               bg-app-bg/90 border border-app-border text-text-main
                               px-6 py-3 rounded-full shadow-app-shadow
                               text-sm font-bold tracking-wide backdrop-blur-xl whitespace-nowrap"
                  >
                    {popup}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </motion.div>

      {/* Claim Boost Popup - outside scrollable area */}
      <ClaimBoostPopup
        isOpen={isClaimBoostOpen}
        data={claimBoostData}
        onClose={() => {
          setIsClaimBoostOpen(false);

          // 1. Dispatch balance update first
          if (pendingBalanceUpdate !== null) {
            window.dispatchEvent(
              new CustomEvent("updateBalance", { detail: pendingBalanceUpdate })
            );
            setPendingBalanceUpdate(null);
          }

          // 2. 🔥 Trigger Streak Celebration after Boost Popup is closed (Sequential)
          if (pendingStreakData) {
            window.dispatchEvent(new CustomEvent("showStreakCelebration", {
              detail: pendingStreakData
            }));
            setPendingStreakData(null);
          }
        }}
      />

    </>
  );
}

