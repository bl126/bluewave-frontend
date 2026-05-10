import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ArrowLeft, Trophy, User, SlidersHorizontal, X, Link2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi } from "@/lib/useApi";

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
  isInline?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
  onGetRefLink?: () => void;
}

export default function Leaderboard({ isOpen, onClose, telegramUser, isInline = false, onSheetOpenChange, onGetRefLink }: LeaderboardProps) {
  const { t } = useLanguage();
  const tg_id = telegramUser?.id;

  const [countriesOpen, setCountriesOpen] = useState(false);
  const [builderNationsOpen, setBuilderNationsOpen] = useState(false);
  const [joinBoardOpen, setJoinBoardOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"global" | "network">("global");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterOpen]);

  const handleCountriesOpen = (open: boolean) => {
    setCountriesOpen(open);
    if (onSheetOpenChange) onSheetOpenChange(open);
  };

  const handleBuilderNationsOpen = (open: boolean) => {
    setBuilderNationsOpen(open);
    if (onSheetOpenChange) onSheetOpenChange(open);
  };

  const [cachedData, setCachedData] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const effectiveTgId = tg_id || window.localStorage.getItem("bw_tg_id");
      if (effectiveTgId) {
        const cached = window.localStorage.getItem(`bw_leaderboard_cache_${effectiveTgId}`);
        return cached ? JSON.parse(cached) : null;
      }
    }
    return null;
  });

  const [cachedNetworkData, setCachedNetworkData] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const effectiveTgId = tg_id || window.localStorage.getItem("bw_tg_id");
      if (effectiveTgId) {
        const cached = window.localStorage.getItem(`bw_network_leaderboard_cache_${effectiveTgId}`);
        return cached ? JSON.parse(cached) : null;
      }
    }
    return null;
  });
 
  // Global leaderboard data
  const { data, loading, error } = useApi(isOpen && tg_id ? `/leaderboard?tg_id=${tg_id}` : null, {
    fallbackData: cachedData,
    dedupingInterval: 30000,
    revalidateOnFocus: false,
  });

  // Network builders data (only fetched when that mode is active)
  const { data: networkData, loading: networkLoading } = useApi(
    isOpen && tg_id && viewMode === "network" ? `/leaderboard/network-builders?tg_id=${tg_id}` : null,
    { 
      fallbackData: cachedNetworkData,
      dedupingInterval: 60000, 
      revalidateOnFocus: false 
    }
  );

  const activeData = viewMode === "global" ? data : networkData;
  const leaders = activeData?.leaders || [];
  const myRank = activeData?.myRank;
 
  // Update cache when fresh data arrives
  useEffect(() => {
    if (data && !loading && tg_id) {
       window.localStorage.setItem(`bw_leaderboard_cache_${tg_id}`, JSON.stringify(data));
    }
    if (networkData && !networkLoading && tg_id) {
       window.localStorage.setItem(`bw_network_leaderboard_cache_${tg_id}`, JSON.stringify(networkData));
    }
  }, [data, loading, networkData, networkLoading, tg_id]);

  const isLoading = viewMode === "global" ? (!data && !error) : networkLoading;
 
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
        <div className={`w-full h-full rounded-full bg-app-accent/5 border ${borderColor} flex items-center justify-center text-app-accent font-black`}>
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
                : "fixed inset-0 bg-app-bg/90 backdrop-blur-2xl z-[170]"
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
              className="w-24 h-24 bg-app-accent/10 rounded-3xl flex items-center justify-center mx-auto border border-app-border shadow-[0_0_40px_rgba(0,230,255,0.12)] mb-8 relative"
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
              <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">
                Citizens Only
              </h2>
              <p className="text-[11px] text-app-accent/80 font-black uppercase tracking-[0.25em]">
                Leaderboard · Connect to Compete
              </p>
              <p className="text-xs text-text-sub max-w-[240px] leading-relaxed mx-auto pt-2">
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
          className={`${isInline ? 'relative w-full' : 'fixed inset-0 bg-app-bg/90 backdrop-blur-2xl z-[170]'} flex flex-col text-text-main transition-all duration-300 ${countriesOpen ? 'z-[210]' : ''}`}
          style={isInline ? {} : { paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 20px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          initial={isInline ? { opacity: 0 } : { opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={isInline ? { opacity: 0 } : { opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className={`${isInline ? 'w-full px-6 pb-60 custom-scrollbar' : 'flex-1 overflow-y-auto px-6 pb-44 custom-scrollbar'}`}>
            {/* Skeleton: ONLY when there is truly zero data (first-ever load) */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full pt-16 animate-pulse w-full max-w-md mx-auto">
                {/* Podium Skeleton */}
                <div className="flex items-end justify-center gap-2 sm:gap-4 mb-10 w-full px-4">
                  <div className="w-24 h-32 bg-app-accent/10 rounded-t-3xl border border-app-border"></div>
                  <div className="w-28 h-48 bg-app-accent/20 rounded-t-3xl border border-app-border shadow-app-shadow"></div>
                  <div className="w-24 h-28 bg-app-accent/10 rounded-t-3xl border border-app-border"></div>
                </div>
                {/* List Skeleton */}
                <div className="w-full space-y-3 px-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-full h-16 flex items-center gap-4 px-4 bg-app-accent/5 rounded-2xl border border-app-border">
                      <div className="w-10 h-10 rounded-full bg-app-accent/10 shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/2 bg-app-accent/10 rounded-full"></div>
                        <div className="h-2 w-1/4 bg-app-accent/5 rounded-full"></div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-app-accent/5 shrink-0"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && !data && viewMode === "global" && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-red-400 font-bold">{t("leaderboard.error_load")}</p>
              </div>
            )}

            {/* Content: Show IMMEDIATELY when data exists — even if revalidating in background */}
            {activeData && (
              <div className="max-w-md mx-auto w-full space-y-10">

                {/* PODIUM SECTION */}
                <div className="relative pt-12 pb-6 flex items-end justify-center gap-2 sm:gap-4 scale-95 sm:scale-100">
                  {podiumOrder.map((u: any, idx: number) => {
                    const isFirst = (podiumOrder.length >= 3 && idx === 1) || (podiumOrder.length < 3 && u.rank === 1);
                    const rank = u.rank;
                    const height = isFirst ? "h-52" : "h-40";
                    const width = isFirst ? "w-32" : "w-28";
                    const isMe = String(u.telegram_id) === String(tg_id);

                    // Strictly Theme-Aware Accent
                    const glowIntensity = isMe
                      ? "shadow-app-shadow"
                      : isFirst
                        ? "shadow-app-shadow"
                        : "shadow-app-shadow";
                    const borderColor = isMe ? "border-app-accent" : isFirst ? "border-app-accent/60" : "border-app-border";
                    const borderTopColor = isMe ? "border-t-app-accent" : isFirst ? "border-t-app-accent/80" : "border-t-app-border";
                    const textColor = isFirst ? "text-text-main" : "text-text-main/90";

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
                          <div className={`relative p-1 rounded-full ${isFirst ? 'bg-app-accent/20' : ''}`}>
                            <AvatarItem user={u} size={isFirst ? "lg" : "md"} isMe={isMe} />
                            {/* Floating Country Flag */}
                            <div className="absolute -bottom-1 -right-1 bg-app-card/60 backdrop-blur-md rounded-full w-6 h-6 flex items-center justify-center border border-app-border text-xs shadow-lg">
                              {u.country_flag}
                            </div>
                          </div>
                        </div>

                        {/* The "Cone" / Column */}
                        <div className={`${width} ${height} relative rounded-t-[2rem] border-t-2 ${borderTopColor} border-x ${borderColor} ${glowIntensity} overflow-hidden group mt-2`}>
                          {/* Label: 1st, 2nd, 3rd - Moved up slightly */}
                          <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20">
                            <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full bg-app-accent text-black shadow-app-shadow`}>
                              {getOrdinalLabel(u.rank)}
                            </span>
                          </div>
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-b from-app-accent/10 via-app-accent/5 to-transparent"></div>

                          {/* Animated Scan Line */}
                          <motion.div
                            className="absolute inset-0 w-full h-1 bg-app-accent/30 blur-[2px]"
                            animate={{ translateY: ["0%", "1000%"] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                          />

                          <div className="absolute inset-0 flex flex-col items-center justify-start pt-6 px-2 text-center">
                            <h4 className={`${isFirst ? 'text-[10px]' : 'text-[9px]'} font-black uppercase tracking-widest text-text-main mb-2 truncate max-w-full mt-5`}>
                              {u.name}
                            </h4>

                            <div className="flex flex-col items-center gap-0.5 mb-2">
                              <p className={`${isFirst ? 'text-sm' : 'text-xs'} font-black tracking-tight ${textColor}`}>
                                {viewMode === "network" ? u.total_referrals : u.balance.toLocaleString()}
                              </p>
                              <p className="text-[7px] font-black text-text-sub uppercase tracking-[0.2em] leading-none">
                                {viewMode === "network" ? "Networks" : "$BWAVE"}
                              </p>
                            </div>

                            {/* Referral Chip */}
                            <div className={`mt-auto mb-3 px-3 py-1.5 rounded-xl border bg-app-card/40 backdrop-blur-sm flex flex-col items-center justify-center 
                              ${isFirst ? 'border-app-accent/30' : 'border-app-border opacity-90'}`}>
                              {viewMode === "network" ? (
                                u.verified_referrals > 0 && (
                                  <span className={`${rank === 3 ? 'text-[12px]' : rank === 2 ? 'text-[11px]' : 'text-[10px]'} text-app-accent font-black uppercase tracking-tight`}>
                                    {u.verified_referrals} verified
                                  </span>
                                )
                              ) : (
                                <>
                                  <span className={`${rank === 3 ? 'text-sm' : rank === 2 ? 'text-[13px]' : 'text-xs'} font-black text-text-sub uppercase tracking-tighter`}>{t("leaderboard.referrals_label")}</span>
                                  <span className={`${rank === 3 ? 'text-sm' : rank === 2 ? 'text-[13px]' : 'text-xs'} font-black text-text-main`}>{u.referrals}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* COUNTRIES PILL - switches between Active Countries and Builder Nations */}
                <div className="flex justify-center -mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => viewMode === "network" ? handleBuilderNationsOpen(true) : handleCountriesOpen(true)}
                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-app-accent/5 border border-app-border shadow-app-shadow hover:border-app-accent/60 transition-all group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-app-accent animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-app-accent group-hover:text-text-main">
                      {viewMode === "network" ? "Builder Nations" : "Active Countries"}
                    </span>
                    <Trophy size={12} className="text-text-sub group-hover:text-app-accent" />
                  </motion.button>
                </div>

                {/* NETWORK BUILDERS — JOIN PILL (user has 0 referrals) */}
                {viewMode === "network" && (!myRank || myRank.total_referrals === 0) && (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-app-accent/20" />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setJoinBoardOpen(true)}
                      className="px-5 py-2 rounded-full border border-app-accent/40 bg-app-accent/10 hover:bg-app-accent/20 hover:border-app-accent transition-all group flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-app-accent animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-app-accent">Join the Board</span>
                    </motion.button>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-app-accent/20" />
                  </div>
                )}

                {/* YOUR RANK CARD — only when user has referrals and is outside top 100 */}
                {myRank && !isUserInTop100 && (viewMode === "global" || myRank.total_referrals > 0) && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-app-accent/20"></div>
                      <div className="px-5 py-1.5 rounded-full border border-app-accent/40 bg-app-accent/5 shadow-app-shadow animate-pulse">
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-app-accent/80">
                          {t("leaderboard.your_rank")}
                        </span>
                      </div>
                      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-app-accent/20"></div>
                    </div>

                    <div className="bg-app-accent/10 border border-app-accent/40 rounded-3xl p-5 flex items-center gap-5 shadow-app-shadow relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-app-accent/10 to-transparent"></div>
                      <div className="relative font-black text-2xl text-app-accent min-w-[3rem] text-center">{getOrdinalLabel(myRank.rank)}</div>
                      <div className="relative shrink-0"><AvatarItem user={myRank} size="md" /></div>
                      <div className="relative flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-text-main truncate text-lg leading-none">{myRank.name}</p>
                          <span className="text-base leading-none">{myRank.country_flag}</span>
                        </div>
                        {viewMode === "network" ? (
                          myRank.verified_referrals > 0 && (
                            <p className="text-[10px] text-app-accent font-black uppercase tracking-[0.15em] mt-0.5">
                              {myRank.verified_referrals} Verified
                            </p>
                          )
                        ) : (
                          <p className="text-[10px] text-text-sub font-black uppercase tracking-[0.15em] mt-0.5">
                            {myRank.referrals} Networks
                          </p>
                        )}
                      </div>
                      <div className="relative text-right flex flex-col items-end">
                        <p className="text-lg font-black text-app-accent leading-none">
                          {viewMode === "network" ? myRank.total_referrals : myRank.balance.toLocaleString()}
                        </p>
                        <p className="text-[9px] text-text-sub font-black uppercase tracking-widest mt-1">
                          {viewMode === "network" ? "Networks" : "$BWAVE"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* LIST SECTION */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2 relative">
                    <h3 className="text-cyan-500/70 text-[10px] font-black uppercase tracking-[0.3em]">
                      {viewMode === "global" ? "Global Leaderboard" : "Network Builders"}
                    </h3>
                    {/* Filter Toggle */}
                    <div className="relative" ref={filterRef}>
                      <button
                        onClick={() => setFilterOpen(v => !v)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                          viewMode === "network"
                            ? "border-app-accent/60 text-app-accent bg-app-accent/10"
                            : "border-app-border text-text-sub hover:border-app-accent/40 hover:text-app-accent"
                        }`}
                      >
                        <SlidersHorizontal size={10} />
                        {viewMode === "global" ? "Global" : "Builders"}
                      </button>
                      <AnimatePresence>
                        {filterOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-8 z-50 bg-app-card border border-app-border rounded-2xl shadow-app-shadow overflow-hidden min-w-[160px]"
                          >
                            <button
                              onClick={() => { setViewMode("global"); setFilterOpen(false); }}
                              className={`w-full flex items-center gap-2.5 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                                viewMode === "global" ? "text-app-accent bg-app-accent/10" : "text-text-sub hover:text-app-accent hover:bg-app-accent/5"
                              }`}
                            >
                              <Trophy size={11} />
                              Global Leaderboard
                            </button>
                            <div className="h-[1px] bg-app-border mx-3" />
                            <button
                              onClick={() => { setViewMode("network"); setFilterOpen(false); }}
                              className={`w-full flex items-center gap-2.5 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                                viewMode === "network" ? "text-app-accent bg-app-accent/10" : "text-text-sub hover:text-app-accent hover:bg-app-accent/5"
                              }`}
                            >
                              <SlidersHorizontal size={11} />
                              Network Builders
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
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
                            ? "bg-app-accent/10 border-app-accent shadow-app-shadow z-10 scale-[1.02]"
                            : "bg-app-bg/30 border-app-border hover:border-app-accent/30"
                          }
                        `}
                      >
                        <div className={`font-black text-sm w-10 text-center ${isMe ? 'text-app-accent' : 'text-text-sub'}`}>
                          {getOrdinalLabel(u.rank)}
                        </div>

                        <div className="shrink-0">
                          <AvatarItem user={u} size="sm" isMe={isMe} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-black truncate ${isMe ? 'text-text-main' : 'text-text-main/90'}`}>
                              {u.name}
                            </span>
                            <span className="text-sm">{u.country_flag}</span>
                          </div>
                          {viewMode === "network" ? (
                            u.verified_referrals > 0 && (
                              <p className="text-[10px] text-app-accent font-black uppercase tracking-[0.15em] mt-0.5">
                                {u.verified_referrals} Verified
                              </p>
                            )
                          ) : (
                            <p className="text-[10px] text-text-sub font-black uppercase tracking-[0.15em] mt-0.5">
                              {u.referrals} Networks
                            </p>
                          )}
                        </div>

                        <div className="text-right flex flex-col items-end">
                          <p className={`text-base font-black leading-none ${isMe ? 'text-app-accent' : 'text-text-main'}`}>
                            {viewMode === "network" ? u.total_referrals : u.balance.toLocaleString()}
                          </p>
                          <p className="text-[8px] text-text-sub font-black uppercase tracking-widest mt-1">
                            {viewMode === "network" ? "Networks" : "$BWAVE"}
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
          <BuilderNationsSheet
            isOpen={builderNationsOpen}
            onClose={() => handleBuilderNationsOpen(false)}
            leaders={leaders}
          />
          <JoinTheBoardModal
            isOpen={joinBoardOpen}
            onClose={() => setJoinBoardOpen(false)}
            onGetRefLink={() => {
              setJoinBoardOpen(false);
              onGetRefLink?.();
            }}
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
          {/* Backdrop — above nav */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[998] bg-app-bg/60 backdrop-blur-sm"
          />

          {/* Sheet — above nav */}
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
            className="fixed bottom-0 left-0 right-0 z-[999] bg-app-card border-t border-app-border rounded-t-[2.5rem] flex flex-col max-h-[70vh] shadow-app-shadow"
          >
            {/* Drag Handle */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing touch-none"
            >
              <div className="w-12 h-1.5 bg-app-border/50 rounded-full" />
            </div>

            <div className="px-8 pb-4">
              <h3 className="text-app-accent text-sm font-black uppercase tracking-[0.2em] mb-1">
                Active Countries
              </h3>
              <p className="text-text-sub text-[10px] font-bold uppercase tracking-widest">
                Global Network Reach
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-20 custom-scrollbar">
              {loading ? (
                <div className="grid grid-cols-2 gap-3 pb-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-14 bg-app-accent/5 rounded-2xl border border-app-border animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pb-6">
                  {countries?.map((c: any) => (
                    <div
                      key={c.code}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-app-accent/5 border border-app-border hover:border-app-accent/30 transition-colors group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{c.flag}</span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-text-main truncate uppercase tracking-tighter">{c.name}</p>
                        <p className="text-[9px] font-bold text-text-sub uppercase tracking-widest">{c.code}</p>
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

// [CODE: BUILDER_NATIONS_SHEET]
// Static country code → name map so names show instantly regardless of API timing
const COUNTRY_NAMES: Record<string, string> = {
  AF:"Afghanistan",AL:"Albania",DZ:"Algeria",AO:"Angola",AR:"Argentina",AM:"Armenia",AU:"Australia",AT:"Austria",AZ:"Azerbaijan",
  BS:"Bahamas",BH:"Bahrain",BD:"Bangladesh",BY:"Belarus",BE:"Belgium",BJ:"Benin",BT:"Bhutan",BO:"Bolivia",BA:"Bosnia",BW:"Botswana",BR:"Brazil",BN:"Brunei",BG:"Bulgaria",BF:"Burkina Faso",BI:"Burundi",
  CV:"Cape Verde",KH:"Cambodia",CM:"Cameroon",CA:"Canada",CF:"Central African Rep.",TD:"Chad",CL:"Chile",CN:"China",CO:"Colombia",KM:"Comoros",CG:"Congo",CR:"Costa Rica",CI:"Côte d'Ivoire",HR:"Croatia",CU:"Cuba",CY:"Cyprus",CZ:"Czech Republic",
  DK:"Denmark",DJ:"Djibouti",DO:"Dominican Republic",
  EC:"Ecuador",EG:"Egypt",SV:"El Salvador",GQ:"Equatorial Guinea",ER:"Eritrea",EE:"Estonia",SZ:"Eswatini",ET:"Ethiopia",
  FJ:"Fiji",FI:"Finland",FR:"France",
  GA:"Gabon",GM:"Gambia",GE:"Georgia",DE:"Germany",GH:"Ghana",GR:"Greece",GT:"Guatemala",GN:"Guinea",GW:"Guinea-Bissau",GY:"Guyana",
  HT:"Haiti",HN:"Honduras",HU:"Hungary",
  IS:"Iceland",IN:"India",ID:"Indonesia",IR:"Iran",IQ:"Iraq",IE:"Ireland",IL:"Israel",IT:"Italy",
  JM:"Jamaica",JP:"Japan",JO:"Jordan",
  KZ:"Kazakhstan",KE:"Kenya",KW:"Kuwait",KG:"Kyrgyzstan",
  LA:"Laos",LV:"Latvia",LB:"Lebanon",LS:"Lesotho",LR:"Liberia",LY:"Libya",LT:"Lithuania",LU:"Luxembourg",
  MG:"Madagascar",MW:"Malawi",MY:"Malaysia",MV:"Maldives",ML:"Mali",MT:"Malta",MR:"Mauritania",MU:"Mauritius",MX:"Mexico",MD:"Moldova",MN:"Mongolia",ME:"Montenegro",MA:"Morocco",MZ:"Mozambique",MM:"Myanmar",
  NA:"Namibia",NP:"Nepal",NL:"Netherlands",NZ:"New Zealand",NI:"Nicaragua",NE:"Niger",NG:"Nigeria",MK:"North Macedonia",NO:"Norway",
  OM:"Oman",
  PK:"Pakistan",PA:"Panama",PG:"Papua New Guinea",PY:"Paraguay",PE:"Peru",PH:"Philippines",PL:"Poland",PT:"Portugal",
  QA:"Qatar",
  RO:"Romania",RU:"Russia",RW:"Rwanda",
  SA:"Saudi Arabia",SN:"Senegal",RS:"Serbia",SL:"Sierra Leone",SG:"Singapore",SK:"Slovakia",SI:"Slovenia",SO:"Somalia",ZA:"South Africa",SS:"South Sudan",ES:"Spain",LK:"Sri Lanka",SD:"Sudan",SR:"Suriname",SE:"Sweden",CH:"Switzerland",SY:"Syria",
  TW:"Taiwan",TJ:"Tajikistan",TZ:"Tanzania",TH:"Thailand",TL:"Timor-Leste",TG:"Togo",TT:"Trinidad & Tobago",TN:"Tunisia",TR:"Turkey",TM:"Turkmenistan",
  UG:"Uganda",UA:"Ukraine",AE:"UAE",GB:"United Kingdom",US:"United States",UY:"Uruguay",UZ:"Uzbekistan",
  VE:"Venezuela",VN:"Vietnam",
  YE:"Yemen",
  ZM:"Zambia",ZW:"Zimbabwe"
};

function BuilderNationsSheet({ isOpen, onClose, leaders }: { isOpen: boolean; onClose: () => void; leaders: any[] }) {
  const dragControls = useDragControls();

  // Derive unique nations — use static COUNTRY_NAMES map for instant name resolution
  const nations = Array.from(
    new Map(
      leaders
        .filter((u: any) => u.country_flag && u.country_flag !== "🏳️" && u.country_code)
        .map((u: any) => {
          const code = u.country_code?.toUpperCase() || "";
          return [
            code,
            {
              flag: u.country_flag,
              code,
              name: COUNTRY_NAMES[code] || code,
            },
          ];
        })
    ).values()
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — above nav */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[998] bg-app-bg/60 backdrop-blur-sm"
          />

          {/* Sheet — above nav */}
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
            className="fixed bottom-0 left-0 right-0 z-[999] bg-app-card border-t border-app-border rounded-t-[2.5rem] flex flex-col max-h-[70vh] shadow-app-shadow"
          >
            {/* Drag Handle */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing touch-none"
            >
              <div className="w-12 h-1.5 bg-app-border/50 rounded-full" />
            </div>

            <div className="px-8 pb-4">
              <h3 className="text-app-accent text-sm font-black uppercase tracking-[0.2em] mb-1">
                Builder Nations
              </h3>
              <p className="text-text-sub text-[10px] font-bold uppercase tracking-widest">
                Where Network Builders Are From
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-20 custom-scrollbar">
              <div className="grid grid-cols-2 gap-3 pb-6">
                {nations.length === 0 ? (
                  <p className="col-span-2 text-center text-text-sub/50 text-[10px] font-black uppercase tracking-widest py-8">No data</p>
                ) : (
                  nations.map((n: any) => (
                    <div
                      key={n.code}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-app-accent/5 border border-app-border hover:border-app-accent/30 transition-colors group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{n.flag}</span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-text-main truncate uppercase tracking-tighter">{n.name}</p>
                        <p className="text-[9px] font-bold text-text-sub uppercase tracking-widest">{n.code}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// [CODE: JOIN_THE_BOARD_MODAL]
function JoinTheBoardModal({ isOpen, onClose, onGetRefLink }: {
  isOpen: boolean;
  onClose: () => void;
  onGetRefLink: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[200] bg-app-bg/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal card */}
          <motion.div
            className="fixed inset-0 z-[201] flex items-center justify-center p-6 pointer-events-none"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="w-full max-w-sm bg-app-card border border-app-border rounded-[2.5rem] overflow-hidden shadow-app-shadow pointer-events-auto relative">
              {/* Ambient glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--accent-glow)_0%,_transparent_70%)] pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div>
                  <h2 className="text-text-main font-black text-lg uppercase tracking-tight">How to Rank</h2>
                  <p className="text-text-sub text-[10px] font-bold uppercase tracking-widest leading-none mt-1">Network Builders Board</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl bg-app-accent/5 text-text-sub hover:text-app-accent transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-app-border" />

              {/* Steps */}
              <div className="px-6 py-5 space-y-4">
                {[
                  { n: "01", text: "Share your referral link and onboard humans to your network" },
                  { n: "02", text: "Each person who connects their TON wallet & activates their first presence counts as your Network" },
                  { n: "03", text: "Verified Humans in your network count 3× — quality over quantity" }
                ].map((step) => (
                  <div key={step.n} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-xl bg-app-accent/10 border border-app-border flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[9px] font-black text-app-accent">{step.n}</span>
                    </div>
                    <p className="text-[11px] text-text-sub font-medium leading-relaxed flex-1">{step.text}</p>
                  </div>
                ))}
              </div>

              {/* CTA button */}
              <div className="px-6 pb-7">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onGetRefLink}
                  className="w-full h-14 rounded-2xl bg-app-accent text-black font-black uppercase text-xs tracking-widest shadow-app-shadow hover:bg-app-accent/80 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Link2 size={15} />
                  Get Referral Link
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
