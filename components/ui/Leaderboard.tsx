"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";


interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
}

export default function Leaderboard({ isOpen, onClose, telegramUser }: LeaderboardProps) {
  const { t } = useLanguage();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progressData, setProgressData] = useState<any>(null);

  // user ID
  const tg = telegramUser?.id;

  useEffect(() => {
    if (!isOpen || leaders.length > 0) return;

    // ⭐ OPTIMIZED: Single endpoint returns top 10 + user's rank
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard?tg_id=${tg}`)
      .then(r => r.json())
      .then(d => {
        setLeaders(d.leaders || []);
        if (d.myRank) {
          setProgressData(d);
        }
      })
      .catch(() => setError(t("leaderboard.error_load")))
      .finally(() => setLoading(false));
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
                {t("leaderboard.title")}
              </h2>
              <button
                onClick={onClose}
                className="absolute right-0 text-cyan-300 hover:text-cyan-100"
              >
                <X size={20} />
              </button>
            </div>

            {loading && (
              <div className="space-y-2 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center px-3 py-2 rounded-xl border border-cyan-900/30 bg-black/20">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-4 bg-cyan-900/50 rounded"></div>
                      <div className="w-6 h-6 rounded-full bg-cyan-900/30"></div>
                      <div className="w-24 h-4 bg-cyan-900/30 rounded"></div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="w-16 h-3 bg-cyan-900/50 rounded ml-auto"></div>
                      <div className="w-12 h-2 bg-cyan-900/30 rounded ml-auto"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {error && <p className="text-center text-red-400">{error}</p>}

            {!loading && !error && (
              <>

                {/* SCROLLABLE AREA — Top 10 + Your Rank */}
                <div className="space-y-2 max-h-[47vh] overflow-y-auto pr-1">

                  {/* Top 10 */}
                  {leaders.map((u, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center px-3 py-2 rounded-xl border border-cyan-900 bg-black/30 ${index === 0
                        ? "shadow-[0_0_15px_#00e6ff70]"
                        : index === 1
                          ? "shadow-[0_0_10px_#00e6ff40]"
                          : ""
                        }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-cyan-400 font-bold text-sm">#{u.rank}</span>
                        <span>{u.country_flag}</span>
                        <span className="text-cyan-200 text-sm truncate max-w-[130px]">
                          {u.name}
                          {String(u.telegram_id) === String(tg) && (
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-md bg-cyan-400/20 text-cyan-300 border border-cyan-500/40">
                              {t("leaderboard.you")}
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-cyan-300">{u.balance} $BWAVE</p>
                        <p className="text-[10px] text-cyan-500">{u.referrals} {t("leaderboard.referrals")}</p>
                      </div>
                    </div>
                  ))}

                  {/* MY RANK (scrolls with list) */}
                  {progressData?.myRank &&
                    !leaders.some((u) => String(u.telegram_id) === String(tg)) && (
                      <div className="flex justify-between items-center px-3 py-2 rounded-xl 
                                      border border-cyan-700 bg-black/40 shadow-[0_0_20px_#00e6ff70] mt-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-cyan-400 font-bold text-sm">
                            #{progressData.myRank.rank}
                          </span>

                          <span>{progressData.myRank.country_flag}</span>

                          <span className="text-cyan-200 text-sm truncate max-w-[130px]">
                            {progressData.myRank.name}
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-md 
                                            bg-cyan-400/20 text-cyan-300 border border-cyan-500/40">
                              {t("leaderboard.you")}
                            </span>
                          </span>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-cyan-300">
                            {progressData.myRank.balance} $BWAVE
                          </p>
                          <p className="text-[10px] text-cyan-500">
                            {progressData.myRank.referrals} {t("leaderboard.referrals")}
                          </p>
                        </div>
                      </div>
                    )}

                </div>
                {/* END SCROLL DIV */}


                {/* STATIC — Level Progress (never scrolls) */}
                {progressData && (
                  <div className="mt-4 bg-black/40 border border-cyan-800 rounded-xl p-4 shadow-[0_0_20px_#00e6ff20]">

                    <p className="text-cyan-400 text-sm mb-2">
                      {t("leaderboard.your_level")} {progressData.current_level}
                    </p>

                    {progressData.next_level ? (
                      <>
                        <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-cyan-900">
                          <div
                            className="h-full bg-cyan-400/80"
                            style={{
                              width: 0,
                              animation: `fillBar 1.2s ease-out forwards`,
                              ["--target" as any]: `${progressData.progress}%`,
                            }}
                          ></div>
                        </div>

                        <p className="text-[11px] text-cyan-300 mt-1">
                          {progressData.progress}% — {progressData.remaining} {t("leaderboard.points_to_reach")}{" "}
                          {progressData.next_level}
                        </p>
                      </>
                    ) : (
                      <p className="text-[12px] text-cyan-300 mt-1">{t("leaderboard.max_level")}</p>
                    )}
                  </div>
                )}

              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
