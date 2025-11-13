"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any; // add this line
}

export default function Profile({ isOpen, onClose, telegramUser }: ProfileProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const telegram_id = telegramUser?.id;

  useEffect(() => {
    if (!isOpen || !telegram_id) return;

    fetch(`https://bluewave-backend-wj70.onrender.com/api/user/${telegram_id}`)

      .then(res => res.json())
      .then(user => {
        setUser(user);
        setLoading(false);
      })
      .catch(() => setError("Could not load profile"));
  }, [isOpen, telegram_id]);

  const handleClaim = async () => {
    const res = await fetch("https://bluewave-backend-wj70.onrender.com/api/claim_referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id }),
    });
    const result = await res.json();
    if (result.claimed) {
      setUser((prev: any) => ({
        ...prev,
        referral_earnings: 0,
        balance: result.new_balance,
      }));

      // Dispatch global balance update
      window.dispatchEvent(new CustomEvent("updateBalance", { detail: result.new_balance }));
    }
  };


  const handleNotify = async () => {
    await fetch("https://bluewave-backend-wj70.onrender.com/api/notify_inactive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id }),
    });
    alert("Inactive referrals notified 🚀");
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
                PROFILE
              </h2>
              <button
                onClick={onClose}
                className="absolute right-0 text-cyan-300 hover:text-cyan-100"
              >
                <X size={20} />
              </button>
            </div>

            {loading && <p className="text-center text-cyan-400">Loading...</p>}
            {error && <p className="text-center text-red-400">{error}</p>}

            {user && (
              <div className="space-y-3 text-sm">
                {/* Avatar */}
                <div className="flex flex-col items-center mb-2">
                  <img
                    src={user.photo_url || "https://via.placeholder.com/80"}
                    alt="avatar"
                    className="w-20 h-20 rounded-full border border-cyan-400/40 mb-2"
                  />
                  {user.streak > 0 && (
                    <div className="text-orange-400 text-xs">
                      🔥 {user.streak} Day Streak
                    </div>
                  )}
                </div>

                <div className="text-center text-cyan-400 text-xs mb-3">
                  Level 3 — Blue Seed
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <p>
                    BW ID: <span className="text-cyan-300">{user.bw_id}</span>
                  </p>
                  <p>
                    Name: <span className="text-cyan-300">{user.name}</span>
                  </p>
                  <p>
                    Total Referrals:{" "}
                    <span className="text-cyan-300">{user.total_referrals}</span>
                  </p>
                  <p>
                    Inactive Referrals:{" "}
                    <span className="text-cyan-300">
                      {user.inactive_referrals_cache}
                    </span>
                  </p>
                </div>

                <div className="mt-3 border-t border-cyan-900/50 pt-2">
                  <p>
                    Referral Earnings:{" "}
                    <span className="text-cyan-300">
                      {user.referral_earnings_pending} $BWAVE
                    </span>
                  </p>
                  <button
                    onClick={handleClaim}
                    disabled={user.referral_earnings_pending === 0}
                    className={`px-3 py-1 mt-1 text-xs rounded-md border ${
                      user.referral_earnings_pending === 0
                        ? "bg-gray-700 text-gray-400 border-gray-600"
                        : "bg-cyan-500/20 text-cyan-300 border-cyan-400 hover:bg-cyan-500/30"
                    }`}
                  >
                    {user.referral_earnings_pending === 0 ? "Claimed" : "Claim"}
                  </button>
                </div>

                <div>
                  <button
                    onClick={handleNotify}
                    className="w-full mt-2 text-xs px-3 py-1 border border-cyan-400 text-cyan-300 rounded-md hover:bg-cyan-500/20"
                  >
                    Notify Them
                  </button>
                </div>

                {/* Referral Link & Copy */}
                <div className="mt-3 border-t border-cyan-900/50 pt-2 text-center">
                  <p className="text-xs text-cyan-400 mb-1">Referral Link:</p>
                  <div className="flex justify-center items-center space-x-2">
                    <span className="text-[11px] text-cyan-300 truncate max-w-[180px]">
                      {user.referral_link}
                    </span>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(user.referral_link)
                      }
                      className="text-[11px] px-2 py-0.5 border border-cyan-400 text-cyan-300 rounded-md hover:bg-cyan-500/20"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="text-xs text-center text-cyan-500 mt-3">
                  Joined: {new Date(user.joined_at).toLocaleDateString()}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
