"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Clock, Lock } from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi, getApi, postApi } from "@/lib/useApi";
import ClaimBoostPopup, { ClaimBoostData } from "./ClaimBoostPopup";

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
      relative overflow-hidden rounded-2xl border transition-all duration-300
      ${isActive ? "border-cyan-500/50 bg-cyan-950/20 shadow-[0_0_20px_#00e6ff10]" : ""}
      ${isCompleted ? "border-cyan-400 bg-cyan-900/30 shadow-[0_0_30px_#00e6ff30]" : ""}
      ${mission.status === "inactive" ? "border-cyan-900/30 bg-black/40" : ""}
    `}>
      {/* Background Progress Bar (Fill) */}
      {(isActive || isCompleted) && (
        <div
          className="absolute inset-0 bg-cyan-500/20 transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      )}

      <div className="relative p-6 flex items-center justify-between z-10 w-full">
        <div className="flex-1">
          {/* Title Removed as requested - Progress bar is the main visual */}
          {/* If we need to show the TYPE (1h/4h/24h) we could put it in the button or a small tag, 
               but user requested "no titles". We will rely on order or button text if needed, 
               but for now just keeping it clean as requested. */}
        </div>

        <button
          onClick={() => {
            if (isCompleted) onClaim(mission.type);
            else if (mission.status === "inactive") onActivate(mission.type);
          }}
          disabled={isActive || isLoading}
          className={`
            w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all
            ${isCompleted
              ? "bg-cyan-400 text-black hover:bg-cyan-300 shadow-[0_0_15px_#00e6ff]"
              : isActive
                ? "bg-transparent text-cyan-500/50 cursor-not-allowed border border-cyan-500/20"
                : "bg-cyan-950/50 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900/50 hover:border-cyan-400"
            }
          `}
        >
          {isLoading ? t("profile.wait") : // reusing 'Please wait...' or similar
            isCompleted ? t("presence.claim_reward").replace("{{amount}}", (mission.reward || 0).toString()) :
              isActive ? t("missions.syncing").toUpperCase() :
                t("presence.activate")}
        </button>
      </div>

      {/* Active Glow Line */}
      {isActive && (
        <div className="absolute bottom-0 left-0 h-1 bg-cyan-400 shadow-[0_0_15px_#00e6ff]"
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
      <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center text-cyan-500">
        <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{t("missions.synchronizing")}</span>
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

  // 3. Derived Presence Missions
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
    // The actual multiplied reward from the backend will update the popup silently.
    const missionData = presenceMissions.find((m: any) => m.type === type);
    const baseReward = missionData?.reward || 0;
    setClaimBoostData({
      base_claimed: baseReward,
      multiplier: 1.0,
      total_claimed: baseReward,
      applied_roles: [],
      is_loading: true
    });
    setIsClaimBoostOpen(true);

    // Optimistically mark the card as claimed so the button disappears immediately
    setOptimisticPresence(prev => ({ ...prev, [type]: { status: "inactive" } }));

    try {
      const data = await postApi(`/presence/claim`, { tg_id: telegram_id, mission_type: type });

      if (data.success) {
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
        // ── Rollback on failure ──────────────────────────────────────────────
        setIsClaimBoostOpen(false);
        setClaimBoostData(null);
        setPresenceLoadingId(null);
        // Restore card to its real state
        setOptimisticPresence(prev => { const n = { ...prev }; delete n[type]; return n; });
        const errMsg = data.error === "NOT_FINISHED"
          ? "Mission not complete yet — timer still running."
          : data.error === "NO_MISSION"
            ? "No active mission found."
            : "Claim failed. Please try again.";
        setPopup(errMsg);
        setTimeout(() => setPopup(null), 3000);
      }
    } catch (e) {
      console.error(e);
      // ── Rollback on network error ────────────────────────────────────────
      setIsClaimBoostOpen(false);
      setClaimBoostData(null);
      setPresenceLoadingId(null);
      setOptimisticPresence(prev => { const n = { ...prev }; delete n[type]; return n; });
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
    const isDaily = id === "invite_daily";

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

    if (isOnboarding || isDaily) {
      setTimeout(() => {
        setOptimisticSocial(prev => ({ ...prev, [id]: { status: "claim" } }));
      }, 3000);
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

    try {
      let endpoint = "/claim_mission";
      let payload: any = { telegram_id, mission_id: id };

      if (id === "join_channel" || id === "join_news" || id === "join_community" || id === "join_bwavescan") endpoint = "/claim/onboarding";
      else if (id === "invite_daily") { endpoint = "/claim/daily"; payload = { telegram_id }; }
      else if (id === "story_post") { endpoint = "/claim/story_post"; payload = { telegram_id }; }

      const result = await postApi(endpoint, payload);

      if (result.claimed) {
        window.dispatchEvent(new CustomEvent("updateBalance", { detail: result.new_balance }));
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");

        // ✅ Mark as done optimistically — do NOT delete override, SWR cache still has "open"
        setOptimisticSocial(prev => ({ ...prev, [id]: { status: "done" } }));
        // Sync from server in background to confirm
        mutateMissions();

        // 🔥 Trigger Streak Celebration immediately for non-boost missions
        if (result.streak_info?.bonus_awarded) {
          window.dispatchEvent(new CustomEvent("showStreakCelebration", {
            detail: { days: result.streak_days, reward: 200 }
          }));
        }
      } else {
        setPopup(t("missions.popup_complete") || "Not completed");
        // Clear optimistic override on failed claim
        setOptimisticSocial(prev => { const n = { ...prev }; delete n[id]; return n; });
        setTimeout(() => setPopup(null), 2500);
      }
    } catch (e) {
      console.error(e);
      // Clear optimistic override on error
      setOptimisticSocial(prev => { const n = { ...prev }; delete n[id]; return n; });
    } finally {
      setClaimingMissionId(null);
      setTimeout(() => setClaimCooldown(false), 1000);
    }
  };


  // ── Badge Counts ──────────────────────────────────────────
  type TabId = "presence" | "social" | "quest" | "earn";
  const [activeTab, setActiveTab] = useState<TabId>("presence");
  const TABS: TabId[] = ["presence", "social", "quest", "earn"];

  const presenceBadge = Array.isArray(presenceMissions) ? (presenceMissions as PresenceMission[]).filter(
    (pm: PresenceMission) => pm.status === "inactive" || pm.status === "completed"
  ).length : 0;

  const socialBadge = Array.isArray(missions) ? (missions as Mission[]).filter(
    (m: Mission) => m.status === "open" || m.status === "claim" || m.status === "waiting"
  ).length : 0;


  return (
    <>
      {isOpen && (

        <motion.div
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col text-cyan-200"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 20px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >


          {/* ── Tab Bar ── */}
          <div className="flex items-center justify-between w-full px-3 pt-6 pb-4 shrink-0 gap-1">
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
                        ? "bg-white/5 border border-white/20 text-white/50"
                        : "bg-transparent border border-white/10 text-white/25 hover:border-white/20"
                      : isActive
                        ? "bg-cyan-500/15 border border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_#00e6ff15]"
                        : "bg-transparent border border-cyan-900/40 text-cyan-600 hover:border-cyan-700/50 hover:text-cyan-500"
                    }`}
                >
                  {tab === "presence" && t("missions.tabs.presence")}
                  {tab === "social" && t("missions.tabs.social")}
                  {tab === "quest" && t("missions.tabs.quest")}
                  {tab === "earn" && t("missions.tabs.earn")}
                  {badge > 0 && tab !== "earn" && tab !== "quest" && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 text-black text-[9px] font-black flex items-center justify-center leading-none shadow-[0_0_10px_#00e6ff]">
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
              const startX = (e.currentTarget as any)._touchStartX;
              if (startX === undefined) return;
              const diff = startX - e.changedTouches[0].clientX;
              const THRESHOLD = 60;
              if (Math.abs(diff) < THRESHOLD) return;
              const idx = TABS.indexOf(activeTab);
              if (diff > 0 && idx < TABS.length - 1) setActiveTab(TABS[idx + 1]);
              if (diff < 0 && idx > 0) setActiveTab(TABS[idx - 1]);
            }}
          >
            <div className="max-w-md mx-auto w-full px-6 pb-32 space-y-4 pt-2">

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-bold">
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
                      <div className="h-20 bg-cyan-900/20 rounded-2xl border border-cyan-900/40" />
                      <div className="h-20 bg-cyan-900/20 rounded-2xl border border-cyan-900/40" />
                      <div className="h-20 bg-cyan-900/20 rounded-2xl border border-cyan-900/40" />
                    </div>
                  )}
                  {presenceMissions.length === 0 && !loading && (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center opacity-50">
                        <Clock size={20} className="text-cyan-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-cyan-200 uppercase tracking-widest">{t("presence.system_offline")}</p>
                        <p className="text-[10px] text-cyan-500/70 max-w-[200px] leading-relaxed">
                          {t("presence.sync_error_desc")}
                        </p>
                      </div>
                      <button
                        onClick={() => mutatePresence()}
                        className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500/20 transition-all font-mono"
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
                          ? "border-gray-800 bg-black/40 opacity-50"
                          : "border-cyan-900/50 bg-cyan-950/10 hover:border-cyan-500/30"
                        }`}
                    >
                      <div>
                        <p className="text-sm font-bold text-cyan-100">{m.name}</p>
                        <p className="text-xs text-cyan-500 font-mono mt-0.5">{m.points} $BWAVE</p>
                      </div>
                      {m.status === "open" && m.id !== "invite_daily" && (
                        <button onClick={() => handleOpen(m.id)} className="px-3 py-1.5 text-xs font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-lg hover:bg-cyan-500/20 transition-colors uppercase tracking-wider">
                          {t("missions.open")}
                        </button>
                      )}
                      {m.status === "waiting" && (
                        <button disabled className="px-3 py-1.5 text-xs font-bold bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-lg uppercase tracking-wider animate-pulse">
                          {t("missions.syncing").toUpperCase()}
                        </button>
                      )}
                      {m.status === "claim" && (
                        <button
                          onClick={() => handleClaim(m.id)}
                          disabled={claimingMissionId === m.id}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-all ${claimingMissionId === m.id
                            ? "bg-cyan-700 text-cyan-200 border border-cyan-600 cursor-wait"
                            : "bg-cyan-500 text-black border border-cyan-400 shadow-[0_0_15px_#00e6ff80] animate-pulse"
                            }`}
                        >
                          {claimingMissionId === m.id ? t("missions.claiming").toUpperCase() : t("missions.claim")}
                        </button>
                      )}
                      {m.status === "done" && (
                        <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <Check size={12} /> {t("missions.done")}
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && missions.length === 0 && (
                    <div className="space-y-3 animate-pulse">
                      {[1, 2, 3].map(i => <div key={i} className="h-16 bg-cyan-900/10 rounded-xl border border-cyan-900/30" />)}
                    </div>
                  )}
                  {!loading && missions.length === 0 && !error && (
                    <div className="py-20 text-center opacity-30 italic text-xs uppercase tracking-widest">
                      {t("missions.no_missions") || "No social missions available"}
                    </div>
                  )}
                </motion.div>
              )}

              {/* QUEST TAB */}
              {activeTab === "quest" && (
                <motion.div
                  key="quest"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center justify-center pt-12 pb-8 text-center gap-5"
                >
                  <div className={`w-20 h-20 rounded-full ${isHumanVerified ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]' : 'bg-violet-500/10 border-violet-500/30 shadow-[0_0_30px_rgba(139,92,246,0.2)]'} flex items-center justify-center`}>
                    <span className="text-4xl">{isHumanVerified ? '⚡' : '🔒'}</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white uppercase tracking-widest">{t("missions.quests.title")}</h3>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black tracking-widest uppercase ${isHumanVerified ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-violet-500/15 border-violet-500/30 text-violet-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isHumanVerified ? 'bg-cyan-400' : 'bg-violet-400'}`} />
                      {isHumanVerified ? t("missions.quests.verified_human") : t("missions.quests.verified_only")}
                    </div>
                  </div>
                  <div className="max-w-xs bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
                    {isHumanVerified ? (
                      <p className="text-sm text-white/70 leading-relaxed italic">
                        {t("missions.quests.empty")}
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-white/70 leading-relaxed">
                          {t("missions.quests.desc")}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-white/40 font-semibold border-t border-white/5 pt-3">
                          <Lock size={12} className="text-violet-400" />
                          {t("missions.quests.lock_hint")}
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
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
                  <div className="w-20 h-20 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.15)]">
                    <span className="text-4xl">🎁</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white uppercase tracking-widest">{t("missions.earn_drop.title")}</h3>
                    <div className="inline-block px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] font-black tracking-widest uppercase">
                      {t("missions.earn_drop.coming_soon")}
                    </div>
                  </div>
                  <div className="max-w-xs bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
                    <p className="text-sm text-white/70 leading-relaxed">
                      {t("missions.earn_drop.desc")}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-white/40 font-semibold border-t border-white/5 pt-3">
                      <Clock size={12} className="text-orange-400" />
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
                               bg-cyan-950/90 border border-cyan-500/50 text-cyan-100
                               px-6 py-3 rounded-full shadow-[0_0_30px_#00e6ff40]
                               text-sm font-bold tracking-wide backdrop-blur-xl whitespace-nowrap"
                  >
                    {popup}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </motion.div>
      )}

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

