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
  link_url: string;
  status: string;
}

export default function MissionCenter({ isOpen, onClose, telegramUser }: MissionCenterProps) {  
  const telegram_id = telegramUser?.id;   // ← ADD THIS EXACTLY HERE
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState(120); // temporary for now until live profile data

  useEffect(() => {
    if (!isOpen) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/missions`)
      .then((res) => res.json())
      .then((data) => {
        setMissions(data);
        setLoading(false);
      })
      .catch(() => setError("Could not fetch missions"));
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
    if (!telegram_id) {
      console.error("Telegram ID missing — cannot claim mission");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/claim_mission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_id,
          mission_id: id,
        }),
      });

      const result = await res.json();
      if (result.claimed) {
        setBalance(result.new_balance);
        setMissions((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: "done" } : m))
        );
      }
    } catch (err) {
      console.error("Claim failed:", err);
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

                  {m.status === "active" && (
                    <button
                      onClick={() => handleOpen(m.id, m.link_url)}
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
