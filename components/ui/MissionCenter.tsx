"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

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

export default function MissionCenter({ isOpen, onClose, telegramUser }: MissionCenterProps) {  
  const telegram_id = telegramUser?.id;   // ← ADD THIS EXACTLY HERE
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimCooldown, setClaimCooldown] = useState(false);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  // Popup message modal
  const [popup, setPopup] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function loadMissions() {
      try {
        // 1️⃣ Normal missions from DB
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/missions/${telegram_id}`
        );
        const data = await res.json();
        let finalList: Mission[] = data || [];

        // 2️⃣ Daily "Invite 2 people" mission
        const dailyRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/missions/daily/${telegram_id}`
        );
        const dailyData = await dailyRes.json();

        if (Array.isArray(dailyData) && dailyData.length > 0) {
          finalList = [...finalList, ...dailyData];
        }

        // 3️⃣ Onboarding mission
        const onboardingRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/missions/onboarding/${telegram_id}`
        );
        const onboardingData = await onboardingRes.json();

        if (Array.isArray(onboardingData) && onboardingData.length > 0) {
          finalList = [...finalList, ...onboardingData];
        }

        // Ensure onboarding appears first
        finalList.sort((a, b) => {
          if (a.id === "join_channel") return -1;
          if (b.id === "join_channel") return 1;
          return 0;
        });

        setMissions(finalList);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError("Could not load missions.");
      }
    }

    loadMissions();
  }, [isOpen, telegram_id]);

  const handleOpen = async (id: string) => {
    if (!telegram_id) return;

    const isSpecial =
      id === "invite_daily" ||
      id === "join_channel" ||
      id === "story_post";
    
    // ⭐ SPECIAL MISSIONS — use old logic (no Ai PvP)
    if (isSpecial) {
    // ⭐ DAILY INVITE MISSION — open Telegram share with referral link
    if (id === "invite_daily") {
      const refLink = `https://t.me/Bluewave_Ecosystem_bot?start=ref_${telegram_id}`;
      const text = `Join Bluewave — The Presence Economy starts here.\n${refLink}`;

      const tg = (window as any).Telegram?.WebApp;

      // Telegram share panel
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(
          `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`
        );
      } else {
        // fallback for browser testing
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`,
          "_blank"
        );
      }

      // Start countdown → 10 seconds
      setMissions(prev =>
        prev.map(m => m.id === id ? { ...m, status: "waiting" } : m)
      );

      setTimeout(() => {
        setMissions(prev =>
          prev.map(m => m.id === id ? { ...m, status: "claim" } : m)
        );
      }, 10000);

      return; // IMPORTANT → stop further logic
    }

    
      // STORY POST LOGIC
      if (id === "story_post") {
        try {
          let storyMission = missions.find(m => m.id === id);
          let mediaUrl = storyMission?.url;

          if (!mediaUrl) {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/story/poster/${telegram_id}`
            );
            const data = await res.json();
            mediaUrl = data.url;

            if (mediaUrl) {
              setMissions(prev =>
                prev.map(m => m.id === id ? { ...m, url: mediaUrl || "" } : m)
              );
            }
          }

          if (mediaUrl) {
            const refLink = `https://t.me/Bluewave_Ecosystem_bot?start=ref_${telegram_id}`;
            const tg = (window as any).Telegram?.WebApp;

            if (tg?.shareToStory) {
              tg.shareToStory(mediaUrl, {
                text: `This isn't a meme coin
  This is a Presence Economy.
  #BWAVE #TON #Bluewave
  ${refLink}`,
                widget_link: {
                  url: refLink,
                  name: "Join Bluewave"
                }
              });
            } else {
              window.open(mediaUrl, "_blank");
            }
          }
        } catch (err) {
          console.error("Story open failed:", err);
        }
      }

      // ⭐ JOIN CHANNEL — open the Telegram channel link
      if (id === "join_channel") {
        const mission = missions.find(m => m.id === id);
        if (mission?.url) {
          window.open(mission.url, "_blank");
        }
      }

      // ⭐ For ALL special missions → use fixed 10s wait
      setMissions(prev =>
        prev.map(m => m.id === id ? { ...m, status: "waiting" } : m)
      );

      setTimeout(() => {
        setMissions(prev =>
          prev.map(m => m.id === id ? { ...m, status: "claim" } : m)
        );
      }, 10000);

      return; // 🔥 EXIT (no Ai PvP)
    }

    // ⭐ NORMAL MISSION (Ai PvP)
    try {
      // 1️⃣ Start PvP timer BEFORE opening URL
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/mission/open`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegram_id, mission_id: id }),
        }
      );

      const data = await res.json();

      // 2️⃣ Open URL NOW
      const mission = missions.find(m => m.id === id);
      if (mission?.url) {
        window.open(mission.url, "_blank");
      }

      // 3️⃣ Set WAITING UI
      setMissions(prev =>
        prev.map(m => m.id === id ? { ...m, status: "waiting" } : m)
      );

      // 4️⃣ If Ai PvP disabled for this mission → fallback to 10s
      if (!data.ai_pvp) {
        setTimeout(() => {
          setMissions(prev =>
            prev.map(m => m.id === id ? { ...m, status: "claim" } : m)
          );
        }, 8000);
        return;
      }

      // 5️⃣ Dynamic unlock based on backend timing
      const unlockTime = new Date(data.unlocks_at).getTime() - Date.now();
      const delay = Math.max(0, unlockTime);

      setTimeout(() => {
        setMissions(prev =>
          prev.map(m => m.id === id ? { ...m, status: "claim" } : m)
        );
      }, delay);

    } catch (e) {
      console.error("mission/open failed:", e);
    }
  };

  const handleClaim = async (id: string) => {
    if (!telegram_id) return;

    // ⛔ Prevent rapid spam (3 seconds)
    if (claimCooldown) return;
    setClaimCooldown(true);
    setTimeout(() => setClaimCooldown(false), 3000);

    // ⭐ Step 1 — change button to "Claiming..."
    setMissions(prev =>
      prev.map(m =>
        m.id === id ? { ...m, status: "claiming" } : m
      )
    );

    try {
      let endpoint = "";
      let payload: any = {};

      if (id === "join_channel") {
        // Onboarding mission
        endpoint = "/api/claim/onboarding";
        payload = { telegram_id };
      } else if (id === "invite_daily") {
        // Daily invite mission
        endpoint = "/api/claim/daily";
        payload = { telegram_id };
      } else if (id === "story_post") {
        // New story poster mission
        endpoint = "/api/claim/story_post";
        payload = { telegram_id };   // backend expects { telegram_id }
      } else {
        // Normal missions (from missions table)
        endpoint = "/api/claim_mission";
        payload = { telegram_id, mission_id: id };  // backend expects both
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();


      // ⭐ NEW — Trigger badge popup in Profile
      if (result.badge_unlocked) {
        window.dispatchEvent(new CustomEvent("badgeUnlocked"));
      }


      // ⭐ BACKEND RESPONSE HANDLING
      if (result.claimed) {
        // Success case
        setBalance(result.new_balance);

        setMissions(prev =>
          prev.map(m =>
            m.id === id ? { ...m, status: "done" } : m
          )
        );

      } else {
        // ❌ FAILED CONDITIONS

        if (id === "join_channel" && result.reason === "NOT_IN_CHANNEL") {
          setPopup("Join the official Bluewave channel to claim.");
          setTimeout(() => setPopup(null), 2500);

          // Reset to OPEN state
          setMissions(prev =>
            prev.map(m =>
              m.id === id ? { ...m, status: "open" } : m
            )
          );

        } else if (id === "invite_daily" && result.reason === "NOT_ENOUGH_INVITES") {
          setPopup("Invite 2 people today to unlock this reward.");
          setTimeout(() => setPopup(null), 2500);

          // Reset button to open 
          setMissions(prev =>
            prev.map(m =>
              m.id === id ? { ...m, status: "open" } : m
            )
          );

        } else if (result.reason === "OPEN_REQUIRED") {
            setPopup("Tap OPEN first before claiming this mission.");
            setTimeout(() => setPopup(null), 2500);

            setMissions(prev =>
              prev.map(m =>
                m.id === id ? { ...m, status: "open" } : m
              )
            );

        } else if (
          result.reason === "MISSION_NOT_COMPLETED" ||
          result.reason === "TOO_FAST"
        ) {
          // Ai PvP: user didn't complete mission within allowed timeline
          setPopup("Please complete the mission properly before claiming.");
          setTimeout(() => setPopup(null), 2500);

          // Reset mission back to OPEN so they must start again
          setMissions(prev =>
            prev.map(m =>
              m.id === id ? { ...m, status: "open" } : m
            )
          );

        } else {
          // Generic failure → revert to claim
          setMissions(prev =>
            prev.map(m =>
              m.id === id ? { ...m, status: "claim" } : m
            )
          );
        }
      }

    } catch (err) {
      console.error("Claim failed:", err);

      // Network error → revert to claim
      setMissions(prev =>
        prev.map(m =>
          m.id === id ? { ...m, status: "claim" } : m
        )
      );
    }
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                       w-[90%] max-w-sm bg-black/60 backdrop-blur-md border border-cyan-900 
                       rounded-2xl p-5 text-cyan-200 shadow-[0_0_25px_#00e6ff30]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex justify-center relative mb-4">
              <h2 className="text-cyan-400 text-lg font-semibold tracking-wide">
                MISSION CENTER
              </h2>
              <button
                onClick={onClose}
                className="absolute right-0 text-cyan-300 hover:text-cyan-100"
              >
                <X size={20} />
              </button>
            </div>

            {loading && <p className="text-center text-cyan-300">Loading...</p>}
            {error && <p className="text-center text-red-400">{error}</p>}

            <div className="space-y-3">
              {missions.map((m) => (
                <div
                  key={m.id}
                  className={`flex justify-between items-center px-3 py-2 rounded-xl border
                  ${
                    m.status === "done"
                      ? "border-gray-700 opacity-50"
                      : "border-cyan-900"
                  } bg-black/30`}
                >
                  <div>
                    <p className="text-sm font-semibold capitalize">{m.name}</p>
                    <p className="text-xs text-cyan-500">{m.points} $BWAVE</p>
                  </div>

                  {m.status === "open" && (
                    <button
                      onClick={() => handleOpen(m.id)}
                      className="px-3 py-1 text-xs bg-cyan-500/20 border border-cyan-400 text-cyan-300 rounded-md hover:bg-cyan-500/30"
                    >
                      Open
                    </button>
                  )}
                  {m.status === "waiting" && (
                    <button
                      disabled
                      className="px-3 py-1 text-xs bg-yellow-600/20 border border-yellow-400 text-yellow-200 rounded-md"
                    >
                      Waiting...
                    </button>
                  )}
                  {m.status === "claim" && (
                    <button
                      onClick={() => handleClaim(m.id)}
                      className="px-3 py-1 text-xs bg-cyan-600/30 border border-cyan-400 text-cyan-200 rounded-md animate-pulse shadow-[0_0_10px_#00e6ff80]"
                    >
                      Claim
                    </button>
                  )}
                  {m.status === "claiming" && (
                    <button
                      disabled
                      className="px-3 py-1 text-xs bg-cyan-700/20 border border-cyan-500 text-cyan-400 rounded-md opacity-70"
                    >
                      Claiming...
                    </button>
                  )}
                  {m.status === "done" && (
                    <button
                      disabled
                      className="px-3 py-1 text-xs bg-gray-700 text-gray-400 rounded-md"
                    >
                      Done
                    </button>
                  )}
                </div>
              ))}
            </div>
            {/* Popup Modal */}
            <AnimatePresence>
              {popup && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 
                             bg-black/70 border border-cyan-500 text-cyan-200
                             px-4 py-2 rounded-lg shadow-[0_0_15px_#00e6ff]"
                >
                  {popup}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
