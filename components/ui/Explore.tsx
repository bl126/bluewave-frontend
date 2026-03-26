"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Bell,
  BarChart2,
  ChevronDown,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  ShieldCheck,
  Rocket,
  Plus,
  X,
  Image,
  Video,
  Send
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi, postApi } from "@/lib/useApi";
import Leaderboard from "./Leaderboard";

const ADMIN_IDS = [5023869471];

interface ExploreProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
}

export default function Explore({ isOpen, onClose, telegramUser }: ExploreProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"foryou" | "following" | "leaderboard" | "notifications">("foryou");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isLeaderboardSheetOpen, setIsLeaderboardSheetOpen] = useState(false);
  const [latestKnownPostId, setLatestKnownPostId] = useState<number | string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const feedTopRef = useRef<HTMLDivElement>(null);

  // Scroll hide/show state
  const [showChrome, setShowChrome] = useState(true);
  const lastScrollY = useRef(0);

  // Touch/Swipe
  const touchStart = useRef<number | null>(null);

  // New posts pill

  const [newPostsAvailable, setNewPostsAvailable] = useState(false);


  // Fetch Notifications
  const { data: notifications, mutate: mutateNotifications } = useApi(
    isOpen && telegramUser?.id ? `/explore/notifications/${telegramUser.id}` : null,
    { refreshInterval: 30000 }
  );
  const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;

  // Fetch Feed
  const { data: posts, loading, mutate } = useApi(
    isOpen && telegramUser?.id ? `/explore/feed?tg_id=${telegramUser.id}&tab=${activeTab}` : null
  );

  // Track latest post ID for new-posts pill
  useEffect(() => {
    if (posts && posts.length > 0) {
      const topId = posts[0]?.id;
      if (!latestKnownPostId) {
        setLatestKnownPostId(topId);
      } else if (topId !== latestKnownPostId) {
        setNewPostsAvailable(true);
      }
    }
  }, [posts]);

  // Poll for new posts every 15s
  useEffect(() => {
    if (!isOpen || !telegramUser?.id) return;
    const interval = setInterval(async () => {
      if (!latestKnownPostId) return;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      try {
        const res = await fetch(`${apiUrl}/api/explore/feed?tg_id=${telegramUser.id}&tab=${activeTab}&offset=0`);
        const data = await res.json();
        if (data && data.length > 0 && data[0]?.id !== latestKnownPostId) {
          setNewPostsAvailable(true);
        }
      } catch { /* silent */ }
    }, 15000);
    return () => clearInterval(interval);
  }, [isOpen, telegramUser?.id, activeTab, latestKnownPostId]);

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

  // Swipe tab switch
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.targetTouches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    const tabs: ("foryou" | "following" | "leaderboard" | "notifications")[] = ["foryou", "following", "leaderboard", "notifications"];
    const currentIndex = tabs.indexOf(activeTab);

    if (Math.abs(diff) > 80) {
      if (diff > 0 && currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      } else if (diff < 0 && currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    }
    touchStart.current = null;
  };

  // Scroll to top + refresh
  const handleNewPostsPill = () => {
    setNewPostsAvailable(false);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    mutate();
    if (posts && posts.length > 0) setLatestKnownPostId(posts[0]?.id);
  };

  // Handle tab switch
  const handleTabClick = (tab: "foryou" | "following" | "leaderboard" | "notifications") => {
    setActiveTab(tab);
    if (tab === "notifications" && telegramUser?.id) {
      postApi("/explore/notifications/clear", { tg_id: telegramUser.id }).then(() => mutateNotifications());
    }
  };

  if (!isOpen) return null;

  const isAdmin = telegramUser?.id ? ADMIN_IDS.includes(Number(telegramUser.id)) : false;

  if (!isAdmin) {
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
      className={`fixed inset-0 bg-black flex flex-col overflow-hidden text-cyan-200 ${(isPostModalOpen || isLeaderboardSheetOpen) ? "z-[210]" : "z-[120]"}`}
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
                  <Bell size={18} className={activeTab === tab ? "text-cyan-400" : "text-white/30"} />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1.5 -right-2 w-3 h-3 bg-cyan-500 rounded-full flex items-center justify-center text-[7px] text-black font-black shadow-[0_0_8px_#00e6ff]">
                      {unreadCount > 9 ? "!" : unreadCount}
                    </div>
                  )}
                </div>
              )}
              {tab === "leaderboard" && <BarChart2 size={18} className={activeTab === tab ? "text-cyan-400" : "text-white/30"} />}

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
        {newPostsAvailable && (
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

      {/* ─── Main Content Area ─── */}
      <div ref={feedTopRef} />
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onTouchStart={onTouchStart}
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
              {loading && !posts && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                  <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t("explore.hydrating")}</span>
                </div>
              )}

              {posts?.map((post: any) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onHide={() => mutate()}
                />
              ))}

              {!loading && posts?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4 opacity-40 px-6">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl">🕳️</div>
                  <div className="space-y-1">
                    <p className="font-black uppercase tracking-widest text-xs">
                      {activeTab === "following" ? t("explore.no_following") : t("explore.no_signals")}
                    </p>
                    <p className="text-[10px] text-white/50 max-w-[200px]">
                      {activeTab === "following" ? t("explore.no_following_desc") : t("explore.no_signals_desc")}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── FAB Post Button ─── */}
      <AnimatePresence>
        {showChrome && activeTab !== "leaderboard" && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            transition={{ duration: 0.12, ease: "easeInOut" }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsPostModalOpen(true)}
            className="fixed right-5 bottom-28 w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center text-black shadow-[0_0_10px_rgba(6,182,212,0.3)] z-[160] border-4 border-black/20 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Plus size={22} strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Post Modal ─── */}
      <AnimatePresence>
        {isPostModalOpen && (
          <PostModal
            telegramUser={telegramUser}
            onClose={() => setIsPostModalOpen(false)}
            onPosted={() => { mutate(); setIsPostModalOpen(false); }}
          />
        )}
      </AnimatePresence>

    </motion.div >
  );
}

// ----------------------------------------------------------------------------
// 📤 Post Modal (X-style)
// ----------------------------------------------------------------------------
function PostModal({ telegramUser, onClose, onPosted }: { telegramUser: any, onClose: () => void, onPosted: () => void }) {
  const { t } = useLanguage();
  const [content, setContent] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaBase64, setMediaBase64] = useState<string>("");
  const [mediaType, setMediaType] = useState<"photo" | "video" | "text">("text");
  const [mediaExt, setMediaExt] = useState("jpg");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    setMediaType(isVideo ? "video" : "photo");
    setMediaExt(file.name.split(".").pop() || (isVideo ? "mp4" : "jpg"));
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setMediaPreview(dataUrl);
      setMediaBase64(dataUrl.split(",")[1] || "");
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!content.trim() && !mediaBase64) return;
    setPosting(true);
    setError(null);
    try {
      const res = await postApi("/explore/post", {
        tg_id: telegramUser.id,
        content: content.trim(),
        media_base64: mediaBase64,
        media_type: mediaBase64 ? mediaType : "text",
        media_ext: mediaExt,
      });
      if (res?.success) {
        onPosted();
      } else {
        const errDetail = res?.detail || res?.error;
        setError(errDetail === "AUTH_EXPIRED" || errDetail === "AUTH_REQUIRED" ? t("missions.session_expired") : (errDetail || t("explore.post_error_channel")));
      }
    } catch {
      setError(t("explore.post_error_network"));
    } finally {
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
              onClick={() => { setMediaPreview(null); setMediaBase64(""); setMediaType("text"); }}
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
          <video src={item.url} controls className="w-full h-auto max-h-[400px]" playsInline />
        )}
      </div>
    );
  }
  if (count === 2) {
    return (
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl overflow-hidden border border-white/5 h-[200px]">
        {validItems.map((item, i) => (
          <div key={i} className="relative w-full h-full">
            {item.type === "photo" ? <img src={item.url} className="w-full h-full object-cover" /> : <video src={item.url} className="w-full h-full object-cover" />}
          </div>
        ))}
      </div>
    );
  }
  if (count === 3) {
    return (
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl overflow-hidden border border-white/5 h-[250px]">
        <div className="h-full"><img src={validItems[0].url} className="w-full h-full object-cover" /></div>
        <div className="grid grid-rows-2 gap-1 h-full">
          <img src={validItems[1].url} className="w-full h-full object-cover" />
          <img src={validItems[2].url} className="w-full h-full object-cover" />
        </div>
      </div>
    );
  }
  return (
    <div className="mb-4 grid grid-cols-2 grid-rows-2 gap-1 rounded-2xl overflow-hidden border border-white/5 h-[300px]">
      {validItems.slice(0, 4).map((item, i) => (
        <div key={i} className="relative w-full h-full">
          <img src={item.url} className="w-full h-full object-cover" />
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
function PostCard({ post, onHide }: { post: any, onHide: () => void }) {
  const { t } = useLanguage();
  const [isAcknowledged, setIsAcknowledged] = useState(post.is_acknowledged);
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
    await postApi("/explore/acknowledge", { user_id: post.tg_id, post_id: post.id });
  };

  const handleHide = async () => {
    setIsMenuOpen(false);
    await postApi("/explore/hide_post", { user_id: post.tg_id, post_id: post.id });
    onHide();
  };

  // Direct link to Telegram channel
  const openChannel = () => {
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
    if (twa?.openTelegramLink) twa.openTelegramLink(link);
    else window.open(link, "_blank");
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <div className="p-4 flex gap-4 relative hover:bg-white/[0.01] transition-all items-start">
      {/* Avatar → direct channel link */}
      <button onClick={openChannel} className="shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-black/40 shadow-lg">
          {post.channel?.photo && !imgError ? (
            <img src={post.channel.photo} onError={() => setImgError(true)} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-cyan-500 bg-cyan-500/10 font-black text-xs">
              {post.channel?.title?.[0] || "B"}
            </div>
          )}
        </div>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center justify-between gap-2 mb-1">
          {/* Channel name → direct link */}
          <button onClick={openChannel} className="flex items-center gap-1.5 truncate">
            <span className="text-white font-bold text-[13px] truncate uppercase tracking-tight">{post.channel?.title}</span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-white/40 font-bold uppercase">{timeAgo(post.created_at)}</span>
            <div className="relative" ref={rowMenuRef}>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 text-white/30 hover:text-white">
                <MoreHorizontal size={14} />
              </button>
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, x: 10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95, x: 10 }}
                    className="absolute right-0 top-6 w-36 bg-black border border-white/10 rounded-xl z-30 shadow-2xl overflow-hidden"
                  >
                    <button onClick={handleHide} className="w-full text-left px-3 py-3 text-[9px] font-black uppercase tracking-widest text-orange-400 hover:bg-orange-500/10">
                      {t("explore.not_interested")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <p className="text-sm text-cyan-100/70 leading-relaxed break-words whitespace-pre-wrap mb-3">{post.content}</p>

        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 ? (
          <MediaCollage items={post.media_urls} />
        ) : post.media_url ? (
          <div className="mb-4 rounded-2xl overflow-hidden border border-white/5 bg-black/20 shadow-inner">
            {post.media_type === "photo" ? (
              <img src={post.media_url} alt="signal" className="w-full h-auto max-h-[400px] object-contain" loading="lazy" />
            ) : post.media_type === "video" ? (
              <video src={post.media_url} controls className="w-full h-auto max-h-[400px]" playsInline />
            ) : null}
          </div>
        ) : null}

        {/* Bottom row: Acknowledge + Views */}
        <div className="flex items-center justify-between">
          <div className="relative">
            {/* Space Dust — anchored to the acknowledge button */}
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
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${isAcknowledged
                ? "bg-cyan-500 text-black shadow-[0_0_10px_#00e6ff80]"
                : "bg-white/[0.03] text-cyan-400/50 hover:bg-white/10"
                }`}
            >
              <CheckCircle2 size={12} />
              {isAcknowledged ? t("explore.acknowledged") : t("explore.acknowledge")}
            </button>
          </div>

          <div className="flex items-center gap-1 opacity-40 pr-1">
            <Eye size={10} />
            <span className="text-[9px] font-mono font-bold">{post.views || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 🔔 Notifications View (Inline)
// ----------------------------------------------------------------------------
function NotificationsView({ notifications, onClear }: { notifications: any[], onClear: () => void }) {
  const { t } = useLanguage();

  const getIcon = (type: string) => {
    switch (type) {
      case "post_uploaded": return <Rocket size={18} className="text-cyan-400" />;
      case "acknowledged": return <ShieldCheck size={18} className="text-cyan-400" />;
      default: return <Bell size={18} className="text-cyan-400" />;
    }
  };

  const getTitle = (n: any) => {
    if (n.type === "post_uploaded") return t("notifications.distribution_success");
    if (n.type === "acknowledged") return t("notifications.acknowledgment");
    return t("notifications.notification_type");
  };

  const getMessage = (n: any) => {
    if (n.type === "post_uploaded") return t("notifications.broadcast_msg");
    if (n.type === "acknowledged") return t("notifications.acknowledged_msg").replace("{{name}}", n.from_user?.name || "Verified human");
    return t("notifications.update_msg");
  };

  return (
    <div className="space-y-3">
      {notifications.length === 0 ? (
        <div className="py-20 text-center opacity-20 flex flex-col items-center gap-3">
          <div className="p-4 rounded-full bg-white/5">
            <Bell size={32} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest">{t("notifications.empty")}</p>
        </div>
      ) : (
        notifications.map((n: any) => (
          <div
            key={n.id}
            className={`flex gap-4 p-4 rounded-2xl items-center transition-all ${n.is_read
              ? "bg-white/[0.01] border border-white/[0.03] opacity-50"
              : "bg-cyan-500/[0.03] border border-cyan-500/20 shadow-[0_0_15px_rgba(0,230,255,0.05)]"
              }`}
          >
            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border ${n.is_read ? "bg-white/5 border-white/5" : "bg-cyan-500/10 border-cyan-500/20"
              }`}>
              {getIcon(n.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-black uppercase tracking-tight truncate ${n.is_read ? "text-white/60" : "text-white"}`}>
                {getTitle(n)}
              </p>
              <p className={`text-[10px] leading-relaxed ${n.is_read ? "text-white/30" : "text-white/50"}`}>
                {getMessage(n)}
              </p>
            </div>
            {!n.is_read && (
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#00e6ff]" />
            )}
          </div>
        ))
      )}
    </div>
  );
}
