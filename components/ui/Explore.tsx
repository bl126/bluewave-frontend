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
  Image as ImageIcon,
  Video,
  Send,
  UserCheck,
  MessageCircle,
  Share2,
  Calendar,
  Shield,
  Zap,
  ShoppingCart,
  Vote,
  Activity,
  Fingerprint,
  Bot,
  Star,
  Forward,
  Copy,
  ArrowLeft,
  ArrowRight,
  Trophy,
  User,
  Lock
} from "lucide-react";
import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useApi, postApi, getApi, useSync } from "@/lib/useApi";
import Leaderboard from "./Leaderboard";
import ReferralShareModal from "./ReferralShareModal";
import { hasExploreBetaAccess } from "@/lib/exploreAccess";
import { LiveNowTray, MiniAppCarousel, MOCK_MINI_APPS } from "@/components/explore/ExploreDiscoverChrome";
import StarGiftModal, {
  getSavedStarGiftAmount,
  hasCompletedStarGiftSetup,
  saveStarGiftAmount,
  type StarGiftModalMode,
} from "@/components/explore/StarGiftModal";

const DepositModal = dynamic(() => import("./DepositModal"), { ssr: false });

const MINI_APP_INSERT_EVERY = 6;

interface ExploreProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
}

export default function Explore({ isOpen, onClose, telegramUser }: ExploreProps) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"foryou" | "following" | "leaderboard" | "notifications">("leaderboard");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [isLeaderboardSheetOpen, setIsLeaderboardSheetOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [buyStarsOpen, setBuyStarsOpen] = useState(false);
  const [latestKnownPostId, setLatestKnownPostId] = useState<number | string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);

  // Pagination State
  const [offset, setOffset] = useState(0);
  const [pagedPosts, setPagedPosts] = useState<any[]>(() => {
    if (typeof window !== "undefined" && telegramUser?.id) {
      const cached = window.localStorage.getItem(`bw_feed_foryou_${telegramUser.id}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.error("Feed Cache Corrupt", e);
        }
      }
    }
    return [];
  });
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const feedTopRef = useRef<HTMLDivElement>(null);
  const betaDefaultTabSet = useRef(false);

  // Scroll hide/show state
  const [showChrome, setShowChrome] = useState(true);
  const lastScrollY = useRef(0);

  // Restore bottom nav when leaving Explore (scroll hide only applies inside feed)
  useEffect(() => {
    if (!isOpen) {
      setShowChrome(true);
      lastScrollY.current = 0;
      window.dispatchEvent(new CustomEvent("scrollDirectionChanged", { detail: "up" }));
    }
  }, [isOpen]);

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
  const { data: liveUsers } = useApi(isOpen ? `/explore/live_users${telegramUser?.id ? `?tg_id=${telegramUser.id}` : ''}` : null, { refreshInterval: 60000 });

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

  // 🔄 Help Sync pagedPosts with initialPosts on tab change or refresh
  useEffect(() => {
    if (initialPosts && Array.isArray(initialPosts)) {
      setPagedPosts(initialPosts);
      setOffset(initialPosts.length);
      setHasMore(initialPosts.length >= 10);

      // Keep cache fresh if on the main 'foryou' tab
      if (activeTab === "foryou" && telegramUser?.id) {
        window.localStorage.setItem(`bw_feed_foryou_${telegramUser.id}`, JSON.stringify(initialPosts));
      }
    }
  }, [initialPosts, activeTab]);

  // 🚀 Load More Implementation (Infinite Scroll Logic)
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading || !telegramUser?.id) return;

    setLoadingMore(true);
    try {
      // 🚄 Fetch the next batch from the API using current offset
      const nextBatch = await getApi(`/explore/feed?tg_id=${telegramUser.id}&tab=${activeTab}&offset=${offset}`);

      if (nextBatch && Array.isArray(nextBatch) && nextBatch.length > 0) {
        setPagedPosts(prev => [...prev, ...nextBatch]);
        setOffset(prev => prev + nextBatch.length);
        setHasMore(nextBatch.length >= 10); // Standard pagination limit is 10
      } else {
        setHasMore(false); // No more posts to load
      }
    } catch (err) {
      console.error("Failed to load more posts:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, loading, offset, activeTab, telegramUser?.id]);

  // 👁️ Intersection Observer for triggering the load more action
  useEffect(() => {
    if (!hasMore || activeTab === "leaderboard" || activeTab === "notifications") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && !loading) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" } // Load early for better UX
    );

    const currentTrigger = loadMoreRef.current;
    if (currentTrigger) observer.observe(currentTrigger);

    return () => {
      if (currentTrigger) observer.unobserve(currentTrigger);
    };
  }, [hasMore, loadingMore, loading, handleLoadMore, activeTab]);

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
    };

    window.addEventListener("bwNativeBack", handleNativeBack);
    return () => window.removeEventListener("bwNativeBack", handleNativeBack);
  }, [isOpen, selectedPost, isPostModalOpen, isSpeedDialOpen]);

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

  const hasAccess = hasExploreBetaAccess(telegramUser?.id);

  useEffect(() => {
    if (!betaDefaultTabSet.current && hasAccess) {
      setActiveTab("foryou");
      betaDefaultTabSet.current = true;
    }
  }, [hasAccess]);

  const handleStarBalanceChange = useCallback((delta: number) => {
    if (!telegramUser?.id) return;
    const next = Math.max(0, (telegramUser.stars_balance || 0) + delta);
    window.dispatchEvent(
      new CustomEvent("updateUser", { detail: { stars_balance: next } })
    );
  }, [telegramUser?.id, telegramUser?.stars_balance]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-0 flex flex-col overflow-hidden text-text-main bg-app-bg backdrop-blur-3xl ${(isPostModalOpen || isLeaderboardSheetOpen) ? "z-[300]" : "z-[120]"}`}
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 60px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)"
      }}
    >
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-app-accent/5 blur-[100px] pointer-events-none" />

      {/* ─── Tab Bar (fixed, solid, no floating) ─── */}
      <motion.div
        animate={{
          y: showChrome ? 0 : (activeTab === "foryou" || activeTab === "following") && (liveUsers?.length ?? 0) > 0 ? -200 : -80,
          opacity: showChrome ? 1 : 0
        }}
        transition={{ duration: 0.12, ease: "easeInOut" }}
        className="fixed top-20 left-0 right-0 z-[130] border-b border-app-border pointer-events-auto bg-app-bg backdrop-blur-xl"
      >
        <div className="flex items-center justify-between px-6 pt-2 w-full">
          {(["foryou", "following", "leaderboard", "notifications"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`relative pb-3 flex items-center justify-center transition-all ${
                activeTab === tab ? "text-app-accent" : "text-text-sub"
              }`}
            >
              {tab === "foryou" && (
                hasAccess ? (
                  <span className="text-[10px] font-black uppercase tracking-widest">{t("explore.tabs.foryou")}</span>
                ) : (
                  <Lock size={18} className="text-white/30" />
                )
              )}
              {tab === "following" && (
                hasAccess ? (
                  <span className="text-[10px] font-black uppercase tracking-widest">{t("explore.tabs.following")}</span>
                ) : (
                  <Lock size={18} className="text-text-sub" />
                )
              )}
              {tab === "notifications" && (
                hasAccess ? (
                  <div className="relative">
                    <Bell size={18} className={activeTab === tab ? "text-app-accent" : "text-text-sub"} />
                    {unreadCount > 0 && (
                      <div className="absolute -top-1.5 -right-2 w-3 h-3 bg-cyan-500 rounded-full flex items-center justify-center text-[7px] text-black font-black shadow-[0_0_8px_#00e6ff]">
                        {unreadCount > 9 ? "!" : unreadCount}
                      </div>
                    )}
                  </div>
                ) : (
                  <Lock size={18} className="text-text-sub" />
                )
              )}
              {tab === "leaderboard" && (
                <BarChart2 size={18} className={activeTab === tab ? "text-app-accent" : "text-text-sub"} />
              )}
              {activeTab === tab && (
                <motion.div
                  layoutId="exploreTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-app-accent shadow-app-shadow"
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
        {/* Main Content Area with Access Control */}
        {(!hasAccess && activeTab !== "leaderboard") ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
            <div className="w-20 h-20 bg-cyan-500/5 rounded-3xl flex items-center justify-center mb-6 border border-cyan-500/10">
              <Lock size={32} className="text-cyan-500/30" />
            </div>
            <h2 className="text-sm font-black text-white/50 uppercase tracking-[0.2em]">Beta Testing Phase</h2>
            <p className="text-[10px] text-cyan-500/30 mt-2 uppercase tracking-widest italic">Authorized access only</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "notifications" && (
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
            )}
            {activeTab === "leaderboard" && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Leaderboard
                  isOpen={true}
                  onClose={onClose}
                  telegramUser={telegramUser}
                  isInline={true}
                  onSheetOpenChange={(open) => setIsLeaderboardSheetOpen(open)}
                  onGetRefLink={() => setIsReferralModalOpen(true)}
                />
              </motion.div>
            )}
            {(activeTab === "foryou" || activeTab === "following") && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {loading && pagedPosts.length === 0 ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
                    ))}
                  </div>
                ) : pagedPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                    <p className="text-text-sub text-sm font-black uppercase tracking-widest">No posts yet</p>
                  </div>
                ) : (
                  <div className="pb-32">
                    {activeTab === "foryou" && liveUsers && liveUsers.length > 0 && (
                      <LiveNowTray liveUsers={liveUsers} />
                    )}
                    {pagedPosts.map((post: any, index: number) => (
                      <Fragment key={post.id}>
                        <PostCard
                          post={post}
                          currentUserId={telegramUser?.id}
                          starsBalance={telegramUser?.stars_balance ?? 0}
                          onStarBalanceChange={handleStarBalanceChange}
                          isConnected={isConnected}
                          onHide={() => setPagedPosts(prev => prev.filter((p: any) => p.id !== post.id))}
                          onRepost={() => mutate()}
                          onConnectRequired={() => { setConnectPrompt(true); setTimeout(() => setConnectPrompt(false), 3000); }}
                          onCommentClick={() => setSelectedPost(post)}
                          onPostClick={() => setSelectedPost(post)}
                          onStarGiftSuccess={() => mutateNotifications()}
                          onOpenBuyStars={() => setBuyStarsOpen(true)}
                        />
                        {activeTab === "foryou" && (index + 1) % MINI_APP_INSERT_EVERY === 0 && (
                          <MiniAppCarousel apps={MOCK_MINI_APPS} />
                        )}
                      </Fragment>
                    ))}
                    {hasMore && (
                      <div ref={loadMoreRef} className="flex justify-center py-6">
                        {loadingMore && <Loader2 size={20} className="text-cyan-400 animate-spin" />}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ─── FAB Post Button (Speed Dial) ─── */}
      <AnimatePresence>
        {isSpeedDialOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[180] bg-app-bg/40 backdrop-blur-md"
            onClick={() => setIsSpeedDialOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChrome && activeTab !== "leaderboard" && (
          <div className="fixed right-5 bottom-28 z-[200] flex flex-col items-center gap-3">
            <motion.button
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 20 }}
              transition={{ duration: 0.12, ease: "easeInOut" }}
              whileTap={hasAccess ? { scale: 0.9 } : undefined}
              disabled={!hasAccess}
              title={hasAccess ? t("explore.new_post_title") : t("explore.beta_post_locked")}
              onClick={() => {
                if (!hasAccess) return;
                if (swrUser && !isConnected) {
                  setConnectPrompt(true);
                  setTimeout(() => setConnectPrompt(false), 3000);
                } else {
                  setIsPostModalOpen(true);
                }
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-black/20 overflow-hidden group transition-all relative z-[210] ${
                !hasAccess
                  ? "bg-zinc-800/90 text-zinc-600 cursor-not-allowed opacity-50"
                  : isConnected || !swrUser
                    ? "bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                    : "bg-gray-800 text-gray-500 shadow-none"
              }`}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              {!hasAccess ? <Lock size={22} /> : <Plus size={26} strokeWidth={3} />}
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Post Modal ─── */}
      <AnimatePresence>
        {isPostModalOpen && (
          <PostModal
            telegramUser={telegramUser}
            swrUser={swrUser}
            onClose={() => setIsPostModalOpen(false)}
            onPosted={(requestArgs) => {
              setIsPostModalOpen(false);

              // 🚀 [SPEED_BOOST] Optimistic UI: Prepend to the feed immediately while background posting
              const optimisticPost = {
                id: `temp-${Date.now()}`,
                tg_id: telegramUser.id,
                content: requestArgs.content,
                media_url: requestArgs.media_url,
                media_urls: requestArgs.media_urls || (requestArgs.media_url ? [{ url: requestArgs.media_url, type: requestArgs.media_type }] : []),
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

      {/* ─── Referral Share Modal ─── */}
      <ReferralShareModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        telegramId={telegramUser?.id || null}
        bwId={swrUser?.bw_id || ""}
        referralLink={swrUser?.referral_link}
      />

      {buyStarsOpen && (
        <DepositModal
          type="stars"
          telegramUser={telegramUser}
          onClose={() => setBuyStarsOpen(false)}
          onSuccess={(_ton, starsAdded) => {
            if (starsAdded) {
              handleStarBalanceChange(starsAdded);
            }
            setBuyStarsOpen(false);
          }}
        />
      )}

    </motion.div>
  );
}

// ----------------------------------------------------------------------------
// 📤 Post Modal (X-style Full-Screen)
// ----------------------------------------------------------------------------
function PostModal({ 
  telegramUser, 
  onClose, 
  onPosted, 
  swrUser 
}: { 
  telegramUser: any, 
  onClose: () => void, 
  onPosted: (args: any) => void, 
  swrUser: any 
}) {
  const { t } = useLanguage();
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [mediaTypes, setMediaTypes] = useState<("photo" | "video")[]>([]);
  const [mediaExts, setMediaExts] = useState<string[]>([]);
  const [uploadIndex, setUploadIndex] = useState<number | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      video.src = url;
      video.load();
      video.currentTime = 0.5;
      video.muted = true;
      video.playsInline = true;
      video.onloadeddata = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")?.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg");
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      };
      video.onerror = () => resolve("");
    });
  };

  // Helper to generate preview & type info for selected files
  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    for (const file of files) {
      if (mediaFiles.length >= 4) break; 
      const isVideo = file.type.startsWith("video/");
      
      const ext = file.name.split('.').pop() || (isVideo ? "mp4" : "jpg");
      setMediaFiles(prev => [...prev, file]);
      setMediaTypes(prev => [...prev, isVideo ? "video" : "photo"]);
      setMediaExts(prev => [...prev, ext]);

      if (isVideo) {
        const thumb = await generateVideoThumbnail(file);
        setMediaPreviews(prev => [...prev, thumb]);
      } else {
        const reader = new FileReader();
        reader.onload = ev => {
          setMediaPreviews(prev => [...prev, ev.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const moveMedia = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= mediaFiles.length) return;
    
    setMediaFiles(prev => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    setMediaPreviews(prev => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    setMediaTypes(prev => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    setMediaExts(prev => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    setMediaTypes(prev => prev.filter((_, i) => i !== index));
    setMediaExts(prev => prev.filter((_, i) => i !== index));
  };

  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [cropRect, setCropRect] = useState({ x: 10, y: 10, w: 80, h: 80 }); 

  const startCrop = (idx: number) => {
    setCropIndex(idx);
    setCropRect({ x: 10, y: 10, w: 80, h: 80 });
  };

  const applyCrop = async () => {
    if (cropIndex === null) return;
    const file = mediaFiles[cropIndex];
    if (!file) return;
    
    const img = new Image();
    img.src = mediaPreviews[cropIndex];
    await new Promise(res => img.onload = () => res(null));
    
    const canvas = document.createElement("canvas");
    const realX = (cropRect.x / 100) * img.width;
    const realY = (cropRect.y / 100) * img.height;
    const realW = (cropRect.w / 100) * img.width;
    const realH = (cropRect.h / 100) * img.height;
    
    canvas.width = realW;
    canvas.height = realH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(img, realX, realY, realW, realH, 0, 0, realW, realH);
    
    canvas.toBlob(blob => {
      if (!blob) return;
      const newFile = new File([blob], file.name, { type: file.type });
      const newFiles = [...mediaFiles];
      newFiles[cropIndex] = newFile;
      setMediaFiles(newFiles);
      
      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string;
        const newPreviews = [...mediaPreviews];
        newPreviews[cropIndex] = dataUrl;
        setMediaPreviews(newPreviews);
      };
      reader.readAsDataURL(newFile);
    }, file.type);
    setCropIndex(null);
  };

  const handlePost = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;
    setPosting(true);
    setError(null);
    try {
      const uploadedUrls: { url: string; type: string }[] = [];
      for (let i = 0; i < mediaFiles.length; i++) {
        setUploadIndex(i + 1);
        const file = mediaFiles[i];
        const ext = mediaExts[i];
        const urlData = await postApi(`/explore/get_upload_url`, { tg_id: telegramUser.id, media_ext: ext });
        if (urlData.signed_url) {
          const putRes = await fetch(urlData.signed_url, {
            method: "PUT",
            headers: {
              "Authorization": `Bearer ${urlData.token}`,
              "Content-Type": file.type,
            },
            body: file,
          });
          if (putRes.ok) {
            uploadedUrls.push({ url: urlData.public_url, type: file.type.startsWith("video") ? "video" : "photo" });
          }
        }
      }
      
      const payload: any = {
        tg_id: telegramUser.id,
        content: content.trim(),
        media_url: uploadedUrls[0]?.url || "",
        media_type: uploadedUrls[0]?.type || "text",
        media_ext: mediaExts[0] || "",
        media_urls: uploadedUrls.map(u => ({ url: u.url, type: u.type })),
      };
      onPosted(payload);
    } catch (err: any) {
      console.error(err);
      setError("Upload failed.");
    } finally {
      setPosting(false);
      setUploadIndex(null);
    }
  };

  const charLimit = 250;
  const progress = (content.length / charLimit) * 100;
  const strokeDasharray = 2 * Math.PI * 8; 
  const strokeDashoffset = strokeDasharray - (Math.min(progress, 100) / 100) * strokeDasharray;

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col md:max-w-md md:mx-auto md:relative md:inset-auto md:h-[90vh] md:rounded-[3rem] md:overflow-hidden"
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 60px)"
      }}
    >


      <div className="flex-1 overflow-y-auto p-4 space-y-6">
         <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
              {swrUser?.telegram_channel_photo ? (
                <img src={swrUser.telegram_channel_photo} className="w-full h-full object-cover" />
              ) : (
                <span className="text-cyan-500 font-black text-sm">{swrUser?.telegram_channel_title?.[0] || "B"}</span>
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/30 text-cyan-500 text-[9px] font-black uppercase tracking-widest w-fit bg-cyan-500/5">
                  {swrUser?.telegram_channel_title ? (
                    swrUser.telegram_channel_title.length > 18 ? swrUser.telegram_channel_title.slice(0, 15) + '...' : swrUser.telegram_channel_title
                  ) : "Bluewave"} 
                  <ChevronDown size={10} />
                </button>
              </div>

             <textarea
               autoFocus
               value={content}
               onChange={e => setContent(e.target.value)}
               maxLength={charLimit}
               placeholder={t("explore.post_placeholder")}
               className="w-full bg-transparent text-lg text-white placeholder-white/20 resize-none outline-none min-h-[160px]"
             />

             {mediaPreviews.length > 0 && (
               <div className={`grid gap-2 ${mediaPreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                 {mediaPreviews.map((src, i) => (
                   <div key={i} className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/30 aspect-square group shadow-lg">
                     {mediaTypes[i] === "photo" ? (
                       <img src={src} className="w-full h-full object-cover" />
                     ) : (
                       <video src={src} className="w-full h-full object-cover" />
                     )}
                     <button onClick={() => removeMedia(i)} className="absolute top-2 right-2 w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                       <X size={16} />
                     </button>
                     {mediaTypes[i] === "photo" && (
                       <button onClick={() => startCrop(i)} className="absolute bottom-2 left-2 w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-cyan-500 transition-colors">
                         <Activity size={16} />
                       </button>
                     )}
                   </div>
                 ))}
               </div>
             )}
           </div>
        </div>
      </div>

      <div className="fixed bottom-12 left-0 right-0 px-5 z-20">
        <div className="p-4 rounded-[2.5rem] bg-zinc-900/90 backdrop-blur-2xl border border-white/5 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-center">
            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFilesChange} />
            <button onClick={() => fileInputRef.current?.click()} className="text-cyan-500 hover:scale-110 transition-transform active:scale-90 p-2"><ImageIcon size={22} /></button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
                <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="2" fill="transparent" 
                  strokeDasharray={strokeDasharray} 
                  strokeDashoffset={strokeDashoffset}
                  className={content.length > charLimit - 20 ? "text-orange-500" : "text-cyan-500"} 
                />
              </svg>
              {content.length > charLimit - 20 && (
                <span className="absolute text-[8px] font-bold text-white/40">{charLimit - content.length}</span>
              )}
            </div>
            
            <button 
              onClick={handlePost}
              disabled={posting || (!content.trim() && mediaFiles.length === 0)}
              className="px-6 py-2.5 bg-cyan-500 text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-full shadow-[0_10px_20px_rgba(6,182,212,0.2)] active:scale-95 transition-all disabled:opacity-30"
            >
              {posting ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin" />
                  <span>{uploadIndex ? `${uploadIndex}/${mediaFiles.length}` : "..."}</span>
                </div>
              ) : "Post"}
            </button>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {cropIndex !== null && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black/95 z-[300] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <button onClick={() => setCropIndex(null)} className="text-white/60 text-sm font-bold px-4 py-2 hover:text-white transition-colors">Cancel</button>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">Refine Photo</h4>
              <button onClick={applyCrop} className="px-6 py-2 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Apply</button>
            </div>
            <div className="flex-1 flex items-center justify-center p-8 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)]">
              <div className="relative w-full aspect-square border border-white/10 overflow-hidden bg-black/40 shadow-2xl">
                 <img src={mediaPreviews[cropIndex]} className="w-full h-full object-contain opacity-40 grayscale" />
                 <div className="absolute border-2 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.4)]" 
                   style={{
                     left: `${cropRect.x}%`,
                     top: `${cropRect.y}%`,
                     width: `${cropRect.w}%`,
                     height: `${cropRect.h}%`,
                   }}
                 >
                   <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                     {[...Array(9)].map((_, i) => <div key={i} className="border border-white/10" />)}
                   </div>
                 </div>
              </div>
            </div>
            <div className="p-8 bg-zinc-950 space-y-8 border-t border-white/5">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/40">
                  <span>Pan Offset</span>
                  <span className="text-cyan-500">X: {cropRect.x}% Y: {cropRect.y}%</span>
                </div>
                <input type="range" min="0" max="100" value={cropRect.x} onChange={e => setCropRect(r => ({ ...r, x: Number(e.target.value) }))} className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                <input type="range" min="0" max="100" value={cropRect.y} onChange={e => setCropRect(r => ({ ...r, y: Number(e.target.value) }))} className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/40">
                  <span>Zoom Level</span>
                  <span className="text-cyan-500">{cropRect.w}%</span>
                </div>
                <input type="range" min="10" max="100" value={cropRect.w} onChange={e => setCropRect(r => ({ ...r, w: Number(e.target.value), h: Number(e.target.value) }))} className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AutoPlayVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, { threshold: 0.5 });
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isIntersecting) videoRef.current?.play().catch(() => {});
    else videoRef.current?.pause();
  }, [isIntersecting]);

  return (
    <video
      ref={videoRef}
      src={src}
      muted
      loop
      playsInline
      className="w-full h-full object-cover"
    />
  );
}

// ----------------------------------------------------------------------------
// 📸 Media Lightbox (Swipeable)
// ----------------------------------------------------------------------------
function Lightbox({ items, index, onClose }: { items: { url: string, type: string }[], index: number, onClose: () => void }) {
  const [curr, setCurr] = useState(index);
  const [scale, setScale] = useState(1);
  const { t } = useLanguage();

  useEffect(() => {
    const twa = (window as any).Telegram?.WebApp;
    if (twa?.BackButton) {
      twa.BackButton.show();
      twa.BackButton.onClick(onClose);
    }
    return () => {
      if (twa?.BackButton) {
        twa.BackButton.hide();
        twa.BackButton.offClick(onClose);
      }
    };
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[600] bg-black/95 flex flex-col items-center justify-center select-none backdrop-blur-3xl"
      onClick={onClose}
    >
      <div className="w-full flex-1 relative flex items-center justify-center overflow-hidden" onClick={e => e.stopPropagation()}>
         <motion.div 
           key={curr}
           initial={{ x: 100, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           exit={{ x: -100, opacity: 0 }}
           className="w-full h-full flex items-center justify-center p-4 touch-none"
           drag
           dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
           dragElastic={0.8}
           onDragEnd={(_, info) => {
             // Vertical dismiss
             if (Math.abs(info.offset.y) > 150) {
               onClose();
             }
             // Horizontal swiping
             else if (info.offset.x > 80 && curr > 0) setCurr(curr - 1);
             else if (info.offset.x < -80 && curr < items.length - 1) setCurr(curr + 1);
           }}
           style={{ scale }}
           onDoubleClick={() => setScale(s => s === 1 ? 2.5 : 1)}
         >
           {items[curr].type === "photo" ? (
             <img src={items[curr].url} className="max-w-full max-h-[90vh] object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg" />
           ) : (
             <video src={items[curr].url} controls autoPlay className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
           )}
         </motion.div>
      </div>

      {items.length > 1 && (
        <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-2.5">
          {items.map((_, i) => (
            <motion.div 
              key={i} 
              animate={{ width: i === curr ? 24 : 6, backgroundColor: i === curr ? "#06b6d4" : "rgba(255,255,255,0.2)" }}
              className="h-1.5 rounded-full transition-all" 
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ----------------------------------------------------------------------------
// 🖼️ Media Collage Component
// ----------------------------------------------------------------------------
function MediaCollage({ items }: { items: { url: string, type: string }[] }) {
  const [lbIndex, setLbIndex] = useState<number | null>(null);
  if (!items || items.length === 0) return null;
  const validItems = items.filter(item => item.url);
  const count = validItems.length;
  if (count === 0) return null;

  const handleImageClick = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLbIndex(idx);
  };

  return (
    <>
      <div className="mb-4">
        {count === 1 && (
          <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/20 shadow-inner cursor-pointer" onClick={(e) => handleImageClick(0, e)}>
            {validItems[0].type === "photo" ? (
              <img src={validItems[0].url} alt="signal" className="w-full h-auto max-h-[400px] object-contain" loading="lazy" />
            ) : (
              <AutoPlayVideo src={validItems[0].url} />
            )}
          </div>
        )}
        {count === 2 && (
          <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden border border-white/5 h-[280px]">
            {validItems.map((item, i) => (
              <div key={i} className="relative w-full h-full overflow-hidden cursor-pointer" onClick={(e) => handleImageClick(i, e)}>
                {item.type === "photo" ? <img src={item.url} className="w-full h-full object-cover" /> : <AutoPlayVideo src={item.url} />}
              </div>
            ))}
          </div>
        )}
        {count === 3 && (
          <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden border border-white/5 h-[300px]">
            <div className="h-full border-r border-white/5 cursor-pointer" onClick={(e) => handleImageClick(0, e)}>
              {validItems[0].type === "photo" ? <img src={validItems[0].url} className="w-full h-full object-cover" /> : <AutoPlayVideo src={validItems[0].url} />}
            </div>
            <div className="grid grid-rows-2 gap-1 h-full">
              <div className="h-full cursor-pointer" onClick={(e) => handleImageClick(1, e)}>
                {validItems[1].type === "photo" ? <img src={validItems[1].url} className="w-full h-full object-cover" /> : <AutoPlayVideo src={validItems[1].url} />}
              </div>
              <div className="h-full cursor-pointer" onClick={(e) => handleImageClick(2, e)}>
                {validItems[2].type === "photo" ? <img src={validItems[2].url} className="w-full h-full object-cover" /> : <AutoPlayVideo src={validItems[2].url} />}
              </div>
            </div>
          </div>
        )}
        {count >= 4 && (
          <div className="grid grid-cols-2 grid-rows-2 gap-1 rounded-2xl overflow-hidden border border-white/5 h-[300px]">
            {validItems.slice(0, 4).map((item, i) => (
              <div key={i} className="relative w-full h-full overflow-hidden cursor-pointer" onClick={(e) => handleImageClick(i, e)}>
                {item.type === "photo" ? <img src={item.url} className="w-full h-full object-cover" /> : <AutoPlayVideo src={item.url} />}
                {i === 3 && count > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-black text-xl">+{count - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lbIndex !== null && (
          <Lightbox items={validItems} index={lbIndex} onClose={() => setLbIndex(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ----------------------------------------------------------------------------
// 🔗 Linked Text Component (X-style Clickable Links & Mentions)
// ----------------------------------------------------------------------------
function LinkedText({ text, className = "" }: { text: string, className?: string }) {
  if (!text) return null;

  const openChannel = (handle: string) => {
    const clean = handle.replace(/^@/, "");
    const link = `https://t.me/${clean}`;
    const twa = (window as any).Telegram?.WebApp;
    if (twa?.openTelegramLink) {
      twa.openTelegramLink(link);
    } else {
      window.open(link, "_blank");
    }
  };

  // Split by URL (with or without http), or Mention
  // Regex explanation:
  // 1. https?:\/\/[^\s]+ -> Standard URL with protocol
  // 2. (?:\b[\w-]+\.)+(?:com|xyz|net|org|io|me|app|bot)(?:\/[^\s]*)? -> Domains without protocol
  // 3. @\w{3,} -> Mentions
  const parts = text.split(/(https?:\/\/[^\s]+|@\w{3,}|(?:\b[\w-]+\.)+(?:com|xyz|net|org|io|me|app|bot)(?:\/[^\s]*)?)/gi);

  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (!part) return null;
        
        // Protocol-based links
        if (/^https?:\/\//i.test(part)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/30 underline-offset-4 transition-colors"
            >
              {part}
            </a>
          );
        }
        
        // Protocol-less links (com, xyz, etc.)
        if (/^(?:[\w-]+\.)+(?:com|xyz|net|org|io|me|app|bot)/i.test(part)) {
          return (
            <a
              key={i}
              href={`https://${part}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/30 underline-offset-4 transition-colors"
            >
              {part}
            </a>
          );
        }

        // Mentions
        if (part.startsWith('@')) {
          return (
            <span
              key={i}
              onClick={(e) => { e.stopPropagation(); openChannel(part); }}
              className="text-cyan-400 font-bold hover:text-cyan-300 cursor-pointer transition-colors"
            >
              {part}
            </span>
          );
        }
        
        // Plain text
        return part;
      })}
    </p>
  );
}

// ----------------------------------------------------------------------------
// 📬 Post Card Component
// ----------------------------------------------------------------------------
function PostCard({
  post,
  currentUserId,
  starsBalance,
  onStarBalanceChange,
  isConnected,
  onHide,
  onRepost,
  onConnectRequired,
  onCommentClick,
  onPostClick,
  onStarGiftSuccess,
  onOpenBuyStars
}: {
  post: any,
  currentUserId: number,
  starsBalance: number,
  onStarBalanceChange: (delta: number) => void,
  isConnected: boolean,
  onHide: () => void,
  onRepost: () => void,
  onConnectRequired: () => void,
  onCommentClick: () => void,
  onPostClick: () => void,
  onStarGiftSuccess?: () => void,
  onOpenBuyStars?: () => void
}) {
  const { t } = useLanguage();
  const [isAcknowledged, setIsAcknowledged] = useState(post.is_acknowledged);
  const [localAckCount, setLocalAckCount] = useState(post.acknowledgments_count || 0);
  const [localStarCount, setLocalStarCount] = useState(post.stars_count || 0);
  const [starError, setStarError] = useState<string | null>(null);
  const [starGiftOpen, setStarGiftOpen] = useState(false);
  const [starGiftMode, setStarGiftMode] = useState<StarGiftModalMode>("setup");
  const [giftAmount, setGiftAmount] = useState(1);
  const [isReposted, setIsReposted] = useState(post.is_reposted);
  const [isCopying, setIsCopying] = useState(false);

  // Sync local count if post data updates from background revalidation
  useEffect(() => {
    setLocalAckCount(post.acknowledgments_count || 0);
  }, [post.acknowledgments_count]);
  const [isReposting, setIsReposting] = useState(false);
  const [showSpaceDust, setShowSpaceDust] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    setLocalAckCount((prev: number) => prev + 1);
    await postApi("/explore/acknowledge", { user_id: currentUserId, post_id: post.id });
  };

  const recipientName =
    post.channel?.title || post.user?.name || t("explore.gift_star_recipient_fallback");

  const openStarGiftFlow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStarError(null);
    if (post.tg_id === currentUserId) {
      setStarError(t("explore.gift_star_own_post"));
      return;
    }
    if ((starsBalance || 0) < 1) {
      onOpenBuyStars?.();
      return;
    }
    const saved = getSavedStarGiftAmount();
    setGiftAmount(saved);
    setStarGiftMode(hasCompletedStarGiftSetup() ? "confirm" : "setup");
    setStarGiftOpen(true);
  };

  const submitStarGiftInBackground = async (amount: number) => {
    try {
      const res = await postApi("/explore/star", {
        user_id: currentUserId,
        post_id: post.id,
        amount,
      });
      if (res?.success) {
        saveStarGiftAmount(amount);
        onStarGiftSuccess?.();
      } else if (res?.error === "INSUFFICIENT_STARS") {
        setLocalStarCount((prev: number) => Math.max(0, prev - amount));
        onStarBalanceChange(amount);
        onOpenBuyStars?.();
        setStarError(t("explore.gift_star_need_balance"));
      } else {
        setLocalStarCount((prev: number) => Math.max(0, prev - amount));
        onStarBalanceChange(amount);
        setStarError(t("explore.gift_star_failed"));
      }
    } catch {
      setLocalStarCount((prev: number) => Math.max(0, prev - amount));
      onStarBalanceChange(amount);
      setStarError(t("explore.gift_star_failed"));
    }
  };

  const handleStarGiftConfirm = (amount: number) => {
    if (starGiftMode === "setup") {
      setGiftAmount(amount);
      setStarGiftMode("confirm");
      return;
    }
    if ((starsBalance || 0) < amount) {
      setStarGiftOpen(false);
      onOpenBuyStars?.();
      return;
    }
    setStarGiftOpen(false);
    setLocalStarCount((prev: number) => prev + amount);
    onStarBalanceChange(-amount);
    void submitStarGiftInBackground(amount);
  };

  // 🔢 Compact number formatter: 1000 → 1k, 21000 → 21k, 100000 → 100k, 1000000 → 1m
  const fmt = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}m`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : (n >= 10_000 ? 0 : 1))}k`;
    return String(n);
  };

  // 🔗 Shareable post URL — points to the /post/[id] web page which has proper
  // Open Graph tags so Telegram generates a rich link preview (snippet).
  // That page auto-redirects users into the Bluewave mini app.
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bluewaveprotocol.com";
  const postLink = `${APP_URL}/post/${post.id}`;
  // Direct mini app deep link (used only for the Telegram forward action)
  const miniAppLink = `https://t.me/Bluewave_Ecosystem_bot/bluewave?startapp=post_${post.id}`;


  const handleForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    const forwardUrl = `https://t.me/share/url?url=${encodeURIComponent(postLink)}&text=${encodeURIComponent(post.content.slice(0, 100))}`;
    const twa = (window as any).Telegram?.WebApp;
    if (twa?.openTelegramLink) {
      twa.openTelegramLink(forwardUrl);
    } else {
      window.open(forwardUrl, "_blank");
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bluewave Post',
          text: post.content.slice(0, 100) + '...',
          url: postLink
        });
      } catch (err) { console.error("Share failed", err); }
    } else {
      handleCopyLink(e);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCopying) return;
    setIsCopying(true);
    // Copy the direct mini app deep link — opens the post straight in Bluewave
    navigator.clipboard.writeText(miniAppLink).then(() => {
      setTimeout(() => {
        setIsCopying(false);
        setIsMenuOpen(false);
      }, 1000);
    });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (!window.confirm("Delete this post permanently?")) return;
    onHide(); // Optimistic remove
    try {
      await postApi(`/explore/post/${post.id}`, {}, { method: "DELETE" });
    } catch (err) {
      console.error("Delete failed", err);
    }
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
    <div
      className="mx-3 mb-3 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent overflow-hidden relative hover:border-cyan-500/20 transition-all cursor-pointer"
      onClick={onPostClick}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400/90 via-cyan-500/40 to-purple-500/30" />
      <div className="p-4 flex flex-col gap-1 relative items-start pl-5">
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
          <div className={`w-11 h-11 rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-lg ${post.user?.is_live_on_telegram ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-black animate-pulse' : ''}`}>
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
                      className="absolute right-0 top-8 w-44 bg-zinc-950 border border-white/10 rounded-2xl z-30 shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden p-1.5"
                    >

                      <button onClick={handleCopyLink} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <Copy size={14} className={isCopying ? "text-green-400" : "text-cyan-400"} />
                        {isCopying ? "Copied!" : "Copy Link"}
                      </button>
                      <div className="h-px bg-white/5 my-1 mx-2" />
                      
                      {post.tg_id === currentUserId ? (
                        <button onClick={handleDelete} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-400/70 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all">
                          <X size={14} />
                          Delete Post
                        </button>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); handleHide(); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-orange-400/70 hover:text-orange-400 hover:bg-orange-500/5 rounded-xl transition-all">
                          <X size={14} />
                          {t("explore.not_interested")}
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <LinkedText text={post.content} className="text-sm text-white/90 leading-relaxed break-words whitespace-pre-wrap mb-3" />

          {/* Signal Content */}
          {post.post_type === 'live_scheduled' ? null : post.media_urls && post.media_urls.length > 0 ? (
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

          {/* ─── Action Bar: Comment · Like · Star · Repost (left) | Views (right) ─── */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
            {/* Left: Comment + Like + Star + Repost — X/Twitter scale, full visibility */}
            <div className="flex items-center gap-6">

              {/* Comment — open for everyone */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCommentClick();
                }}
                className="flex items-center gap-2 group transition-all"
              >
                <MessageCircle size={18} className="text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                <span className="text-[12px] font-bold font-mono text-cyan-400 group-hover:text-cyan-300 transition-colors">
                  {fmt(post.comments_count || 0)}
                </span>
              </button>

              {/* Like (Acknowledge) */}
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
                  className="flex items-center gap-2 group transition-all"
                >
                  <Heart
                    size={18}
                    fill={isAcknowledged ? "currentColor" : "none"}
                    className={`transition-all ${
                      isAcknowledged
                        ? "text-cyan-400 scale-110"
                        : "text-cyan-400 group-hover:text-cyan-300"
                    }`}
                  />
                  <span className={`text-[12px] font-bold font-mono transition-colors ${
                    isAcknowledged ? "text-cyan-400" : "text-cyan-400 group-hover:text-cyan-300"
                  }`}>
                    {fmt(localAckCount)}
                  </span>
                </button>
              </div>

              <button
                onClick={openStarGiftFlow}
                title={t("explore.gift_star_hint")}
                className="flex items-center gap-2 group transition-all"
              >
                <Star
                  size={18}
                  fill="none"
                  className="text-amber-400/80 group-hover:text-amber-300 transition-all"
                />
                <span className="text-[12px] font-bold font-mono text-amber-400/80">
                  {fmt(localStarCount)}
                </span>
              </button>

              {/* Repost */}
              <button
                onClick={handleRepost}
                disabled={isReposted || isReposting}
                className={`flex items-center gap-2 transition-all ${
                  isReposted ? "text-cyan-400" : isReposting ? "text-cyan-400/50" : "text-cyan-400/60 hover:text-cyan-400"
                }`}
              >
                {isReposting
                  ? <Loader2 size={16} className="animate-spin" />
                  : <Repeat2 size={18} className={isReposted ? "rotate-180" : ""} />
                }
                {(post.reposts_count || 0) > 0 && (
                  <span className="text-[12px] font-bold font-mono">{fmt(post.reposts_count || 0)}</span>
                )}
              </button>

            </div>

            {/* Right: Views */}
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-cyan-400/60" />
              <span className="text-[12px] font-bold font-mono text-cyan-400/60">
                {fmt(post.views_count || post.views || 0)}
              </span>
            </div>
          </div>
          {starError && (
            <p className="text-[10px] text-amber-400/90 mt-1 font-medium">{starError}</p>
          )}
        </div>
      </div>
      </div>

      <StarGiftModal
        isOpen={starGiftOpen}
        mode={starGiftMode}
        recipientName={recipientName}
        starsBalance={starsBalance}
        initialAmount={giftAmount}
        isSubmitting={false}
        onClose={() => setStarGiftOpen(false)}
        onConfirm={handleStarGiftConfirm}
        onEditAmount={() => setStarGiftMode("setup")}
      />
    </div>
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
    if (type.startsWith("verified_repost_milestone")) return <Repeat2 size={18} className="text-cyan-40" />;
    switch (type) {
      case "post_uploaded": return <Rocket size={18} className="text-cyan-400" />;
      case "acknowledged": return <Heart size={18} fill="currentColor" className="text-cyan-400" />;
      case "reposted": return <Repeat2 size={18} className="text-cyan-400" />;
      case "commented": return <MessageCircle size={18} className="text-cyan-400" />;
      case "comment_replied": return <MessageCircle size={18} className="text-cyan-400" />;
      case "comment_liked": return <Heart size={18} fill="currentColor" className="text-cyan-400" />;
      case "new_follower": return <Plus size={18} className="text-cyan-400" />;
      case "star_gift": return <Star size={18} fill="currentColor" className="text-amber-400" />;
      case "mentioned_in_post":
      case "mentioned_in_comment": return <UserCheck size={18} className="text-cyan-400" />;
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
    if (n.type === "commented") return t("notifications.comment_title");
    if (n.type === "comment_replied") return t("notifications.comment_reply_title");
    if (n.type === "comment_liked") return t("notifications.comment_like_title");
    if (n.type === "new_follower") return t("notifications.new_follower") || "New Follower";
    if (n.type === "star_gift") return t("notifications.star_gift_title");
    if (n.type === "mentioned_in_post") return t("notifications.mentioned_in_post_title");
    if (n.type === "mentioned_in_comment") return t("notifications.mentioned_in_comment_title");
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
      return t("notifications.comment_msg").replace("{{name}}", firstName);
    }
    if (n.type === "comment_replied") {
      const firstName = n.from_user?.first_name || n.from_user?.name?.split(" ")[0] || "Someone";
      return t("notifications.comment_reply_msg").replace("{{name}}", firstName);
    }
    if (n.type === "comment_liked") {
      const firstName = n.from_user?.first_name || n.from_user?.name?.split(" ")[0] || "Someone";
      return t("notifications.comment_like_msg").replace("{{name}}", firstName);
    }
    if (n.type === "new_follower") {
      const firstName = n.from_user?.first_name || n.from_user?.name?.split(" ")[0] || "Someone";
      return (t("notifications.new_follower_msg") || "{{name}} followed your channel.").replace("{{name}}", firstName);
    }
    if (n.type === "star_gift") {
      const firstName = n.from_user?.first_name || n.from_user?.name?.split(" ")[0] || "Someone";
      return t("notifications.star_gift_msg").replace("{{name}}", firstName);
    }
    if (n.type === "mentioned_in_post") {
      const firstName = n.from_user?.first_name || n.from_user?.name?.split(" ")[0] || "Someone";
      return t("notifications.mentioned_in_post_msg").replace("{{name}}", firstName);
    }
    if (n.type === "mentioned_in_comment") {
      const firstName = n.from_user?.first_name || n.from_user?.name?.split(" ")[0] || "Someone";
      return t("notifications.mentioned_in_comment_msg").replace("{{name}}", firstName);
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
                {(n.type === "acknowledged" || n.type === "reposted" || n.type === "new_follower" || n.type.startsWith("verified_repost_milestone") || n.type === "commented" || n.type === "comment_replied" || n.type === "comment_liked" || n.type === "mentioned_in_post" || n.type === "mentioned_in_comment") && n.from_user ? (
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
  const [commentImage, setCommentImage] = useState<string | null>(null); // base64 preview
  const [commentImageUploading, setCommentImageUploading] = useState(false);
  const commentImageInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle image selection for comment
  const handleCommentImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCommentImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    // Reset input so same file can be reselected
    e.target.value = "";
  };

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
    if (!content.trim() && !commentImage) return;
    setPosting(true);

    let uploadedMediaUrl: string | null = null;

    // Upload image if attached
    if (commentImage) {
      setCommentImageUploading(true);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        const b64 = commentImage.split(",")[1]; // strip data:image/...;base64,
        const ext = commentImage.split(";")[0].split("/")[1] || "jpg";
        const uploadRes = await fetch(`${apiBase}/explore/upload_comment_image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: telegramUser.id, image_b64: b64, ext }),
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) uploadedMediaUrl = uploadData.url;
      } catch (e) {
        console.warn("Comment image upload failed:", e);
      } finally {
        setCommentImageUploading(false);
      }
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      post_id: post.id,
      user_id: telegramUser.id,
      parent_id: replyTo?.id || null,
      content: content.trim(),
      media_url: uploadedMediaUrl || commentImage, // show preview optimistically
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
    setCommentImage(null);
    const prevReplyTo = replyTo;
    setReplyTo(null);

    try {
      const res = await postApi(`/explore/post/${post.id}/comment`, {
        user_id: telegramUser.id,
        content: optimisticComment.content,
        parent_id: optimisticComment.parent_id,
        media_url: uploadedMediaUrl || undefined,
      });

      if (res.success) {
        mutateComments();
        onRefresh();
      }
    } catch (err) {
      setLocalComments(prev => prev.filter(c => c.id !== tempId));
      setContent(optimisticComment.content);
      setCommentImage(optimisticComment.media_url || null);
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

  // 🔗 Open commenter's Telegram profile
  const openCommenterProfile = (username?: string, tgId?: number) => {
    const twa = (window as any).Telegram?.WebApp;
    let link = "";
    if (username) {
      link = `https://t.me/${username.replace(/^@/, "")}`;
    } else if (tgId) {
      // Deep link by Telegram user ID (works even without a public username)
      link = `tg://user?id=${tgId}`;
    }
    if (!link) return;
    if (twa?.openTelegramLink) twa.openTelegramLink(link);
    else window.open(link, "_blank");
  };

  const renderComments = (parentId: number | null = null, depth = 0) => {
    return localComments
      .filter(c => c.parent_id === parentId)
      .map(comment => (
        <div key={comment.id} id={`comment-${comment.id}`} className="flex flex-col">
          <div className={`flex gap-3 py-4 ${depth > 0 ? "ml-6 border-l border-white/5 pl-4" : ""} ${comment.id === commentId ? "bg-cyan-500/5 rounded-xl px-2 -mx-2" : ""}`}>
            {/* Avatar — clickable to open Telegram profile */}
            <button
              onClick={() => openCommenterProfile(comment.user.username, comment.user.tg_id)}
              className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10 bg-black/40 shadow-sm active:scale-90 transition-transform"
            >
              {comment.user.photo ? (
                <img src={comment.user.photo} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-cyan-500/10 text-cyan-400 font-black text-[10px]">
                  {comment.user.name?.[0]}
                </div>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {/* Name — also clickable to open Telegram profile */}
                <button
                  onClick={() => openCommenterProfile(comment.user.username, comment.user.tg_id)}
                  className="text-white font-bold text-[11px] truncate tracking-tight uppercase hover:text-cyan-400 transition-colors active:scale-95"
                >
                  {comment.user.name}
                </button>
                <span className="text-[9px] text-white/20 font-mono">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {/* Comment image — show if exists */}
              {comment.media_url && (
                <div className="mb-3 rounded-2xl overflow-hidden border border-white/10 max-w-[240px]">
                  <img src={comment.media_url} alt="comment media" className="w-full h-auto object-cover" loading="lazy" />
                </div>
              )}
              <LinkedText text={comment.content} className="text-[13px] text-white/80 leading-relaxed mb-3 whitespace-pre-wrap" />
              <div className="flex items-center gap-6">
                <button
                  onClick={() => handleToggleLike(comment.id)}
                  className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-colors ${comment.is_liked ? "text-cyan-400" : "text-white/20 hover:text-white"}`}
                >
                  <Heart size={11} fill={comment.is_liked ? "currentColor" : "none"} strokeWidth={3} />
                  {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
                </button>
                <button
                  onClick={() => {
                    setReplyTo(comment);
                    const input = document.getElementById('comment-input');
                    input?.focus();
                  }}
                  className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors"
                >
                  <MessageCircle size={11} strokeWidth={3} />
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
      className="fixed inset-0 z-[500] bg-black/95 flex flex-col items-center justify-end backdrop-blur-2xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 32, stiffness: 300, mass: 1 }}
        className="w-full max-w-xl bg-zinc-950 flex flex-col shadow-[0_-20px_100px_rgba(0,0,0,1)] overflow-hidden border-t border-white/5"
        style={{
          height: "calc(100vh - env(safe-area-inset-top, 0px) - var(--tg-content-safe-area-inset-top, 0px) - 60px)"
        }}
        onClick={(e) => e.stopPropagation()}
      >


        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-40">
          {loading ? (
            <div className="py-32 flex flex-col items-center gap-4 opacity-50">
              <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500">Loading</p>
            </div>
          ) : (
            <div className="py-6 space-y-8">
              <div
                className="flex items-center gap-4 cursor-pointer group"
                onClick={() => {
                  const handle = post.channel?.handle || post.user?.handle;
                  if (handle) {
                    const clean = handle.replace(/^@/, "");
                    const link = `https://t.me/${clean}`;
                    const twa = (window as any).Telegram?.WebApp;
                    if (twa?.openTelegramLink) twa.openTelegramLink(link);
                    else window.open(link, "_blank");
                  }
                }}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-black/40 shrink-0 group-hover:border-cyan-500/50 transition-colors">
                  {(post.channel?.photo || post.user?.photo) ? (
                    <img src={post.channel?.photo || post.user.photo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-cyan-500/10 text-cyan-400 font-black text-lg">
                      {(post.channel?.title || post.user?.name || 'U')[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-black text-[15px] tracking-tight truncate group-hover:text-cyan-400 transition-colors uppercase">{post.channel?.title || post.user?.name}</h4>
                  <p className="text-[11px] text-white/30 font-mono">@{(post.channel?.handle || post.user?.handle || 'anon').replace(/^@/, '')}</p>
                </div>
              </div>

              <LinkedText text={post.content} className="text-xl text-white font-medium leading-[1.6] tracking-tight mb-8 whitespace-pre-wrap selection:bg-cyan-500/30" />

              {post.media_urls && post.media_urls.length > 0 && (
                <MediaCollage items={post.media_urls} />
              )}

              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between py-4 border-y border-white/5">
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-black text-white">{post.acknowledgments_count || 0}</span>
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Likes</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-black text-white">{post.reposts_count || 0}</span>
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Reposts</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-black text-white">{post.views || 0}</span>
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Views</span>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-tighter">
                    {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="space-y-4">
                  {localComments.length === 0 ? (
                    <div className="py-16 text-center opacity-20 flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-2">
                        <MessageCircle size={32} strokeWidth={1.5} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">No comments yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.03]">
                      {renderComments()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-2xl border-t border-white/5 pb-[calc(env(safe-area-inset-bottom,20px)+20px)] max-w-xl mx-auto">
          {/* Hidden image file input */}
          <input
            ref={commentImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCommentImageSelect}
          />

          {/* Reply banner */}
          {replyTo && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center justify-between bg-cyan-500/10 px-4 py-2 border-x border-t border-cyan-500/20">
              <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">
                Replying to <span className="text-white">{replyTo.user.name}</span>
              </span>
              <button onClick={() => setReplyTo(null)} className="text-cyan-400 p-1">
                <X size={14} />
              </button>
            </motion.div>
          )}

          {/* Image preview strip */}
          {commentImage && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 pt-3"
            >
              <div className="relative">
                <img src={commentImage} alt="preview" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
                <button
                  onClick={() => setCommentImage(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black/80 rounded-full border border-white/20 flex items-center justify-center"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
              <span className="text-[10px] text-white/40 font-mono">Image attached</span>
            </motion.div>
          )}

          {/* Input row */}
          <div className={`flex items-end gap-3 p-3 m-3 mt-2 bg-white/[0.03] border border-white/10 ${
            replyTo ? 'rounded-2xl' : 'rounded-3xl'
          } focus-within:border-cyan-500/30 transition-all shadow-2xl`}>

            {/* Image attach button */}
            <button
              onClick={() => commentImageInputRef.current?.click()}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all active:scale-90"
            >
              <ImageIcon size={18} />
            </button>

            <textarea
              id="comment-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Post your reply…"
              className="flex-1 bg-transparent border-none outline-none text-sm text-white py-2 resize-none max-h-32 min-h-[40px] custom-scrollbar"
              rows={1}
            />
            <button
              onClick={handlePostComment}
              disabled={posting || commentImageUploading || (!content.trim() && !commentImage)}
              className="w-10 h-10 rounded-full bg-cyan-500 text-black flex items-center justify-center shrink-0 active:scale-95 transition-all disabled:opacity-30 shadow-[0_0_20px_rgba(0,230,255,0.2)]"
            >
              {(posting || commentImageUploading) ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
