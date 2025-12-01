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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/missions/${telegram_id}`);
        const data = await res.json();

        let finalList: Mission[] = data || [];

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

    if (id === "story_post") {
      try {
        // 1️⃣ Get mission entry for this user
        const storyMission = missions.find((m) => m.id === id);

        let mediaUrl = storyMission?.url;

        // 2️⃣ If no cached URL yet → ask backend to generate poster NOW
        if (!mediaUrl) {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/story/poster/${telegram_id}`
          );
          const data = await res.json();
          mediaUrl = data.url;

          // Save URL into local missions state so we don't refetch on next open
          if (mediaUrl) {
            setMissions((prev) =>
              prev.map((m) =>
                m.id === id ? { ...m, url: mediaUrl || "" } : m
              )
            );
          }
        }

        if (!mediaUrl) {
          console.error("No media URL for story poster");
          return;
        }

        // 3️⃣ Build referral link for the widget
        const refLink = `https://t.me/Bluewave_Ecosystem_bot?start=ref_${telegram_id}`;

        // 4️⃣ Call Telegram Mini App API → open Story composer
        const tg = (window as any).Telegram?.WebApp;
        if (tg && typeof tg.shareToStory === "function") {
          tg.shareToStory(mediaUrl, {
            text: `This isn't a meme coin
          This is a Presence Economy.
          #BWAVE #TON #Bluewave`,

            widget_link: {
              url: refLink,                // auto referral
              name: "Join Bluewave"        // text shown on story
            }
          });
        } else {
          // Fallback: at least open the image URL if story API is not supported
          window.open(mediaUrl, "_blank");
        }
      } catch (err) {
        console.error("Story open failed:", err);
      }
    }

    // 🔁 Same UX as before → WAITING then CLAIM
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "waiting" } : m))
    );

    setTimeout(() => {
      setMissions((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "claim" } : m))
      );
    }, 10000);
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
        endpoint = "/api/missions/claim_onboarding";
        payload = { telegram_id };
      } else if (id === "invite_daily") {
        // Daily invite mission
        endpoint = "/api/missions/claim_daily";
        payload = { telegram_id };
      } else if (id === "story_post") {
        // New story poster mission
        endpoint = "/api/claim/story_post";
        payload = { telegram_id };   // backend expects { telegram_id }
      } else {
        // Normal missions (from missions table)
        endpoint = "/api/missions/claim";
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

          // Reset button to CLAIM (cannot go back to open)
          setMissions(prev =>
            prev.map(m =>
              m.id === id ? { ...m, status: "claim" } : m
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
