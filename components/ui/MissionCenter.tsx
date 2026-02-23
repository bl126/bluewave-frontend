"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Clock, Lock } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

// [CODE: FRONTEND_MISSION_CENTER_TYPES]
interface MissionCenterProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
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
            isCompleted ? t("presence.claim_reward").replace("{{amount}}", mission.reward.toString()) :
              isActive ? "SYNCING..." :
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
export default function MissionCenter({ isOpen, onClose, telegramUser }: MissionCenterProps) {
  const { t } = useLanguage();
  const telegram_id = telegramUser?.id;

  const [missions, setMissions] = useState<Mission[]>([]);
  const [presenceMissions, setPresenceMissions] = useState<PresenceMission[]>([]);

  const [loading, setLoading] = useState(true);

  // Independent loading states
  const [presenceLoadingId, setPresenceLoadingId] = useState<string | null>(null);
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);

  const [claimCooldown, setClaimCooldown] = useState(false);
  const [error, setError] = useState("");
  const [popup, setPopup] = useState<string | null>(null);

  // 🚀 PRE-CACHED story deeplink data (fetched at load, used instantly on click)
  const storyDataRef = useRef<{ poster_url: string; caption: string; ref_link: string } | null>(null);

  // [CODE: FETCH_DATA]
  const loadData = async () => {
    if (!telegram_id) return;

    try {
      // 1. Fetch Presence Missions
      const pRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/presence/list/${telegram_id}`);
      const pData = await pRes.json();
      if (Array.isArray(pData)) {
        setPresenceMissions(pData);
      }

      // 2. Fetch Normal Missions
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/missions/all/${telegram_id}`);
      const data = await res.json();

      let finalList: Mission[] = [];
      if (data.normal) finalList.push(...data.normal);
      if (data.daily) finalList.push(...data.daily);
      if (data.onboarding) finalList.push(...data.onboarding);
      if (data.story && Object.keys(data.story).length > 0) {
        finalList.push(data.story);
        // 🚀 PRE-FETCH story deeplink data so shareToStory can be called SYNCHRONOUSLY on click
        // shareToStory REQUIRES direct user-gesture context — no await allowed before it!
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/story/deeplink/${telegram_id}`)
          .then(r => r.json())
          .then(dlData => {
            console.log("STORY_PREFETCH: Cached deeplink data", dlData);
            storyDataRef.current = dlData;
          })
          .catch(e => console.error("STORY_PREFETCH: Failed", e));
      }

      // Sort onboarding first
      finalList.sort((a, b) => {
        const onboardingIds = ["join_channel", "join_news"];
        return (onboardingIds.includes(a.id) ? -1 : 1) - (onboardingIds.includes(b.id) ? -1 : 1);
      });

      setMissions(finalList);
      setLoading(false);

    } catch (e) {
      console.error(e);
      setError(t("missions.error_load"));
    }
  };

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen, telegram_id]);


  // [CODE: PRESENCE_HANDLERS]
  const handleActivatePresence = async (type: string) => {
    if (presenceLoadingId) return; // Prevent multiple clicks
    // Lock only this presence card's loading state
    setPresenceLoadingId(type);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/presence/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tg_id: telegram_id, mission_type: type }),
      });
      const data = await res.json();

      if (data.success) {
        // If it was a 1h mission and a bonus was awarded, update balance
        if (data.streak_info?.bonus_awarded) {
          const uRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/balance/${telegram_id}`);
          const uData = await uRes.json();
          window.dispatchEvent(
            new CustomEvent("updateBalance", { detail: uData.balance })
          );
        }
        // Refresh list to get new state
        await loadData();
      } else {
        setPopup(t("presence.error_activate"));
        setTimeout(() => setPopup(null), 2500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPresenceLoadingId(null);
    }
  };

  const handleClaimPresence = async (type: string) => {
    if (presenceLoadingId) return;
    setPresenceLoadingId(type);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/presence/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tg_id: telegram_id, mission_type: type }),
      });
      const data = await res.json();

      if (data.success) {
        // Balance update event
        window.dispatchEvent(
          new CustomEvent("updateBalance", { detail: data.new_balance })
        );

        // Haptic
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");

        await loadData(); // Refresh UI
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPresenceLoadingId(null);
    }
  };


  // [CODE: NORMAL_MISSION_HANDLERS] (Kept from previous version)
  const handleOpen = async (id: string) => {
    if (!telegram_id) return;

    // ... [Logic for opening missions - same as before] ...
    const isSpecial = id === "invite_daily" || id === "join_channel" || id === "join_news" || id === "story_post";

    if (isSpecial) {
      // Logic for special missions implementation
      // Copied logic for brevity in this thought, will implement fully in file

      if (id === "story_post") {
        const tg = (window as any).Telegram?.WebApp;
        const cached = storyDataRef.current;
        const tgVersion = parseFloat(tg?.version || "0");

        console.log("STORY_MISSION: Click detected. State:", {
          hasCached: !!cached,
          posterUrl: cached?.poster_url,
          hasShareToStory: typeof tg?.shareToStory === 'function',
          tgVersion,
          platform: tg?.platform
        });

        // Haptic feedback for interaction
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");

        // 1. SYNC PATH: Use cached data if available (Best for gesture context)
        if (cached?.poster_url && tg && typeof tg.shareToStory === 'function') {
          console.log("STORY_MISSION: Running SYNC path (shareToStory)");
          try {
            tg.shareToStory(cached.poster_url);
            console.log("STORY_MISSION: SYNC path success");
            setMissions(prev => prev.map(m => m.id === id ? { ...m, status: "waiting" } : m));
            setTimeout(() => {
              setMissions(prev => prev.map(m => m.id === id ? { ...m, status: "claim" } : m));
            }, 18000);
            return;
          } catch (e) {
            console.error("STORY_MISSION: SYNC path failed:", e);
          }
        }

        // 2. ASYNC PATH / FALLBACK: Fetch fresh data and try shareToStory again
        console.log("STORY_MISSION: Running ASYNC path");
        setMissions(prev => prev.map(m => m.id === id ? { ...m, status: "waiting" } : m));

        try {
          const dlRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/story/deeplink/${telegram_id}`);
          if (!dlRes.ok) throw new Error(`Backend: ${dlRes.status}`);
          const dlData = await dlRes.json();
          console.log("STORY_MISSION: ASYNC data fetched:", dlData.poster_url);

          storyDataRef.current = dlData;

          if (dlData.poster_url) {
            // Try shareToStory even in async path (often works if delay is small)
            if (tg && typeof tg.shareToStory === 'function') {
              console.log("STORY_MISSION: Attempting shareToStory in ASYNC path");
              try {
                tg.shareToStory(dlData.poster_url);
                console.log("STORY_MISSION: ASYNC shareToStory success");
                setTimeout(() => {
                  setMissions(prev => prev.map(m => m.id === id ? { ...m, status: "claim" } : m));
                }, 18000);
                return;
              } catch (e) {
                console.error("STORY_MISSION: ASYNC shareToStory failed:", e);
              }
            }

            // Absolute Fallback: Open the link
            console.log("STORY_MISSION: All shareToStory attempts failed. Opening raw link.");
            if (tg?.openLink) tg.openLink(dlData.poster_url);
            else window.open(dlData.poster_url, "_blank");

            setPopup("Telegram rejected native sharing. Please save the image and post manually!");
            setTimeout(() => setPopup(null), 5000);
          } else {
            throw new Error("No poster URL in response");
          }
        } catch (e) {
          console.error("STORY_MISSION: Total failure:", e);
          setPopup("Failed to load story mission. Please try again.");
          setMissions(prev => prev.map(m => m.id === id ? { ...m, status: "open" } : m));
          setTimeout(() => setPopup(null), 3000);
          return;
        }

        setTimeout(() => {
          setMissions(prev => prev.map(m => m.id === id ? { ...m, status: "claim" } : m));
        }, 18000);
        return;
      }

      if (id === "join_channel" || id === "join_news") {
        const m = missions.find(m => m.id === id);
        const tg = (window as any).Telegram?.WebApp;
        if (m?.url) {
          if (tg?.openTelegramLink && m.url.includes("t.me/")) {
            tg.openTelegramLink(m.url);
          } else {
            window.open(m.url, "_blank");
          }
        }
      }

      setMissions(prev => prev.map(m => m.id === id ? { ...m, status: "waiting" } : m));

      // Simulate waiting time for "Syncing..." effect
      setTimeout(() => {
        setMissions(prev => prev.map(m => m.id === id ? { ...m, status: "claim" } : m));
      }, 5000);
      return;
    }

    // Normal Mission
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mission/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id, mission_id: id }),
      });

      const mission = missions.find(m => m.id === id);

      // 🚀 FORCE OPEN LINK LOGIC (Fixes "Open Again" not working)
      if (mission?.url) {
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.openLink) {
          tg.openLink(mission.url);
        } else {
          window.open(mission.url, "_blank");
        }
      }

      setMissions(prev => prev.map(m => m.id === id ? { ...m, status: "waiting" } : m));
      setTimeout(() => {
        setMissions(prev => prev.map(m => m.id === id ? { ...m, status: "claim" } : m));
      }, 8000);
    } catch (e) { console.error(e); }
  };

  const handleClaim = async (id: string) => {
    if (claimCooldown || claimingMissionId) return;
    setClaimingMissionId(id);
    setClaimCooldown(true);

    try {
      let endpoint = "/api/claim_mission";
      let payload: any = { telegram_id, mission_id: id };

      if (id === "join_channel" || id === "join_news") endpoint = "/api/claim/onboarding";
      else if (id === "invite_daily") { endpoint = "/api/claim/daily"; payload = { telegram_id }; }
      else if (id === "story_post") { endpoint = "/api/claim/story_post"; payload = { telegram_id }; }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (result.claimed) {
        window.dispatchEvent(new CustomEvent("updateBalance", { detail: result.new_balance }));
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
        setMissions(prev => prev.map(m => m.id === id ? { ...m, status: "done" } : m));
      } else {
        setPopup(t("missions.popup_complete") || "Not completed");
        // Reset to "open" so user can try again
        setMissions(prev => prev.map(m => m.id === id ? { ...m, status: "open" } : m));
        setTimeout(() => setPopup(null), 2500);
      }
    } catch (e) {
      console.error(e);
      // Fallback reset on error
      setMissions(prev => prev.map(m => m.id === id ? { ...m, status: "open" } : m));
    } finally {
      setClaimingMissionId(null);
      setTimeout(() => setClaimCooldown(false), 1000);
    }
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col overflow-y-auto text-cyan-200 
                     pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header Bar - Truly Floating */}
          <div className="flex justify-between items-center p-6 sticky top-0 z-50 bg-transparent pointer-events-none">
            <button
              onClick={onClose}
              className="group pointer-events-auto"
            >
              <div className="p-2 rounded-full bg-cyan-950/30 group-hover:bg-cyan-900/50 transition-colors border border-cyan-900/50 shadow-[0_0_15px_-5px_#22d3ee]">
                <ArrowLeft size={20} className="text-cyan-400 group-hover:text-cyan-200" />
              </div>
            </button>

            <h2 className="text-cyan-400 text-lg font-bold tracking-widest uppercase opacity-80 backdrop-blur-md px-4 py-1 rounded-full bg-black/20 border border-cyan-900/30">
              {t("missions.title")}
            </h2>

            <div className="w-10"></div> {/* Spacer for center alignment */}
          </div>

          <div className="max-w-md mx-auto w-full p-6 pb-24 space-y-8">

            {/* PRESENCE COMMIT SECTION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 px-1">
                <Clock size={16} className="text-cyan-400" />
                <h3 className="text-cyan-100 text-xs font-black uppercase tracking-[0.2em]">
                  {t("presence.title") || "PRESENCE MISSION"}
                </h3>
              </div>

              <div className="grid gap-3">
                {presenceMissions.map((pm) => (
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
                    <div className="h-20 bg-cyan-900/20 rounded-2xl border border-cyan-900/40"></div>
                    <div className="h-20 bg-cyan-900/20 rounded-2xl border border-cyan-900/40"></div>
                    <div className="h-20 bg-cyan-900/20 rounded-2xl border border-cyan-900/40"></div>
                  </div>
                )}
              </div>
            </div>


            {/* NORMAL MISSIONS SECTION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 px-1 border-t border-cyan-900/30 pt-6">
                <Lock size={16} className="text-cyan-400" />
                <h3 className="text-cyan-100 text-xs font-black uppercase tracking-[0.2em]">
                  SOCIAL PRESENCE MISSION
                </h3>
              </div>

              <div className="space-y-3">
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
                      <button
                        onClick={() => handleOpen(m.id)}
                        className="px-3 py-1.5 text-xs font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-lg hover:bg-cyan-500/20 transition-colors uppercase tracking-wider"
                      >
                        {t("missions.open")}
                      </button>
                    )}
                    {m.status === "waiting" && (
                      <button disabled className="px-3 py-1.5 text-xs font-bold bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-lg uppercase tracking-wider animate-pulse">
                        SYNCING...
                      </button>
                    )}
                    {m.status === "claim" && (
                      <button
                        onClick={() => handleClaim(m.id)}
                        disabled={claimingMissionId === m.id}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-all
                            ${claimingMissionId === m.id
                            ? "bg-cyan-700 text-cyan-200 border border-cyan-600 cursor-wait"
                            : "bg-cyan-500 text-black border border-cyan-400 shadow-[0_0_15px_#00e6ff80] animate-pulse"
                          }
                          `}
                      >
                        {claimingMissionId === m.id ? "CLAIMING..." : t("missions.claim")}
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
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-cyan-900/10 rounded-xl border border-cyan-900/30"></div>)}
                  </div>
                )}
              </div>
            </div>

            {/* Popup Modal */}
            <AnimatePresence>
              {popup && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[150]
                             bg-cyan-950/90 border border-cyan-500/50 text-cyan-100
                             px-6 py-3 rounded-full shadow-[0_0_30px_#00e6ff40]
                             text-sm font-bold tracking-wide backdrop-blur-xl whitespace-nowrap"
                >
                  {popup}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
