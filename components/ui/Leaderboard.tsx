import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ArrowLeft, Trophy, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi } from "@/lib/useApi";

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
  isInline?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
}

export default function Leaderboard({ isOpen, onClose, telegramUser, isInline = false, onSheetOpenChange }: LeaderboardProps) {
  const { t } = useLanguage();
  const tg_id = telegramUser?.id;

  const [countriesOpen, setCountriesOpen] = useState(false);

  const handleCountriesOpen = (open: boolean) => {
    setCountriesOpen(open);
    if (onSheetOpenChange) onSheetOpenChange(open);
  };

  const [cachedData, setCachedData] = useState<any>(() => {
    if (typeof window !== "undefined") {
      // Use live tg_id OR fall back to the saved id so returning users get instant data
      const effectiveTgId = tg_id || window.localStorage.getItem("bw_tg_id");
      if (effectiveTgId) {
        const cached = window.localStorage.getItem(`bw_leaderboard_cache_${effectiveTgId}`);
        return cached ? JSON.parse(cached) : null;
      }
    }
    return null;
  });
 
  // Use useApi for caching and automatic revalidation
  const { data, loading, error } = useApi(isOpen && tg_id ? `/leaderboard?tg_id=${tg_id}` : null, { fallbackData: cachedData });
 
  const leaders = data?.leaders || [];
  const myRank = data?.myRank;
 
  // Update cache when fresh data arrives
  useEffect(() => {
    if (data && !loading && tg_id) {
       window.localStorage.setItem(`bw_leaderboard_cache_${tg_id}`, JSON.stringify(data));
    }
  }, [data, loading, tg_id]);
 
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

  // Component for avatar - Handles simple first letter with broken image handling
  const AvatarItem = ({ user, size = "md", isMe = false }: { user: any, size?: "sm" | "md" | "lg", isMe?: boolean }) => {
    const [imgError, setImgError] = useState(false);
    const isVerifiedHuman = user.roles?.includes("Verified Human");

    const sizeClasses = {
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-16 h-16 text-xl",
    };

    const borderColor = isMe ? "border-cyan-300 shadow-[0_0_15px_rgba(0,230,255,0.5)]" : "border-cyan-500/30 shadow-[0_0_10px_rgba(0,230,255,0.2)]";

    const renderContent = () => {
      if (user.photo_url && !imgError) {
        return (
          <img
            src={user.photo_url}
            alt={user.name}
            onError={() => setImgError(true)}
            className={`w-full h-full rounded-full border ${borderColor} object-cover`}
          />
        );
      }
      return (
        <div className={`w-full h-full rounded-full bg-cyan-950/40 border ${borderColor} flex items-center justify-center text-cyan-400 font-black`}>
          {((user.first_name || user.name || "U").charAt(0)).toUpperCase()}
        </div>
      );
    };

    return (
      <div className={`${sizeClasses[size]} relative`}>
        {renderContent()}
      </div>
    );
  };

  const getOrdinalLabel = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // 🔐 Wallet Gate — Ghost users (no wallet) see the lock screen
  const isGhost = !telegramUser?.wallet_address;

  if (isGhost) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`${
              isInline
                ? "relative w-full min-h-[70vh]"
                : "fixed inset-0 bg-black/90 backdrop-blur-2xl z-[170]"
            } flex flex-col items-center justify-center p-8 text-center`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,230,255,0.06)_0%,_transparent_70%)] pointer-events-none" />

            {/* Lock Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
              className="w-24 h-24 bg-cyan-500/10 rounded-3xl flex items-center justify-center mx-auto border border-cyan-500/20 shadow-[0_0_40px_rgba(0,230,255,0.12)] mb-8 relative"
            >
              <span className="text-5xl">🔒</span>
              <motion.div
                className="absolute inset-0 rounded-3xl border border-cyan-400/20"
                animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="space-y-3 mb-8"
            >
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                Citizens Only
              </h2>
              <p className="text-[11px] text-cyan-400/80 font-black uppercase tracking-[0.25em]">
                Leaderboard · Connect to Compete
              </p>
              <p className="text-xs text-white/30 max-w-[240px] leading-relaxed mx-auto pt-2">
                Connect your TON wallet to enter the global ranks and compete for the top.
              </p>
            </motion.div>

            {/* CTA */}
            <motion.button
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              whileTap={{ scale: 0.96 }}
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("setActiveTab", { detail: "profile" })
                )
              }
              className="h-14 px-10 bg-cyan-500 text-black text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-[0_0_25px_rgba(0,230,255,0.35)] active:scale-95 transition-all hover:bg-cyan-400"
            >
              Connect Wallet →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`${isInline ? 'relative w-full' : 'fixed inset-0 bg-black/90 backdrop-blur-2xl z-[170]'} flex flex-col text-cyan-200 transition-all duration-300 ${countriesOpen ? 'z-[210]' : ''}`}
          style={isInline ? {} : { paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 20px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          initial={isInline ? { opacity: 0 } : { opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={isInline ? { opacity: 0 } : { opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className={`${isInline ? 'w-full px-6 pb-60 custom-scrollbar' : 'flex-1 overflow-y-auto px-6 pb-44 custom-scrollbar'}`}>
            {loading && !data && (
              <div className="flex flex-col items-center justify-center h-full pt-16 animate-pulse w-full max-w-md mx-auto">
                {/* Podium Skeleton */}
                <div className="flex items-end justify-center gap-2 sm:gap-4 mb-10 w-full px-4">
                  <div className="w-24 h-32 bg-cyan-500/10 rounded-t-3xl border border-cyan-500/20"></div>
                  <div className="w-28 h-48 bg-cyan-500/20 rounded-t-3xl border border-cyan-500/30 shadow-[0_0_15px_rgba(0,230,255,0.1)]"></div>
                  <div className="w-24 h-28 bg-cyan-500/10 rounded-t-3xl border border-cyan-500/20"></div>
                </div>
                {/* List Skeleton */}
                <div className="w-full space-y-3 px-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-full h-16 flex items-center gap-4 px-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="w-10 h-10 rounded-full bg-white/10 shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/2 bg-white/10 rounded-full"></div>
                        <div className="h-2 w-1/4 bg-white/5 rounded-full"></div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/5 shrink-0"></div>
                    </div>
                  ))}
                </div>
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
                    const height = isFirst ? "h-52" : "h-40";
                    const width = isFirst ? "w-32" : "w-28";
                    const isMe = String(u.telegram_id) === String(tg_id);

                    // Strictly Cyan Theme
                    const glowIntensity = isMe
                      ? "shadow-[0_0_50px_rgba(0,230,255,0.6)]"
                      : isFirst
                        ? "shadow-[0_0_40px_rgba(0,230,255,0.4)]"
                        : "shadow-[0_0_20px_rgba(0,230,255,0.15)]";
                    const borderColor = isMe ? "border-cyan-300" : isFirst ? "border-cyan-400/60" : "border-cyan-500/30";
                    const borderTopColor = isMe ? "border-t-cyan-200" : isFirst ? "border-t-cyan-300" : "border-t-cyan-500/50";
                    const textColor = isFirst ? "text-cyan-50" : "text-cyan-200";

                    return (
                      <motion.div
                        key={u.telegram_id}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1, duration: 0.6, ease: "easeOut" }}
                        className="flex flex-col items-center"
                      >
                        {/* User Photo - Shifted UP slightly to make room */}
                        <div className="relative mb-2">
                          <div className={`relative p-1 rounded-full ${isFirst ? 'bg-cyan-500/20' : ''}`}>
                            <AvatarItem user={u} size={isFirst ? "lg" : "md"} isMe={isMe} />
                            {/* Floating Country Flag */}
                            <div className="absolute -bottom-1 -right-1 bg-black/60 backdrop-blur-md rounded-full w-6 h-6 flex items-center justify-center border border-cyan-500/30 text-xs shadow-lg">
                              {u.country_flag}
                            </div>
                          </div>
                        </div>

                        {/* The "Cone" / Column */}
                        <div className={`${width} ${height} relative rounded-t-[2rem] border-t-2 ${borderTopColor} border-x ${borderColor} ${glowIntensity} overflow-hidden group mt-2`}>
                          {/* Label: 1st, 2nd, 3rd - Moved up slightly */}
                          <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20">
                            <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full bg-cyan-400 text-black shadow-[0_0_10px_#00e6ff]`}>
                              {getOrdinalLabel(u.rank)}
                            </span>
                          </div>
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-cyan-500/5 to-transparent"></div>

                          {/* Animated Scan Line */}
                          <motion.div
                            className="absolute inset-0 w-full h-1 bg-cyan-400/30 blur-[2px]"
                            animate={{ translateY: ["0%", "1000%"] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                          />

                          <div className="absolute inset-0 flex flex-col items-center justify-start pt-6 px-2 text-center">
                            <h4 className={`${isFirst ? 'text-[10px]' : 'text-[9px]'} font-black uppercase tracking-widest text-white mb-2 truncate max-w-full mt-5`}>
                              {u.name}
                            </h4>

                            <div className="flex flex-col items-center gap-0.5 mb-2">
                              <p className={`${isFirst ? 'text-sm' : 'text-xs'} font-black tracking-tight ${textColor}`}>
                                {u.balance.toLocaleString()}
                              </p>
                              <p className="text-[7px] font-black text-cyan-600 uppercase tracking-[0.2em] leading-none">
                                $BWAVE
                              </p>
                            </div>

                            {/* Referral Chip */}
                            <div className={`mt-auto mb-3 px-3 py-1 rounded-xl border border-cyan-500/10 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center 
                              ${isFirst ? 'scale-110 border-cyan-500/30' : rank === 3 ? 'scale-[0.65] border-cyan-500/20 translate-y-1' : 'scale-75 opacity-80 border-cyan-500/20'}`}>
                              <span className="text-[9px] font-black text-cyan-500 uppercase tracking-tighter">{t("leaderboard.referrals_label")}</span>
                              <span className="text-xs font-black text-cyan-100">{u.referrals}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* ACTIVE COUNTRIES PILL - Fixed placement below top 3 */}
                <div className="flex justify-center -mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCountriesOpen(true)}
                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-cyan-950/40 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,230,255,0.1)] hover:border-cyan-400/60 transition-all group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 group-hover:text-cyan-200">
                      Active Countries
                    </span>
                    <Trophy size={12} className="text-cyan-600 group-hover:text-cyan-400" />
                  </motion.button>
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
                      <div className="relative font-black text-2xl text-cyan-400 min-w-[3rem] text-center">{getOrdinalLabel(myRank.rank)}</div>
                      <div className="relative shrink-0"><AvatarItem user={myRank} size="md" /></div>
                      <div className="relative flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-cyan-50 truncate text-lg leading-none">{myRank.name}</p>
                          <span className="text-base leading-none">{myRank.country_flag}</span>
                        </div>
                        <p className="text-[10px] text-cyan-600 font-black uppercase tracking-[0.15em] mt-0.5">
                          {myRank.referrals} Networks
                        </p>
                      </div>
                      <div className="relative text-right flex flex-col items-end">
                        <p className="text-lg font-black text-cyan-400 leading-none">{myRank.balance.toLocaleString()}</p>
                        <p className="text-[9px] text-cyan-600 font-black uppercase tracking-widest mt-1">$BWAVE</p>
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
                        <div className={`font-black text-sm w-10 text-center ${isMe ? 'text-cyan-300' : 'text-cyan-700'}`}>
                          {getOrdinalLabel(u.rank)}
                        </div>

                        <div className="shrink-0">
                          <AvatarItem user={u} size="sm" isMe={isMe} />
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
          <ActiveCountriesSheet
            isOpen={countriesOpen}
            onClose={() => handleCountriesOpen(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// [CODE: ACTIVE_COUNTRIES_SHEET]
function ActiveCountriesSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const { data: countries, loading } = useApi(isOpen ? "/countries" : null);
  const dragControls = useDragControls();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 z-[201] bg-black/95 border-t border-cyan-500/30 rounded-t-[2.5rem] flex flex-col max-h-[70vh] shadow-[0_-10px_40px_rgba(0,230,255,0.15)]"
          >
            {/* Drag Handle */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing touch-none"
            >
              <div className="w-12 h-1.5 bg-cyan-900/50 rounded-full" />
            </div>

            <div className="px-8 pb-4">
              <h3 className="text-cyan-400 text-sm font-black uppercase tracking-[0.2em] mb-1">
                Active Countries
              </h3>
              <p className="text-cyan-500/50 text-[10px] font-bold uppercase tracking-widest">
                Global Network Reach
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-20 custom-scrollbar">
              {loading ? (
                <div className="grid grid-cols-2 gap-3 pb-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-14 bg-cyan-900/10 rounded-2xl border border-cyan-900/20 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pb-6">
                  {countries?.map((c: any) => (
                    <div
                      key={c.code}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-cyan-950/20 border border-cyan-900/30 hover:border-cyan-500/30 transition-colors group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{c.flag}</span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-white truncate uppercase tracking-tighter">{c.name}</p>
                        <p className="text-[9px] font-bold text-cyan-600 uppercase tracking-widest">{c.code}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
