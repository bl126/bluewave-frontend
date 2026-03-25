"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  Bell, 
  Trophy, 
  MoreHorizontal, 
  Eye, 
  CheckCircle2, 
  User, 
  ShieldCheck,
  ChevronLeft,
  Rocket
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi, postApi } from "@/lib/useApi";
import Leaderboard from "./Leaderboard"; // Re-using existing leaderboard

interface ExploreProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
}

const ADMIN_IDS = [5023869471]; // Primary Admin (User)

export default function Explore({ isOpen, onClose, telegramUser }: ExploreProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Fetch Notifications
  const { data: notifications, mutate: mutateNotifications } = useApi(
    isOpen && telegramUser?.id ? `/explore/notifications/${telegramUser.id}` : null
  );

  const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;

  // Fetch Feed Data
  const { data: posts, loading, mutate } = useApi(
    isOpen && telegramUser?.id ? `/explore/feed?tg_id=${telegramUser.id}&tab=${activeTab}` : null
  );

  if (!isOpen) return null;

  const isAdmin = telegramUser?.id ? ADMIN_IDS.includes(Number(telegramUser.id)) : false;

  if (!isAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] bg-black flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="absolute inset-0 bg-cyan-500/5 blur-[100px] pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <div className="w-24 h-24 bg-cyan-500/10 rounded-3xl flex items-center justify-center mx-auto border border-cyan-500/20 shadow-[0_0_30px_rgba(0,230,255,0.1)]">
             <Rocket className="text-cyan-400" size={40} />
          </div>
          <div className="space-y-2">
             <h2 className="text-3xl font-black text-white uppercase tracking-tight">Explore Feed</h2>
             <p className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.2em]">Beta Phase • Coming Soon</p>
          </div>
          <p className="text-xs text-white/30 max-w-[260px] leading-relaxed mx-auto italic">
             "The social distribution layer is currently being calibrated across the global node network. Access is restricted to primary administrators during this epoch."
          </p>
          <button 
            onClick={onClose}
            className="mt-8 h-14 w-40 bg-white/5 border border-white/10 rounded-2xl text-white/50 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all active:scale-95"
          >
            Back
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="fixed inset-0 z-[120] bg-black flex flex-col overflow-hidden text-cyan-200"
      style={{ 
        paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 60px)", 
        paddingBottom: "env(safe-area-inset-bottom, 0px)" 
      }}
    >
      {/* 🌊 Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-cyan-500/5 blur-[100px] pointer-events-none" />

      {/* 🔝 Top Navigation & Dropdown */}
      <div className="relative px-6 flex items-center justify-between mb-6 z-20">
        <div className="flex gap-6 border-b border-white/5 pb-2">
          {(["foryou", "following"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-2 text-sm font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? "text-white" : "text-white/30"
              }`}
            >
              {tab === "foryou" ? "For You" : "Following"}
              {activeTab === tab && (
                <motion.div 
                  layoutId="exploreTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 shadow-[0_0_10px_#00e6ff]"
                />
              )}
            </button>
          ))}
        </div>

        {/* Dropdown Menu */}
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="relative p-2 bg-white/5 rounded-full border border-white/10 text-white/50 hover:text-white transition-all active:scale-95"
          >
            <ChevronDown size={18} className={`transition-transform duration-300 ${isMenuOpen ? "rotate-180" : ""}`} />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-black text-[9px] font-black rounded-full flex items-center justify-center border border-black shadow-[0_0_10px_#00e6ff]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </div>
            )}
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-48 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsNotificationsOpen(true);
                    // Clear notifications on open
                    postApi("/explore/notifications/clear", { tg_id: telegramUser.id }).then(() => mutateNotifications());
                  }}
                  className="w-full flex items-center justify-between px-4 py-4 text-xs font-bold text-white/70 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all border-b border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Bell size={16} /> Notifications
                  </div>
                  {unreadCount > 0 && (
                    <span className="w-4 h-4 bg-cyan-500 text-black text-[8px] font-black rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsLeaderboardOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 text-xs font-bold text-white/70 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all"
                >
                  <Trophy size={16} /> Leaderboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 📜 Feed Container */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 custom-scrollbar space-y-4">
        {loading && !posts && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
            <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest">Hydrating Feed...</span>
          </div>
        )}

        {posts?.map((post: any) => (
          <PostCard 
            key={post.id} 
            post={post} 
            onChannelClick={() => setSelectedChannelId(post.tg_id)}
            onHide={() => mutate()} // Refresh on hide
          />
        ))}

        {!loading && posts?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 opacity-40">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl">🕳️</div>
            <div className="space-y-1">
              <p className="font-black uppercase tracking-widest text-xs">No signals yet</p>
              <p className="text-[10px] text-white/50 max-w-[200px]">The distribution feed is currently empty. Connect your channel to start broadcasting.</p>
            </div>
          </div>
        )}
      </div>

      {/* 🏆 Leaderboard Overlay (Nested) */}
      {isLeaderboardOpen && (
        <Leaderboard 
          isOpen={isLeaderboardOpen} 
          onClose={() => setIsLeaderboardOpen(false)} 
          telegramUser={telegramUser} 
        />
      )}

      {/* 👤 Channel Profile Popup */}
      <AnimatePresence>
        {selectedChannelId && (
          <ChannelPopup 
            tgId={selectedChannelId} 
            myId={telegramUser?.id}
            onClose={() => setSelectedChannelId(null)} 
          />
        )}
      </AnimatePresence>

      {/* 🔔 Notifications Popup */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <NotificationsPopup 
            isOpen={isNotificationsOpen}
            notifications={notifications || []}
            onClose={() => setIsNotificationsOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ----------------------------------------------------------------------------
// 📬 Post Card Component
// ----------------------------------------------------------------------------
function PostCard({ post, onChannelClick, onHide }: { post: any, onChannelClick: () => void, onHide: () => void }) {
  const [isAcknowledged, setIsAcknowledged] = useState(post.is_acknowledged);
  const [showSpaceDust, setShowSpaceDust] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleAcknowledge = async () => {
    if (isAcknowledged) return;
    setShowSpaceDust(true);
    setTimeout(() => setShowSpaceDust(false), 1500);
    setIsAcknowledged(true);
    await postApi("/explore/acknowledge", { user_id: post.tg_id, post_id: post.id });
  };

  const handleHide = async () => {
    setIsMenuOpen(false);
    await postApi("/explore/hide_post", { user_id: post.tg_id, post_id: post.id });
    onHide();
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-4 flex flex-col gap-4 relative overflow-hidden group hover:bg-white/[0.05] transition-all">
      {/* Space Dust Animation Overlay */}
      <AnimatePresence>
        {showSpaceDust && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
          >
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, scale: 1 }}
                animate={{ 
                  x: (Math.random() - 0.5) * 200, 
                  y: (Math.random() - 0.5) * 200, 
                  scale: 0,
                  rotate: Math.random() * 360
                }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        {/* Avatar */}
        <button onClick={onChannelClick} className="shrink-0">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-black shadow-lg">
            {post.channel.photo ? (
              <img src={post.channel.photo} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-cyan-500 bg-cyan-500/10 font-black">
                {post.channel.title[0]}
              </div>
            )}
          </div>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <button onClick={onChannelClick} className="flex flex-col items-start truncate overflow-hidden">
                <div className="flex items-center gap-1 max-w-full">
                    <span className="text-white font-black text-sm truncate uppercase tracking-tight">{post.channel.title}</span>
                    <CheckCircle2 size={14} className="text-cyan-400 shrink-0" />
                </div>
                <span className="text-[10px] text-white/30 font-mono truncate">BW_ID: {post.tg_id}</span>
            </button>
            
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30 font-bold uppercase">{timeAgo(post.created_at)}</span>
                <div className="relative">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-1 text-white/20 hover:text-white transition-colors"
                    >
                        <MoreHorizontal size={18} />
                    </button>
                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, x: 10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95, x: 10 }}
                                className="absolute right-0 top-8 w-40 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl z-30 shadow-2xl"
                            >
                                <button 
                                    onClick={handleHide}
                                    className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-orange-400/80 hover:bg-orange-500/10"
                                >
                                    Not interested
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
          </div>

          <p className="text-sm text-cyan-200/90 leading-relaxed break-words py-1">
            {post.content}
          </p>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <button 
                onClick={handleAcknowledge}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                    isAcknowledged 
                    ? "bg-cyan-500 text-black shadow-[0_0_15px_#00e6ff80]" 
                    : "bg-white/5 text-cyan-500 hover:bg-white/10"
                }`}
            >
                {isAcknowledged ? "Acknowledged" : "Acknowledge"}
            </button>

            <div className="flex items-center gap-1.5 opacity-30">
                <Eye size={12} />
                <span className="text-[10px] font-mono font-bold">{post.views || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 👥 Channel Profile Popup
// ----------------------------------------------------------------------------
function ChannelPopup({ tgId, myId, onClose }: { tgId: number, myId: number, onClose: () => void }) {
  const { data: info, loading } = useApi(`/explore/channel/${tgId}?current_user_id=${myId}`);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (info) setFollowing(info.is_following);
  }, [info]);

  const handleFollow = async () => {
    setFollowing(!following);
    await postApi("/user/follow", { follower_id: myId, followed_id: tgId });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-end justify-center px-4 pb-10"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-[0_-10px_50px_rgba(0,0,0,0.8)]"
        onClick={e => e.stopPropagation()}
      >
        {loading ? (
             <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : info && (
            <>
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-cyan-500 shadow-[0_0_30px_#00e6ff40]">
                        <img src={info.channel.photo || info.photo} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">{info.channel.title}</h2>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-[10px] font-black tracking-widest uppercase">
                            @{info.channel.handle || "verified_human"}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-white/5 rounded-2xl p-4">
                        <p className="text-xs text-white/50 leading-relaxed">
                            Certified human distribution channel broadcast by Bluewave protocol nodes. 
                            Signals verified across multiple epoch windows.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 p-4 border border-white/5 rounded-2xl bg-black/40">
                        <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5">
                            <img src={info.photo} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-white text-[10px] font-black truncate">{info.name}</span>
                                <ShieldCheck size={12} className="text-cyan-400" />
                            </div>
                            <span className="text-[10px] text-white/30 font-mono">ID: {info.bw_id}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button 
                        onClick={onClose}
                        className="flex-1 h-14 bg-white/5 rounded-2xl text-white/50 font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all"
                    >
                        Back
                    </button>
                    <button 
                        onClick={handleFollow}
                        className={`flex-[2] h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95 ${
                            following 
                            ? "bg-white/10 text-white border border-white/20" 
                            : "bg-cyan-500 text-black shadow-cyan-500/20"
                        }`}
                    >
                        {following ? "Unfollow" : "Follow Channel"}
                    </button>
                </div>
            </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ----------------------------------------------------------------------------
// 🔔 Notifications Popup (Level-Card Style)
// ----------------------------------------------------------------------------
function NotificationsPopup({ isOpen, notifications, onClose }: { isOpen: boolean, notifications: any[], onClose: () => void }) {
  const getIcon = (type: string) => {
    switch (type) {
      case "post_uploaded": return <Rocket size={20} className="text-cyan-400" />;
      case "acknowledged": return <ShieldCheck size={20} className="text-cyan-400" />;
      default: return <Bell size={20} className="text-cyan-400" />;
    }
  };

  const getTitle = (n: any) => {
    if (n.type === "post_uploaded") return "Distribution Success";
    if (n.type === "acknowledged") return "New Acknowledgment";
    return "Notification";
  };

  const getMessage = (n: any) => {
    if (n.type === "post_uploaded") return "Your channel post has been successfully broadcast to the Bluewave network.";
    if (n.type === "acknowledged") return `${n.from_user?.name || "A verified human"} has acknowledged your latest signal.`;
    return "You have a new update.";
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center px-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-sm bg-gradient-to-b from-cyan-950/40 to-black border border-cyan-500/20 rounded-[2.5rem] p-8 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-cyan-500/20 blur-[60px] pointer-events-none" />
        
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,230,255,0.1)]">
              <Bell size={32} className="text-cyan-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Recent Activity</h2>
              <p className="text-[10px] text-cyan-400/60 font-black uppercase tracking-[0.2em]">Verified Human Feed</p>
            </div>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-10 text-center opacity-30">
                <p className="text-xs font-bold uppercase tracking-widest">No recent alerts</p>
              </div>
            ) : notifications.map((n: any) => (
              <div key={n.id} className="flex gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl group hover:bg-white/[0.05] transition-all">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-tight text-white">{getTitle(n)}</p>
                  <p className="text-[10px] leading-relaxed text-white/50">{getMessage(n)}</p>
                  <p className="text-[8px] text-white/20 font-mono mt-1">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={onClose}
            className="w-full h-14 bg-cyan-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-[0_0_20px_rgba(0,230,255,1)] hover:scale-[1.02] active:scale-95 transition-all"
          >
            Acknowledge
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
