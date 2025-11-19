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
  const [balance, setBalance] = useState(120); // temporary for now until live profile data
  // Popup message modal
  const [popup, setPopup] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function loadMissions() {
      try {
        const [onboardRes, dailyRes, normalRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/missions/onboarding/${telegram_id}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/missions/daily/${telegram_id}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/missions/${telegram_id}`)
        ]);

        const onboarding = await onboardRes.json();
        const daily = await dailyRes.json();
        const normal = await normalRes.json();

        let finalList: Mission[] = [];

        // ⭐ 1. ONBOARDING — only show if not completed
        if (onboarding.length && onboarding[0].status !== "done") {
          finalList.push(onboarding[0]);
        }

        // ⭐ 2. DAILY (Invite 2 People)
        // Always show and always force status to "claim" or "open"
        if (daily.length) {
          const d = daily[0];

          // Fix: Daily mission should NEVER show "open" button
          // If no invites yet — status should be "claim" (but claim will fail)
          if (d.status === "open") d.status = "claim";

          finalList.push(d);
        }

        // ⭐ 3. NORMAL MISSIONS (Dynamic missions)
        normal.forEach((m: Mission) => finalList.push(m));

        // ⭐ 4. Sort missions in correct static order:
        // Onboarding → Daily → Dynamic
        finalList.sort((a, b) => {
          const order = {
            "join_channel": 1,
            "invite_daily": 2
          };
          return ((order as any)[a.id] ?? 100) - ((order as any)[b.id] ?? 100);
        });

        setMissions(finalList);
        setLoading(false);

      } catch (e) {
        console.error(e);
        setError("Could not load missions.");
      }
    }

    loadMissions();
  }, [isOpen]);

  const handleOpen = (id: string, url: string) => {
    // 1. Open the mission link
    window.open(url, "_blank");

    // 2. Immediately show user “opened”
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "waiting" } : m))
    );

    // 3. After 10 seconds, allow claiming
    setTimeout(() => {
      setMissions((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "claim" } : m))
      );
    }, 10000); // 10 seconds
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

      if (id === "join_channel") {
        endpoint = "/api/claim/onboarding";
      } 
      else if (id === "invite_daily") {
        endpoint = "/api/claim/daily";
      } 
      else {
        endpoint = "/api/claim_mission";
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id, mission_id: id }),
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
                      onClick={() => handleOpen(m.id, m.url)}
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
