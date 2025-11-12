"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Leaderboard({ isOpen, onClose }: LeaderboardProps) {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    fetch("http://localhost:8000/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        setLeaders(data);
        setLoading(false);
      })
      .catch(() => setError("Could not load leaderboard"));
  }, [isOpen]);

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
                LEADERBOARD
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

            {!loading && !error && (
              <div className="space-y-2">
                {leaders.map((u, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center px-3 py-2 rounded-xl border border-cyan-900 bg-black/30 ${
                      index === 0
                        ? "shadow-[0_0_15px_#00e6ff70]"
                        : index === 1
                        ? "shadow-[0_0_10px_#00e6ff40]"
                        : ""
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-cyan-400 font-bold text-sm">#{u.rank}</span>
                      <span>{u.country_flag}</span>
                      <span className="text-cyan-200 text-sm truncate max-w-[100px]">
                        {u.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-cyan-300">{u.balance} $BWAVE</p>
                      <p className="text-[10px] text-cyan-500">
                        {u.referrals} Referrals
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
