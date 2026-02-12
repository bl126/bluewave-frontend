"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi } from "@/lib/useApi";

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
}

export default function Leaderboard({ isOpen, onClose, telegramUser }: LeaderboardProps) {
  const { t } = useLanguage();
  const tg_id = telegramUser?.id;

  // Use useApi for caching and automatic revalidation
  const { data, loading, error } = useApi(isOpen && tg_id ? `/leaderboard?tg_id=${tg_id}` : null);

  const leaders = data?.leaders || [];
  const myRank = data?.myRank;
  const isUserInTop100 = leaders.some((u: any) => String(u.telegram_id) === String(tg_id));

  // Top 3 for the podium
  const top3 = leaders.slice(0, 3);
  // Sort top 3 as [2nd, 1st, 3rd] for the visual display
  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3.length === 2
      ? [top3[1], top3[0]]
      : top3;

  const restOfList = leaders.slice(3);

  // Fallback for avatar
  const renderAvatar = (user: any, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-16 h-16 text-xl",
    };

    if (user.photo_url) {
      return (
        <img
          src={user.photo_url}
          alt={user.name}
          className={`${sizeClasses[size]} rounded-full border border-cyan-500/30 object-cover shadow-[0_0_10px_rgba(0,230,255,0.2)]`}
        />
      );
    }
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold shadow-[0_0_10px_rgba(0,230,255,0.2)]`}>
        {(user.name?.charAt(0) || "U").toUpperCase()}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-2xl flex flex-col text-cyan-200 
                     pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Header Bar */}
          <div className="flex items-center p-6 sticky top-0 z-50">
            <button
              onClick={onClose}
              className="group p-2 rounded-full bg-cyan-950/30 hover:bg-cyan-900/50 transition-all border border-cyan-900/50 shadow-[0_0_15px_-5px_#22d3ee]"
            >
              <ArrowLeft size={20} className="text-cyan-400 group-hover:text-cyan-200" />
            </button>
            <h2 className="ml-4 text-cyan-400 text-lg font-black tracking-widest uppercase">
              {t("leaderboard.title")}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-12 custom-scrollbar">
            {loading && !data && (
              <div className="flex flex-col items-center justify-center h-full space-y-4 animate-pulse">
                <div className="w-20 h-20 bg-cyan-900/20 rounded-full border border-cyan-900/40"></div>
                <div className="h-4 w-32 bg-cyan-900/20 rounded"></div>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-red-400 font-bold">{t("leaderboard.error_load")}</p>
              </div>
            )}

            {!loading && !error && (
              <div className="max-w-md mx-auto w-full space-y-10">

                {/* PODIUM SECTION */}
                <div className="relative pt-12 pb-6 flex items-end justify-center gap-2 sm:gap-4 scale-95 sm:scale-100">
                  {podiumOrder.map((u: any, idx: number) => {
                    const isFirst = (podiumOrder.length >= 3 && idx === 1) || (podiumOrder.length < 3 && u.rank === 1);
                    const rank = u.rank;
                    const height = isFirst ? "h-52" : rank === 2 ? "h-40" : "h-32";
                    const width = isFirst ? "w-32" : "w-28";

                    // Strictly Cyan Theme
                    const glowIntensity = isFirst ? "shadow-[0_0_40px_rgba(0,230,255,0.4)]" : "shadow-[0_0_20px_rgba(0,230,255,0.15)]";
                    const borderColor = isFirst ? "border-cyan-400/60" : "border-cyan-500/30";
                    const borderTopColor = isFirst ? "border-t-cyan-300" : "border-t-cyan-500/50";
                    const textColor = isFirst ? "text-cyan-50" : "text-cyan-200";

                    return (
                      <motion.div
                        key={u.telegram_id}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1, duration: 0.6, ease: "easeOut" }}
                        className="flex flex-col items-center"
                      >
                        {/* User Photo */}
                        <div className="relative mb-4">
                          <div className={`relative p-1 rounded-full ${isFirst ? 'bg-cyan-500/20' : ''}`}>
                            {renderAvatar(u, isFirst ? "lg" : "md")}
                            {/* Floating Country Flag */}
                            <div className="absolute -bottom-1 -right-1 bg-black/60 backdrop-blur-md rounded-full w-6 h-6 flex items-center justify-center border border-cyan-500/30 text-xs shadow-lg">
                              {u.country_flag}
                            </div>
                          </div>

                          {String(u.telegram_id) === String(tg_id) && (
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-cyan-400 text-black text-[8px] font-black uppercase tracking-tighter shadow-[0_0_10px_#00e6ff]">
                              {t("leaderboard.you")}
                            </div>
                          )}
                        </div>

                        {/* The "Cone" / Column */}
                        <div className={`${width} ${height} relative rounded-t-[2rem] border-t-2 ${borderTopColor} border-x ${borderColor} ${glowIntensity} overflow-hidden group mt-2`}>
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-cyan-500/5 to-transparent"></div>

                          {/* Animated Scan Line */}
                          <motion.div
                            className="absolute inset-0 w-full h-1 bg-cyan-400/30 blur-[2px]"
                            animate={{ translateY: ["0%", "1000%"] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                          />

                          <div className="absolute inset-0 flex flex-col items-center justify-start pt-7 px-2 text-center">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-white mb-2 truncate max-w-full">
                              {u.name}
                            </h4>

                            <div className="flex flex-col items-center gap-0.5 mb-4">
                              <p className={`text-sm font-black tracking-tight ${textColor}`}>
                                {u.balance.toLocaleString()}
                              </p>
                              <p className="text-[8px] font-black text-cyan-600 uppercase tracking-[0.2em] leading-none">
                                $BWAVE
                              </p>
                            </div>

                            {/* Referral Chip */}
                            <div className={`mt-auto mb-4 px-3 py-1.5 rounded-xl border border-cyan-500/10 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center ${isFirst ? 'scale-110 border-cyan-500/30' : 'scale-90 opacity-80'}`}>
                              <span className="text-[9px] font-black text-cyan-500 uppercase tracking-tighter">{t("leaderboard.referrals_label")}</span>
                              <span className="text-xs font-black text-cyan-100">{u.referrals}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* YOUR RANK SECTION (If not in top 100) */}
                {myRank && !isUserInTop100 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-cyan-500/20"></div>
                      <div className="px-5 py-1.5 rounded-full border border-cyan-400/40 bg-cyan-400/5 shadow-[0_0_20px_#00e6ff20] animate-pulse">
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-cyan-300">
                          {t("leaderboard.your_rank")}
                        </span>
                      </div>
                      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-cyan-500/20"></div>
                    </div>

                    <div className="bg-cyan-400/10 border border-cyan-400/40 rounded-3xl p-5 flex items-center gap-5 shadow-[0_0_30px_#00e6ff20] relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent"></div>
                      <div className="relative font-black text-2xl text-cyan-400 min-w-[3rem]">#{myRank.rank}</div>
                      <div className="relative shrink-0">{renderAvatar(myRank, "md")}</div>
                      <div className="relative flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-cyan-50 truncate text-lg leading-none">{myRank.name}</p>
                          <span className="text-base leading-none">{myRank.country_flag}</span>
                        </div>
                      </div>
                      <div className="relative text-right flex flex-col items-end">
                        <p className="text-lg font-black text-cyan-400 leading-none">{myRank.balance.toLocaleString()}</p>
                        <p className="text-[9px] text-cyan-600 font-black uppercase tracking-widest mt-1">$BWAVE</p>
                        <div className="mt-2 text-[10px] text-cyan-300/60 font-black border-t border-cyan-500/10 pt-1">
                          {myRank.referrals} {t("leaderboard.referrals").slice(0, 3).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* LIST SECTION */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <h3 className="text-cyan-500/70 text-[10px] font-black uppercase tracking-[0.3em]">
                      {t("leaderboard.global_list")}
                    </h3>
                  </div>

                  {restOfList.map((u: any, idx: number) => {
                    const isMe = String(u.telegram_id) === String(tg_id);
                    return (
                      <motion.div
                        key={u.telegram_id}
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true, margin: "-20px" }}
                        transition={{ delay: Math.min(idx * 0.05, 0.4) }}
                        className={`flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all duration-300
                          ${isMe
                            ? "bg-cyan-400/10 border-cyan-300 shadow-[0_0_25px_#00e6ff25] z-10 scale-[1.02]"
                            : "bg-black/30 border-cyan-900/40 hover:border-cyan-500/30"
                          }
                        `}
                      >
                        <div className={`font-black text-sm w-10 text-center ${isMe ? 'text-cyan-400' : 'text-cyan-700'}`}>
                          #{u.rank}
                        </div>

                        <div className="shrink-0">
                          {renderAvatar(u, "sm")}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-black truncate ${isMe ? 'text-white' : 'text-cyan-100/90'}`}>
                              {u.name}
                            </span>
                            <span className="text-sm">{u.country_flag}</span>
                          </div>
                          <p className="text-[10px] text-cyan-600 font-black uppercase tracking-[0.15em] mt-0.5">
                            {u.referrals} Networks
                          </p>
                        </div>

                        <div className="text-right flex flex-col items-end">
                          <p className={`text-base font-black leading-none ${isMe ? 'text-cyan-400' : 'text-cyan-100'}`}>
                            {u.balance.toLocaleString()}
                          </p>
                          <p className="text-[8px] text-cyan-700 font-black uppercase tracking-widest mt-1">
                            $BWAVE
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
