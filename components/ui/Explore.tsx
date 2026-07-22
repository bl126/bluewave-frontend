"use client";

import useSWR from "swr";
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
  Gamepad2,
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
  ArrowUp,
  Trophy,
  User,
  Lock,
  Search,
  Sparkles,
  Coins,
  Award,
  Megaphone,
  Layers,
  Wrench,
  Maximize2,
  Minimize2
} from "lucide-react";
import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useApi, postApi, getApi, useSync } from "@/lib/useApi";
import Leaderboard from "./Leaderboard";
import ConnectBluModal from "./ConnectBluModal";
import ReferralShareModal from "./ReferralShareModal";
import { hasExploreBetaAccess } from "@/lib/exploreAccess";
import { LiveNowTray, MiniAppCarousel, MOCK_MINI_APPS } from "@/components/explore/ExploreDiscoverChrome";
import StarGiftModal, {
  getSavedStarGiftAmount,
  hasCompletedStarGiftSetup,
  saveStarGiftAmount,
  type StarGiftModalMode,
} from "@/components/explore/StarGiftModal";
import LinkPreviewCard from "./LinkPreviewCard";

const openChannel = (handle: string) => {
  const clean = handle.replace(/^@/, "");
  const link = `https://t.me/${clean}`;
  const twa = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;
  if (twa?.openTelegramLink) {
    twa.openTelegramLink(link);
  } else if (typeof window !== "undefined") {
    window.open(link, "_blank");
  }
};

const openExternalLink = (url: string, e?: React.MouseEvent) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const twa = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;
  if (url.includes("t.me/") || url.includes("telegram.me/")) {
    if (twa?.openTelegramLink) {
      twa.openTelegramLink(url);
      return;
    }
  }
  if (twa?.openLink) {
    twa.openLink(url);
  } else if (typeof window !== "undefined") {
    window.open(url, "_blank");
  }
};

const DepositModal = dynamic(() => import("./DepositModal"), { ssr: false });
const WalletRequiredBeforeDepositModal = dynamic(
  () => import("./WalletRequiredBeforeDepositModal"),
  { ssr: false }
);
const StarWithdrawalModal = dynamic(
  () => import("./StarWithdrawalModal"),
  { ssr: false }
);

const MINI_APP_INSERT_EVERY = 20;

const AnimatedAIIcon = ({ size = 16 }: { size?: number }) => (
  <span className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/20 opacity-75"></span>
    <Sparkles size={size - 2} className="text-white relative z-10 animate-[spin_5s_linear_infinite]" />
  </span>
);

const VerifiedBadge = ({ className = "text-white shrink-0", size = 16 }: { className?: string, size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-13 5l-4-4 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

const Tooltip = ({
  id,
  activeId,
  title,
  content,
  targetRect
}: {
  id: string,
  activeId: string | null,
  title: string,
  content: string,
  targetRect: DOMRect | null
}) => {
  // Position it above the button (68px offset)
  const top = targetRect ? targetRect.top - 68 : 0;
  const left = targetRect ? Math.max(12, Math.min((typeof window !== "undefined" ? window.innerWidth : 360) - 220, targetRect.left + (targetRect.width / 2) - 104)) : 0;

  return (
    <AnimatePresence>
      {activeId === id && targetRect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="fixed z-[1200] w-52 bg-zinc-950/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-3 shadow-2xl pointer-events-none text-left"
          style={{
            top: top,
            left: left
          }}
        >
          {/* Arrow pointing down */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full border-[5px] border-transparent border-t-zinc-950/95" />
          <p className="text-[10px] font-black text-white uppercase tracking-widest mb-0.5">{title}</p>
          <p className="text-[9px] leading-relaxed text-white/50 font-semibold">{content}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function SwapTabComponent() {
  return (
    <div className="flex flex-col items-center px-5 pt-6 pb-32 text-left">
      <div className="w-full max-w-sm">
        {/* Swap Card */}
        <div className="w-full bg-zinc-950/80 border border-white/[0.06] rounded-[2rem] p-5 shadow-2xl relative overflow-hidden flex flex-col gap-1.5">
          {/* Top Token Pay Box */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">You Send</span>
            <div className="flex items-center justify-between mt-1">
              <input
                type="text"
                disabled
                value="0"
                className="bg-transparent text-white/80 text-3xl font-bold focus:outline-none w-1/2"
              />
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 rounded-full shrink-0">
                <span className="text-white/70 text-sm font-black uppercase tracking-wider">TON</span>
                <ChevronDown size={14} className="text-white/40" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-1 text-[10px] font-black uppercase tracking-wider text-white/30">
              <span>$0</span>
              <span>Balance: 0</span>
            </div>
          </div>

          {/* Swap divider circle */}
          <div className="relative flex items-center justify-center my-0.5 z-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.04]"></div>
            </div>
            <button disabled className="w-8 h-8 rounded-full bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-white/60 active:scale-90 transition-transform">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 5 4 4-4 4M16 9H3M12 19l-4-4 4-4M8 15h13"/></svg>
            </button>
          </div>

          {/* Bottom Token Receive Box */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">You Receive</span>
            <div className="flex items-center justify-between mt-1">
              <input
                type="text"
                disabled
                value="0"
                className="bg-transparent text-white/80 text-3xl font-bold focus:outline-none w-1/2"
              />
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 rounded-full shrink-0">
                <span className="text-white/70 text-sm font-black uppercase tracking-wider">USDT</span>
                <ChevronDown size={14} className="text-white/40" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-1 text-[10px] font-black uppercase tracking-wider text-white/30">
              <span>$0</span>
              <span>Balance: 0</span>
            </div>
          </div>

          {/* CTA Submit Button */}
          <button disabled className="mt-4 w-full py-4 rounded-2xl bg-white/[0.04] text-white/25 font-black uppercase tracking-widest text-xs border border-white/[0.06]">
            Enter an amount
          </button>
        </div>

        {/* Footer Dedust notice */}
        <p className="text-center text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-5">
          Powered by DeDust · Coming Soon
        </p>
      </div>
    </div>
  );
}

function PostCardSkeleton() {
  return (
    <div className="flex gap-4 p-4 border-b border-white/[0.06] animate-pulse w-full text-left">
      {/* Avatar */}
      <div className="w-11 h-11 rounded-2xl bg-white/10 shrink-0" />
      {/* Content */}
      <div className="flex-1 space-y-3">
        {/* Name & Handle */}
        <div className="flex gap-2">
          <div className="h-3.5 bg-white/10 rounded w-1/4" />
          <div className="h-3.5 bg-white/10 rounded w-1/6" />
        </div>
        {/* Text lines */}
        <div className="space-y-2">
          <div className="h-3 bg-white/10 rounded w-full" />
          <div className="h-3 bg-white/10 rounded w-5/6" />
        </div>
        {/* Media Block */}
        <div className="h-40 bg-white/5 rounded-2xl w-full" />
        {/* Action Bar */}
        <div className="flex justify-between w-3/4 pt-2">
          <div className="h-3 bg-white/10 rounded w-8" />
          <div className="h-3 bg-white/10 rounded w-8" />
          <div className="h-3 bg-white/10 rounded w-8" />
          <div className="h-3 bg-white/10 rounded w-8" />
        </div>
      </div>
    </div>
  );
}

interface ExploreProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
  onGoToProfile?: () => void;
  onOverlayStateChange?: (isActive: boolean) => void;
  onOpenCocoon?: () => void;
}

export default function Explore({ isOpen, onClose, telegramUser, onGoToProfile, onOverlayStateChange, onOpenCocoon }: ExploreProps) {
  const { t } = useLanguage();
  const { theme } = useTheme();

  // Fetch Current User (for channel connection status and wallet checks)
  const { data: swrUser } = useApi(telegramUser?.id ? `/user/${telegramUser.id}` : null);
  const isConnected = !!swrUser?.telegram_channel;

  // Admin check & multi-channel support
  const ADMIN_IDS = [5023869471, 7762443283];
  const isAdmin = ADMIN_IDS.includes(telegramUser?.id ?? 0);
  const connectedChannels: any[] = swrUser?.connected_channels || (swrUser?.telegram_channel ? [{
    handle: swrUser.telegram_channel,
    title: swrUser.telegram_channel_title || "",
    photo: swrUser.telegram_channel_photo || "",
    subscribers: 0
  }] : []);

  // New Drawer / Search / Connect Channel states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchTab, setActiveSearchTab] = useState("Topics");
  const [isMiniAppsOpen, setIsMiniAppsOpen] = useState(false);
  const [activeMiniAppsTab, setActiveMiniAppsTab] = useState("All");
  const [isSubmitMiniAppOpen, setIsSubmitMiniAppOpen] = useState(false);
  const [subAppName, setSubAppName] = useState("");
  const [subAppUsername, setSubAppUsername] = useState("");
  const [subAppLink, setSubAppLink] = useState("");
  const [subAppCategory, setSubAppCategory] = useState("Utilities");
  const [subAppDescription, setSubAppDescription] = useState("");
  const [subAppIconB64, setSubAppIconB64] = useState<string | null>(null);
  const [subAppIconPreview, setSubAppIconPreview] = useState<string | null>(null);
  const [isSubmittingMiniApp, setIsSubmittingMiniApp] = useState(false);
  const [isConnectBluOpen, setIsConnectBluOpen] = useState(false);
  const [connectBluAnalytics, setConnectBluAnalytics] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isAnalyticsChannelSheetOpen, setIsAnalyticsChannelSheetOpen] = useState(false);
  const [analyticsChannelHandle, setAnalyticsChannelHandle] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);
  const tooltipTimeoutRef = useRef<any>(null);

  const [showConnectBanner, setShowConnectBanner] = useState(false);
  const [feedSeed, setFeedSeed] = useState<number | null>(null);

  useEffect(() => {
    setFeedSeed(Math.floor(Math.random() * 1000000));
    
    const handleTriggerTokenSearch = (e: Event) => {
      const customEvent = e as CustomEvent;
      const query = customEvent.detail?.query || "";
      if (query) {
        setIsSearchOpen(true);
        setSearchQuery(query);
        setActiveSearchTab("Gram");
      }
    };
    window.addEventListener("triggerTokenSearch", handleTriggerTokenSearch);
    return () => window.removeEventListener("triggerTokenSearch", handleTriggerTokenSearch);
  }, []);

  useEffect(() => {
    if (!swrUser) return;
    const hasConnectedChannel = swrUser.telegram_channel || (swrUser.connected_channels && swrUser.connected_channels.length > 0);
    if (!hasConnectedChannel) {
      if (typeof window !== "undefined") {
        const sessionFlag = sessionStorage.getItem("explore_connect_banner_shown");
        if (!sessionFlag) {
          setShowConnectBanner(true);
          sessionStorage.setItem("explore_connect_banner_shown", "true");
        }
      }
    } else {
      setShowConnectBanner(false);
    }
  }, [swrUser]);

  const showTooltip = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipRect(rect);
    setActiveTooltip(id);
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    tooltipTimeoutRef.current = setTimeout(() => {
      setActiveTooltip(null);
      setTooltipRect(null);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    };
  }, []);

  const [tokenResults, setTokenResults] = useState<any[]>([]);
  const [isTokenSearching, setIsTokenSearching] = useState(false);

  // Debounced search query logic
  useEffect(() => {
    if (!isSearchOpen) {
      setSearchResults([]);
      setSearchQuery("");
      return;
    }
    
    if (activeSearchTab === "Gram") return;
    
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    const delayDebounce = setTimeout(() => {
      getApi(`/explore/feed?tg_id=${telegramUser?.id}&tab=foryou&offset=0&search=${encodeURIComponent(query)}`)
        .then((res) => {
          if (Array.isArray(res)) {
            setSearchResults(res);
          }
        })
        .catch((err) => console.error("Search failed:", err))
        .finally(() => setIsSearching(false));
    }, 300);
    
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, isSearchOpen, telegramUser?.id, activeSearchTab]);

  useEffect(() => {
    if (!isSearchOpen) {
      setTokenResults([]);
      return;
    }
    if (activeSearchTab !== "Gram") return;

    setIsTokenSearching(true);
    const query = searchQuery.trim();
    const delayDebounce = setTimeout(() => {
      getApi(`/explore/token/search?query=${encodeURIComponent(query)}`)
        .then((res: any) => {
          if (res) {
            setTokenResults(res);
          }
        })
        .catch((err) => console.error("Token search failed:", err))
        .finally(() => setIsTokenSearching(false));
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, isSearchOpen, activeSearchTab]);

  const [activeTab, setActiveTab] = useState<"foryou" | "following" | "leaderboard" | "notifications">("foryou");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [isLeaderboardSheetOpen, setIsLeaderboardSheetOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [buyStarsOpen, setBuyStarsOpen] = useState(false);
  const [buyStarsWalletGateOpen, setBuyStarsWalletGateOpen] = useState(false);

  const tryOpenBuyStars = useCallback(() => {
    if (!swrUser?.wallet_address) {
      setBuyStarsWalletGateOpen(true);
      return;
    }
    setBuyStarsOpen(true);
  }, [swrUser?.wallet_address]);
  const [latestKnownPostId, setLatestKnownPostId] = useState<number | string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);

  // Monitor active overlays and notify parent for dynamic z-index stacking
  const isAnyOverlayActive = !!(
    isDrawerOpen ||
    isSearchOpen ||
    isConnectBluOpen ||
    isPostModalOpen ||
    isLeaderboardSheetOpen ||
    isReferralModalOpen ||
    buyStarsOpen ||
    buyStarsWalletGateOpen ||
    withdrawOpen ||
    isPremiumOpen ||
    isAnalyticsChannelSheetOpen
  );

  useEffect(() => {
    onOverlayStateChange?.(isAnyOverlayActive);
  }, [isAnyOverlayActive, onOverlayStateChange]);

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
  // New posts pill & avatars
  const [newPostsAvailable, setNewPostsAvailable] = useState(false);
  const [newPostsAvatars, setNewPostsAvatars] = useState<string[]>([]);

  // Status Popups & Background Action
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPostingBackground, setIsPostingBackground] = useState(false);
  const [connectPrompt, setConnectPrompt] = useState(false);

  // Promote Project Sheet State
  const [isPromoteSheetOpen, setIsPromoteSheetOpen] = useState(false);
  const [promoteTitle, setPromoteTitle] = useState("");
  const [promoteDesc, setPromoteDesc] = useState("");
  const [promoteImageUrl, setPromoteImageUrl] = useState("");
  const [promoteTargetUrl, setPromoteTargetUrl] = useState("");
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [isSubmittingPromote, setIsSubmittingPromote] = useState(false);
  const promoteFileInputRef = useRef<HTMLInputElement | null>(null);

  // SWR for Carousel Banners
  const { data: carouselData } = useSWR('/explore/carousel', () => getApi('/explore/carousel'), { refreshInterval: 30000 });
  const carouselBanners = carouselData?.banners || [];

  const handlePromoteImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await postApi("/upload", formData);
      if (res?.url) {
        setPromoteImageUrl(res.url);
      }
    } catch (err) {
      console.error("Image upload failed:", err);
    }
  };

  const handleSubmitPromoteBanner = async () => {
    if (!promoteTitle.trim() || !promoteImageUrl.trim()) {
      setPromoteError("Title and Image URL are required.");
      return;
    }
    setPromoteError(null);
    setIsSubmittingPromote(true);
    try {
      await postApi("/explore/carousel/submit", {
        user_id: telegramUser?.id || 0,
        title: promoteTitle.trim(),
        description: promoteDesc.trim(),
        image_url: promoteImageUrl.trim(),
        target_url: promoteTargetUrl.trim(),
      });
      setSuccessMessage("Your promotion banner has been submitted for review!");
      setPromoteTitle("");
      setPromoteDesc("");
      setPromoteImageUrl("");
      setPromoteTargetUrl("");
      setIsPromoteSheetOpen(false);
      mutateNotifications();
    } catch (err: any) {
      setPromoteError(err.message || "Failed to submit banner.");
    } finally {
      setIsSubmittingPromote(false);
    }
  };

  // Centralized Telegram BackButton Manager across all overlays
  const [backTrigger, setBackTrigger] = useState(0);
  const backHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const handleRestore = () => setBackTrigger((prev) => prev + 1);
    window.addEventListener("bwRestoreBackHandler", handleRestore);
    return () => window.removeEventListener("bwRestoreBackHandler", handleRestore);
  }, []);

  useEffect(() => {
    const tg = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;
    if (!tg?.BackButton) return;

    // Remove previous handler first (use same ref)
    if (backHandlerRef.current) {
      tg.BackButton.offClick(backHandlerRef.current);
      backHandlerRef.current = null;
    }

    const hasOverlay = Boolean(
      isPromoteSheetOpen ||
      isSubmitMiniAppOpen ||
      isMiniAppsOpen ||
      selectedPost ||
      isSearchOpen ||
      isDrawerOpen ||
      isLeaderboardSheetOpen ||
      isConnectBluOpen ||
      isPremiumOpen ||
      isOpen
    );

    if (hasOverlay) {
      const handleTelegramBackClick = () => {
        if (isPromoteSheetOpen) {
          setIsPromoteSheetOpen(false);
        } else if (isSubmitMiniAppOpen) {
          setIsSubmitMiniAppOpen(false);
        } else if (isMiniAppsOpen) {
          setIsMiniAppsOpen(false);
        } else if (selectedPost) {
          setSelectedPost(null);
        } else if (isSearchOpen) {
          setIsSearchOpen(false);
        } else if (isDrawerOpen) {
          setIsDrawerOpen(false);
        } else if (isConnectBluOpen) {
          setIsConnectBluOpen(false);
        } else if (isPremiumOpen) {
          setIsPremiumOpen(false);
        } else if (isLeaderboardSheetOpen) {
          setIsLeaderboardSheetOpen(false);
        } else if (isOpen) {
          onClose?.();
        }
      };
      backHandlerRef.current = handleTelegramBackClick;
      tg.BackButton.show();
      tg.BackButton.onClick(handleTelegramBackClick);
    } else {
      tg.BackButton.hide();
    }

    return () => {
      if (backHandlerRef.current) {
        tg.BackButton.offClick(backHandlerRef.current);
      }
    };
  }, [
    backTrigger,
    isSubmitMiniAppOpen,
    isMiniAppsOpen,
    selectedPost,
    isSearchOpen,
    isDrawerOpen,
    isLeaderboardSheetOpen,
    isConnectBluOpen,
    isPremiumOpen,
    isOpen,
    onClose,
  ]);



  const { data: notifications, loading: loadingNotifications, mutate: mutateNotifications } = useApi(
    telegramUser?.id ? `/explore/notifications/${telegramUser.id}` : null
  );
  const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;

  // Fetch Feed — all tabs pre-loaded on mount for instant switching
  const { data: initialPosts, loading, mutate } = useApi(
    telegramUser?.id
      ? `/explore/feed?tg_id=${telegramUser.id}&tab=${activeTab}&offset=0${activeTab === "foryou" && feedSeed !== null ? `&seed=${feedSeed}` : ""}`
      : null
  );

  // Pre-warm following tab
  useApi(telegramUser?.id ? `/explore/feed?tg_id=${telegramUser.id}&tab=following&offset=0` : null);

  // Fetch Live Users globally
  const { data: liveUsers } = useApi(isOpen ? `/explore/live_users${telegramUser?.id ? `?tg_id=${telegramUser.id}` : ''}` : null, { refreshInterval: 60000 });

  const [cachedMiniApps, setCachedMiniApps] = useState<any[] | undefined>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("bw_mini_apps");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    return undefined;
  });

  // Fetch Ecosystem Mini Apps & Bots — always fetch when Explore is open OR mini apps section is open
  const miniAppsKey = (isOpen || isMiniAppsOpen) && telegramUser?.id
    ? `/explore/mini_apps?tg_id=${telegramUser.id}`
    : (isOpen || isMiniAppsOpen)
      ? `/explore/mini_apps`
      : null;
  const { data: dbMiniApps, mutate: mutateMiniApps } = useApi(miniAppsKey, {
    fallbackData: cachedMiniApps,
    revalidateOnMount: true,
    dedupingInterval: 1000,
  });

  useEffect(() => {
    if (dbMiniApps && Array.isArray(dbMiniApps) && dbMiniApps.length > 0) {
      if (typeof window !== "undefined") {
        localStorage.setItem("bw_mini_apps", JSON.stringify(dbMiniApps));
      }
    }
  }, [dbMiniApps]);

  const miniAppsList = Array.isArray(dbMiniApps) && dbMiniApps.length > 0
    ? dbMiniApps
    : Array.isArray(cachedMiniApps) && cachedMiniApps.length > 0
      ? cachedMiniApps
      : [];

  // Hide Bottom Navigation bar when Mini App Fullscreen is open
  useEffect(() => {
    if (isMiniAppsOpen) {
      window.dispatchEvent(new CustomEvent("scrollDirectionChanged", { detail: "down" }));
    } else {
      window.dispatchEvent(new CustomEvent("scrollDirectionChanged", { detail: "up" }));
    }
  }, [isMiniAppsOpen]);

  // Fetch Explore Ads
  const { data: dbAds } = useApi(isOpen ? "/explore/ads" : null);
  const adsList = dbAds || [];

  const lastPostUploadedNotif = useRef<string | null>(null);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const latestPostNotif = notifications.find((n: any) => n.type === "post_uploaded" && !n.is_read);
      if (latestPostNotif && latestPostNotif.id !== lastPostUploadedNotif.current) {
        lastPostUploadedNotif.current = latestPostNotif.id;
        mutate();
      }
    }
  }, [notifications, mutate]);

  // Track latest post ID & extract author avatars for new-posts pill
  useEffect(() => {
    if (initialPosts && initialPosts.length > 0) {
      const topId = initialPosts[0]?.id;
      if (!latestKnownPostId) {
        setLatestKnownPostId(topId);
      } else if (topId !== latestKnownPostId) {
        const avatars = initialPosts.slice(0, 3).map((p: any) => p.channel?.photo_url || p.user?.photo_url || p.telegram_channel_photo).filter(Boolean);
        setNewPostsAvatars(avatars);
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

  // 🔗 Auto-open pending deep link post on mount / tab open
  useEffect(() => {
    if (!isOpen || !telegramUser?.id) return;
    const pendingPostId = window.localStorage.getItem("bw_pending_post_id");
    if (!pendingPostId) return;

    window.localStorage.removeItem("bw_pending_post_id");
    
    // Fetch post details immediately and open comments modal
    getApi(`/explore/post/${pendingPostId}?tg_id=${telegramUser.id}`)
      .then((data) => {
        if (data && !data.error) {
          setSelectedPost(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load deep link post:", err);
      });
  }, [isOpen, telegramUser?.id]);

  // 🚀 Load More Implementation (Infinite Scroll Logic)
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading || !telegramUser?.id) return;

    setLoadingMore(true);
    try {
      // 🚄 Fetch the next batch from the API using current offset
      const queryParamSeed = activeTab === "foryou" && feedSeed !== null ? `&seed=${feedSeed}` : '';
      const nextBatch = await getApi(`/explore/feed?tg_id=${telegramUser.id}&tab=${activeTab}&offset=${offset}${queryParamSeed}`);

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
  }, [hasMore, loadingMore, loading, offset, activeTab, telegramUser?.id, feedSeed]);

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
      if (isPremiumOpen) {
        setIsPremiumOpen(false);
        e.preventDefault();
        return;
      }
      if (isAnalyticsChannelSheetOpen) {
        setIsAnalyticsChannelSheetOpen(false);
        e.preventDefault();
        return;
      }
      if (isDrawerOpen) {
        setIsDrawerOpen(false);
        e.preventDefault();
        return;
      }
      if (isMiniAppsOpen) {
        setIsMiniAppsOpen(false);
        e.preventDefault();
        return;
      }
      if (isSearchOpen) {
        setIsSearchOpen(false);
        e.preventDefault();
        return;
      }
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
  }, [isOpen, selectedPost, isPostModalOpen, isSpeedDialOpen, isSearchOpen, isDrawerOpen, isMiniAppsOpen, isPremiumOpen, isAnalyticsChannelSheetOpen]);



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

  // Scroll handler — fast hide/show & early load-more when 8 posts remaining (~2400px)
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const currentY = container.scrollTop;
    setShowScrollToTop(currentY > 400);

    // Trigger "load more" early when remaining scroll height is less than 8 posts (~2400px)
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const remainingScroll = scrollHeight - currentY - clientHeight;
    
    if (remainingScroll < 2400) {
      if (hasMore && !loadingMore && !loading && activeTab !== "leaderboard" && activeTab !== "notifications" && activeTab !== "following") {
        handleLoadMore();
      }
    }

    if (Math.abs(currentY - lastScrollY.current) < 6) return;
    const goingDown = currentY > lastScrollY.current && currentY > 40;
    setShowChrome(!goingDown);
    window.dispatchEvent(new CustomEvent("scrollDirectionChanged", { detail: goingDown ? "down" : "up" }));
    lastScrollY.current = currentY;
  }, [hasMore, loadingMore, loading, handleLoadMore, activeTab]);

  // Swipe tab switch & Pull to refresh
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current !== null && scrollContainerRef.current?.scrollTop === 0) {
      const diffY = e.targetTouches[0].clientY - touchStartY.current;
      if (diffY > 0) {
        const pull = Math.pow(diffY, 0.8) * 1.5;
        setPullY(Math.min(pull, 120));
      }
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    // Horizontal swipe logic
    if (touchStart.current !== null && touchStartY.current !== null) {
      const diffX = touchStart.current - e.changedTouches[0].clientX;
      const diffY = touchStartY.current - e.changedTouches[0].clientY;
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);
      
      const tabs: ("foryou" | "following" | "leaderboard" | "notifications")[] = ["foryou", "following", "leaderboard", "notifications"];
      const currentIndex = tabs.indexOf(activeTab);

      if (absX > 100 && absY < 40 && absX > absY * 3.5 && absX > pullY) {
        if (diffX > 0 && currentIndex < tabs.length - 1) {
          setActiveTab(tabs[currentIndex + 1]);
        } else if (diffX < 0) {
          if (currentIndex > 0) {
            setActiveTab(tabs[currentIndex - 1]);
          } else if (currentIndex === 0) {
            setIsDrawerOpen(true);
            const tg = (window as any).Telegram?.WebApp;
            if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
          }
        }
      }
    }

    // Pull to refresh logic - Magnetic snap and hold release
    if (pullY > 50 && !isRefreshing) {
      setPullY(45);
      setTimeout(() => {
        setIsRefreshing(true);
        setPullY(0);
        
        // Generate a new random seed on pull-to-refresh
        setFeedSeed(Math.floor(Math.random() * 1000000));
        
        // Safety timeout: force stop refreshing after 5 seconds if mutate hangs
        const safetyTimeout = setTimeout(() => {
          setIsRefreshing(false);
        }, 5000);

        mutate().then(() => {
          clearTimeout(safetyTimeout);
          setIsRefreshing(false);
        }).catch(() => {
          clearTimeout(safetyTimeout);
          setIsRefreshing(false);
        });
      }, 300);
    } else {
      setPullY(0);
    }

    touchStart.current = null;
    touchStartY.current = null;
  };

  // Scroll to top + refresh
  const handleNewPostsPill = () => {
    const newSeed = Math.floor(Math.random() * 1000000);
    setFeedSeed(newSeed);
    setPagedPosts([]);
    setOffset(0);
    setNewPostsAvailable(false);
    setNewPostsAvatars([]);
    if (latestKnownPostId) {
      setLatestKnownPostId(null);
    }
    mutate();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle tab switch
  const handleTabClick = (tab: "foryou" | "following" | "leaderboard" | "notifications") => {
    setActiveTab(tab);
    if (tab === "notifications" && telegramUser?.id) {
      if (notifications) {
        mutateNotifications(
          notifications.map((n: any) => ({ ...n, is_read: true })),
          false
        );
      }
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

  const showLiveTray = liveUsers && liveUsers.length > 0 && activeTab === "foryou";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-0 flex flex-col overflow-hidden text-text-main bg-app-bg ${isAnyOverlayActive ? "z-[900]" : "z-[120]"}`}
      style={{
        paddingTop: 0,
        paddingBottom: "env(safe-area-inset-bottom, 0px)"
      }}
    >
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-app-accent/5 blur-[100px] pointer-events-none" />

      {/* ─── Frosted Header Backdrop Background ─── */}
      <motion.div
        animate={{ y: showChrome ? 0 : (showLiveTray ? -288 : -196) }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-[125] pointer-events-none"
        style={{
          height: `calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + ${showLiveTray ? 288 : 196}px)`,
          background: "rgba(0, 0, 0, 0.55)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)"
        }}
      />

      {/* ─── Top Header (Avatar + Search Bar) — NO background ─── */}
      <motion.div 
        animate={{ y: showChrome ? 0 : (showLiveTray ? -288 : -196), opacity: showChrome ? 1 : 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-[135] flex items-center justify-between gap-3 px-6 pb-3"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 88px)",
          height: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 126px)"
        }}
      >
        {/* Left Side: Channel Avatar */}
        <button
          onClick={() => {
            if (hasAccess) setIsDrawerOpen(true);
          }}
          disabled={!hasAccess}
          className={`w-12 h-12 rounded-full border border-white/10 overflow-hidden shrink-0 flex items-center justify-center bg-white/5 transition-all ${hasAccess ? "active:scale-95 cursor-pointer" : "cursor-not-allowed opacity-50"}`}
        >
          {swrUser?.telegram_channel_photo ? (
            <img 
              src={swrUser.telegram_channel_photo} 
              alt="Channel Avatar" 
              className="w-full h-full object-cover pointer-events-none select-none"
            />
          ) : (
            <User size={20} className="text-white/80" />
          )}
        </button>

        {/* Right Side: Curved Search Bar (Small, fits like a tab pill, doesn't cross center) */}
        <button
          onClick={() => {
            if (hasAccess) setIsSearchOpen(true);
          }}
          disabled={!hasAccess}
          className={`w-28 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-between px-3 text-left ${hasAccess ? "cursor-pointer active:scale-95" : "cursor-not-allowed opacity-50"}`}
        >
          <span className="text-white/60 text-[11px] font-black uppercase tracking-wider">Search</span>
          <Search size={12} className="text-white/60" />
        </button>
      </motion.div>

      {/* ─── Tab Bar (fixed, transparent background) ─── */}
      <motion.div
        animate={{ y: showChrome ? 0 : (showLiveTray ? -288 : -196), opacity: showChrome ? 1 : 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="fixed left-0 right-0 z-[130] pointer-events-auto"
        style={{
          top: 0,
          paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 148px)",
          background: "transparent",
          boxShadow: "none"
        }}
      >
        <div className="flex items-center justify-between px-6 pt-2 w-full">
          {(["foryou", "following", "leaderboard", "notifications"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`relative pb-3 flex items-center justify-center transition-all ${
                activeTab === tab ? "text-white font-black" : "text-white/60 hover:text-white/90"
              }`}
            >
              {tab === "foryou" && (
                hasAccess ? (
                  <span className="text-[13.5px] font-black uppercase tracking-wider">{t("explore.tabs.foryou")}</span>
                ) : (
                  <Lock size={19} className="text-white/75" />
                )
              )}
              {tab === "following" && (
                hasAccess ? (
                  <span className="text-[13.5px] font-black uppercase tracking-wider">{t("explore.tabs.following")}</span>
                ) : (
                  <Lock size={19} className="text-white/60" />
                )
              )}
              {tab === "notifications" && (
                hasAccess ? (
                  <div className="relative">
                    <Bell size={19} className={activeTab === tab ? "text-white" : "text-white/60"} />
                    {unreadCount > 0 && (
                      <div className="absolute -top-1.5 -right-2 w-3 h-3 bg-white rounded-full flex items-center justify-center text-[7px] text-black font-black shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                        {unreadCount > 9 ? "!" : unreadCount}
                      </div>
                    )}
                  </div>
                ) : (
                  <Lock size={19} className="text-white/60" />
                )
              )}
              {tab === "leaderboard" && (
                <BarChart2 size={19} className={activeTab === tab ? "text-white" : "text-white/60"} />
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

      {/* ─── Live Channels Dropdown ─── */}
      {showLiveTray && (
        <motion.div
          animate={{ y: showChrome ? 0 : (showLiveTray ? -288 : -196), opacity: showChrome ? 1 : 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed left-0 right-0 z-[130] pointer-events-none"
          style={{
            top: 0,
            paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 202px)",
            height: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 288px)",
            background: "transparent"
          }}
        >
          {/* Horizontal scroll list of live channels */}
          <div className="flex items-center gap-4 overflow-x-auto px-6 pb-3 hide-scrollbar w-full pointer-events-auto">
            {liveUsers.map((u: any, idx: number) => {
              const handleOpen = () => {
                const handle = u.telegram_channel;
                if (!handle) return;
                const clean = handle.replace(/^@/, "");
                const link = `https://t.me/${clean}`;
                const twa = (window as any).Telegram?.WebApp;
                if (twa?.openTelegramLink) twa.openTelegramLink(link);
                else window.open(link, "_blank");
              };

              return (
                <button
                  key={idx}
                  onClick={handleOpen}
                  className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 transition-transform"
                >
                  {/* Live Avatar with Shimmer Glim */}
                  <div className="relative w-11 h-11 rounded-full overflow-hidden bg-black/40 border border-white/20 shimmer-light-wave shrink-0">
                    {u.telegram_channel_photo ? (
                      <img src={u.telegram_channel_photo} className="w-full h-full object-cover" />
                    ) : u.photo_url ? (
                      <img src={u.photo_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-cyan-500 bg-cyan-500/10 font-black text-xs">
                        {(u.telegram_channel_title || u.name || "?")[0]}
                      </div>
                    )}
                  </div>
                  {/* Name */}
                  <span className="text-[9px] font-black text-white/90 uppercase tracking-wider truncate w-14 text-center mt-0.5">
                    {u.telegram_channel_title || u.name}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* New Posts Pill (Pure White X-style pill — enlarged to fit 32px channel avatars) */}
      <AnimatePresence>
        {newPostsAvailable && showChrome && activeTab !== "leaderboard" && activeTab !== "notifications" && activeTab !== "following" && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="fixed left-0 right-0 z-[140] flex justify-center pointer-events-none"
            style={{ top: `calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + ${showLiveTray ? 296 : 204}px)` }}
          >
            <button
              onClick={handleNewPostsPill}
              className="px-5 py-2.5 bg-white text-black text-[13px] font-extrabold rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.85)] border-2 border-white/80 active:scale-95 transition-all flex items-center gap-3 pointer-events-auto cursor-pointer max-w-fit"
            >
              <ArrowUp size={18} strokeWidth={3} className="text-black shrink-0" />
              <div className="flex -space-x-3 overflow-hidden items-center shrink-0 py-0.5">
                {(newPostsAvatars.length > 0 ? newPostsAvatars : ["https://api.dicebear.com/7.x/identicon/svg?seed=wave"]).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-8 h-8 rounded-full border-2 border-black object-cover shadow-md bg-zinc-900 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ))}
              </div>
              <span className="font-black tracking-wider text-black uppercase text-[12px] shrink-0 ml-0.5">posted</span>
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
            className="fixed left-1/2 -translate-x-1/2 z-[135] bg-black/85 border border-white/10 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg pointer-events-none"
            style={{ top: `calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + ${showLiveTray ? 292 : 200}px)` }}
          >
            <Loader2 size={12} className="text-white animate-spin" />
            <span className="text-[9px] text-white/90 font-black uppercase tracking-widest">{t("explore.posting_btn") || "Transmitting"}</span>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ─── Main Content Area ─── */}
      <div ref={feedTopRef} />
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`flex-1 custom-scrollbar ${activeTab === "following" ? "overflow-hidden" : "overflow-y-auto"}`}
        style={{
          paddingTop: `calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + ${showLiveTray ? 288 : 196}px)`,
          paddingBottom: activeTab === "following" ? "0px" : "120px",
          transform: pullY > 0 ? `translateY(${pullY * 0.75}px)` : 'none',
          transition: pullY === 0 ? 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
        }}
      >
        {/* Main Content Area with Access Control */}
        {(!hasAccess && activeTab !== "leaderboard") ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center mb-6 border border-cyan-500/25">
              <Lock size={32} className="text-app-accent" />
            </div>
            <h2 className="text-sm font-black text-text-main uppercase tracking-[0.15em]">Beta Testing Phase</h2>
            <p className="text-xs text-text-sub mt-2 uppercase tracking-wide">Authorized access only</p>
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
                {loadingNotifications && (!notifications || notifications.length === 0) ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="flex gap-4 p-4 rounded-2xl items-center border border-white/[0.05] bg-white/[0.01]">
                        <div className="w-10 h-10 shrink-0 rounded-full shimmer-sweep bg-white/5" />
                        <div className="flex-1 space-y-2">
                          <div className="w-1/3 h-2.5 shimmer-sweep rounded bg-white/5" />
                          <div className="w-3/4 h-2 shimmer-sweep rounded bg-white/5" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <NotificationsView
                    notifications={notifications || []}
                    onClear={() => mutateNotifications()}
                    currentUserId={telegramUser?.id}
                    onPostClick={(postId, commentId) => {
                      const foundPost = pagedPosts.find((p: any) => p.id === postId);
                      if (foundPost) {
                        setSelectedPost(foundPost);
                      } else {
                        setSelectedPost({ id: postId });
                      }
                      setSelectedCommentId(commentId || null);
                    }}
                  />
                )}
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
            {activeTab === "foryou" && (
              <motion.div
                key="foryou"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {(loading && pagedPosts.length === 0) || isRefreshing ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <PostCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="pb-32">
                    {/* Connect Channel Banner Card */}
                    {showConnectBanner && (
                      <div className="mx-4 mt-2 mb-4 bg-black border border-white/[0.08] rounded-3xl p-6 flex flex-col gap-4 text-left shadow-2xl relative overflow-hidden">
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-white tracking-tight leading-tight">
                            Post on the Waves
                          </h3>
                          <p className="text-xs text-white/50 leading-relaxed font-semibold">
                            Connect your Telegram channel to start posting on the Explore feed.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setConnectBluAnalytics(false);
                            setIsConnectBluOpen(true);
                          }}
                          className="w-full bg-white text-black text-xs font-black uppercase tracking-wider py-3.5 rounded-full hover:opacity-90 active:scale-[0.98] transition-all"
                        >
                          Connect channel
                        </button>
                      </div>
                    )}

                    {pagedPosts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                        <p className="text-text-sub text-sm font-black uppercase tracking-widest">No posts yet</p>
                      </div>
                    ) : pagedPosts.map((post: any, index: number) => (
                      <Fragment key={post.id}>
                        <PostCard
                          post={post}
                          isLive={liveUsers?.some((u: any) => (u.telegram_channel || "").replace(/^@/, "").toLowerCase() === (post.channel?.handle || "").replace(/^@/, "").toLowerCase())}
                          currentUserId={telegramUser?.id}
                          starsBalance={telegramUser?.stars_balance ?? 0}
                          onStarBalanceChange={handleStarBalanceChange}
                          isConnected={isConnected}
                          isWalletConnected={!!swrUser?.wallet_address}
                          onHide={() => setPagedPosts(prev => prev.filter((p: any) => p.id !== post.id))}
                          onRepost={() => mutate()}
                          onConnectRequired={() => { setConnectBluAnalytics(false); setIsConnectBluOpen(true); }}
                          onCommentClick={() => setSelectedPost(post)}
                          onPostClick={() => setSelectedPost(post)}
                          onStarGiftSuccess={() => mutateNotifications()}
                          onOpenBuyStars={tryOpenBuyStars}
                        />
                        {(index + 1) % 5 === 0 ? (
                          <ExploreCarousel
                            banners={carouselBanners}
                            onOpenPromote={() => setIsPromoteSheetOpen(true)}
                          />
                        ) : (index + 1) % MINI_APP_INSERT_EVERY === 0 ? (
                          <MiniAppCarousel
                            apps={miniAppsList}
                            loading={!dbMiniApps || dbMiniApps.length === 0}
                            onViewAll={() => {
                              setIsMiniAppsOpen(true);
                              setActiveMiniAppsTab("All");
                            }}
                          />
                        ) : (index + 1) % 10 === 0 && adsList.length > 0 ? (
                          (() => {
                            const adIndex = Math.floor((index + 1) / 10) % adsList.length;
                            const ad = adsList[adIndex];
                            if (!ad) return null;

                            const handleAdClick = (e: React.MouseEvent) => {
                              postApi(`/explore/ad/${ad.id}/view`, {}).catch(() => {});
                              openExternalLink(ad.link_url, e);
                            };

                            const isVideo = ad.media_type === 'video' || (ad.banner_url && /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(ad.banner_url));

                            return (
                              <div 
                                onClick={handleAdClick}
                                className="px-4 py-3.5 border-b border-white/[0.06] relative hover:bg-white/[0.01] transition-all cursor-pointer w-full text-left"
                              >
                                <div className="flex gap-3.5 w-full items-start">
                                  {/* Avatar */}
                                  <div className="shrink-0 relative">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-black/40 shadow-sm relative">
                                      {ad.avatar_url ? (
                                        <img src={ad.avatar_url} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-cyan-500 bg-cyan-500/10 font-black text-xs">
                                          {(ad.title || "S")[0]}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Right Content Column */}
                                  <div className="flex-1 min-w-0 pt-0.5">
                                    {/* Header Row: Title + Sponsored Badge + Ad tag */}
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <div className="flex items-center gap-2 min-w-0 truncate">
                                        <span className="text-white font-bold text-[15px] truncate uppercase tracking-tight">
                                          {ad.title || "Sponsored"}
                                        </span>
                                        <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                                          Sponsored
                                        </span>
                                      </div>
                                      <span className="text-[12px] text-white/60 font-bold uppercase shrink-0">
                                        Ad
                                      </span>
                                    </div>

                                    {/* Caption */}
                                    {ad.caption && (
                                      <LinkedText text={ad.caption} className="text-[15px] text-white/95 leading-relaxed break-words whitespace-pre-wrap mb-3" />
                                    )}

                                    {/* Media Banner (Image or Video) */}
                                    {ad.banner_url && (
                                      <div className="mb-4 rounded-2xl overflow-hidden border border-white/5 bg-black/20 shadow-inner w-full">
                                        {isVideo ? (
                                          <AutoPlayVideo src={ad.banner_url} />
                                        ) : (
                                          <img 
                                            src={ad.banner_url} 
                                            alt="Sponsored media" 
                                            className="w-full h-auto max-h-[400px] object-contain" 
                                            loading="lazy" 
                                          />
                                        )}
                                      </div>
                                    )}

                                    {/* Action / Views Bar (Exact same border & view count as channel posts) */}
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06] w-full text-white/60">
                                      <div className="flex items-center gap-6">
                                        {/* Empty left gap for alignment consistency */}
                                      </div>
                                      <div className="flex items-center gap-1.5 text-white/50 text-[11px] font-black uppercase tracking-widest ml-auto">
                                        <BarChart2 size={16} />
                                        <span>{(ad.views_count || 1).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()
                        ) : null}
                      </Fragment>
                    ))
                    }
                    {hasMore && (
                      <div ref={loadMoreRef} className="flex flex-col gap-4 py-6 w-full px-4 shrink-0">
                        {loadingMore && (
                          <>
                            <PostCardSkeleton />
                            <PostCardSkeleton />
                            <PostCardSkeleton />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
            {activeTab === "following" && (
              <motion.div
                key="following"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SwapTabComponent />
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

      {/* Speed Dial Channel Avatars */}
      <AnimatePresence>
        {isSpeedDialOpen && connectedChannels.length > 1 && (
          <div className="fixed right-5 bottom-36 z-[205] flex flex-col items-center gap-3 pb-16">
            {connectedChannels.map((ch: any, i: number) => (
              <motion.button
                key={ch.handle}
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 20 }}
                transition={{ duration: 0.15, delay: i * 0.05, ease: "easeOut" }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setIsSpeedDialOpen(false);
                  openChannel(ch.handle);
                }}
                className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 shadow-lg bg-zinc-800"
              >
                {ch.photo ? (
                  <img src={ch.photo} className="w-full h-full object-cover" alt={ch.title || ch.handle} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br from-cyan-500 to-blue-600">
                    {(ch.title || ch.handle || "?")[0].toUpperCase()}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Scroll-to-top FAB (Liquid Glass, Arrow Pointing Upwards) */}
      <AnimatePresence>
        {showScrollToTop && (
          <div className="fixed right-5 bottom-52 z-[200]">
            <motion.button
              initial={{ scale: 0, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 15 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-12 h-12 rounded-full flex items-center justify-center border border-white/10 text-white backdrop-blur-xl bg-black/55 shadow-lg active:bg-white/10 transition-all cursor-pointer"
            >
              <ArrowUp size={20} strokeWidth={2.5} />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChrome && activeTab !== "leaderboard" && activeTab !== "following" && (
          <div className="fixed right-5 bottom-36 z-[200] flex flex-col items-center gap-3">
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
                if (connectedChannels.length > 1) {
                  setIsSpeedDialOpen(!isSpeedDialOpen);
                } else {
                  const handle = swrUser?.telegram_channel;
                  if (handle) {
                    openChannel(handle);
                  } else {
                    setConnectBluAnalytics(false);
                    setIsConnectBluOpen(true);
                  }
                }
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden group transition-all relative z-[210] ${
                !hasAccess
                  ? "bg-zinc-800/90 text-zinc-600 cursor-not-allowed opacity-50"
                  : isConnected || !swrUser
                    ? "bg-white text-black"
                    : "bg-gray-800 text-gray-500 shadow-none"
              }`}
            >
              {!hasAccess ? <Lock size={22} /> : <Plus size={24} className="text-black" strokeWidth={2.5} />}
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* Post Modal deleted as requested */}

      {/* ─── Detail Modal (X-style thread) ─── */}
      <AnimatePresence>
        {selectedPost && (
          <PostDetailModal
            post={selectedPost}
            commentId={selectedCommentId}
            telegramUser={telegramUser}
            isLive={liveUsers?.some((u: any) => (u.telegram_channel || "").replace(/^@/, "").toLowerCase() === (selectedPost.channel?.handle || "").replace(/^@/, "").toLowerCase())}
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
            className="fixed left-1/2 -translate-x-1/2 z-[300] bg-white text-black px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg border border-white/20"
            style={{ top: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 200px)" }}
          >
            <div className="w-5 h-5 bg-black/5 rounded-full flex items-center justify-center">
              <Rocket size={12} className="animate-pulse" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">{successMessage}</span>
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

      <WalletRequiredBeforeDepositModal
        isOpen={buyStarsWalletGateOpen}
        onClose={() => setBuyStarsWalletGateOpen(false)}
        onReady={() => {
          setBuyStarsWalletGateOpen(false);
          setBuyStarsOpen(true);
        }}
        onGoToProfile={() => onGoToProfile?.()}
        telegramUser={telegramUser}
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

      {withdrawOpen && (
        <StarWithdrawalModal
          isOpen={withdrawOpen}
          onClose={() => setWithdrawOpen(false)}
          telegramUser={telegramUser}
        />
      )}

      {/* ─── Left Sidebar Drawer (App Theme, Stops at Center, Above Bottom Nav & Balance Pill) ─── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop overlay (z-index 1008 to cover balance pill and bottom nav) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-[1008] bg-black/60"
            />

            {/* Sidebar drawer (stops at center: w-[80%], top-0 bottom-0, premium glass styling) */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[80%] max-w-sm z-[1009] flex flex-col justify-between border-r border-white/6"
              style={{
                paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 50px)",
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(40px) saturate(180%)",
                WebkitBackdropFilter: "blur(40px) saturate(180%)",
                boxShadow: "10px 0 40px rgba(0, 0, 0, 0.5)"
              }}
            >
              {/* Fixed Channel Header (pinned at top so menu scrolls below) */}
              <div className="px-4 pt-2 pb-3 flex flex-col items-start text-left gap-3 w-full shrink-0 border-b border-white/[0.06]">
                <div className="w-14 h-14 rounded-full border border-white/10 overflow-hidden bg-app-bg flex items-center justify-center shadow-lg shrink-0">
                  {swrUser?.telegram_channel_photo ? (
                    <img 
                      src={swrUser.telegram_channel_photo} 
                      alt="Channel photo" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} className="text-text-sub/40" />
                  )}
                </div>

                {swrUser?.telegram_channel ? (
                  <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                    <h3 className="text-white font-black text-sm uppercase truncate tracking-wider w-full">
                      {swrUser.telegram_channel_title || "My Channel"}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-wide text-app-accent truncate w-full">
                      @{swrUser.telegram_channel.replace("@", "")}
                    </p>
                    
                    {/* Subscriber Count */}
                    <div className="mt-1 flex items-center gap-1.5 text-[9px] text-text-sub font-black uppercase tracking-wider">
                      <BarChart2 size={10} className="text-app-accent shrink-0" />
                      <span className="truncate">{(swrUser.telegram_channel_subscribers ?? 0).toLocaleString()} subs</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-2 w-full">
                    <h3 className="text-white font-black text-[10px] uppercase tracking-wide">
                      No channel
                    </h3>
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        setIsConnectBluOpen(true);
                      }}
                      className="w-full py-2 bg-app-accent text-app-bg font-black uppercase text-[9px] tracking-wider rounded-xl shadow-lg active:scale-95 transition-all"
                    >
                      Connect
                    </button>
                  </div>
                )}
              </div>

              {/* Scrollable Menu Items */}
              <div className="px-4 py-3 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
                {/* Section 1: Topics, Blu AI & Cocoon */}
                <div className="flex flex-col gap-1">
                  <div className="text-[8px] font-black text-text-muted uppercase tracking-widest px-2 mb-1">Topics</div>
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setIsSearchOpen(true);
                    }}
                    className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-white/[0.04] active:scale-[0.98] transition-all text-left w-full"
                  >
                    <Search size={20} className="text-white shrink-0" />
                    <span className="text-white text-[12px] font-black uppercase tracking-wider">Topics</span>
                  </button>
                  
                  {/* Blu AI with clean vector Sparkles icon */}
                  <button
                    onClick={(e) => showTooltip("blu-ai", e)}
                    className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-white/[0.04] active:scale-[0.98] transition-all text-left w-full"
                  >
                    <Sparkles size={20} className="text-white shrink-0" />
                    <span className="text-white text-[12px] font-black uppercase tracking-wider">Blu AI</span>
                  </button>

                  {/* Cocoon Pill (Dynamic Island style) directly below Blu AI */}
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      if (onOpenCocoon) {
                        onOpenCocoon();
                      } else {
                        window.dispatchEvent(new CustomEvent("openCocoon"));
                      }
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 my-0.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl hover:bg-white/10 active:scale-95 transition-all cursor-pointer w-fit shadow-md"
                  >
                    <img 
                      src="/cocoon_egg.webp" 
                      alt="Cocoon" 
                      loading="eager"
                      className="w-4 h-5 object-contain filter drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] transition-transform"
                      onError={(e) => { (e.target as any).src = "https://cdn-icons-png.flaticon.com/512/3233/3233150.png" }}
                    />
                    <span className="text-[10px] font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                      Cocoon
                    </span>
                  </button>
                </div>

                <div className="h-px bg-white/[0.05] my-0.5" />

                {/* Section 2: Swap & Wave Tools (AI Studio removed) */}
                <div className="flex flex-col gap-1">
                  <div className="text-[8px] font-black text-text-muted uppercase tracking-widest px-2 mb-1">Ecosystem</div>
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      handleTabClick("following");
                    }}
                    className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-white/[0.04] active:scale-[0.98] transition-all text-left w-full"
                  >
                    <Repeat2 size={20} className="text-white shrink-0" />
                    <span className="text-white text-[12px] font-black uppercase tracking-wider">Swap</span>
                  </button>

                  {/* Wave Tools with clean vector Layers icon */}
                  <button
                    onClick={(e) => showTooltip("wave-tools", e)}
                    className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-white/[0.04] active:scale-[0.98] transition-all text-left w-full"
                  >
                    <Layers size={20} className="text-white shrink-0" />
                    <span className="text-white text-[12px] font-black uppercase tracking-wider">Wave Tools</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setIsMiniAppsOpen(true);
                    }}
                    className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-white/[0.04] active:scale-[0.98] transition-all text-left w-full"
                  >
                    <Gamepad2 size={20} className="text-white shrink-0" />
                    <span className="text-white text-[12px] font-black uppercase tracking-wider">Mini Apps</span>
                  </button>
                </div>

                <div className="h-px bg-white/[0.05] my-0.5" />

                {/* Section 2.5: Star Pill */}
                <div className="flex flex-col gap-1">
                  <div className="text-[8px] font-black text-text-muted uppercase tracking-widest px-2 mb-1">Earn</div>
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setWithdrawOpen(true);
                    }}
                    className="flex items-center justify-between py-2 px-2 rounded-xl hover:bg-white/[0.04] active:scale-[0.98] transition-all text-left w-full border border-amber-500/20 bg-amber-500/5 shadow-[0_0_10px_rgba(245,158,11,0.05)]"
                  >
                    <div className="flex items-center gap-3">
                      <Star size={20} className="text-amber-400 shrink-0" fill="currentColor" />
                      <span className="text-white text-[12px] font-black uppercase tracking-wider">Withdraw Stars</span>
                    </div>
                    <span className="text-amber-400 font-mono text-[10px] font-black mr-1">
                      {(swrUser?.stars_balance ?? 0).toLocaleString()}
                    </span>
                  </button>
                </div>

                <div className="h-px bg-white/[0.05] my-0.5" />

                {/* Section 3: Analytics & Premium */}
                <div className="flex flex-col gap-1">
                  <div className="text-[8px] font-black text-text-muted uppercase tracking-widest px-2 mb-1">Growth</div>
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      if (connectedChannels.length > 1) {
                        setIsAnalyticsChannelSheetOpen(true);
                      } else {
                        setAnalyticsChannelHandle(null);
                        setConnectBluAnalytics(true);
                        setIsConnectBluOpen(true);
                      }
                    }}
                    className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-white/[0.04] active:scale-[0.98] transition-all text-left w-full"
                  >
                    <BarChart2 size={20} className="text-white shrink-0" />
                    <span className="text-white text-[12px] font-black uppercase tracking-wider">Analytics</span>
                  </button>
                  <button
                    onClick={(e: any) => {
                      if (!isAdmin) {
                        showTooltip("premium", e);
                        return;
                      }
                      setIsDrawerOpen(false);
                      setIsPremiumOpen(true);
                    }}
                    className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-white/[0.04] active:scale-[0.98] transition-all text-left w-full"
                  >
                    <img src="/premium badge.png" alt="Premium" className="w-6 h-6 shrink-0 object-contain" />
                    <span className="text-white text-[12px] font-black uppercase tracking-wider">Premium</span>
                  </button>
                </div>

                <div className="h-px bg-white/[0.05] my-0.5" />

                {/* Section 4: Feedback & Support */}
                <div className="flex flex-col gap-1">
                  <div className="text-[8px] font-black text-text-muted uppercase tracking-widest px-2 mb-1">Support</div>
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      window.dispatchEvent(new CustomEvent("openBugsSuggestions"));
                    }}
                    className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-white/[0.04] active:scale-[0.98] transition-all text-left w-full"
                  >
                    <MessageCircle size={20} className="text-white shrink-0" />
                    <span className="text-white text-[12px] font-black uppercase tracking-wider">Feedback & Support</span>
                  </button>
                </div>
              </div>

              {/* Bottom section (keep blank as requested) */}
              <div className="px-4 text-left pt-2">
                <span className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em]">Bluewave beta phase v1.2.0</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Fullscreen Search View (App Theme, Center Input below safe area, no X button) ─── */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[1019] bg-app-bg flex flex-col"
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 73px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)"
            }}
          >
            {/* Search Input Container - Centered and Enlarged, 20px below safe area */}
            <div className="w-full max-w-md mx-auto px-6 mb-3 shrink-0">
              <div className="relative flex items-center w-full">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-white/5 border border-white/5 focus:border-white/20 text-white placeholder-white/30 text-sm rounded-full py-2 px-4 pr-10 focus:outline-none transition-all font-sans"
                />
                {isSearching ? (
                  <Loader2 size={16} className="absolute right-3.5 text-app-accent animate-spin" />
                ) : (
                  <Search size={16} className="absolute right-3.5 text-text-sub/50" />
                )}
              </div>
            </div>

            {/* Slim, sleek categories strip - matching curved segmented control */}
            <div className="w-full mb-4 shrink-0 px-6">
              <div className="flex items-center gap-1 w-full bg-zinc-950/80 border border-white/20 rounded-full p-1 backdrop-blur-xl shadow-lg shadow-black/40 overflow-x-auto no-scrollbar scroll-smooth">
                {["Topics", "Live", "Gram", "News", "AI", "Top Channels", "Mini Apps"].map((tab) => {
                  const isActive = activeSearchTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveSearchTab(tab)}
                      className={`relative flex items-center justify-center py-1.5 px-3.5 rounded-full text-[12.5px] font-black uppercase tracking-wider transition-all duration-200 shrink-0
                        ${isActive
                          ? "bg-white/[0.12] border border-white/25 text-white shadow-md shadow-white/5"
                          : "bg-transparent border border-transparent text-white/65 hover:text-white/90 hover:bg-white/[0.04]"
                        }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-24">
              {activeSearchTab === "Live" ? (
                (() => {
                  if (!liveUsers || liveUsers.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="text-xs text-text-muted font-black uppercase tracking-widest">No channels live right now</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 gap-4 pb-12">
                      {liveUsers.map((u: any, idx: number) => {
                        const handleOpen = () => {
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
                        };

                        return (
                          <button
                            key={idx}
                            onClick={handleOpen}
                            className="flex flex-col items-center justify-center p-4 active:scale-[0.98] transition-all text-center relative overflow-hidden h-32 cursor-pointer"
                          >
                            {/* Avatar */}
                            <div className="relative mb-2 shrink-0 w-14 h-14 rounded-full overflow-hidden bg-black/40 border border-white/20 shimmer-light-wave z-10">
                              {u.telegram_channel_photo ? (
                                <img src={u.telegram_channel_photo} className="w-full h-full object-cover" />
                              ) : u.photo_url ? (
                                <img src={u.photo_url} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-cyan-500 bg-cyan-500/10 font-black text-sm">
                                  {(u.telegram_channel_title || u.name || "?")[0]}
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <h4 className="text-white text-[12px] font-black uppercase tracking-tight truncate w-full px-2">
                              {u.telegram_channel_title || u.name}
                            </h4>
                            <p className="text-cyan-400 font-mono text-[9px] font-bold truncate mt-1 leading-none tracking-wider uppercase flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                              Live Now
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()
              ) : activeSearchTab === "Mini Apps" ? (
                (() => {
                  if (!dbMiniApps || dbMiniApps.length === 0) {
                    return (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-3 animate-pulse text-left">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-white/10" />
                              <div className="space-y-2">
                                <div className="w-24 h-3 bg-white/10 rounded" />
                                <div className="w-16 h-2 bg-white/5 rounded" />
                              </div>
                            </div>
                            <div className="w-14 h-6 rounded-full bg-white/10" />
                          </div>
                        ))}
                      </div>
                    );
                  }

                  const filteredMiniApps = miniAppsList.filter((app: any) => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      app.name?.toLowerCase().includes(query) ||
                      app.username?.toLowerCase().includes(query) ||
                      app.description?.toLowerCase().includes(query)
                    );
                  });

                  if (filteredMiniApps.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="text-xs text-text-muted font-black uppercase tracking-widest">No mini apps found</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-1">
                      {filteredMiniApps.map((app: any) => {
                        const handleOpen = () => {
                          const link = app.link || `https://t.me/${app.username}`;
                          const twa = (window as any).Telegram?.WebApp;
                          if (twa?.openTelegramLink) {
                            twa.openTelegramLink(link);
                          } else {
                            window.open(link, "_blank");
                          }
                        };

                        return (
                          <div
                            key={app.id}
                            className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-3 text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Circular Logo */}
                              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/[0.08] bg-white/5 shrink-0 flex items-center justify-center relative">
                                {app.photo_url ? (
                                  <img src={app.photo_url} className="w-full h-full object-cover" alt="" />
                                ) : app.photo ? (
                                  <img src={app.photo} className="w-full h-full object-cover" alt="" />
                                ) : app.icon ? (
                                  app.icon
                                ) : (
                                  <span className="text-xs font-black uppercase text-app-accent">
                                    {app.name?.[0]}
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0">
                                <h4 className="text-white text-[12px] font-black uppercase tracking-tight truncate">
                                  {app.name}
                                </h4>
                                <p className="text-text-muted font-mono text-[9px] font-bold truncate mt-0.5">
                                  @{app.username || `${app.id}_bot`}
                                </p>
                                <p className="text-text-muted text-[10px] font-bold mt-1 line-clamp-2 leading-normal">
                                  {app.description || 'No description provided.'}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={handleOpen}
                              className="px-4 py-1.5 rounded-full bg-white text-black font-black uppercase text-[9px] tracking-widest hover:opacity-90 active:scale-95 transition-all shrink-0"
                            >
                              Open
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : activeSearchTab === "Gram" ? (
                (() => {
                  if (isTokenSearching && tokenResults.length === 0) {
                    return (
                      <div className="space-y-4 py-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-3 animate-pulse">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-white/10" />
                              <div className="space-y-2">
                                <div className="w-24 h-3 bg-white/10 rounded" />
                                <div className="w-16 h-2 bg-white/5 rounded" />
                              </div>
                            </div>
                            <div className="w-16 h-6 rounded-full bg-white/10" />
                          </div>
                        ))}
                      </div>
                    );
                  }
                  
                  if (tokenResults.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="text-xs text-text-muted font-black uppercase tracking-widest">No tokens found</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-3 pb-12">
                      {tokenResults.map((token: any, idx: number) => {
                        const swapUrl = `https://app.ston.fi/swap?ft=TON&tt=${token.address || "TON"}`;
                        const handleOpenSwap = (e: React.MouseEvent) => {
                          e.stopPropagation();
                          const twa = (window as any).Telegram?.WebApp;
                          if (twa?.openLink) twa.openLink(swapUrl);
                          else window.open(swapUrl, "_blank");
                        };
                        
                        const handleCopyAddress = (e: React.MouseEvent) => {
                          e.stopPropagation();
                          if (token.address) {
                            navigator.clipboard.writeText(token.address);
                            const twa = (window as any).Telegram?.WebApp;
                            if (twa?.showAlert) twa.showAlert("Address copied!");
                            else alert("Address copied to clipboard!");
                          }
                        };
                        
                        return (
                          <div 
                            key={idx}
                            className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-black/40 border border-white/15 flex items-center justify-center shrink-0">
                                {token.image ? (
                                  <img src={token.image} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-emerald-400 bg-emerald-400/10 font-black text-xs">
                                    {token.symbol?.[0] || "$"}
                                  </div>
                                )}
                              </div>
                              
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-white text-sm font-black uppercase tracking-wider">{token.symbol}</span>
                                  {token.name && <span className="text-[10px] text-white/50 font-bold uppercase truncate max-w-[80px]">({token.name})</span>}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[9px] font-mono text-white/40 truncate max-w-[120px]">{token.address || "Native TON"}</span>
                                  {token.address && (
                                    <button 
                                      onClick={handleCopyAddress}
                                      className="text-[9px] font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300"
                                    >
                                      Copy
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end shrink-0 gap-1.5">
                              <span className="text-sm font-mono font-black text-emerald-400">
                                {token.price !== null ? `$${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}` : "—"}
                              </span>
                              <button 
                                onClick={handleOpenSwap}
                                className="px-3.5 py-1 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all"
                              >
                                Swap
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : isSearching && searchResults.length === 0 ? (
                <div className="space-y-4 py-4">
                  {[1, 2, 3].map((i) => (
                    <PostCardSkeleton key={i} />
                  ))}
                </div>
              ) : searchQuery.trim() === "" ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Search size={40} className="text-white/10 mb-3" />
                  <p className="text-xs text-text-muted font-black uppercase tracking-widest">Type to search explore</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-xs text-text-muted font-black uppercase tracking-widest">No posts found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((post: any) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      isLive={liveUsers?.some((u: any) => (u.telegram_channel || "").replace(/^@/, "").toLowerCase() === (post.channel?.handle || "").replace(/^@/, "").toLowerCase())}
                      currentUserId={telegramUser?.id}
                      starsBalance={telegramUser?.stars_balance ?? 0}
                      onStarBalanceChange={handleStarBalanceChange}
                      isConnected={isConnected}
                      isWalletConnected={!!swrUser?.wallet_address}
                      onHide={() => setSearchResults(prev => prev.filter((p: any) => p.id !== post.id))}
                      onRepost={() => mutate()}
                      onConnectRequired={() => { setConnectBluAnalytics(false); setIsConnectBluOpen(true); }}
                      onCommentClick={() => setSelectedPost(post)}
                      onPostClick={() => setSelectedPost(post)}
                      onStarGiftSuccess={() => mutateNotifications()}
                      onOpenBuyStars={tryOpenBuyStars}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Fullscreen Ecosystem Mini Apps View (App Theme, matching Search layout) ─── */}
      <AnimatePresence>
        {isMiniAppsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[2000] bg-app-bg flex flex-col"
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 60px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)"
            }}
          >
            {/* Header - same size as Search header */}
            <div className="w-full max-w-md mx-auto px-6 mb-2 shrink-0 flex items-center justify-center">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">MINI APPS</h3>
            </div>

            {/* Categories strip matching MissionCenter control rectangle */}
            <div className="w-full mb-4 shrink-0 px-6">
              <div className="flex items-center gap-1 w-full bg-zinc-950/80 border border-white/20 rounded-full p-1 backdrop-blur-xl shadow-lg shadow-black/40 overflow-x-auto no-scrollbar scroll-smooth">
                {["All", "Games", "Wallets", "Swaps & DeFi", "Payments", "NFT & Marketplaces", "Dev Infra", "Explorers", "Naming & Identity"].map((tab) => {
                  const isActive = activeMiniAppsTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveMiniAppsTab(tab)}
                      className={`relative flex items-center justify-center py-1.5 px-3.5 rounded-full text-[12.5px] font-black uppercase tracking-wider transition-all duration-200 shrink-0
                        ${isActive
                          ? "bg-white/[0.12] border border-white/25 text-white shadow-md shadow-white/5"
                          : "bg-transparent border border-transparent text-white/65 hover:text-white/90 hover:bg-white/[0.04]"
                        }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mini Apps Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-24">
              {(() => {
                const filteredApps = activeMiniAppsTab === "All"
                  ? miniAppsList
                  : miniAppsList.filter((app: any) => app.category === activeMiniAppsTab);

                if (filteredApps.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <p className="text-xs text-text-muted font-black uppercase tracking-widest">No apps in this category</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {filteredApps.map((app: any) => {
                      const isPending = app.status === "pending";
                      const handleOpen = () => {
                        if (isPending) return;
                        const link = app.deep_link || app.link || `https://t.me/${app.username}`;
                        const twa = (window as any).Telegram?.WebApp;
                        if (twa?.openTelegramLink) {
                          twa.openTelegramLink(link);
                        } else {
                          window.open(link, "_blank");
                        }
                      };

                      return (
                        <div
                          key={app.id}
                          className={`flex items-center justify-between p-3.5 mb-3 text-left rounded-2xl transition-all ${
                            isPending
                              ? "bg-red-950/20 border border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                              : "border-b border-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Circular Logo */}
                            <div className={`w-12 h-12 rounded-full overflow-hidden border shrink-0 flex items-center justify-center relative shadow-[0_0_12px_rgba(0,0,0,0.3)] ${
                              isPending ? "border-red-500/80 bg-red-950/40" : "border-white/[0.08] bg-white/5"
                            }`}>
                              {app.photo_url ? (
                                <img src={app.photo_url} className="w-full h-full object-cover" alt="" />
                              ) : app.photo ? (
                                <img src={app.photo} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <span className={`text-sm font-black uppercase ${isPending ? "text-red-400" : "text-app-accent"}`}>
                                  {app.name?.[0]}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-white text-[13px] font-black uppercase tracking-tight truncate">
                                  {app.name}
                                </h4>
                                {isPending && (
                                  <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest bg-red-500/20 border border-red-500/60 text-red-400 animate-pulse shrink-0">
                                    Awaiting Approval
                                  </span>
                                )}
                              </div>
                              <p className="text-text-muted font-mono text-[9.5px] font-bold truncate mt-0.5">
                                @{app.username}
                              </p>
                              <p className="text-white/50 text-[10.5px] leading-relaxed mt-1 line-clamp-2 uppercase tracking-wide font-medium">
                                {app.description || "Ecosystem App"}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={handleOpen}
                            disabled={isPending}
                            className={`px-5 py-2 rounded-full font-black uppercase text-[10px] tracking-widest transition-all shrink-0 ml-4 border ${
                              isPending
                                ? "bg-red-500/20 text-red-300 border-red-500/40 opacity-70 cursor-not-allowed"
                                : "bg-white text-black hover:opacity-90 active:scale-95 border-white/20 shadow-md"
                            }`}
                          >
                            {isPending ? "Pending" : "Open"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* White FAB Button — hidden when submit sheet is open */}
            {!isSubmitMiniAppOpen && (
              <button
                onClick={() => {
                  if (!subAppUsername && (swrUser?.username || (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.username)) {
                    setSubAppUsername(swrUser?.username || (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.username || "");
                  }
                  setIsSubmitMiniAppOpen(true);
                }}
                className="fixed right-5 bottom-24 z-[2025] w-12 h-12 rounded-full bg-white text-black font-black text-xl shadow-[0_0_25px_rgba(255,255,255,0.45)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/30"
                title="Submit Mini App"
              >
                +
              </button>
            )}

            {/* ─── Submit Mini App Bottom Sheet ─── */}
            <AnimatePresence>
              {isSubmitMiniAppOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[2050] bg-black/80 backdrop-blur-xl flex flex-col justify-end"
                  onClick={() => setIsSubmitMiniAppOpen(false)}
                >
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 220 }}
                    className="w-full max-w-lg mx-auto bg-zinc-950/95 border-t border-white/15 rounded-t-3xl p-6 text-white shadow-2xl flex flex-col max-h-[88vh] overflow-y-auto custom-scrollbar"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mb-4 shrink-0" />

                    <div className="text-center mb-6">
                      <h3 className="text-base font-black uppercase tracking-wider text-white">
                        Connect Your Mini App to the Waves
                      </h3>
                      <p className="text-[11px] text-white/60 font-medium mt-1 leading-relaxed">
                        The Waves team will verify ownership and approve your app before publishing.
                      </p>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!subAppName.trim() || !subAppUsername.trim() || !subAppLink.trim() || isSubmittingMiniApp) return;
                        setIsSubmittingMiniApp(true);
                        try {
                          const userTgId = Number(telegramUser?.id || (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id || 0);
                          const res = await postApi("/mini-apps/submit", {
                            tg_id: userTgId,
                            name: subAppName.trim(),
                            username: subAppUsername.trim(),
                            link: subAppLink.trim(),
                            category: subAppCategory || "Games",
                            description: subAppDescription.trim(),
                            icon_b64: subAppIconB64,
                          });

                          if (res && (res.success || res.mini_app)) {
                            setIsSubmitMiniAppOpen(false);
                            setSubAppName("");
                            setSubAppUsername("");
                            setSubAppLink("");
                            setSubAppDescription("");
                            setSubAppIconB64(null);
                            setSubAppIconPreview(null);
                            if (mutateMiniApps) mutateMiniApps();
                          } else {
                            alert(res?.detail || res?.error || "Failed to submit mini app. Please try again.");
                          }
                        } catch (err: any) {
                          console.error("Submit mini app error:", err);
                          alert(err?.message || "Failed to submit mini app. Please try again.");
                        } finally {
                          setIsSubmittingMiniApp(false);
                        }
                      }}
                      className="space-y-4"
                    >
                      {/* Logo uploader */}
                      <div className="flex flex-col items-center gap-2">
                        <label className="w-20 h-20 rounded-2xl border border-white/20 bg-white/5 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative shadow-inner">
                          {subAppIconPreview ? (
                            <img src={subAppIconPreview} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center text-white/40">
                              <span className="text-xl">+</span>
                              <span className="text-[9px] font-black uppercase tracking-widest mt-1">Logo</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const result = reader.result as string;
                                setSubAppIconPreview(result);
                                setSubAppIconB64(result.split(",")[1]);
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                        <span className="text-[10px] font-bold text-white/50 uppercase">App Icon / Logo</span>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block mb-1">
                          App Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Gram Casino"
                          value={subAppName}
                          onChange={(e) => setSubAppName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-medium outline-none focus:border-white/40"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block mb-1">
                          Telegram @Username (Auto-Filled)
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. gramcasinobot"
                          value={subAppUsername}
                          onChange={(e) => setSubAppUsername(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-medium outline-none focus:border-white/40"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block mb-1">
                          Mini App Deep Link / WebApp URL
                        </label>
                        <input
                          type="url"
                          required
                          placeholder="e.g. https://t.me/gramcasinobot/app"
                          value={subAppLink}
                          onChange={(e) => setSubAppLink(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-medium outline-none focus:border-white/40"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block mb-1">
                          Category
                        </label>
                        <select
                          value={subAppCategory}
                          onChange={(e) => setSubAppCategory(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/15 text-white text-xs font-medium outline-none focus:border-white/40 cursor-pointer"
                        >
                          <option value="Games">Games</option>
                          <option value="Wallets">Wallets</option>
                          <option value="Swaps & DeFi">Swaps & DeFi</option>
                          <option value="Payments">Payments</option>
                          <option value="NFT & Marketplaces">NFT & Marketplaces</option>
                          <option value="Dev Infra">Dev Infra</option>
                          <option value="Explorers">Explorers</option>
                          <option value="Naming & Identity">Naming & Identity</option>
                          <option value="Utilities">Utilities</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block mb-1">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Brief description of what your app does..."
                          value={subAppDescription}
                          onChange={(e) => setSubAppDescription(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-medium outline-none focus:border-white/40"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingMiniApp}
                        className="w-full py-3.5 rounded-xl bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-white/90 active:scale-95 transition-all shadow-lg"
                      >
                        {isSubmittingMiniApp ? "Submitting..." : "Submit Mini App"}
                      </button>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Premium Full Page Overlay ─── */}
      <AnimatePresence>
        {isPremiumOpen && (
          <PremiumPage
            telegramUser={telegramUser}
            swrUser={swrUser}
            onClose={() => setIsPremiumOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── Tooltips ─── */}
      <Tooltip id="blu-ai" activeId={activeTooltip} title="Blu AI" content="Blu is in the lab. Access is restricted during beta." targetRect={tooltipRect} />
      <Tooltip id="wave-tools" activeId={activeTooltip} title="Wave Tools" content="Coming Soon" targetRect={tooltipRect} />
      <Tooltip id="ai-studio" activeId={activeTooltip} title="AI Studio" content="Coming Soon" targetRect={tooltipRect} />
      <Tooltip id="premium" activeId={activeTooltip} title="Premium" content="Premium is currently invite-only." targetRect={tooltipRect} />


      {/* ─── Analytics Channel Selector Bottom Sheet ─── */}
      <AnimatePresence>
        {isAnalyticsChannelSheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setIsAnalyticsChannelSheetOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-w-md bg-[#111113] rounded-t-3xl p-5 pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle */}
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <h3 className="text-white text-base font-black uppercase tracking-wider mb-4 text-center">Select Channel</h3>
              <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto">
                {connectedChannels.map((ch: any) => (
                  <button
                    key={ch.handle}
                    onClick={() => {
                      setIsAnalyticsChannelSheetOpen(false);
                      setAnalyticsChannelHandle(ch.handle);
                      setConnectBluAnalytics(true);
                      setIsConnectBluOpen(true);
                    }}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] transition-all text-left w-full border border-white/[0.06]"
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-zinc-800">
                      {ch.photo ? (
                        <img src={ch.photo} className="w-full h-full object-cover" alt={ch.title || ch.handle} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br from-cyan-500 to-blue-600">
                          {(ch.title || ch.handle || "?")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-white text-sm font-bold truncate">{ch.title || ch.handle}</span>
                      <span className="text-white/40 text-xs truncate">@{(ch.handle || "").replace(/^@/, "")}</span>
                    </div>
                    <BarChart2 size={18} className="text-white/30 ml-auto shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Connect Channel Modal ─── */}
      <ConnectBluModal
        isOpen={isConnectBluOpen}
        onClose={() => { setIsConnectBluOpen(false); setAnalyticsChannelHandle(null); }}
        telegramId={telegramUser?.id}
        telegramUser={swrUser || telegramUser}
        isHumanVerified={!!swrUser?.is_human_verified}
        alreadyConnected={swrUser?.telegram_channel || null}
        channelTitle={swrUser?.telegram_channel_title || null}
        channelPhoto={swrUser?.telegram_channel_photo || null}
        channelStarsReceived={swrUser?.channel_stars_received ?? 0}
        initialAnalytics={connectBluAnalytics}
        analyticsChannelHandle={analyticsChannelHandle}
      />

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

  const charLimit = 4096;
  const progress = (content.length / charLimit) * 100;
  const strokeDasharray = 2 * Math.PI * 8; 
  const strokeDashoffset = strokeDasharray - (Math.min(progress, 100) / 100) * strokeDasharray;

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[1000] bg-zinc-950 flex flex-col md:max-w-md md:mx-auto md:relative md:inset-auto md:h-[90vh] md:rounded-[3rem] md:overflow-hidden"
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
                <span className="absolute text-[8px] font-bold text-white/80">{charLimit - content.length}</span>
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
              <button onClick={() => setCropIndex(null)} className="text-white/88 text-sm font-bold px-4 py-2 hover:text-white transition-colors">Cancel</button>
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
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/80">
                  <span>Pan Offset</span>
                  <span className="text-cyan-500">X: {cropRect.x}% Y: {cropRect.y}%</span>
                </div>
                <input type="range" min="0" max="100" value={cropRect.x} onChange={e => setCropRect(r => ({ ...r, x: Number(e.target.value) }))} className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                <input type="range" min="0" max="100" value={cropRect.y} onChange={e => setCropRect(r => ({ ...r, y: Number(e.target.value) }))} className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/80">
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

const GramIcon = ({ size = 12 }: { size?: number }) => (
  <img
    src="/gram icon.png"
    alt="Gram"
    style={{ width: size, height: size }}
    className="shrink-0"
  />
);

function PremiumPage({ 
  telegramUser, 
  swrUser, 
  onClose 
}: { 
  telegramUser: any, 
  swrUser: any, 
  onClose: () => void 
}) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"premium" | "premium+">("premium");
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("monthly");
  
  // Payment states
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);

  // Live TON price from CoinGecko
  const [liveTonPrice, setLiveTonPrice] = useState<number>(7.50);
  useEffect(() => {
    let cancelled = false;
    const fetchTonPrice = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd");
        const data = await res.json();
        if (!cancelled && data?.["the-open-network"]?.usd) {
          setLiveTonPrice(data["the-open-network"].usd);
        }
      } catch {}
    };
    fetchTonPrice();
    const interval = setInterval(fetchTonPrice, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Load latest premium status
  const { data: premiumStatus, mutate: mutatePremium } = useApi(
    telegramUser?.id ? `/explore/premium/status?tg_id=${telegramUser.id}` : null
  );

  const tonBalance = premiumStatus?.ton_balance ?? (swrUser?.ton_balance ?? 0);
  const depositToken = premiumStatus?.deposit_token ?? (swrUser?.deposit_token ?? "");
  const userBwId = premiumStatus?.bw_id ?? (swrUser?.bw_id ?? "");

  const planPriceUsd = selectedPlan === "monthly" ? 1.49 : 12.52;
  const requiredTon = Number((planPriceUsd / liveTonPrice).toFixed(3));
  const requiredGram = requiredTon; // 1 Gram = 1 TON

  // Premium countdown timer
  const premiumExpiresAt = premiumStatus?.premium_expires_at;
  const [countdown, setCountdown] = useState("");
  useEffect(() => {
    if (!premiumExpiresAt) return;
    const tick = () => {
      const now = Date.now();
      const exp = new Date(premiumExpiresAt).getTime();
      const diff = exp - now;
      if (diff <= 0) { setCountdown("Expired"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${d}d ${h}h ${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [premiumExpiresAt]);

  const handlePayFromBalance = async () => {
    setIsPaying(true);
    setPaymentError(null);
    try {
      const res = await postApi("/explore/premium/pay_balance", {
        tg_id: telegramUser?.id,
        plan: selectedPlan
      });
      if (res.success) {
        setPaymentSuccess(true);
        mutatePremium();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("refreshUserStatus"));
        }
      } else {
        if (res.error === "INSUFFICIENT_BALANCE") {
          setPaymentError(`Insufficient Gram balance. You need at least ${res.required_ton?.toFixed(3)} Gram but you currently have ${res.current_ton?.toFixed(3)} Gram.`);
        } else {
          setPaymentError(res.error || "Payment failed.");
        }
      }
    } catch (err: any) {
      setPaymentError("An error occurred during payment processing.");
    } finally {
      setIsPaying(false);
    }
  };

  const handleCopyMemo = () => {
    const memo = `tg_id:${telegramUser?.id}|bw_id:${userBwId}|token:${depositToken}|mode:premium_${selectedPlan}`;
    navigator.clipboard.writeText(memo);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  const handleCopyWallet = () => {
    const depositWallet = "UQCs-W3qSgG6z99K_e7wYlS87c-H0VjX2lU82nE27z"; // standard system deposit wallet or user's specific address if any
    navigator.clipboard.writeText(depositWallet);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end select-none">
      {/* Backdrop Dimmer Shield (Tap to close) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0"
      />

      {/* Liquid Glass Bottom Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 240 }}
        className="relative z-10 w-full max-h-[85vh] bg-black/60 border-t border-white/10 rounded-t-[2.5rem] p-6 pb-12 flex flex-col shadow-[0_-15px_40px_rgba(0,0,0,0.6)] overflow-y-auto no-scrollbar backdrop-blur-2xl"
      >

        <div className="relative z-10 flex flex-col h-full">
          {/* Top Center Premium Icon & Title */}
          <div className="flex flex-col items-center mb-6 shrink-0 relative">
            <div className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center mb-2 shimmer-light-wave">
              <img src="/premium badge.png" alt="Premium Badge" className="w-16 h-16 object-contain pointer-events-none select-none" />
            </div>
            
            <h2 className="text-lg font-black text-white uppercase tracking-[0.25em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              Upgrade to Premium
            </h2>
            
            {/* Subscription Countdown Timer */}
            {premiumStatus?.is_premium && (
              <div className="mt-2 flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Premium Active</span>
                <span className="text-xs font-mono font-black text-white bg-white/10 border border-white/15 px-3 py-1 rounded-full">
                  {countdown || "Checking..."}
                </span>
              </div>
            )}
          </div>

          {/* Segmented Control Tabs (Premium vs Premium+) */}
          <div className="flex items-center justify-between w-full bg-zinc-950/80 border border-white/10 rounded-full p-1 gap-1 mb-6 shadow-md shrink-0">
            {(["premium", "premium+"] as const).map((tab) => {
              const isActive = activeTab === tab;
              const isPremiumPlus = tab === "premium+";
              return (
                <button
                  key={tab}
                  disabled={isPremiumPlus}
                  onClick={() => setActiveTab(tab)}
                  className={`relative flex items-center justify-center flex-1 py-2 rounded-full text-[12px] font-black uppercase tracking-wider transition-all duration-200
                    ${isActive
                      ? "bg-white/[0.12] border border-white/20 text-white shadow-md shadow-white/5"
                      : isPremiumPlus
                        ? "text-white/30 cursor-not-allowed"
                        : "text-white/60 hover:text-white/90"
                    }`}
                >
                  <span>{tab === "premium" ? "Premium" : "Premium+ (Soon)"}</span>
                </button>
              );
            })}
          </div>

          {!showPaymentOptions ? (
            <div className="flex-1 flex flex-col justify-between">
              {/* Benefits list */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-white/55 uppercase tracking-widest mb-2 border-b border-white/5 pb-2">
                  Premium Benefits
                </h3>
                
                <div className="space-y-3.5">
                  {[
                    { title: "Verified Badge", desc: "Show a premium checkmark next to your channel profile." },
                    { title: "Double Claim Yield", desc: "Gain 2x multiplier on all daily $BWAVE mission rewards." },
                    { title: "Instant Sync Priority", desc: "Priority background scanning locks and updates posts instantly." },
                    { title: "Advanced Beta Tools", desc: "Exclusive early beta access to Wave Tools & AI Studio." }
                  ].map((b, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] text-white font-bold shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div className="text-left">
                        <h4 className="text-white text-xs font-black uppercase tracking-wide leading-none mb-1">{b.title}</h4>
                        <p className="text-[10px] text-white/50 leading-relaxed font-semibold">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid Cards (Monthly vs Annual) */}
              <div className="grid grid-cols-2 gap-3.5 my-6 shrink-0">
                {/* Monthly Plan Card */}
                <button
                  onClick={() => setSelectedPlan("monthly")}
                  className={`relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-200 group
                    ${selectedPlan === "monthly"
                      ? "border-white bg-white/[0.04] shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                >
                  {/* 1 Month Free Badge */}
                  <div className="absolute -top-2.5 left-3 bg-white text-black font-black uppercase text-[7px] tracking-widest px-2 py-0.5 rounded-full shadow-md">
                    +1 Mo Free
                  </div>
                  
                  <span className="text-white/60 font-black uppercase text-[9px] tracking-wider mt-1">1 Month</span>
                  <span className="text-white font-black text-base mt-1">$1.49</span>
                  
                  <div className="flex items-center gap-1.5 mt-2 bg-black/40 border border-white/5 rounded-full px-2.5 py-1">
                    <img src="/gram icon.png" alt="Gram" className="w-3.5 h-3.5 object-contain" />
                    <span className="text-white text-[10px] font-black">{requiredGram.toFixed(3)} Gram</span>
                  </div>
                </button>

                {/* Annual Plan Card */}
                <button
                  onClick={() => setSelectedPlan("annual")}
                  className={`relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-200 group
                    ${selectedPlan === "annual"
                      ? "border-white bg-white/[0.04] shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                >
                  {/* Save 30% Badge */}
                  <div className="absolute -top-2.5 right-3 bg-white text-black font-black uppercase text-[7px] tracking-widest px-2 py-0.5 rounded-full shadow-md">
                    Save 30%
                  </div>
                  
                  <span className="text-white/60 font-black uppercase text-[9px] tracking-wider mt-1">1 Year</span>
                  <span className="text-white font-black text-base mt-1">$12.52</span>
                  
                  <div className="flex items-center gap-1.5 mt-2 bg-black/40 border border-white/5 rounded-full px-2.5 py-1">
                    <img src="/gram icon.png" alt="Gram" className="w-3.5 h-3.5 object-contain" />
                    <span className="text-white text-[10px] font-black">{requiredGram.toFixed(3)} Gram</span>
                  </div>
                </button>
              </div>

              {/* Subscribe Button & T&C */}
              <div className="shrink-0 flex flex-col gap-3">
                <button
                  onClick={() => setShowPaymentOptions(true)}
                  className="w-full h-12 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-md hover:bg-white/95 active:scale-[0.98] transition-all flex items-center justify-center border border-white/20"
                >
                  Subscribe
                </button>
                
                <p className="text-[8px] text-white/35 text-center leading-relaxed font-semibold uppercase tracking-wider">
                  By subscribing, you authorize recurring payments. You can cancel at any time in settings.
                </p>
              </div>
            </div>
          ) : (
            /* Payment options screen */
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <button 
                    onClick={() => {
                      setShowPaymentOptions(false);
                      setPaymentSuccess(false);
                      setPaymentError(null);
                    }}
                    className="w-8 h-8 rounded-full border border-white/10 bg-white/5 text-white flex items-center justify-center font-bold text-xs active:scale-90 transition-transform"
                  >
                    ◀
                  </button>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">
                    Select Payment Method
                  </h3>
                </div>

                {paymentSuccess ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-3xl animate-bounce">
                      ✓
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-white font-black text-sm uppercase tracking-widest">Payment Successful!</h4>
                      <p className="text-[10px] text-white/50 max-w-[240px] leading-relaxed">
                        Your Premium status is active. You now have the verified badge and double daily reward multipliers!
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="h-10 px-6 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/95 transition-all shadow-md mt-4"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentError && (
                      <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10.5px] font-bold text-center leading-relaxed">
                        {paymentError}
                      </div>
                    )}

                    {/* Option 1: Pay from Gram Balance */}
                    <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div className="text-left">
                          <h4 className="text-white text-xs font-black uppercase tracking-wide">Pay from Gram Balance</h4>
                          <p className="text-[9px] text-white/40 mt-0.5 font-bold">Pay instantly using your in-app wallet balance</p>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-mono text-xs font-black">{requiredGram.toFixed(3)} Gram</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-2.5">
                        <span className="text-white/50 font-bold">Your Balance:</span>
                        <span className="text-white font-mono font-black">{tonBalance.toFixed(4)} Gram</span>
                      </div>

                      <button
                        onClick={handlePayFromBalance}
                        disabled={isPaying || tonBalance < requiredTon}
                        className={`w-full h-10 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center shadow-md
                          ${tonBalance < requiredTon
                            ? "bg-white/5 border border-white/5 text-white/30 cursor-not-allowed"
                            : "bg-white text-black hover:bg-white/95 active:scale-[0.98]"
                          }`}
                      >
                        {isPaying ? "Processing..." : "Confirm & Pay Now"}
                      </button>
                    </div>

                    {/* Option 2: Direct Gram Deposit */}
                    <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col gap-3">
                      <div className="text-left">
                        <h4 className="text-white text-xs font-black uppercase tracking-wide">Direct Gram Deposit</h4>
                        <p className="text-[9px] text-white/40 mt-0.5 font-bold">Send Gram directly from any external wallet (Tonkeeper, etc.)</p>
                      </div>

                      <div className="space-y-2 text-left border-t border-white/5 pt-2.5 text-[9.5px]">
                        {/* Deposit wallet */}
                        <div className="flex justify-between items-center bg-black/40 border border-white/5 rounded-lg px-2.5 py-2">
                          <div className="truncate pr-2 font-mono">
                            <span className="text-white/40 uppercase tracking-wider block text-[7.5px] font-sans font-bold">Deposit Wallet</span>
                            <span className="text-white truncate block">UQCs-W3qSgG6z99K_e7wYlS87c-H0VjX2lU82nE27z</span>
                          </div>
                          <button 
                            onClick={handleCopyWallet}
                            className="shrink-0 text-white font-bold hover:text-white/80 uppercase tracking-widest text-[8px]"
                          >
                            {copiedWallet ? "Copied" : "Copy"}
                          </button>
                        </div>

                        {/* Required transfer amount */}
                        <div className="flex justify-between items-center bg-black/40 border border-white/5 rounded-lg px-2.5 py-2">
                          <div>
                            <span className="text-white/40 uppercase tracking-wider block text-[7.5px] font-sans font-bold">Required Amount</span>
                            <span className="text-white font-mono font-bold block">{requiredGram.toFixed(3)} Gram</span>
                          </div>
                        </div>

                        {/* Transaction Memo */}
                        <div className="flex justify-between items-center bg-black/40 border border-white/5 rounded-lg px-2.5 py-2">
                          <div className="truncate pr-2 font-mono">
                            <span className="text-white/40 uppercase tracking-wider block text-[7.5px] font-sans font-bold">Required Memo (Must Include!)</span>
                            <span className="text-white truncate block">
                              tg_id:{telegramUser?.id}|bw_id:{userBwId}|token:{depositToken}|mode:premium_{selectedPlan}
                            </span>
                          </div>
                          <button 
                            onClick={handleCopyMemo}
                            className="shrink-0 text-white font-bold hover:text-white/80 uppercase tracking-widest text-[8px]"
                          >
                            {copiedMemo ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>

                      <p className="text-[8px] text-white/50 font-bold uppercase tracking-wider text-left leading-normal leading-relaxed mt-1">
                        ⚠️ WARNING: You must copy and include the memo payload exactly as shown. Otherwise the deposit monitor cannot identify your account and verify the transaction automatically!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[8px] text-white/30 text-center leading-relaxed font-semibold uppercase tracking-wider shrink-0 mt-6">
                Gram payments are processed automatically on-chain.
              </p>
            </div>
          )}

          {/* Promote Project Bottom Sheet Modal (Positions above bottom nav with z-[999]) */}
          <AnimatePresence>
            {isPromoteSheetOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-end justify-center pointer-events-auto"
                onClick={() => setIsPromoteSheetOpen(false)}
              >
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 250 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-lg bg-zinc-950 border-t border-white/15 rounded-t-[2.5rem] p-6 pb-[calc(env(safe-area-inset-bottom,0px)+85px)] flex flex-col gap-4 shadow-2xl overflow-y-auto max-h-[85vh]"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-cyan-400" />
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Promote Your Project</h3>
                    </div>
                    <button onClick={() => setIsPromoteSheetOpen(false)} className="p-1 text-white/50 hover:text-white">
                      <X size={20} />
                    </button>
                  </div>

                  <p className="text-xs text-white/70 font-medium">
                    reach thousands of verified humans on the waves. Submit your banner image and details for approval.
                  </p>

                  {/* Inputs */}
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-white/60">Banner Title *</label>
                      <input
                        type="text"
                        value={promoteTitle}
                        onChange={(e) => setPromoteTitle(e.target.value)}
                        placeholder="e.g. TG STARS ON GETGEMS"
                        className="w-full bg-zinc-900 border border-white/15 rounded-2xl px-3.5 py-2.5 text-white text-xs font-medium outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-white/60">Description</label>
                      <textarea
                        rows={2}
                        value={promoteDesc}
                        onChange={(e) => setPromoteDesc(e.target.value)}
                        placeholder="Get Stars 30% cheaper than inside Telegram"
                        className="w-full bg-zinc-900 border border-white/15 rounded-2xl px-3.5 py-2.5 text-white text-xs font-medium outline-none focus:border-cyan-400 resize-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-white/60">Banner Image URL *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoteImageUrl}
                          onChange={(e) => setPromoteImageUrl(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 bg-zinc-900 border border-white/15 rounded-2xl px-3.5 py-2.5 text-white text-xs font-medium outline-none focus:border-cyan-400"
                        />
                        <button
                          type="button"
                          onClick={() => promoteFileInputRef.current?.click()}
                          className="px-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold shrink-0 flex items-center gap-1"
                        >
                          <ImageIcon size={16} /> Upload
                        </button>
                      </div>
                      <input
                        ref={promoteFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePromoteImageSelect}
                      />
                    </div>

                    {promoteImageUrl && (
                      <div className="w-full h-36 rounded-2xl overflow-hidden border border-white/15 bg-black/40 mt-1">
                        <img src={promoteImageUrl} alt="preview" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-white/60">Destination Link (Optional)</label>
                      <input
                        type="text"
                        value={promoteTargetUrl}
                        onChange={(e) => setPromoteTargetUrl(e.target.value)}
                        placeholder="https://t.me/your_channel or https://..."
                        className="w-full bg-zinc-900 border border-white/15 rounded-2xl px-3.5 py-2.5 text-white text-xs font-medium outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  {promoteError && <p className="text-xs text-red-400 font-bold">{promoteError}</p>}

                  <button
                    onClick={handleSubmitPromoteBanner}
                    disabled={isSubmittingPromote}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    {isSubmittingPromote ? <Loader2 size={16} className="animate-spin" /> : "Submit Promotion Banner"}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>,
    document.body
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
// ----------------------------------------------------------------------------
// 📸 Modern Clean Lightbox (Gesture Driven, Smooth Touch Swipe, Back Button Stack)
// ----------------------------------------------------------------------------
function Lightbox({ items, index, onClose }: { items: { url: string, type: string }[], index: number, onClose: () => void }) {
  const [curr, setCurr] = useState(index);
  const [scale, setScale] = useState(1);
  const [touchStartDist, setTouchStartDist] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Telegram Native Back Button Integration with Active Sheet Stack
  const lightboxBackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      if (!(window as any).bwActiveSheets) (window as any).bwActiveSheets = [];
      (window as any).bwActiveSheets.push("lightbox");
      window.dispatchEvent(new CustomEvent("bwRestoreBackHandler"));
    }

    return () => {
      if (typeof window !== "undefined") {
        if ((window as any).bwActiveSheets) {
          (window as any).bwActiveSheets = (window as any).bwActiveSheets.filter((s: string) => s !== "lightbox");
        }
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("bwRestoreBackHandler"));
        }, 50);
      }
    };
  }, []);

  // Local window event fallback
  useEffect(() => {
    const handleBack = (e: Event) => {
      onClose();
      e.preventDefault();
    };
    window.addEventListener("bwNativeBack", handleBack);
    return () => window.removeEventListener("bwNativeBack", handleBack);
  }, [onClose]);

  // Reset scale on item change
  useEffect(() => {
    setScale(1);
  }, [curr]);

  if (!mounted) return null;

  // Touch handlers for pinch zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStartDist(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchStartDist;
      setScale(Math.min(2.2, Math.max(1, ratio)));
    }
  };

  const handleTouchEnd = () => {
    setTouchStartDist(null);
  };

  return createPortal(
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1200] bg-black/95 flex flex-col items-center justify-center select-none backdrop-blur-3xl"
      onClick={onClose}
    >
      <div 
        className="w-full flex-1 relative flex items-center justify-center overflow-hidden" 
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
         <motion.div 
            key={curr}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="w-full h-full flex items-center justify-center p-3 relative cursor-grab active:cursor-grabbing"
            drag={true}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.3}
            onDragEnd={(_, info) => {
              if (scale === 1) {
                // Swipe up or down to dismiss
                if (Math.abs(info.offset.y) > 90) {
                  onClose();
                }
                // Swipe left/right to navigate
                else if (info.offset.x > 40 && curr > 0) {
                  setCurr(curr - 1);
                } else if (info.offset.x < -40 && curr < items.length - 1) {
                  setCurr(curr + 1);
                }
              }
            }}
            style={{ scale }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setScale(s => s === 1 ? 1.8 : 1);
            }}
         >
            {items[curr].type === "photo" ? (
              <img 
                src={items[curr].url} 
                className="max-w-full max-h-[90vh] object-contain shadow-2xl rounded-xl pointer-events-none" 
                alt="Media preview"
              />
            ) : (
              <video 
                src={items[curr].url} 
                controls 
                autoPlay 
                className="max-w-full max-h-[90vh] rounded-xl shadow-2xl" 
              />
            )}
         </motion.div>
      </div>

      {/* Bottom Animated Indicator Dots Only */}
      {items.length > 1 && (
        <div 
          className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 z-[1210]"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((_, i) => (
            <motion.div 
              key={i} 
              animate={{ 
                width: i === curr ? 24 : 6, 
                backgroundColor: i === curr ? "#ffffff" : "rgba(255,255,255,0.25)" 
              }}
              className="h-1.5 rounded-full transition-all cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setCurr(i);
              }}
            />
          ))}
        </div>
      )}
    </motion.div>,
    document.body
  );
}

// Helper to check video extensions
function anyVideoExt(url: string) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes(".mp4") || lower.includes(".webm") || lower.includes(".mov") || lower.includes(".m4v");
}

// ----------------------------------------------------------------------------
// 🖼️ Media Collage Component
// ----------------------------------------------------------------------------
function MediaCollage({ items }: { items: any }) {
  const [lbIndex, setLbIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lbIndex === null) return;
    const tg = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;
    if (!tg?.BackButton) return;

    const handleTgBack = () => {
      setLbIndex(null);
    };

    tg.BackButton.show();
    tg.BackButton.onClick(handleTgBack);

    return () => {
      tg.BackButton.offClick(handleTgBack);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("bwRestoreBackHandler"));
      }, 50);
    };
  }, [lbIndex]);

  if (!items) return null;

  let rawList: any[] = [];
  if (typeof items === "string") {
    try {
      rawList = JSON.parse(items);
    } catch {
      rawList = items.split(",").map((u: string) => u.trim());
    }
  } else if (Array.isArray(items)) {
    rawList = items;
  }

  const validItems: { url: string; type: string }[] = rawList
    .map((item: any) => {
      if (typeof item === "string" && item.trim()) {
        const isVid = anyVideoExt(item);
        return { url: item.trim(), type: isVid ? "video" : "photo" };
      }
      if (item && typeof item === "object" && item.url) {
        const isVid = item.type === "video" || anyVideoExt(item.url);
        return { url: item.url, type: isVid ? "video" : "photo" };
      }
      return null;
    })
    .filter(Boolean) as { url: string; type: string }[];

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
function LinkedText({ text, className = "", showFull = false }: { text: string, className?: string, showFull?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;

  const isHtml = /<[a-z][\s\S]*>/i.test(text);
  
  // Check length using plain text (strip tags just for measurement)
  const plainText = isHtml ? text.replace(/<[^>]*>/g, "") : text;
  const isLong = plainText.length > 300;

  const htmlClasses = "[&_a]:text-cyan-400 [&_a]:underline [&_a]:decoration-cyan-500/30 [&_a]:hover:text-cyan-300 [&_a]:transition-colors [&_a]:break-all [&_code]:bg-white/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs [&_pre]:bg-white/5 [&_pre]:p-3 [&_pre]:rounded-2xl [&_pre]:font-mono [&_pre]:text-xs [&_pre]:overflow-x-auto [&_pre]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-white/20 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2 [&_blockquote]:text-white/70";

  // Long text: use CSS overflow + gradient fade for truncation (preserves links!)
  if (isLong && !expanded && !showFull) {
    if (isHtml) {
      return (
        <div className={`${className} relative`}>
          <div 
            className={`max-h-[120px] overflow-hidden relative html-post-content ${htmlClasses}`}
            style={{
              maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)"
            }}
            dangerouslySetInnerHTML={{ __html: text }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              const anchor = target.closest('a');
              if (anchor) {
                const href = anchor.getAttribute('href');
                if (href) {
                  openExternalLink(href, e);
                }
              }
            }}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
            className="text-white/60 hover:text-white/90 font-black uppercase text-[10px] tracking-wider mt-1 block transition-colors"
          >
            Show more
          </button>
        </div>
      );
    }
    // Plain text truncation
    const truncated = plainText.slice(0, 300).trim() + "...";
    const parts = truncated.split(/(https?:\/\/[^\s]+|@\w{3,}|#\w{2,}|\$[A-Za-z]{2,}|(?:\b[\w-]+\.)+(?:com|xyz|net|org|io|me|app|bot)(?:\/[^\s]*)?)/gi);
    return (
      <div className={className}>
        <span className="inline whitespace-pre-wrap">
          {parts.map((part, i) => {
            if (!part) return null;
            const displayPart = part.length > 40 ? part.slice(0, 37) + "..." : part;
            if (/^https?:\/\//i.test(part)) {
              return (
                <a key={i} href={part} onClick={(e) => openExternalLink(part, e)} className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/30 underline-offset-4 transition-colors break-all inline">
                  {displayPart}
                </a>
              );
            }
            if (/^(?:[\w-]+\.)+(?:com|xyz|net|org|io|me|app|bot)/i.test(part)) {
              return (
                <a key={i} href={`https://${part}`} onClick={(e) => openExternalLink(`https://${part}`, e)} className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/30 underline-offset-4 transition-colors break-all inline">
                  {displayPart}
                </a>
              );
            }
            if (part.startsWith('@')) {
              return (
                <span key={i} onClick={(e) => { e.stopPropagation(); openChannel(part); }} className="text-cyan-400 font-bold hover:text-cyan-300 cursor-pointer transition-colors">
                  {part}
                </span>
              );
            }
            if (part.startsWith('#')) {
              return (
                <span key={i} className="text-cyan-400 font-bold">
                  {part}
                </span>
              );
            }
             if (part.startsWith('$') && /^\$[A-Za-z]/.test(part)) {
              const symbol = part.slice(1);
              return (
                <span 
                  key={i} 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent("triggerTokenSearch", { detail: { query: symbol } }));
                  }}
                  className="text-emerald-400 font-bold cursor-pointer hover:underline underline-offset-2 transition-all"
                >
                  {part}
                </span>
              );
            }
            return part;
          })}
        </span>{" "}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
          className="text-white/60 hover:text-white/90 font-black uppercase text-[10px] tracking-wider ml-1 inline-block transition-colors"
        >
          Show more
        </button>
      </div>
    );
  }

  // Expanded or short text:
  if (isHtml) {
    return (
      <div 
        className={`${className} html-post-content ${htmlClasses}`}
        dangerouslySetInnerHTML={{ __html: text }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          const anchor = target.closest('a');
          if (anchor) {
            const href = anchor.getAttribute('href');
            if (href) {
              openExternalLink(href, e);
            }
          }
        }}
      />
    );
  }

  const parts = text.split(/(https?:\/\/[^\s]+|@\w{3,}|#\w{2,}|\$[A-Za-z]{2,}|(?:\b[\w-]+\.)+(?:com|xyz|net|org|io|me|app|bot)(?:\/[^\s]*)?)/gi);
  return (
    <p className={`${className} whitespace-pre-wrap break-words [word-break:break-word] overflow-wrap-anywhere`}>
      {parts.map((part, i) => {
        if (!part) return null;
        const displayPart = part.length > 40 ? part.slice(0, 37) + "..." : part;
        if (/^https?:\/\//i.test(part)) {
          return (
            <a key={i} href={part} onClick={(e) => openExternalLink(part, e)} className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/30 underline-offset-4 transition-colors break-all inline">
              {displayPart}
            </a>
          );
        }
        if (/^(?:[\w-]+\.)+(?:com|xyz|net|org|io|me|app|bot)/i.test(part)) {
          return (
            <a key={i} href={`https://${part}`} onClick={(e) => openExternalLink(`https://${part}`, e)} className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/30 underline-offset-4 transition-colors break-all inline">
              {displayPart}
            </a>
          );
        }
        if (part.startsWith('@')) {
          return (
            <span key={i} onClick={(e) => { e.stopPropagation(); openChannel(part); }} className="text-cyan-400 font-bold hover:text-cyan-300 cursor-pointer transition-colors">
              {part}
            </span>
          );
        }
        if (part.startsWith('#')) {
          return (
            <span key={i} className="text-cyan-400 font-bold">
              {part}
            </span>
          );
        }
        if (part.startsWith('$') && /^\$[A-Za-z]/.test(part)) {
          const symbol = part.slice(1);
          return (
            <span 
              key={i} 
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent("triggerTokenSearch", { detail: { query: symbol } }));
              }}
              className="text-emerald-400 font-bold cursor-pointer hover:underline underline-offset-2 transition-all"
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </p>
  );
}

// ----------------------------------------------------------------------------
// 🌟 GetGems-Style Explore Hero Carousel (Repeated every 5 posts)
// ----------------------------------------------------------------------------
function ExploreCarousel({
  banners,
  onOpenPromote,
}: {
  banners: any[];
  onOpenPromote: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Combine approved banners + "Promote Your Project" card as final card
  const totalCards = banners.length + 1;

  // Autoplay timer (every 4 seconds)
  useEffect(() => {
    if (totalCards <= 1) return;
    const timer = setInterval(() => {
      if (isDraggingRef.current) return;
      setActiveIdx((prev) => {
        const next = (prev + 1) % totalCards;
        if (scrollRef.current) {
          const cardWidth = scrollRef.current.clientWidth * 0.85;
          scrollRef.current.scrollTo({ left: next * cardWidth, behavior: "smooth" });
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [totalCards]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.clientWidth * 0.85;
    const idx = Math.round(scrollRef.current.scrollLeft / cardWidth);
    if (idx !== activeIdx && idx >= 0 && idx < totalCards) {
      setActiveIdx(idx);
    }
  };

  return (
    <div className="w-full my-4 px-3 flex flex-col gap-2.5">
      {/* Carousel Header with Top-Right Plus Icon Shortcut */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-cyan-400" />
          <span className="text-xs font-black text-white uppercase tracking-wider">Spotlights</span>
        </div>
        <button
          onClick={onOpenPromote}
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all flex items-center gap-1.5 px-2.5"
        >
          <Plus size={14} className="text-white shrink-0" />
          <span className="text-[10px] font-black uppercase text-white/90">Promote</span>
        </button>
      </div>

      {/* Snap-Scrolling Horizontal Carousel */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={() => { isDraggingRef.current = true; }}
        onTouchEnd={() => { setTimeout(() => { isDraggingRef.current = false; }, 1000); }}
        className="flex gap-3 overflow-x-auto custom-scrollbar snap-x snap-mandatory pb-2 scroll-smooth"
      >
        {banners.map((b, i) => (
          <div
            key={b.id || i}
            onClick={() => {
              if (b.target_url && typeof window !== "undefined") {
                const tg = (window as any).Telegram?.WebApp;
                if (tg?.openLink) {
                  tg.openLink(b.target_url);
                } else {
                  window.open(b.target_url, "_blank");
                }
              }
            }}
            className="snap-center shrink-0 w-[85%] max-w-sm bg-zinc-900/90 border border-white/15 rounded-3xl p-3 flex flex-col gap-2.5 cursor-pointer shadow-xl hover:border-white/30 transition-all active:scale-[0.98]"
          >
            {/* Banner Image */}
            <div className="w-full h-44 rounded-2xl overflow-hidden bg-black/40 border border-white/10 relative">
              <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
            </div>
            {/* Banner Title & Description */}
            <div className="flex flex-col gap-0.5 px-1 pb-1">
              <h3 className="text-sm font-black text-white uppercase tracking-wide truncate">{b.title}</h3>
              {b.description && (
                <p className="text-xs text-white/60 font-medium line-clamp-2 leading-tight">{b.description}</p>
              )}
            </div>
          </div>
        ))}

        {/* Final Card: "Promote Your Project" */}
        <div
          onClick={onOpenPromote}
          className="snap-center shrink-0 w-[85%] max-w-sm bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-zinc-900/95 border border-cyan-500/30 rounded-3xl p-4 flex flex-col items-center justify-center text-center gap-3 cursor-pointer shadow-2xl hover:border-cyan-400/50 transition-all active:scale-[0.98] min-h-[220px]"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg border border-white/20">
            <Plus size={28} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col gap-1 max-w-xs">
            <h3 className="text-sm font-black text-white uppercase tracking-wide">Promote Your Project</h3>
            <p className="text-xs text-cyan-300/80 font-medium leading-relaxed">
              reach thousands of verified humans on the waves
            </p>
          </div>
          <button className="px-4 py-1.5 bg-white text-black text-[11px] font-black uppercase rounded-full shadow-md active:scale-95 transition-all">
            Submit Banner
          </button>
        </div>
      </div>

      {/* Pagination Dot Indicators */}
      {totalCards > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-0.5">
          {Array.from({ length: totalCards }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeIdx === idx ? "w-5 bg-white" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      )}
    </div>
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
  isWalletConnected,
  onHide,
  onRepost,
  onConnectRequired,
  onCommentClick,
  onPostClick,
  onStarGiftSuccess,
  onOpenBuyStars,
  isLive
}: {
  post: any,
  currentUserId: number,
  starsBalance: number,
  onStarBalanceChange: (delta: number) => void,
  isConnected: boolean,
  isWalletConnected: boolean,
  onHide: () => void,
  onRepost: () => void,
  onConnectRequired: () => void,
  onCommentClick: () => void,
  onPostClick: () => void,
  onStarGiftSuccess?: () => void,
  onOpenBuyStars?: () => void,
  isLive?: boolean
}) {
  const { t } = useLanguage();
  const [isAcknowledged, setIsAcknowledged] = useState(post.is_acknowledged);
  const [localAckCount, setLocalAckCount] = useState(post.acknowledgments_count || 0);
  const [isStarred, setIsStarred] = useState(post.is_starred);
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
    let active = true;
    const handleClickOutside = (event: MouseEvent) => {
      if (!active) return;
      const target = event.target as HTMLElement;
      if (target.closest('.bottom-sheet-portal')) {
        return;
      }
      if (rowMenuRef.current && !rowMenuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };
    
    let timer: any;
    if (isMenuOpen) {
      timer = setTimeout(() => {
        if (active) document.addEventListener("click", handleClickOutside);
      }, 0);
    }
    
    return () => {
      active = false;
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMenuOpen]);

  // StarGift BackButton handled in parent Explore.tsx centralized event listener

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
    if (!isWalletConnected) {
      return;
    }
    setStarError(null);
    if (Number(post.tg_id) === Number(currentUserId)) {
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
        setIsStarred(post.is_starred);
        onStarBalanceChange(amount);
        onOpenBuyStars?.();
        setStarError(t("explore.gift_star_need_balance"));
      } else if (res?.error === "INVALID_AMOUNT") {
        setLocalStarCount((prev: number) => Math.max(0, prev - amount));
        setIsStarred(post.is_starred);
        onStarBalanceChange(amount);
        setStarError(t("explore.gift_star_invalid_amount"));
      } else {
        setLocalStarCount((prev: number) => Math.max(0, prev - amount));
        setIsStarred(post.is_starred);
        onStarBalanceChange(amount);
        setStarError(t("explore.gift_star_failed"));
      }
    } catch {
      setLocalStarCount((prev: number) => Math.max(0, prev - amount));
      setIsStarred(post.is_starred);
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
    setIsStarred(true);
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
  const miniAppLink = `https://t.me/Bluewave_Ecosystem_bot/bluewave?startapp=ref_${currentUserId}_post_${post.id}`;


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
    const handle = post.channel?.handle || post.channel?.title || post.user?.telegram_channel || post.user?.handle;
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
      className="px-4 py-3.5 border-b border-white/[0.06] relative hover:bg-white/[0.01] transition-all cursor-pointer w-full text-left"
      onClick={onPostClick}
    >
      <TrueViewTracker postId={post.id} />

      {/* Repost Header */}
      {(isReposted || post.reposted_by_name) && (
        <div className="flex items-center gap-2 mb-1.5 ml-14">
          <Repeat2 size={12} className="text-white/40" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
            {post.reposted_by_name ? `${post.reposted_by_name} Reposted` : "You Reposted"}
          </span>
        </div>
      )}

      <div className="flex gap-3.5 w-full items-start">
        {/* Avatar → direct channel link */}
        <button onClick={(e) => { e.stopPropagation(); openChannel(); }} className="shrink-0 relative">
          <div className={`w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-black/40 shadow-sm relative ${(isLive || post.user?.is_live_on_telegram) ? "shimmer-light-wave" : ""}`}>
            {post.channel?.photo && !imgError ? (
              <img src={post.channel.photo} onError={() => setImgError(true)} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-cyan-500 bg-cyan-500/10 font-black text-xs">
                {post.channel?.title?.[0] || "B"}
              </div>
            )}
          </div>
          {(isLive || post.user?.is_live_on_telegram) && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-[7px] font-black px-1 rounded-sm border border-black z-10 shadow-[0_0_5px_#00e6ff]">
              LIVE
            </div>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <button onClick={(e) => { e.stopPropagation(); openChannel(); }} className="flex items-center gap-1.5 truncate">
              <span className="text-white font-bold text-[15px] truncate uppercase tracking-tight">{post.channel?.title}</span>
            </button>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[12px] text-white/60 font-bold uppercase">{timeAgo(post.created_at)}</span>
              <div className="relative" ref={rowMenuRef}>
                <button 
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsMenuOpen(!isMenuOpen); }}
                  onPointerDown={(e) => { e.stopPropagation(); }}
                  className="p-2.5 -m-1.5 text-white/85 hover:text-white touch-manipulation"
                >
                  <MoreHorizontal size={18} />
                </button>
                <AnimatePresence>
                  {isMenuOpen && typeof document !== "undefined" && createPortal(
                    <div className="fixed inset-0 z-[1100] flex flex-col justify-end overflow-hidden pointer-events-auto text-center bottom-sheet-portal">
                      {/* Backdrop */}
                      <motion.div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[8px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}
                      />

                      {/* Bottom Sheet Modal Container */}
                      <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 26, stiffness: 190 }}
                        className="relative w-full z-10 overflow-hidden text-text-main flex flex-col rounded-t-[2.5rem] pb-safe"
                        style={{
                          background: "rgba(0, 0, 0, 0.45)",
                          backdropFilter: "blur(30px) saturate(190%)",
                          WebkitBackdropFilter: "blur(30px) saturate(190%)",
                          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                          boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 -10px 40px rgba(0, 0, 0, 0.5)"
                        }}
                      >
                        {/* Specular Highlight */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-white/5 blur-[60px] rounded-full pointer-events-none" />

                        {/* Drag Handle */}
                        <div className="w-full flex justify-center pt-4 pb-2 shrink-0">
                          <div className="w-12 h-1.5 bg-white/15 rounded-full" />
                        </div>

                        {/* Options Buttons */}
                        <div className="relative p-6 px-8 flex flex-col gap-3 pb-12">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCopyLink(e); }} 
                            className="w-full h-12 flex items-center justify-center gap-3 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 active:scale-[0.98] transition-all"
                          >
                            <Copy size={16} className={isCopying ? "text-green-400" : "text-white/85"} />
                            <span>{isCopying ? "Copied!" : "Copy Link"}</span>
                          </button>
                          
                          {Number(post.tg_id) === Number(currentUserId) ? (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(e); }} 
                              className="w-full h-12 flex items-center justify-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/20 active:scale-[0.98] transition-all"
                            >
                              <X size={16} className="text-red-400" />
                              <span>Delete Post</span>
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleHide(); }} 
                              className="w-full h-12 flex items-center justify-center gap-3 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold uppercase tracking-wider text-white/95 hover:bg-white/10 active:scale-[0.98] transition-all"
                            >
                              <X size={16} className="text-white/80" />
                              <span>{t("explore.not_interested")}</span>
                            </button>
                          )}

                          <button 
                            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }} 
                            className="w-full h-12 flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-wider text-white/40 hover:bg-white/10 active:scale-[0.98] transition-all mt-1"
                          >
                            <span>Cancel</span>
                          </button>
                        </div>
                      </motion.div>
                    </div>,
                    document.body
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <LinkedText text={post.content} className="text-[15px] text-white/95 leading-relaxed break-words whitespace-pre-wrap mb-3" />

          {/* Rich Link Preview Card (Telegram style) */}
          {(() => {
            if (!post.content) return null;
            // Suppress rich link preview if post already has attached media (images/videos)
            const hasAttachedMedia = (post.media_urls && post.media_urls.length > 0) || Boolean(post.media_url);
            if (hasAttachedMedia) return null;

            // Only match the VERY FIRST link in the post content
            const match = post.content.match(/(https?:\/\/[^\s<"']+|(?:\b[\w-]+\.)+(?:com|xyz|net|org|io|me|app|bot|co|tv)(?:\/[^\s<"']*)?)/i);
            if (!match) return null;
            let linkUrl = match[0].replace(/[.,)!?]+$/, "");
            if (!linkUrl.startsWith("http://") && !linkUrl.startsWith("https://")) {
              linkUrl = "https://" + linkUrl;
            }
            return <LinkPreviewCard url={linkUrl} />;
          })()}

          {/* Signal Content */}
          {post.post_type === 'live_scheduled' ? null : post.media_urls && post.media_urls.length > 0 ? (
            <MediaCollage items={post.media_urls} />
          ) : post.media_url ? (
            <div className="mb-4 rounded-2xl overflow-hidden border border-white/5 bg-black/20 shadow-inner w-full">
              {post.media_type === "photo" ? (
                <img src={post.media_url} alt="signal" className="w-full h-auto max-h-[400px] object-contain" loading="lazy" />
              ) : post.media_type === "video" ? (
                <AutoPlayVideo src={post.media_url} />
              ) : null}
            </div>
          ) : null}

          {/* ─── Action Bar: Comment · Like · Star · Repost (left) | Views (right) ─── */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06] w-full text-white/60">
            {/* Left: Comment + Like + Star + Repost — X/Twitter style, full visibility */}
            <div className="flex items-center gap-6">

              {/* Comment */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCommentClick();
                }}
                className="flex items-center gap-2 group transition-all hover:text-cyan-400"
              >
                <MessageCircle size={16} className="transition-colors" />
                <span className="text-[11px] font-black font-mono transition-colors">
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
                          className="absolute w-1.5 h-1.5 bg-red-400 rounded-full"
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  ref={ackBtnRef}
                  onClick={handleAcknowledge}
                  className={`flex items-center gap-2 group transition-all ${
                    isAcknowledged ? "text-red-500" : "hover:text-red-500"
                  }`}
                >
                  <Heart
                    size={16}
                    fill={isAcknowledged ? "currentColor" : "none"}
                    className="transition-transform active:scale-125"
                  />
                  <span className="text-[11px] font-black font-mono transition-colors">
                    {fmt(localAckCount)}
                  </span>
                </button>
              </div>

              {/* Star (Gift) */}
              <button
                onClick={openStarGiftFlow}
                title={t("explore.gift_star_hint")}
                className={`flex items-center gap-2 group transition-all ${
                  isStarred ? "text-amber-500" : "hover:text-amber-500"
                }`}
              >
                <Star
                  size={16}
                  fill={isStarred ? "currentColor" : "none"}
                  className="transition-colors"
                />
                <span className="text-[11px] font-black font-mono transition-colors">
                  {fmt(localStarCount)}
                </span>
              </button>

              {/* Repost */}
              <button
                onClick={handleRepost}
                disabled={isReposted || isReposting}
                className={`flex items-center gap-2 transition-all ${
                  isReposted ? "text-green-500" : isReposting ? "text-green-500/50" : "hover:text-green-500"
                }`}
              >
                {isReposting
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Repeat2 size={16} className={isReposted ? "rotate-180 transition-transform duration-300" : "transition-transform"} />
                }
                {(post.reposts_count || 0) > 0 && (
                  <span className="text-[11px] font-black font-mono">{fmt(post.reposts_count || 0)}</span>
                )}
              </button>

            </div>

            {/* Right: Views */}
            <div className="flex items-center gap-1.5 hover:text-white transition-colors">
              <BarChart2 size={16} />
              <span className="text-[11px] font-black font-mono">
                {fmt(post.views_count || post.views || 0)}
              </span>
            </div>
          </div>
          {starError && (
            <p className="text-[10px] text-amber-400/90 mt-1 font-medium">{starError}</p>
          )}
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



function TrueViewTracker({ postId }: { postId: number | string }) {
  const ref = useRef<HTMLDivElement>(null);
  const viewed = useRef(false);
  useEffect(() => {
    if (viewed.current) return;
    const isTemp = typeof postId === "string" && postId.startsWith("temp");
    if (isTemp) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !viewed.current) {
        viewed.current = true;
        // Convert to number just in case it is a numeric string
        const numericId = typeof postId === "string" ? parseInt(postId, 10) : postId;
        if (!isNaN(numericId)) {
          postApi("/explore/view", { post_id: numericId }).catch(() => { });
        }
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
                className={`flex gap-4 p-4 rounded-2xl items-center transition-all cursor-pointer active:scale-[0.98] bg-white/[0.04] border border-white/[0.08] ${n.is_read ? "opacity-75" : "opacity-100"}`}
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
                  <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border bg-white/5 border-white/5">
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
                  <p className={`text-[10px] leading-relaxed ${n.is_read ? "text-white/85" : "text-white/70"}`}>{getMessage(n)}</p>
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
                        ? "mt-1.5 flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[9px] font-black uppercase tracking-widest text-white/85 cursor-default"
                        : "mt-1.5 flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[9px] font-black uppercase tracking-widest text-cyan-400 hover:bg-cyan-500/20 active:scale-95 transition-all"
                      }
                    >
                      {n.is_followed ? <CheckCircle2 size={10} /> : <Plus size={10} />}
                      {n.is_followed ? "Following" : "Follow Back"}
                    </button>
                  )}
                </div>
                {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-white/40" />}
                {isMilestone && (
                  <ChevronDown size={14} className={`text-white/75 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
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
                          <span className="text-[8px] font-black uppercase tracking-widest text-white/75">Analyzing interactions</span>
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
                            <span className="text-[7px] font-bold text-white/75 truncate max-w-[40px] uppercase">{human.name?.split(" ")[0]}</span>
                          </button>
                        ))
                      ) : (
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/70">No data found</span>
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
  onRefresh,
  isLive
}: {
  post: any,
  commentId?: number | null,
  telegramUser: any,
  onClose: () => void,
  onRefresh: () => void,
  isLive?: boolean
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
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const commentImageInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isAcknowledged, setIsAcknowledged] = useState(initialPost.is_acknowledged);
  const [localLikesCount, setLocalLikesCount] = useState(initialPost.acknowledgments_count || 0);
  const [isReposted, setIsReposted] = useState(initialPost.is_reposted);
  const [localRepostsCount, setLocalRepostsCount] = useState(initialPost.reposts_count || 0);
  const [isReposting, setIsReposting] = useState(false);
  const [isStarred, setIsStarred] = useState(initialPost.is_starred);
  const [localStarCount, setLocalStarCount] = useState(initialPost.stars_count || 0);
  const [starGiftOpen, setStarGiftOpen] = useState(false);
  const [starGiftMode, setStarGiftMode] = useState<"setup" | "confirm">("setup");
  const [starError, setStarError] = useState<string | null>(null);

  useEffect(() => {
    if (post) {
      setIsAcknowledged(post.is_acknowledged);
      setLocalLikesCount(post.acknowledgments_count || 0);
      setIsReposted(post.is_reposted);
      setLocalRepostsCount(post.reposts_count || 0);
      setIsStarred(post.is_starred);
      setLocalStarCount(post.stars_count || 0);
    }
  }, [post]);

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

  const { data: comments, loading: loadingComments, mutate: mutateComments } = useApi(post?.id ? `/explore/post/${post.id}/comments` : null);

  useEffect(() => {
    if (post?.id) {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(`bw_comments_${post.id}`);
        if (cached) {
          try {
            setLocalComments(JSON.parse(cached));
          } catch (e) {}
        } else {
          setLocalComments([]);
        }
      }
    } else {
      setLocalComments([]);
    }
  }, [post?.id]);

  useEffect(() => {
    if (comments) {
      setLocalComments(comments);
      if (post?.id && typeof window !== "undefined") {
        localStorage.setItem(`bw_comments_${post.id}`, JSON.stringify(comments));
      }
      if (commentId) {
        setTimeout(() => {
          const el = document.getElementById(`comment-${commentId}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 500);
      }
    }
  }, [comments, commentId, post?.id]);

  const handlePostComment = async () => {
    if (!content.trim() && !commentImage) return;
    setPosting(true);

    let uploadedMediaUrl: string | null = null;

    // Upload image if attached (uses safer postApi to propagate session and initHeaders)
    if (commentImage) {
      setCommentImageUploading(true);
      try {
        const b64 = commentImage.split(",")[1]; // strip data:image/...;base64,
        const ext = commentImage.split(";")[0].split("/")[1] || "jpg";
        const uploadRes = await postApi("/explore/upload_comment_image", {
          user_id: telegramUser.id,
          image_b64: b64,
          ext,
        });
        if (uploadRes && uploadRes.url) {
          uploadedMediaUrl = uploadRes.url;
        }
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

  const handleAcknowledge = async () => {
    const nextState = !isAcknowledged;
    setIsAcknowledged(nextState);
    setLocalLikesCount((prev: number) => nextState ? prev + 1 : Math.max(0, prev - 1));
    try {
      await postApi(`/explore/post/${post.id}/acknowledge`, { user_id: telegramUser.id });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRepost = async () => {
    if (isReposting || isReposted) return;
    setIsReposting(true);
    try {
      const res = await postApi("/explore/repost", { user_id: telegramUser.id, post_id: post.id });
      if (res.success) {
        setIsReposted(true);
        setLocalRepostsCount((prev: number) => prev + 1);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReposting(false);
    }
  };

  const openStarGiftFlow = () => {
    if (post.tg_id === telegramUser.id) {
      setStarError("You cannot send stars to your own post");
      return;
    }
    setStarError(null);
    setStarGiftMode("confirm");
    setStarGiftOpen(true);
  };

  const handleStarGiftConfirm = async (amount: number) => {
    setStarGiftOpen(false);
    setLocalStarCount((prev: number) => prev + amount);
    setIsStarred(true);
    try {
      const res = await postApi("/explore/star", {
        user_id: telegramUser.id,
        post_id: post.id,
        amount
      });
      if (res.success) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
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

  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());

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

  const toggleExpandReplies = (parentId: number) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  };

  const renderComments = (parentId: number | null = null, depth = 0): React.ReactNode => {
    const allChildComments = localComments.filter(c => c.parent_id === parentId);
    if (allChildComments.length === 0) return null;

    const isExpanded = parentId !== null && expandedReplies.has(parentId);
    // If depth > 0 (replies) and not expanded, show max 2 replies initially
    const visibleComments = (depth > 0 && !isExpanded) ? allChildComments.slice(0, 2) : allChildComments;
    const remainingCount = allChildComments.length - visibleComments.length;

    return (
      <>
        {visibleComments.map(comment => (
          <div key={comment.id} id={`comment-${comment.id}`} className="flex flex-col">
            <div className={`flex gap-3 py-4 ${depth > 0 ? "ml-6 border-l border-white/10 pl-4" : ""} ${comment.id === commentId ? "bg-cyan-500/5 rounded-xl px-2 -mx-2" : ""}`}>
              {/* Avatar — clickable to open Telegram profile */}
              <button
                onClick={() => openCommenterProfile(comment.user.username, comment.user.tg_id)}
                className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10 bg-black/40 shadow-sm active:scale-90 transition-transform"
              >
                {comment.user.photo ? (
                  <img src={comment.user.photo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-cyan-500/10 text-cyan-400 font-black text-xs">
                    {comment.user.name?.[0]}
                  </div>
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                {/* Comment Header: Name + Time on Left, Heart Like on Top-Right */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => openCommenterProfile(comment.user.username, comment.user.tg_id)}
                      className="text-white font-bold text-[13px] truncate tracking-tight uppercase hover:text-cyan-400 transition-colors active:scale-95"
                    >
                      {comment.user.name}
                    </button>
                    <span className="text-[10px] text-white/50 font-mono shrink-0">
                      {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Heart Like Button — Right Aligned with 18px Icon */}
                  <button
                    onClick={() => handleToggleLike(comment.id)}
                    className={`flex items-center gap-1.5 p-1 rounded-lg transition-all active:scale-90 shrink-0 ${comment.is_liked ? "text-rose-500" : "text-white/40 hover:text-white"}`}
                  >
                    <Heart size={18} fill={comment.is_liked ? "currentColor" : "none"} strokeWidth={2.5} />
                    {comment.likes_count > 0 && <span className="text-[11px] font-black font-mono">{comment.likes_count}</span>}
                  </button>
                </div>

                {/* Comment image — show if exists */}
                {comment.media_url && (
                  <div className="mb-3 rounded-2xl overflow-hidden border border-white/10 max-w-[280px]">
                    <img src={comment.media_url} alt="comment media" className="w-full h-auto object-cover" loading="lazy" />
                  </div>
                )}

                {/* Comment Text Content — Crisp 15px font */}
                <LinkedText text={comment.content} className="text-[15px] text-white/95 leading-relaxed mb-2.5 whitespace-pre-wrap font-medium" />

                {/* Reply Action Button */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setReplyTo(comment);
                      const input = document.getElementById('comment-input');
                      input?.focus();
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-cyan-400 transition-colors active:scale-95"
                  >
                    <MessageCircle size={13} strokeWidth={2.5} />
                    <span>Reply</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Render Nested Children */}
            {renderComments(comment.id, depth + 1)}
          </div>
        ))}

        {/* View More Replies Dropdown Button (shown when depth > 0 and replies exceed 2) */}
        {depth > 0 && remainingCount > 0 && (
          <button
            onClick={() => toggleExpandReplies(parentId!)}
            className="ml-6 pl-4 py-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-all active:scale-95"
          >
            <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            <span>{isExpanded ? "Show fewer replies" : `View ${remainingCount} more ${remainingCount === 1 ? "reply" : "replies"}`}</span>
          </button>
        )}
      </>
    );
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
            <div className="py-6 space-y-8 animate-pulse text-left">
              {/* Post Header Skeleton */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-white/10 rounded w-1/3" />
                  <div className="h-3 bg-white/10 rounded w-1/4" />
                </div>
              </div>
              {/* Post Content Skeleton */}
              <div className="space-y-2">
                <div className="h-3 bg-white/10 rounded w-full" />
                <div className="h-3 bg-white/10 rounded w-full" />
                <div className="h-3 bg-white/10 rounded w-2/3" />
              </div>
              {/* Media Block Skeleton */}
              <div className="h-48 bg-white/5 rounded-2xl w-full" />
              {/* Comments Section Separator */}
              <div className="h-px bg-white/5 my-4" />
              {/* Comments List Skeleton */}
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 py-4">
                    <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="flex gap-2">
                        <div className="h-3 bg-white/10 rounded w-1/4" />
                        <div className="h-2 bg-white/10 rounded w-1/6" />
                      </div>
                      <div className="h-3 bg-white/10 rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
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
                <div className={`w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-black/40 shrink-0 group-hover:border-cyan-500/50 transition-colors relative ${(isLive || post.user?.is_live_on_telegram) ? "shimmer-light-wave" : ""}`}>
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
                  <p className="text-[11px] text-white/75 font-mono">@{(post.channel?.handle || post.user?.handle || 'anon').replace(/^@/, '')}</p>
                </div>
              </div>

              <LinkedText text={post.content} showFull={true} className="text-xl text-white font-medium leading-[1.6] tracking-tight mb-4 whitespace-pre-wrap selection:bg-cyan-500/30 break-words [word-break:break-word]" />

              {/* Rich Link Preview Card (Telegram style) inside PostDetailModal */}
              {(() => {
                if (!post.content) return null;
                // Suppress rich link preview if post already has attached media (images/videos)
                const hasAttachedMedia = (post.media_urls && post.media_urls.length > 0) || Boolean(post.media_url);
                if (hasAttachedMedia) return null;

                // Only match the VERY FIRST link in the post content
                const match = post.content.match(/(https?:\/\/[^\s<"']+|(?:\b[\w-]+\.)+(?:com|xyz|net|org|io|me|app|bot|co|tv)(?:\/[^\s<"']*)?)/i);
                if (!match) return null;
                let linkUrl = match[0].replace(/[.,)!?]+$/, "");
                if (!linkUrl.startsWith("http://") && !linkUrl.startsWith("https://")) {
                  linkUrl = "https://" + linkUrl;
                }
                return <LinkPreviewCard url={linkUrl} />;
              })()}

              {post.media_urls && post.media_urls.length > 0 && (
                <MediaCollage items={post.media_urls} />
              )}

              <div className="flex flex-col gap-4">
                {/* ─── Actions Row (Above Stats) ─── */}
                 <div className="flex items-center gap-8 py-3.5 border-t border-white/5 w-full text-white/60">
                  {/* Comment */}
                  <button
                    onClick={() => {
                      const input = document.getElementById('comment-input');
                      input?.focus();
                    }}
                    className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
                  >
                    <MessageCircle size={18} />
                    <span className="text-[11px] font-black font-mono">
                      {post.comments_count || 0}
                    </span>
                  </button>

                  {/* Like */}
                  <button
                    onClick={handleAcknowledge}
                    className={`flex items-center gap-2 transition-all ${
                      isAcknowledged ? "text-red-500" : "hover:text-red-500"
                    }`}
                  >
                    <Heart
                      size={18}
                      fill={isAcknowledged ? "currentColor" : "none"}
                      strokeWidth={2.5}
                    />
                    <span className="text-[11px] font-black font-mono">
                      {localLikesCount}
                    </span>
                  </button>

                  {/* Star (Gift) */}
                  <button
                    onClick={openStarGiftFlow}
                    className={`flex items-center gap-2 transition-all ${
                      isStarred ? "text-amber-500" : "hover:text-amber-500"
                    }`}
                  >
                    <Star
                      size={18}
                      fill={isStarred ? "currentColor" : "none"}
                      strokeWidth={2.5}
                    />
                    <span className="text-[11px] font-black font-mono">
                      {localStarCount}
                    </span>
                  </button>

                  {/* Repost */}
                  <button
                    onClick={handleRepost}
                    disabled={isReposted || isReposting}
                    className={`flex items-center gap-2 transition-all ${
                      isReposted ? "text-green-500" : "hover:text-green-500"
                    }`}
                  >
                    {isReposting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Repeat2 size={18} className={isReposted ? "rotate-180 transition-transform duration-300" : ""} />
                    )}
                    <span className="text-[11px] font-black font-mono">
                      {localRepostsCount}
                    </span>
                  </button>
                </div>

                {/* ─── Stats Row ─── */}
                <div className="flex items-center justify-between py-4 border-y border-white/5">
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-black text-white">{localLikesCount}</span>
                      <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">Likes</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-black text-white">{localRepostsCount}</span>
                      <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">Reposts</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-black text-white">{localStarCount}</span>
                      <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">Stars</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-black text-white">{post.views || 0}</span>
                      <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">Views</span>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-tighter text-right">
                    {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {" · "}
                    {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                <div className="space-y-4">
                  {loadingComments && localComments.length === 0 ? (
                    <div className="space-y-4 py-4 animate-pulse">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 py-4 text-left">
                          <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                          <div className="space-y-2 flex-1">
                            <div className="flex gap-2">
                              <div className="h-3 bg-white/10 rounded w-1/4" />
                              <div className="h-2 bg-white/10 rounded w-1/6" />
                            </div>
                            <div className="h-3 bg-white/10 rounded w-5/6" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : localComments.length === 0 ? (
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

        {/* Hidden image file input */}
        <input
          ref={commentImageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCommentImageSelect}
        />

        {/* ─── Modern X/Twitter Style Dual-State Comment Input ─── */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-zinc-950/95 to-transparent pt-4 pb-[calc(env(safe-area-inset-bottom,16px)+16px)] px-4 max-w-xl mx-auto z-[600] pointer-events-auto">
          {/* Reply Banner */}
          {replyTo && (
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center justify-between bg-white/10 px-3 py-1 mb-2 rounded-lg border border-white/15">
              <span className="text-[10px] font-extrabold text-white/80 uppercase tracking-wider">
                Replying to <span className="text-white font-bold">{replyTo.user.name}</span>
              </span>
              <button onClick={() => setReplyTo(null)} className="text-white/60 p-0.5 hover:text-white">
                <X size={13} />
              </button>
            </motion.div>
          )}

          {starError && (
            <p className="text-[10px] text-amber-400 mb-2 font-medium px-2">{starError}</p>
          )}

          {!isInputExpanded ? (
            /* ─── COLLAPSED PILL STATE (Matching Reference Image 2) ─── */
            <div
              onClick={() => setIsInputExpanded(true)}
              className="w-full bg-zinc-900/90 border border-white/15 rounded-full px-3.5 py-2.5 flex items-center justify-between shadow-2xl backdrop-blur-2xl cursor-pointer hover:border-white/30 transition-all"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Left: Current User Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/15 bg-black/40 shrink-0 shadow-sm">
                  {(telegramUser?.photo || telegramUser?.photo_url || telegramUser?.telegram_channel_photo || (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.photo_url)) ? (
                    <img 
                      src={telegramUser?.photo || telegramUser?.photo_url || telegramUser?.telegram_channel_photo || (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.photo_url} 
                      className="w-full h-full object-cover" 
                      alt="User avatar"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-cyan-500/20 text-cyan-400 font-black text-xs">
                      {(telegramUser?.first_name || telegramUser?.username || "U")[0]}
                    </div>
                  )}
                </div>

                {/* Input Placeholder */}
                <input
                  type="text"
                  readOnly
                  value={content}
                  placeholder="Post your reply"
                  className="bg-transparent text-white/90 text-sm font-medium outline-none pointer-events-none w-full placeholder-white/40"
                />
              </div>

              {/* Right Action Icons */}
              <div className="flex items-center gap-2.5 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => commentImageInputRef.current?.click()}
                  className="p-1.5 rounded-full text-white/70 hover:text-white transition-colors"
                >
                  <ImageIcon size={20} />
                </button>

                <button
                  onClick={() => setIsInputExpanded(true)}
                  className="p-1.5 rounded-full text-white/70 hover:text-white transition-colors"
                >
                  <Maximize2 size={18} />
                </button>
              </div>
            </div>
          ) : (
            /* ─── COMPACT EXPANDED CARD STATE ─── */
            <div className="w-full bg-zinc-900/95 border border-white/15 rounded-2xl p-3 flex flex-col gap-2 shadow-2xl backdrop-blur-2xl">
              {/* Top Input Row: Avatar + Textarea + Contract Icon */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-white/15 bg-black/40 shrink-0 shadow-sm mt-0.5">
                  {(telegramUser?.photo || telegramUser?.photo_url || telegramUser?.telegram_channel_photo || (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.photo_url)) ? (
                    <img 
                      src={telegramUser?.photo || telegramUser?.photo_url || telegramUser?.telegram_channel_photo || (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.photo_url} 
                      className="w-full h-full object-cover" 
                      alt="User avatar"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/20 text-white font-black text-xs">
                      {(telegramUser?.first_name || telegramUser?.username || "U")[0]}
                    </div>
                  )}
                </div>

                <textarea
                  id="comment-input"
                  autoFocus
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Post your reply"
                  rows={2}
                  className="flex-1 bg-transparent text-white text-xs font-medium outline-none resize-none placeholder-white/40 leading-relaxed custom-scrollbar pt-0.5"
                />

                <button
                  onClick={() => setIsInputExpanded(false)}
                  className="p-1 text-white/50 hover:text-white transition-colors shrink-0"
                >
                  <Minimize2 size={16} />
                </button>
              </div>

              {/* Attached Media Thumbnail Preview */}
              {commentImage && (
                <div className="relative inline-block w-20 h-20 rounded-xl overflow-hidden border border-white/15 shadow-lg ml-9 my-0.5">
                  <img src={commentImage} alt="attached media" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setCommentImage(null)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform shadow-md"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}

              {/* Bottom Action Toolbar */}
              <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                {/* Left Toolbar Icons: Image */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => commentImageInputRef.current?.click()}
                    className="p-1 rounded-full text-white/70 hover:text-white active:scale-90 transition-all"
                  >
                    <ImageIcon size={18} />
                  </button>
                </div>

                {/* Right Toolbar: Character Ring + Bold Reply Pill Button */}
                <div className="flex items-center gap-2.5">
                  {/* Character Progress Ring */}
                  <div className="w-4 h-4 relative flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
                      <circle
                        cx="8" cy="8" r="6"
                        stroke={content.length > 250 ? "#ef4444" : "#ffffff"}
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={38}
                        strokeDashoffset={Math.max(0, 38 - (content.length / 280) * 38)}
                      />
                    </svg>
                  </div>

                  {/* Reply Pill Button */}
                  <button
                    onClick={handlePostComment}
                    disabled={posting || commentImageUploading || (!content.trim() && !commentImage)}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm px-6 py-2 rounded-full transition-all active:scale-95 disabled:opacity-30 shadow-lg flex items-center justify-center"
                  >
                    {posting || commentImageUploading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <span>Reply</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Star Gift Modal integration inside PostDetailModal */}
        <StarGiftModal
          isOpen={starGiftOpen}
          mode={starGiftMode}
          recipientName={post.channel?.title || post.user?.name || "Ecosystem User"}
          starsBalance={telegramUser?.stars_balance ?? 0}
          onClose={() => setStarGiftOpen(false)}
          onConfirm={handleStarGiftConfirm}
          onEditAmount={() => setStarGiftMode("setup")}
        />
      </motion.div>
    </motion.div>,
    document.body
  );
}
