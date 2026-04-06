"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Bell,
  BarChart2,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Heart,
  Repeat2,
  CheckCircle2,
  ShieldCheck,
  Rocket,
  Plus,
  X,
  Image,
  Video,
  Send,
  UserCheck,
  MessageCircle,
  Share2
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi, postApi, getApi, useSync } from "@/lib/useApi";
import Leaderboard from "./Leaderboard";

const ADMIN_IDS = [5023869471];
const BETA_TESTER_IDS: number[] = [
  8531164706,
  2008138868,
  769579042,
  5511825370,
  1504247376
];

interface ExploreProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
}

export default function Explore({ isOpen, onClose, telegramUser }: ExploreProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"foryou" | "following" | "leaderboard" | "notifications">("foryou");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [isLeaderboardSheetOpen, setIsLeaderboardSheetOpen] = useState(false);
  const [latestKnownPostId, setLatestKnownPostId] = useState<number | string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);

  // Pagination State
  const [offset, setOffset] = useState(0);
  const [pagedPosts, setPagedPosts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const feedTopRef = useRef<HTMLDivElement>(null);

  // Scroll hide/show state
  const [showChrome, setShowChrome] = useState(true);
  const lastScrollY = useRef(0);

  // Touch/Swipe
  const touchStart = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // New posts pill
  const [newPostsAvailable, setNewPostsAvailable] = useState(false);

  // Status Popups & Background Action
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPostingBackground, setIsPostingBackground] = useState(false);
  const [connectPrompt, setConnectPrompt] = useState(false);

  // Fetch Current User (for channel connection status)
  const { data: swrUser } = useApi(telegramUser?.id ? `/user/${telegramUser.id}` : null);
  const isConnected = !!swrUser?.telegram_channel;

  // Fetch Notifications (pre-load on mount)
  const { data: notifications, mutate: mutateNotifications } = useApi(
    telegramUser?.id ? `/explore/notifications/${telegramUser.id}` : null
  );
  const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;

  // Fetch Feed — all tabs pre-loaded on mount for instant switching
  const { data: initialPosts, loading, mutate } = useApi(
    telegramUser?.id ? `/explore/feed?tg_id=${telegramUser.id}&tab=${activeTab}&offset=0` : null
  );

  // Pre-warm following tab
  useApi(telegramUser?.id ? `/explore/feed?tg_id=${telegramUser.id}&tab=following&offset=0` : null);

  // Fetch Live Users globally
  const { data: liveUsers } = useApi(isOpen ? "/explore/live_users" : null, { refreshInterval: 60000 });

  // Track latest post ID for new-posts pill
  useEffect(() => {
    if (initialPosts && initialPosts.length > 0) {
      const topId = initialPosts[0]?.id;
      if (!latestKnownPostId) {
        setLatestKnownPostId(topId);
      } else if (topId !== latestKnownPostId) {
        setNewPostsAvailable(true);
      }
    }
  }, [initialPosts, latestKnownPostId]);

  // Help Sync pagedPosts with initialPosts on tab change or refresh
  useEffect(() => {
    if (initialPosts) {
      setPagedPosts(initialPosts);
      setOffset(initialPosts.length);
      setHasMore(initialPosts.length >= 10);
    }
  }, [initialPosts]);

  // 🔄 Consolidated Synchronization (Heartbeat)
  // Instead of multiple separate polls, we use the global sync cache.
  const { data: syncData } = useSync(telegramUser?.id || null);

  useEffect(() => {
    const handleNativeBack = (e: Event) => {
      if (!isOpen) return;
      if (isSpeedDialOpen) {
        setIsSpeedDialOpen(false);
        e.preventDefault();
        return;
      }
      if (selectedPost) {
        setSelectedPost(null);
        setSelectedCommentId(null);
        e.preventDefault();
        return;
      }
      if (isPostModalOpen) {
        setIsPostModalOpen(false);
        e.preventDefault();
        return;
      }
      if (isLiveModalOpen) {
        setIsLiveModalOpen(false);
        e.preventDefault();
        return;
      }
    };

    window.addEventListener("bwNativeBack", handleNativeBack);
    return () => window.removeEventListener("bwNativeBack", handleNativeBack);
  }, [isOpen, selectedPost, isPostModalOpen, isLiveModalOpen, isSpeedDialOpen]);

  useEffect(() => {
    if (!syncData || syncData.error || !isOpen) return;

    // Check for new posts using latest_post_id from syncData
    if (syncData.latest_post_id && latestKnownPostId && syncData.latest_post_id !== latestKnownPostId) {
      if (activeTab !== "leaderboard" && activeTab !== "notifications") {
        setNewPostsAvailable(true);
      }
    }

    // If notifications were cleared globally or count changed, refresh the list
    // (Optional: for even less traffic, only mutate if count > notification length)
  }, [syncData, latestKnownPostId, activeTab, isOpen]);

  // Scroll handler — fast hide/show
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const currentY = scrollContainerRef.current.scrollTop;
    if (Math.abs(currentY - lastScrollY.current) < 6) return;
    const goingDown = currentY > lastScrollY.current && currentY > 40;
    setShowChrome(!goingDown);
    window.dispatchEvent(new CustomEvent("scrollDirectionChanged", { detail: goingDown ? "down" : "up" }));
    lastScrollY.current = currentY;
  }, []);

  // Swipe tab switch & Pull to refresh
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current !== null && scrollContainerRef.current?.scrollTop === 0) {
      const diffY = e.targetTouches[0].clientY - touchStartY.current;
      if (diffY > 0 && diffY < 150) {
        setPullY(diffY * 0.6);
      }
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    // Horizontal swipe logic
    if (touchStart.current !== null) {
      const diff = touchStart.current - e.changedTouches[0].clientX;
      const tabs: ("foryou" | "following" | "leaderboard" | "notifications")[] = ["foryou", "following", "leaderboard", "notifications"];
      const currentIndex = tabs.indexOf(activeTab);

      if (Math.abs(diff) > 80 && Math.abs(diff) > pullY) {
        if (diff > 0 && currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1]);
        else if (diff < 0 && currentIndex > 0) setActiveTab(tabs[currentIndex - 1]);
      }
    }

    // Pull to refresh logic
    if (pullY > 50 && !isRefreshing) {
      setIsRefreshing(true);
      mutate().then(() => {
        setIsRefreshing(false);
        setPullY(0);
      });
    } else {
      setPullY(0);
    }

    touchStart.current = null;
    touchStartY.current = null;
  };

  // Scroll to top + refresh
  const handleNewPostsPill = () => {
    setActiveTab("foryou");
    setNewPostsAvailable(false);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    mutate();
    if (initialPosts && initialPosts.length > 0) setLatestKnownPostId(initialPosts[0]?.id);
  };

  // Handle tab switch
  const handleTabClick = (tab: "foryou" | "following" | "leaderboard" | "notifications") => {
    setActiveTab(tab);
    if (tab === "notifications" && telegramUser?.id) {
      postApi("/explore/notifications/clear", { tg_id: telegramUser.id }).then(() => mutateNotifications());
    }
  };

  if (!isOpen) return null;

  const hasAccess = telegramUser?.id ?
    (ADMIN_IDS.includes(Number(telegramUser.id)) || BETA_TESTER_IDS.includes(Number(telegramUser.id)))
    : false;

  if (!hasAccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] bg-black flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="absolute inset-0 bg-cyan-500/5 blur-[100px] pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <div className="w-24 h-24 bg-cyan-500/10 rounded-3xl flex items-center justify-center mx-auto border border-cyan-500/20 shadow-[0_0_30px_rgba(0,230,255,0.1)]">
            <Rocket className="text-cyan-400" size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">{t("explore.title")}</h2>
            <p className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.2em]">{t("explore.beta_phase")}</p>
          </div>
          <p className="text-xs text-white/30 max-w-[260px] leading-relaxed mx-auto italic">
            "{t("explore.beta_desc")}"
          </p>
          <button
            onClick={onClose}
            className="mt-8 h-14 w-40 bg-white/5 border border-white/10 rounded-2xl text-white/50 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all active:scale-95"
          >
            {t("common.back")}
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
      className={`fixed inset-0 bg-black flex flex-col overflow-hidden text-cyan-200 ${(isPostModalOpen || isLeaderboardSheetOpen) ? "z-[300]" : "z-[120]"}`}
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 60px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)"
      }}
    >
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-cyan-500/5 blur-[100px] pointer-events-none" />

      {/* ─── Tab Bar (fixed, solid, no floating) ─── */}
      <motion.div
        animate={{ y: showChrome ? 0 : -80, opacity: showChrome ? 1 : 0 }}
        transition={{ duration: 0.12, ease: "easeInOut" }}
        className="fixed top-20 left-0 right-0 z-[130] bg-black border-b border-white/10 pointer-events-auto"
      >
        <div className="flex items-center justify-between px-6 pt-2 w-full">
          {(["foryou", "following", "leaderboard", "notifications"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`relative pb-3 flex items-center justify-center transition-all ${activeTab === tab ? "text-cyan-400" : "text-white/30"}`}
            >
              {tab === "foryou" && <span className="text-[10px] font-black uppercase tracking-widest">{t("explore.tabs.foryou")}</span>}
              {tab === "following" && <span className="text-[10px] font-black uppercase tracking-widest">{t("explore.tabs.following")}</span>}
              {tab === "notifications" && (
                <div className="relative">
                  <Bell size={18} className={activeTab === tab ? "text-cyan-400" : "text-white/60"} />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1.5 -right-2 w-3 h-3 bg-cyan-500 rounded-full flex items-center justify-center text-[7px] text-black font-black shadow-[0_0_8px_#00e6ff]">
                      {unreadCount > 9 ? "!" : unreadCount}
                    </div>
                  )}
                </div>
              )}
              {tab === "leaderboard" && <BarChart2 size={18} className={activeTab === tab ? "text-cyan-400" : "text-white/60"} />}

              {activeTab === tab && (
                <motion.div
                  layoutId="exploreTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 shadow-[0_0_8px_#00e6ff]"
                />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* New Posts Pill */}
      <AnimatePresence>
        {newPostsAvailable && activeTab !== "leaderboard" && activeTab !== "notifications" && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="fixed top-32 left-0 right-0 z-[140] flex justify-center pointer-events-none"
          >
            <button
              onClick={handleNewPostsPill}
              className="px-4 py-1.5 bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_12px_#00e6ff60] active:scale-95 transition-all flex items-center gap-1.5 pointer-events-auto"
            >
              {t("explore.new_posts_pill")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Posting Floating Loader */}
      <AnimatePresence>
        {isPostingBackground && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="fixed top-32 left-1/2 -translate-x-1/2 z-[135] bg-cyan-950/90 border border-cyan-500/30 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(0,230,255,0.2)] pointer-events-none"
          >
            <Loader2 size={12} className="text-cyan-400 animate-spin" />
            <span className="text-[9px] text-cyan-200 font-black uppercase tracking-widest">{t("explore.posting_btn") || "Transmitting"}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pull to Refresh Indicator */}
      <div
        className="absolute top-24 left-0 right-0 flex justify-center items-end overflow-hidden pointer-events-none z-[110]"
        style={{ height: `${Math.max(0, pullY)}px`, transition: pullY === 0 ? 'height 0.2s' : 'none' }}
      >
        <div className="mb-4">
          <Loader2 className={`text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullY * 2}deg)` }} size={24} />
        </div>
      </div>

      {/* ─── Main Content Area ─── */}
      <div ref={feedTopRef} />
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="flex-1 overflow-y-auto custom-scrollbar mt-6"
      >
        <AnimatePresence mode="wait">
          {activeTab === "notifications" ? (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-4 space-y-4"
            >
              <NotificationsView
                notifications={notifications || []}
                onClear={() => mutateNotifications()}
                currentUserId={telegramUser?.id}
                onPostClick={(postId, commentId) => {
                  setSelectedPost({ id: postId });
                  setSelectedCommentId(commentId || null);
                }}
              />
            </motion.div>
          ) : activeTab === "leaderboard" ? (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Leaderboard
                isOpen={true}
                onClose={() => setActiveTab("foryou")}
                telegramUser={telegramUser}
                isInline={true}
                onSheetOpenChange={setIsLeaderboardSheetOpen}
              />
            </motion.div>
          ) : (
            <motion.div
              key="feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="divide-y divide-white/[0.05]"
            >
              {(activeTab === "foryou" || activeTab === "following") && liveUsers && liveUsers.length > 0 && (
                <LiveNowTray liveUsers={liveUsers} />
              )}
              {loading && pagedPosts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-70">
                  <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t("explore.hydrating")}</span>
                </div>
              )}

              {pagedPosts?.map((post: any) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={telegramUser?.id}
                  isConnected={isConnected}
                  onHide={() => mutate()}
                  onRepost={() => mutate()}
                  onConnectRequired={() => {
                    setConnectPrompt(true);
                    setTimeout(() => setConnectPrompt(false), 3000);
                  }}
                  onCommentClick={() => setSelectedPost(post)}
                  onPostClick={() => setSelectedPost(post)}
                />
              ))}

              {/* Load More Trigger */}
              <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
                {loadingMore && !loading && <Loader2 className="animate-spin text-cyan-400/60" size={20} />}
                {!hasMore && pagedPosts.length > 0 && (
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{t("explore.no_more_signals") || "No more signals found"}</span>
                )}
              </div>

              {!loading && pagedPosts?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-2 opacity-80 px-6">
                  <div className="space-y-1">
                    <p className="font-black uppercase tracking-widest text-xs">
                      {activeTab === "following" ? t("explore.no_following") : t("explore.no_signals")}
                    </p>
                    <p className="text-[10px] text-white/60 max-w-[200px]">
                      {activeTab === "following" ? t("explore.no_following_desc") : t("explore.no_signals_desc")}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── FAB Post Button (Speed Dial) ─── */}
      <AnimatePresence>
        {isSpeedDialOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[180] bg-black/40 backdrop-blur-md"
            onClick={() => setIsSpeedDialOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChrome && activeTab !== "leaderboard" && (
          <div className="fixed right-5 bottom-28 z-[200] flex flex-col items-center gap-3">
            {/* Speed Dial Options */}
            <AnimatePresence>
              {isSpeedDialOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  className="flex flex-col items-center gap-3 mb-2"
                >
                  {/* Live Stream Option */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[7px] font-black uppercase text-red-400 bg-black/60 px-2 py-0.5 rounded-full border border-red-500/20 backdrop-blur-md">Live</span>
                    <button
                      onClick={() => {
                        setIsSpeedDialOpen(false);
                        setIsLiveModalOpen(true);
                      }}
                      className="w-10 h-10 bg-black border border-red-500/30 rounded-full flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] active:scale-95 transition-all"
                    >
                      <Video size={18} />
                    </button>
                  </div>

                  {/* Normal Post Option */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[7px] font-black uppercase text-cyan-400 bg-black/60 px-2 py-0.5 rounded-full border border-cyan-500/20 backdrop-blur-md">Post</span>
                    <button
                      onClick={() => {
                        setIsSpeedDialOpen(false);
                        if (swrUser && !isConnected) {
                          setConnectPrompt(true);
                          setTimeout(() => setConnectPrompt(false), 3000);
                        } else {
                          setIsPostModalOpen(true);
                        }
                      }}
                      className="w-10 h-10 bg-black border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,230,255,0.2)] active:scale-95 transition-all"
                    >
                      <Rocket size={18} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Toggle Button */}
            <motion.button
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 20 }}
              transition={{ duration: 0.12, ease: "easeInOut" }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
              className={`w-12 h-12 ${isSpeedDialOpen ? 'bg-white text-black' : (isConnected || !swrUser ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-gray-800 text-gray-500 shadow-none')} rounded-full flex items-center justify-center border-4 border-black/20 overflow-hidden group transition-all relative z-[210]`}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Plus size={22} strokeWidth={3} className={`transition-transform duration-300 ${isSpeedDialOpen ? 'rotate-45' : ''}`} />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Post Modal ─── */}
      <AnimatePresence>
        {isPostModalOpen && (
          <PostModal
            telegramUser={telegramUser}
            onClose={() => setIsPostModalOpen(false)}
            onPosted={(requestArgs) => {
              setIsPostModalOpen(false);
              
              // 🚀 [SPEED_BOOST] Optimistic UI: Prepend to the feed immediately while background posting
              const optimisticPost = {
                id: `temp-${Date.now()}`,
                tg_id: telegramUser.id,
                content: requestArgs.content,
                media_url: requestArgs.media_url,
                media_urls: requestArgs.media_url ? [{ url: requestArgs.media_url, type: requestArgs.media_type }] : [],
                media_type: requestArgs.media_type,
                views: 0,
                acknowledgments_count: 0,
                reposts_count: 0,
                comments_count: 0,
                created_at: new Date().toISOString(),
                is_acknowledged: false,
                is_reposted: false,
                is_following: true,
                channel: {
                  title: swrUser?.telegram_channel_title || "My Channel",
                  photo: swrUser?.telegram_channel_photo,
                  handle: swrUser?.telegram_channel
                },
                user: {
                  name: swrUser?.name || swrUser?.first_name || "Me",
                  photo: swrUser?.photo_url,
                  country: "",
                  is_live_on_telegram: false
                }
              };
              setPagedPosts(prev => [optimisticPost, ...prev]);

              setIsPostingBackground(true);
              postApi("/explore/post", requestArgs).then((res) => {
                if (res?.success) {
                  mutate(); // Refresh the list from the real source
                  setSuccessMessage(t("explore.post_success_popup"));
                  setTimeout(() => setSuccessMessage(null), 3000);
                }
              }).catch(() => { }).finally(() => setIsPostingBackground(false));
            }}
          />
        )}
      </AnimatePresence>

      {/* ─── Detail Modal (X-style thread) ─── */}
      <AnimatePresence>
        {selectedPost && (
          <PostDetailModal
            post={selectedPost}
            commentId={selectedCommentId}
            telegramUser={telegramUser}
            onClose={() => {
              setSelectedPost(null);
              setSelectedCommentId(null);
            }}
            onRefresh={() => mutate()}
          />
        )}
      </AnimatePresence>

      {/* ─── Schedule Live Modal ─── */}
      <AnimatePresence>
        {isLiveModalOpen && (
          <ScheduleLiveModal
            telegramUser={telegramUser}
            connectedChannel={swrUser?.telegram_channel}
            channelId={swrUser?.telegram_channel_id}
            onClose={() => setIsLiveModalOpen(false)}
            onScheduled={(live: any) => {
              setIsLiveModalOpen(false);
              setSuccessMessage(t("explore.live_scheduled_popup") || "Live stream scheduled!");
              setTimeout(() => setSuccessMessage(null), 3000);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-cyan-500 text-black px-4 py-2 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(0,230,255,0.4)] border border-white/20"
          >
            <div className="w-5 h-5 bg-black/10 rounded-full flex items-center justify-center">
              <Rocket size={12} className="animate-pulse" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Connect Prompt Popup ─── */}
      <AnimatePresence>
        {connectPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-cyan-950/90 backdrop-blur-md text-cyan-200 px-4 py-3 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,230,255,0.2)] border border-cyan-500/30 rounded-[16px] w-[85%] max-w-[320px]"
          >
            <div className="w-6 h-6 bg-cyan-500/10 rounded-full flex items-center justify-center shrink-0 border border-cyan-500/20">
              <span className="text-[10px]">🔒</span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.1em] leading-snug">{t("explore.connect_prompt")}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div >
  );
}

// ----------------------------------------------------------------------------
// 📤 Post Modal (X-style)
// ----------------------------------------------------------------------------
function PostModal({ telegramUser, onClose, onPosted }: { telegramUser: any, onClose: () => void, onPosted: (args: any) => void }) {
  const { t } = useLanguage();
  const [content, setContent] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaBase64, setMediaBase64] = useState<string>("");
  const [mediaType, setMediaType] = useState<"photo" | "video" | "text">("text");
  const [mediaExt, setMediaExt] = useState("jpg");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    setMediaType(isVideo ? "video" : "photo");
    setMediaExt(file.name.split(".").pop() || (isVideo ? "mp4" : "jpg"));
    setMediaFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setMediaPreview(dataUrl);
      setMediaBase64(dataUrl.split(",")[1] || "");
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!content.trim() && !mediaFile && !mediaBase64) return;
    setPosting(true);
    setError(null);
    try {
      let finalMediaUrl = "";

      if (mediaFile) {
        // 🔒 [SECURITY] Use postApi so the x-telegram-init-data auth header is sent
        const urlData = await postApi(`/explore/get_upload_url`, { tg_id: telegramUser.id, media_ext: mediaExt });
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

        if (urlData.signed_url) {
          const putRes = await fetch(urlData.signed_url, {
            method: "PUT",
            headers: {
              "Authorization": `Bearer ${urlData.token}`,
              "Content-Type": mediaFile.type
            },
            body: mediaFile
          });

          if (putRes.ok) {
            finalMediaUrl = urlData.public_url;
          } else {
            console.error("Direct upload failed, code:", putRes.status);
          }
        }
      }

      onPosted({
        tg_id: telegramUser.id,
        content: content.trim(),
        media_url: finalMediaUrl,
        media_base64: finalMediaUrl ? "" : mediaBase64,
        media_type: (finalMediaUrl || mediaBase64) ? mediaType : "text",
        media_ext: mediaExt,
      });
    } catch (err: any) {
      console.error(err);
      setError("Upload failed.");
      setPosting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-[2.5rem] p-6 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/90">{t("explore.new_post_title")}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-white/30 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Text Area */}
        <textarea
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={250}
          placeholder={t("explore.post_placeholder")}
          className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm text-white placeholder-white/10 resize-none outline-none focus:border-cyan-500/30 transition-all min-h-[140px] shadow-inner"
        />
        <div className="text-right text-[8px] text-white/20 font-mono tracking-widest">{content.length}/250</div>

        {/* Media Preview */}
        {mediaPreview && (
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/30 group">
            {mediaType === "photo" ? (
              <img src={mediaPreview} className="w-full max-h-[180px] object-contain" />
            ) : (
              <video src={mediaPreview} className="w-full max-h-[180px]" controls playsInline />
            )}
            <button
              onClick={() => { setMediaPreview(null); setMediaBase64(""); setMediaFile(null); setMediaType("text"); }}
              className="absolute top-2 right-2 w-7 h-7 bg-black/80 border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {error && <p className="text-[10px] text-orange-400 font-bold uppercase tracking-tight text-center">{error}</p>}

        {/* Bottom Row */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <button
              onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = "image/*"; fileInputRef.current.click(); } }}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/20 transition-all"
            >
              <Image size={18} />
            </button>
            <button
              onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = "video/*"; fileInputRef.current.click(); } }}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/20 transition-all"
            >
              <Video size={18} />
            </button>
          </div>
          <button
            onClick={handlePost}
            disabled={posting || (!content.trim() && !mediaBase64)}
            className="flex items-center gap-2 px-6 h-12 bg-cyan-500 text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 transition-all disabled:opacity-30 disabled:shadow-none"
          >
            {posting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {posting ? t("explore.posting_btn") : t("explore.post_btn")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ----------------------------------------------------------------------------
// 🖼️ Media Collage Component
// ----------------------------------------------------------------------------
function MediaCollage({ items }: { items: { url: string, type: string }[] }) {
  if (!items || items.length === 0) return null;
  const validItems = items.filter(item => item.url);
  const count = validItems.length;
  if (count === 0) return null;

  if (count === 1) {
    const item = validItems[0];
    return (
      <div className="mb-4 rounded-2xl overflow-hidden border border-white/5 bg-black/20 shadow-inner">
        {item.type === "photo" ? (
          <img src={item.url} alt="signal" className="w-full h-auto max-h-[400px] object-contain" loading="lazy" />
        ) : (
          <AutoPlayVideo src={item.url} />
        )}
      </div>
    );
  }
  if (count === 2) {
    return (
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl overflow-hidden border border-white/5 h-[280px]">
        {validItems.map((item, i) => (
          <div key={i} className="relative w-full h-full overflow-hidden">
            {item.type === "photo" ? <img src={item.url} className="w-full h-full object-cover" /> : <AutoPlayVideo src={item.url} />}
          </div>
        ))}
      </div>
    );
  }
  if (count === 3) {
    return (
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl overflow-hidden border border-white/5 h-[300px]">
        <div className="h-full border-r border-white/5">
          {validItems[0].type === "photo"
            ? <img src={validItems[0].url} className="w-full h-full object-cover" />
            : <AutoPlayVideo src={validItems[0].url} />}
        </div>
        <div className="grid grid-rows-2 gap-1 h-full">
          <div className="h-full">
            {validItems[1].type === "photo"
              ? <img src={validItems[1].url} className="w-full h-full object-cover" />
              : <AutoPlayVideo src={validItems[1].url} />}
          </div>
          <div className="h-full">
            {validItems[2].type === "photo"
              ? <img src={validItems[2].url} className="w-full h-full object-cover" />
              : <AutoPlayVideo src={validItems[2].url} />}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="mb-4 grid grid-cols-2 grid-rows-2 gap-1 rounded-2xl overflow-hidden border border-white/5 h-[300px]">
      {validItems.slice(0, 4).map((item, i) => (
        <div key={i} className="relative w-full h-full overflow-hidden">
          {item.type === "photo" ? <img src={item.url} className="w-full h-full object-cover" /> : <AutoPlayVideo src={item.url} />}
          {i === 3 && count > 4 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-black text-xl">+{count - 4}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------------
// 📬 Post Card Component
// ----------------------------------------------------------------------------
function PostCard({
  post,
  currentUserId,
  isConnected,
  onHide,
  onRepost,
  onConnectRequired,
  onCommentClick,
  onPostClick
}: {
  post: any,
  currentUserId: number,
  isConnected: boolean,
  onHide: () => void,
  onRepost: () => void,
  onConnectRequired: () => void,
  onCommentClick: () => void,
  onPostClick: () => void
}) {
  const { t } = useLanguage();
  const [isAcknowledged, setIsAcknowledged] = useState(post.is_acknowledged);
  const [localAckCount, setLocalAckCount] = useState(post.acknowledgments_count || 0);
  const [isReposted, setIsReposted] = useState(post.is_reposted);

  // Sync local count if post data updates from background revalidation
  useEffect(() => {
    setLocalAckCount(post.acknowledgments_count || 0);
  }, [post.acknowledgments_count]);
  const [isReposting, setIsReposting] = useState(false);
  const [showSpaceDust, setShowSpaceDust] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const rowMenuRef = useRef<HTMLDivElement>(null);
  const ackBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rowMenuRef.current && !rowMenuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    };
    if (isMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleAcknowledge = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAcknowledged) return;
    setShowSpaceDust(true);
    setTimeout(() => setShowSpaceDust(false), 1500);
    setIsAcknowledged(true);
    setLocalAckCount((prev: number) => prev + 1); // 🚀 [SPEED_BOOST] Instant count update
    await postApi("/explore/acknowledge", { user_id: currentUserId, post_id: post.id });
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReposting || isReposted) return;
    setIsReposting(true);
    try {
      const res = await postApi("/explore/repost", { user_id: currentUserId, post_id: post.id });
      if (res.error === "NO_CHANNEL_CONNECTED") {
        onConnectRequired();
        return;
      }
      if (res.success) {
        setIsReposted(true);
        onRepost(); // Refresh feed to show the new repost
      }
    } catch (err) {
      console.error("Repost failed", err);
    } finally {
      setIsReposting(false);
    }
  };

  const handleHide = async () => {
    setIsMenuOpen(false);
    await postApi("/explore/hide_post", { user_id: currentUserId, post_id: post.id });
    onHide();
  };

  // Direct link to Telegram channel
  const openChannel = () => {
    // If live, prioritized joining the live video chat directly
    if (post.user?.is_live_on_telegram && post.user?.telegram_channel) {
      const handle = post.user.telegram_channel.replace(/^@/, "");
      // Telegram Video Chat URL is usually join?video_chat=... but using chat link is safer for mobile redirect
      const link = `https://t.me/${handle}`;
      const twa = (window as any).Telegram?.WebApp;
      if (twa?.openTelegramLink) {
        twa.openTelegramLink(link);
      } else {
        window.open(link, "_blank");
      }
      return;
    }

    const handle = post.channel?.handle || post.channel?.title;
    if (!handle) return;
    let link = "";
    if (handle.startsWith("http")) {
      link = handle;
    } else {
      const clean = handle.replace(/^@/, "");
      link = `https://t.me/${clean}`;
    }
    const twa = (window as any).Telegram?.WebApp;
    if (twa?.openTelegramLink) {
      twa.openTelegramLink(link);
    } else {
      window.open(link, "_blank");
    }
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <div className="p-4 flex flex-col gap-1 relative hover:bg-white/[0.01] transition-all items-start cursor-pointer" onClick={onPostClick}>
      <TrueViewTracker postId={post.id} />

      {/* Repost Header */}
      {(isReposted || post.reposted_by_name) && (
        <div className="flex items-center gap-2 mb-1 ml-10">
          <Repeat2 size={12} className="text-cyan-400/80" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
            {post.reposted_by_name ? `${post.reposted_by_name} Reposted` : "You Reposted"}
          </span>
        </div>
      )}

      <div className="flex gap-4 w-full items-start">
        {/* Avatar → direct channel link */}
        <button onClick={(e) => { e.stopPropagation(); openChannel(); }} className="shrink-0 relative">
          <div className={`w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-black/40 shadow-lg ${post.user?.is_live_on_telegram ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-black animate-pulse' : ''}`}>
            {post.channel?.photo && !imgError ? (
              <img src={post.channel.photo} onError={() => setImgError(true)} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-cyan-500 bg-cyan-500/10 font-black text-xs">
                {post.channel?.title?.[0] || "B"}
              </div>
            )}
          </div>
          {post.user?.is_live_on_telegram && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-[7px] font-black px-1 rounded-sm border border-black z-10 shadow-[0_0_5px_#00e6ff]">
              LIVE
            </div>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <button onClick={(e) => { e.stopPropagation(); openChannel(); }} className="flex items-center gap-1.5 truncate">
              <span className="text-white font-bold text-[13px] truncate uppercase tracking-tight">{post.channel?.title}</span>
            </button>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-white/60 font-bold uppercase">{timeAgo(post.created_at)}</span>
              <div className="relative" ref={rowMenuRef}>
                <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} className="p-1 text-white/50 hover:text-white">
                  < MoreHorizontal size={14} />
                </button>
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, x: 10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95, x: 10 }}
                      className="absolute right-0 top-6 w-36 bg-black border border-white/10 rounded-xl z-30 shadow-2xl overflow-hidden"
                    >
                      <button onClick={(e) => { e.stopPropagation(); handleHide(); }} className="w-full text-left px-3 py-3 text-[9px] font-black uppercase tracking-widest text-orange-400 hover:bg-orange-500/10">
                        {t("explore.not_interested")}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <p className="text-sm text-white/90 leading-relaxed break-words whitespace-pre-wrap mb-3">{post.content}</p>

          {post.media_urls && post.media_urls.length > 0 ? (
            <MediaCollage items={post.media_urls} />
          ) : post.media_url ? (
            <div className="mb-4 rounded-2xl overflow-hidden border border-white/5 bg-black/20 shadow-inner">
              {post.media_type === "photo" ? (
                <img src={post.media_url} alt="signal" className="w-full h-auto max-h-[400px] object-contain" loading="lazy" />
              ) : post.media_type === "video" ? (
                <AutoPlayVideo src={post.media_url} />
              ) : null}
            </div>
          ) : null}

          {/* Bottom row: Acknowledge (Heart) + Repost + Views */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-8">
              {/* Comment Button */}
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (!isConnected) {
                    onConnectRequired();
                    return;
                  }
                  onCommentClick();
                }}
                className="flex items-center gap-1.5 group transition-all text-white/40 hover:text-cyan-400/60"
              >
                <div className="p-2 rounded-full group-hover:bg-cyan-500/5 transition-colors">
                  <MessageCircle size={16} />
                </div>
                {post.comments_count > 0 && (
                  <span className="text-[10px] font-bold font-mono text-white/80">
                    {post.comments_count}
                  </span>
                )}
              </button>

              <div className="relative">
                <AnimatePresence>
                  {showSpaceDust && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
                    >
                      {[...Array(14)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                          animate={{ x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100, scale: 0, opacity: 0 }}
                          transition={{ duration: 1.0, ease: "easeOut" }}
                          className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full"
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  ref={ackBtnRef}
                  onClick={handleAcknowledge}
                  className={`flex items-center gap-1.5 group transition-all ${isAcknowledged ? "text-cyan-400" : "text-white/40 hover:text-cyan-400/60"}`}
                >
                  <div className={`p-2 rounded-full transition-colors ${isAcknowledged ? "bg-cyan-500/10 text-cyan-400" : "group-hover:bg-cyan-500/5 text-white/40 hover:text-cyan-400/60"}`}>
                    <Heart size={16} fill={isAcknowledged ? "currentColor" : "none"} className={isAcknowledged ? "scale-110" : ""} />
                  </div>
                  {localAckCount > 0 && (
                    <span className="text-[10px] font-bold font-mono text-white/80">
                      {localAckCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={handleRepost}
                  disabled={isReposted || isReposting}
                  className={`flex items-center gap-1.5 group transition-all ${isReposted ? "text-cyan-400" : isReposting ? "text-cyan-400/60" : "text-white/40 hover:text-cyan-400/60"}`}
                >
                  <div className={`p-2 rounded-full transition-colors ${isReposted ? "bg-cyan-500/10" : isReposting ? "bg-cyan-500/5" : "group-hover:bg-cyan-500/5 text-cyan-400/60"}`}>
                    {isReposting
                      ? <Loader2 size={16} className="animate-spin text-cyan-400" />
                      : <Repeat2 size={16} className={isReposted ? "rotate-180" : ""} />
                    }
                  </div>
                  {post.reposts_count > 0 && <span className="text-[10px] font-bold font-mono text-white/60">{post.reposts_count}</span>}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-white/60 px-2 py-1">
              <Eye size={14} className="text-cyan-400/80" />
              <span className="text-[10px] font-mono font-bold text-white/80">{post.views || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}

function AutoPlayVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
        if (videoRef.current && videoRef.current.paused) videoRef.current.play().catch(() => { });
      } else {
        if (videoRef.current && !videoRef.current.paused) videoRef.current.pause();
      }
    }, { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1.0] });
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);
  return (
    <video ref={videoRef} src={src} controls muted playsInline loop autoPlay={false} className="w-full h-auto max-h-[400px] object-contain" />
  );
}

function TrueViewTracker({ postId }: { postId: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const viewed = useRef(false);
  useEffect(() => {
    if (viewed.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !viewed.current) {
        viewed.current = true;
        postApi("/explore/view", { post_id: postId }).catch(() => { });
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [postId]);
  return <div ref={ref} className="absolute top-1/2 left-0 w-full h-px pointer-events-none" />;
}

function NotificationsView({
  notifications,
  onClear,
  currentUserId,
  onPostClick
}: {
  notifications: any[],
  onClear: () => void,
  currentUserId: number,
  onPostClick: (postId: number, commentId?: number) => void
}) {
  const { t } = useLanguage();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [interactionData, setInteractionData] = useState<Record<number, any[]>>({});
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

  const handleToggle = async (n: any) => {
    const isMilestone = n.type.includes("milestone");
    if (!isMilestone || !n.post_id) return;

    if (expandedId === n.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(n.id);
    if (!interactionData[n.id] && !loadingIds.has(n.id)) {
      setLoadingIds(prev => new Set(prev).add(n.id));
      try {
        const data = await getApi(`/explore/post/${n.post_id}/interactions`);
        setInteractionData(prev => ({ ...prev, [n.id]: data }));
      } catch (err) {
        console.error("Failed to fetch interactions", err);
      } finally {
        setLoadingIds(prev => {
          const next = new Set(prev);
          next.delete(n.id);
          return next;
        });
      }
    }
  };

  const openChannel = (handle: string) => {
    if (!handle) return;
    const clean = handle.replace(/^@/, "");
    const link = `https://t.me/${clean}`;
    const twa = (window as any).Telegram?.WebApp;
    if (twa?.openTelegramLink) {
      twa.openTelegramLink(link);
    } else {
      window.open(link, "_blank");
    }
  };

  const getIcon = (type: string) => {
    if (type.startsWith("verified_acknowledgment_milestone")) return <UserCheck size={18} className="text-cyan-400" />;
    if (type.startsWith("new_follower_milestone")) return <UserCheck size={18} className="text-cyan-400" />;
    if (type.startsWith("verified_repost_milestone")) return <Repeat2 size={18} className="text-cyan-400" />;
    switch (type) {
      case "post_uploaded": return <Rocket size={18} className="text-cyan-400" />;
      case "acknowledged": return <Heart size={18} fill="currentColor" className="text-cyan-400" />;
      case "reposted": return <Repeat2 size={18} className="text-cyan-400" />;
      case "commented": return <MessageCircle size={18} className="text-cyan-400" />;
      case "comment_replied": return <MessageCircle size={18} className="text-cyan-400" />;
      case "comment_liked": return <Heart size={18} fill="currentColor" className="text-cyan-400" />;
      case "new_follower": return <Plus size={18} className="text-cyan-400" />;
      default: return <Bell size={18} className="text-cyan-400" />;
    }
  };
  const getTitle = (n: any) => {
    if (n.type.startsWith("verified_acknowledgment_milestone")) return t("notifications.verified_milestone_title");
    if (n.type.startsWith("new_follower_milestone")) return t("notifications.follower_milestone_title");
    if (n.type.startsWith("verified_repost_milestone")) return t("notifications.repost_milestone_title") || "Reposts Milestone";
    if (n.type === "post_uploaded") return t("notifications.distribution_success");
    if (n.type === "acknowledged") return t("notifications.acknowledgment");
    if (n.type === "reposted") return t("notifications.repost") || "Reposted your post";
    if (n.type === "commented") return "New Comment";
    if (n.type === "comment_replied") return "Reply to your comment";
    if (n.type === "comment_liked") return "Comment Liked";
    if (n.type === "new_follower") return t("notifications.new_follower") || "New Follower";
    return t("notifications.notification_type");
  };
  const getMessage = (n: any) => {
    if (n.type.startsWith("verified_acknowledgment_milestone")) {
      const count = n.type.split("_").pop() || "1";
      return t("notifications.verified_milestone_msg").replace("{{count}}", count.toString());
    }
    if (n.type.startsWith("new_follower_milestone")) {
      const count = n.type.split("_").pop() || "1";
      return t("notifications.follower_milestone_msg").replace("{{count}}", count.toString());
    }
    if (n.type.startsWith("verified_repost_milestone")) {
      const count = n.type.split("_").pop() || "1";
      return (t("notifications.repost_milestone_msg") || "{{count}} verified humans reposted your post").replace("{{count}}", count.toString());
    }
    if (n.type === "post_uploaded") return t("notifications.broadcast_msg");
    if (n.type === "acknowledged") {
      const firstName = n.from_user?.first_name || n.from_user?.name?.split(" ")[0] || "Someone";
      return t("notifications.acknowledged_msg").replace("{{name}}", firstName);
    }
    if (n.type === "reposted") {
      const firstName = n.from_user?.first_name || n.from_user?.name?.split(" ")[0] || "Someone";
      return (t("notifications.reposted_msg") || "{{name}} reposted your post.").replace("{{name}}", firstName);
    }
    if (n.type === "commented") {
      const firstName = n.from_user?.first_name || n.from_user?.name?.split(" ")[0] || "Someone";
      return `${firstName} commented on your signal.`;
    }
    if (n.type === "comment_replied") {
      const firstName = n.from_user?.first_name || n.from_user?.name?.split(" ")[0] || "Someone";
      return `${firstName} replied to your comment.`;
    }
    if (n.type === "comment_liked") {
      const firstName = n.from_user?.first_name || n.from_user?.name?.split(" ")[0] || "Someone";
      return `${firstName} liked your comment.`;
    }
    if (n.type === "new_follower") {
      const firstName = n.from_user?.first_name || n.from_user?.name?.split(" ")[0] || "Someone";
      return (t("notifications.new_follower_msg") || "{{name}} followed your channel.").replace("{{name}}", firstName);
    }
    return t("notifications.update_msg");
  };

  return (
    <div className="space-y-3">
      {notifications.length === 0 ? (
        <div className="py-20 text-center opacity-50 flex flex-col items-center gap-3">
          <div className="p-4 rounded-full bg-white/5"><Bell size={32} /></div>
          <p className="text-[10px] font-black uppercase tracking-widest">{t("notifications.empty")}</p>
        </div>
      ) : (
        notifications.map((n: any) => {
          const isExpanded = expandedId === n.id;
          const interactions = interactionData[n.id] || [];
          const isLoading = loadingIds.has(n.id);
          const isMilestone = n.type.includes("milestone");

          return (
            <div key={n.id} className="flex flex-col gap-1">
              <div
                onClick={() => {
                  if (isMilestone) handleToggle(n);
                  else if (n.post_id) onPostClick(n.post_id, n.type.includes("comment") ? n.comment_id : undefined);
                }}
                className={`flex gap-4 p-4 rounded-2xl items-center transition-all cursor-pointer active:scale-[0.98] ${n.is_read ? "bg-white/[0.04] border border-white/[0.08] opacity-90" : "bg-cyan-500/[0.08] border border-cyan-500/40 shadow-[0_0_20px_rgba(0,230,255,0.1)]"}`}
              >
                {/* Avatar for acknowledged + new_follower + repost + comment types — clickable to open channel */}
                {(n.type === "acknowledged" || n.type === "reposted" || n.type === "new_follower" || n.type.startsWith("verified_repost_milestone") || n.type === "commented" || n.type === "comment_replied" || n.type === "comment_liked") && n.from_user ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const handle = n.from_user.telegram_channel;
                      if (!handle) return;
                      const clean = handle.replace(/^@/, "");
                      const link = `https://t.me/${clean}`;
                      const twa = (window as any).Telegram?.WebApp;
                      if (twa?.openTelegramLink) twa.openTelegramLink(link);
                      else window.open(link, "_blank");
                    }}
                    className="w-10 h-10 shrink-0 rounded-full overflow-hidden border border-white/10 bg-black/40 active:scale-90 transition-transform"
                  >
                    {n.from_user.photo_url ? (
                      <img src={n.from_user.photo_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-cyan-500/10 text-cyan-400 font-black text-sm">
                        {(n.from_user.first_name || n.from_user.name || "?")[0].toUpperCase()}
                      </div>
                    )}
                  </button>
                ) : (
                  <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border ${n.is_read ? "bg-white/5 border-white/5" : "bg-cyan-500/10 border-cyan-500/20"}`}>
                    {getIcon(n.type)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-black uppercase tracking-tight truncate ${n.is_read ? "text-white/80" : "text-white"}`}>{getTitle(n)}</p>
                  {(n.type === "acknowledged" || n.type === "new_follower" || n.type.startsWith("verified_repost_milestone")) && n.from_user && (
                    <p className="text-[10px] font-bold text-cyan-400 truncate">
                      {n.from_user.first_name || n.from_user.name?.split(" ")[0] || ""}
                    </p>
                  )}
                  <p className={`text-[10px] leading-relaxed ${n.is_read ? "text-white/50" : "text-white/70"}`}>{getMessage(n)}</p>
                  {/* Follow-back button for new_follower */}
                  {n.type === "new_follower" && n.from_user?.telegram_channel && (
                    <button
                      disabled={n.is_followed}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (currentUserId && n.from_user_id) {
                          try {
                            // 🔒 [SECURITY] postApi ensures auth header is sent
                            // 🚄 [SPEED_BOOST] Instantly open the channel
                            const handle = n.from_user.telegram_channel;
                            const clean = handle.replace(/^@/, "");
                            const link = `https://t.me/${clean}`;
                            const twa = (window as any).Telegram?.WebApp;
                            if (twa?.openTelegramLink) twa.openTelegramLink(link);
                            else window.open(link, "_blank");

                            const data = await postApi(`/user/follow`, { follower_id: currentUserId, followed_id: n.from_user_id });
                            if (data.success) {
                              onClear(); // mutate notifications to see 'is_followed' as true
                            }
                          } catch (err) {
                            console.error("Follow error:", err);
                          }
                        }
                      }}
                      className={n.is_followed
                        ? "mt-1.5 flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[9px] font-black uppercase tracking-widest text-white/50 cursor-default"
                        : "mt-1.5 flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[9px] font-black uppercase tracking-widest text-cyan-400 hover:bg-cyan-500/20 active:scale-95 transition-all"
                      }
                    >
                      {n.is_followed ? <CheckCircle2 size={10} /> : <Plus size={10} />}
                      {n.is_followed ? "Following" : "Follow Back"}
                    </button>
                  )}
                </div>
                {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#00e6ff]" />}
                {isMilestone && (
                  <ChevronDown size={14} className={`text-white/30 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                )}
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mx-4 p-4 bg-white/[0.02] border-x border-b border-white/5 rounded-b-2xl flex flex-wrap gap-3 items-center">
                      {isLoading ? (
                        <div className="flex items-center gap-2 py-1">
                          <Loader2 size={12} className="animate-spin text-cyan-400" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Analyzing interactions</span>
                        </div>
                      ) : interactions.length > 0 ? (
                        interactions.map((human: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); openChannel(human.channel); }}
                            className="group flex flex-col items-center gap-1 active:scale-90 transition-all"
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-black group-hover:border-cyan-500/50 transition-colors">
                              {human.photo ? (
                                <img src={human.photo} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-cyan-500/10 text-cyan-400 text-[8px] font-black">
                                  {human.name?.[0] || "H"}
                                </div>
                              )}
                            </div>
                            <span className="text-[7px] font-bold text-white/30 truncate max-w-[40px] uppercase">{human.name?.split(" ")[0]}</span>
                          </button>
                        ))
                      ) : (
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/20">No data found</span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })
      )}
    </div>
  );
}

function PostDetailModal({
  post: initialPost,
  commentId,
  telegramUser,
  onClose,
  onRefresh
}: {
  post: any,
  commentId?: number | null,
  telegramUser: any,
  onClose: () => void,
  onRefresh: () => void
}) {
  const { t } = useLanguage();
  const [post, setPost] = useState<any>(initialPost);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [posting, setPosting] = useState(false);
  const [localComments, setLocalComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(!initialPost.content);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialPost.content && initialPost.id) {
      setLoading(true);
      getApi(`/explore/post/${initialPost.id}?tg_id=${telegramUser?.id}`).then(data => {
        setPost(data);
        setLoading(false);
      });
    }
  }, [initialPost.id, initialPost.content, telegramUser?.id]);

  const { data: comments, mutate: mutateComments } = useApi(post?.id ? `/explore/post/${post.id}/comments` : null);

  useEffect(() => {
    if (comments) {
      setLocalComments(comments);
      if (commentId) {
        setTimeout(() => {
          const el = document.getElementById(`comment-${commentId}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 500);
      }
    }
  }, [comments, commentId]);

  const handlePostComment = async () => {
    if (!content.trim()) return;
    setPosting(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      post_id: post.id,
      user_id: telegramUser.id,
      parent_id: replyTo?.id || null,
      content: content.trim(),
      created_at: new Date().toISOString(),
      likes_count: 0,
      is_liked: false,
      user: {
        name: telegramUser.first_name || "Me",
        photo: telegramUser.photo_url
      }
    };

    setLocalComments(prev => [...prev, optimisticComment]);
    setContent("");
    const prevReplyTo = replyTo;
    setReplyTo(null);

    try {
      const res = await postApi(`/explore/post/${post.id}/comment`, {
        user_id: telegramUser.id,
        content: optimisticComment.content,
        parent_id: optimisticComment.parent_id
      });

      if (res.success) {
        mutateComments();
        onRefresh();
      }
    } catch (err) {
      setLocalComments(prev => prev.filter(c => c.id !== tempId));
      setContent(optimisticComment.content);
      setReplyTo(prevReplyTo);
    } finally {
      setPosting(false);
    }
  };

  const handleToggleLike = async (cId: number) => {
    setLocalComments(prev => prev.map(c =>
      c.id === cId ? { ...c, is_liked: !c.is_liked, likes_count: c.is_liked ? c.likes_count - 1 : c.likes_count + 1 } : c
    ));
    try {
      await postApi(`/explore/comment/${cId}/like`, { user_id: telegramUser.id, comment_id: cId });
      mutateComments();
    } catch (err) {
      mutateComments();
    }
  };

  const renderComments = (parentId: number | null = null, depth = 0) => {
    return localComments
      .filter(c => c.parent_id === parentId)
      .map(comment => (
        <div key={comment.id} id={`comment-${comment.id}`} className="flex flex-col">
          <div className={`flex gap-3 py-4 ${depth > 0 ? "ml-6 border-l border-white/5 pl-4" : ""} ${comment.id === commentId ? "bg-cyan-500/5 rounded-xl px-2 -mx-2" : ""}`}>
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10 bg-black/40 shadow-sm">
              {comment.user.photo ? (
                <img src={comment.user.photo} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-cyan-500/10 text-cyan-400 font-black text-[10px]">
                  {comment.user.name?.[0]}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-white font-bold text-[11px] truncate tracking-tight">{comment.user.name}</span>
                <span className="text-[9px] text-white/30">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-sm text-white/90 leading-relaxed mb-3 whitespace-pre-wrap">{comment.content}</p>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => handleToggleLike(comment.id)}
                  className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${comment.is_liked ? "text-cyan-400" : "text-white/30 hover:text-white"}`}
                >
                  <Heart size={12} fill={comment.is_liked ? "currentColor" : "none"} strokeWidth={2.5} />
                  {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
                </button>
                <button
                  onClick={() => {
                    setReplyTo(comment);
                    const input = document.getElementById('comment-input');
                    input?.focus();
                  }}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors"
                >
                  <MessageCircle size={12} strokeWidth={2.5} />
                  <span>Reply</span>
                </button>
              </div>
            </div>
          </div>
          {renderComments(comment.id, depth + 1)}
        </div>
      ));
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
        className="w-full max-w-xl bg-zinc-950 border-t border-white/10 rounded-t-[3rem] flex flex-col max-h-[95vh] shadow-[0_-20px_60px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-4 pb-2" onClick={onClose} >
          <div className="w-12 h-1.5 rounded-full bg-white/10 active:bg-white/30 transition-colors" />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4 opacity-50">
              <Loader2 className="animate-spin text-cyan-400" size={32} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Hydrating Signal</p>
            </div>
          ) : (
            <div className="py-2">
              <div 
                className="flex items-center gap-3 mb-4 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => {
                  if (post.channel?.handle) {
                    const handle = post.channel.handle.replace(/^@/, "");
                    const link = `https://t.me/${handle}`;
                    const twa = (window as any).Telegram?.WebApp;
                    if (twa?.openTelegramLink) twa.openTelegramLink(link);
                    else window.open(link, "_blank");
                  }
                }}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-black/40">
                  {(post.channel?.photo || post.user?.photo) ? (
                    <img src={post.channel?.photo || post.user.photo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-cyan-500/10 text-cyan-400 font-black text-lg">
                      {(post.channel?.title || post.user?.name || 'U')[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h4 className="text-white font-black text-sm tracking-tight">{post.channel?.title || post.user?.name}</h4>
                    {post.channel && <CheckCircle2 size={12} className="text-cyan-400" />}
                  </div>
                  <p className="text-xs text-white/30">@{post.channel?.handle || post.user?.handle || 'anon'}</p>
                </div>
              </div>

              <p className="text-lg text-white font-medium leading-relaxed tracking-tight mb-4 whitespace-pre-wrap">
                {post.content}
              </p>

              {post.media_urls && post.media_urls.length > 0 && (
                <MediaCollage items={post.media_urls} />
              )}

              <div className="py-4 border-y border-white/5 flex items-center gap-6 mb-6">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-sm font-black text-white">{post.acknowledgments_count || 0}</span>
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Likes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-white">{post.reposts_count || 0}</span>
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Reposts</span>
                </div>
              </div>

              <div className="space-y-2 pb-32">
                {localComments.length === 0 ? (
                  <div className="py-12 text-center opacity-20 flex flex-col items-center gap-4">
                    <MessageCircle size={48} strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Zero reverberations yet</p>
                  </div>
                ) : (
                  renderComments()
                )}
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-xl border-t border-white/10 pb-[calc(env(safe-area-inset-bottom,20px)+20px)]">
          {replyTo && (
            <div className="flex items-center justify-between bg-cyan-500/10 px-4 py-2 border-x border-t border-cyan-500/20 rounded-t-2xl">
              <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">
                Replying to <span className="text-white">{replyTo.user.name}</span>
              </span>
              <button onClick={() => setReplyTo(null)} className="text-cyan-400 p-1">
                <X size={14} />
              </button>
            </div>
          )}
          <div className={`flex items-end gap-3 p-3 bg-white/5 border border-white/10 ${replyTo ? 'rounded-b-2xl' : 'rounded-[2rem]'} focus-within:border-cyan-500/40 transition-all shadow-2xl`}>
            <textarea
              id="comment-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Post your reply"
              className="flex-1 bg-transparent border-none outline-none text-base text-white py-2 px-2 resize-none max-h-32 min-h-[44px] custom-scrollbar"
              rows={1}
            />
            <button
              onClick={handlePostComment}
              disabled={posting || !content.trim()}
              className="w-11 h-11 rounded-full bg-cyan-500 text-black flex items-center justify-center shrink-0 active:scale-90 transition-all disabled:opacity-30 shadow-[0_0_15px_rgba(0,230,255,0.3)]"
            >
              {posting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

function LiveNowTray({ liveUsers }: { liveUsers: any[] }) {
  if (!liveUsers || liveUsers.length === 0) return null;

  return (
    <div className="w-full border-b border-white/[0.05] bg-black/40 overflow-hidden shrink-0">
      <div className="flex items-center gap-4 overflow-x-auto custom-scrollbar px-4 pt-4 pb-3 hide-scrollbar">
        {liveUsers.map((u, i) => (
          <button 
            key={i} 
            onClick={() => {
              const handle = u.telegram_channel;
              if (!handle) return;
              const clean = handle.replace(/^@/, "");
              const link = `https://t.me/${clean}`;
              const twa = (window as any).Telegram?.WebApp;
              if (twa?.openTelegramLink) {
                twa.openTelegramLink(link);
              } else {
                window.open(link, "_blank");
              }
            }}
            className="flex flex-col items-center gap-2 shrink-0 group w-16"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full overflow-hidden border-[3px] border-cyan-500/30 group-hover:border-cyan-400 transition-all p-0.5 relative z-10 bg-transparent">
                <div className="w-full h-full rounded-full overflow-hidden border border-white/10 bg-black/40 relative pointer-events-none">
                  {u.photo_url || u.telegram_channel_photo ? (
                    <img src={u.photo_url || u.telegram_channel_photo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-cyan-500 bg-cyan-500/10 font-black text-lg">
                      {u.name?.[0] || u.first_name?.[0] || u.telegram_channel_title?.[0] || "U"}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500 animate-[pulse_2s_ease-out_infinite] opacity-50 z-0 pointer-events-none" />

              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-cyan-600 text-black text-[9px] font-black px-1.5 py-0.5 rounded-[4px] border border-cyan-300 shadow-[0_0_10px_rgba(0,230,255,1)] leading-none flex items-center gap-1 tracking-widest z-20 pointer-events-none">
                <span className="w-1 h-1 rounded-full bg-white animate-[pulse_1s_infinite]" />
                LIVE
              </div>
            </div>
            <span className="text-[9px] font-bold text-white/80 truncate w-16 text-center group-hover:text-cyan-400 transition-colors uppercase tracking-tight opacity-90">
              {u.name || u.first_name || u.telegram_channel_title || "Unknown"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ScheduleLiveModal({
  telegramUser,
  connectedChannel,
  channelId,
  onClose,
  onScheduled
}: {
  telegramUser: any,
  connectedChannel?: string,
  channelId?: number | string | null,
  onClose: () => void,
  onScheduled: (live: any) => void
}) {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date(Date.now() + 3600000).toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date(Date.now() + 3600000).toTimeString().slice(0, 5));
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The channel_id must be the Telegram BIGINT channel ID (e.g. -1001234567890)
  // NOT the user's personal telegram ID. We get this from swrUser.telegram_channel_id
  // which is populated by sync_channel_metadata calling getChat on the channel handle.
  const resolvedChannelId = channelId || connectedChannel;

  const handleSchedule = async () => {
    if (!title.trim() || !resolvedChannelId) return;
    setScheduling(true);
    setError(null);
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      const res = await postApi("/explore/schedule_live", {
        channel_id: resolvedChannelId,   // ✅ Real Telegram channel ID (BIGINT)
        admin_id: telegramUser.id,        // ✅ User's personal ID (who is scheduling)
        title: title.trim(),
        scheduled_at: scheduledAt
      });
      if (res.success) {
        onScheduled(res.live);
      } else {
        setError(res.detail || "Failed to schedule. Check your channel connection.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setScheduling(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-xl bg-zinc-950 border-t border-cyan-500/20 rounded-t-[3rem] p-8 space-y-6 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center -mt-4 mb-2">
          <div className="w-12 h-1.5 rounded-full bg-white/10" />
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-black uppercase tracking-tighter text-white">Schedule Live Broadcast</h3>
          <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest opacity-60">Manage your presence signal</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Topic / Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are we broadcasting?"
              className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm text-white outline-none focus:border-cyan-500/40 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm text-white outline-none focus:border-cyan-500/40 transition-all dark:[color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm text-white outline-none focus:border-cyan-500/40 transition-all dark:[color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {error && <p className="text-[10px] text-orange-400 font-bold uppercase text-center tracking-tight">{error}</p>}

        <div className="pt-2">
          <button
            onClick={handleSchedule}
            disabled={scheduling || !title.trim() || !connectedChannel}
            className="w-full h-16 bg-cyan-500 text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(0,230,255,0.3)] active:scale-[0.98] transition-all disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-3"
          >
            {scheduling ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <>
                <Video size={20} strokeWidth={2.5} />
                Confirm Live Schedule
              </>
            )}
          </button>
          {!connectedChannel && (
            <p className="text-[8px] text-white/20 text-center mt-4 uppercase tracking-widest">Connect a channel to broadcast live</p>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
