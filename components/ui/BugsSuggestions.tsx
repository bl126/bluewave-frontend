"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { 
  Plus, Search, ChevronDown, Check, Loader2, 
  Image as ImageIcon, Video as VideoIcon, Trash2, MessageSquare, AlertCircle
} from "lucide-react";
import { postApi, getApi } from "@/lib/useApi";
import { useLanguage } from "@/contexts/LanguageContext";

interface BugsSuggestionsProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUser: any;
}

interface ReportItem {
  id: string;
  tg_id: number;
  bw_id: string;
  first_name: string;
  username: string;
  tag: "bug" | "suggestion";
  headline: string;
  description: string;
  media_urls: string[];
  status: "open" | "fix_coming" | "fixed" | "closed";
  admin_message: string | null;
  admin_media_urls: string[];
  created_at: string;
}

// Helper: format duration remaining until reset (no translations needed — always numeric)
function formatResetDuration(resetTimeStr: string): string {
  const diff = new Date(resetTimeStr).getTime() - Date.now();
  if (diff <= 0) return "a few seconds";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

interface CacheEntry {
  reports: ReportItem[];
  counts: {
    all: number;
    issues: number;
    suggestions: number;
    my: number;
  };
}

const reportsCache: Record<string, CacheEntry> = {};

function formatCount(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "m";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return num.toString();
}


export default function BugsSuggestions({ isOpen, onClose, telegramUser }: BugsSuggestionsProps) {
  const { t } = useLanguage();

  // Translated relative time helper (needs t() from context)
  const relativeTime = (dateStr: string): string => {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return t("bugs_suggestions.just_now");
    if (diff < 3600) return t("bugs_suggestions.ago_m").replace("{time}", String(Math.floor(diff / 60)));
    if (diff < 86400) return t("bugs_suggestions.ago_h").replace("{time}", String(Math.floor(diff / 3600)));
    if (diff < 604800) return t("bugs_suggestions.ago_d").replace("{time}", String(Math.floor(diff / 86400)));
    return new Date(dateStr).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  };

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<"all" | "issues" | "suggestions" | "my">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [counts, setCounts] = useState({ all: 0, issues: 0, suggestions: 0, my: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  // Pull-to-refresh state
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Lightbox Media carousel states
  const [lightboxMedia, setLightboxMedia] = useState<{ urls: string[]; isVideos: boolean[]; currentIndex: number } | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const lightboxSwipeStart = useRef<{ x: number; y: number } | null>(null);
  const [lightboxSlideOffset, setLightboxSlideOffset] = useState(0);

  // Post creation state
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [postTag, setPostTag] = useState<"bug" | "suggestion">("bug");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadProgressMsg, setUploadProgressMsg] = useState("");
  const [pendingSubmission, setPendingSubmission] = useState<{
    tag: "bug" | "suggestion";
    headline: string;
    description: string;
    media_urls?: string[];
  } | null>(null);
  const [showFab, setShowFab] = useState(true);

  // Rate Limit State
  const [rateLimit, setRateLimit] = useState<{
    daily_count: number;
    daily_limit: number;
    weekly_count: number;
    weekly_limit: number;
    can_submit: boolean;
    reset_daily: string | null;
    reset_weekly: string | null;
  } | null>(null);
  const [loadingLimits, setLoadingLimits] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const touchStart = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Swipe & Pull-to-refresh touch gesture handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    
    // Allow pulling only when scroll is at top and not already refreshing
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop === 0 && !isRefreshing) {
      setIsPulling(true);
    } else {
      setIsPulling(false);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current !== null && isPulling && !isRefreshing) {
      const currentY = e.targetTouches[0].clientY;
      const diffY = currentY - touchStartY.current;
      
      if (diffY > 0) {
        // Dragging down: apply spring resistance
        const pull = Math.min(80, diffY * 0.45);
        setPullY(pull);
        
        // Prevent bounce scrolling behavior
        if (e.cancelable) {
          e.preventDefault();
        }
      } else {
        setPullY(0);
      }
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current !== null && touchStartY.current !== null) {
      const diffX = touchStart.current - e.changedTouches[0].clientX;
      const diffY = touchStartY.current - e.changedTouches[0].clientY;
      
      // 1. Check if it's a Pull-to-refresh action
      if (isPulling && pullY >= 60) {
        setIsRefreshing(true);
        fetchReports(true); // force refresh (ignore cache)
      } else {
        setPullY(0);
      }
      
      // 2. Make sure it is primarily a horizontal swipe and meets a threshold
      if (Math.abs(diffX) > 80 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        const tabs: ("all" | "issues" | "suggestions" | "my")[] = ["all", "issues", "suggestions", "my"];
        const currentIndex = tabs.indexOf(activeTab);
        
        if (diffX > 0 && currentIndex < tabs.length - 1) {
          setActiveTab(tabs[currentIndex + 1]);
        } else if (diffX < 0 && currentIndex > 0) {
          setActiveTab(tabs[currentIndex - 1]);
        }
      }
    }
    touchStart.current = null;
    touchStartY.current = null;
    setIsPulling(false);
  };

  // Hide FAB on scroll down, show on scroll up
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const currentY = scrollContainerRef.current.scrollTop;
    if (Math.abs(currentY - lastScrollY.current) < 10) return;
    
    if (currentY > lastScrollY.current && currentY > 50) {
      setShowFab(false);
    } else {
      setShowFab(true);
    }
    lastScrollY.current = currentY;
  };

  // Keep FAB visible when tab switches
  useEffect(() => {
    setShowFab(true);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    lastScrollY.current = 0;
  }, [activeTab]);

  // Status Filter Options
  const statusOptions = [
    { value: null, label: t("bugs_suggestions.status_all") },
    { value: "open", label: t("bugs_suggestions.status_open") },
    { value: "fix_coming", label: t("bugs_suggestions.status_fix_coming") },
    { value: "fixed", label: t("bugs_suggestions.status_fixed") },
    { value: "closed", label: t("bugs_suggestions.status_closed") }
  ];

  // Fetch Reports with caching (Stale-While-Revalidate)
  const fetchReports = async (forceRefresh = false) => {
    const tabParam = activeTab === "issues" ? "issues" : (activeTab === "suggestions" ? "suggestions" : (activeTab === "my" ? "my" : "all"));
    const cacheKey = `${tabParam}_${selectedStatus || "all"}_${searchQuery}`;

    // Stale-While-Revalidate: load from cache immediately if available
    if (!forceRefresh && reportsCache[cacheKey]) {
      setReports(reportsCache[cacheKey].reports);
      setCounts(reportsCache[cacheKey].counts);
      setLoading(false);
      setError(null);
      // Run background API sync silently
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      let url = `/bugs_suggestions?tab=${tabParam}`;
      if (selectedStatus) {
        url += `&status=${selectedStatus}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      const res = await getApi(url);
      if (res.error) {
        if (!reportsCache[cacheKey]) {
          setError(res.error);
        }
      } else {
        let reportsList: ReportItem[] = res.reports || [];
        const resCounts = res.counts || { all: 0, issues: 0, suggestions: 0, my: 0 };

        if (activeTab === "all") {
          const statusOrder: Record<ReportItem["status"], number> = { open: 0, fix_coming: 1, fixed: 2, closed: 3 };
          reportsList = [...reportsList].sort((a, b) => {
            const orderA = statusOrder[a.status] !== undefined ? statusOrder[a.status] : 4;
            const orderB = statusOrder[b.status] !== undefined ? statusOrder[b.status] : 4;
            if (orderA !== orderB) {
              return orderA - orderB;
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        }

        setReports(reportsList);
        setCounts(resCounts);
        
        // Cache the result
        reportsCache[cacheKey] = {
          reports: reportsList,
          counts: resCounts
        };
      }
    } catch (err: any) {
      if (!reportsCache[cacheKey]) {
        setError(err.message || "Failed to fetch reports.");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setPullY(0);
    }
  };

  const fetchRateLimits = async () => {
    if (!telegramUser?.id) return;
    setLoadingLimits(true);
    try {
      const res = await getApi(`/bugs_suggestions/limits?tg_id=${telegramUser.id}`);
      if (res && !res.error) {
        setRateLimit(res);
      }
    } catch (err) {
      console.error("Error fetching rate limits:", err);
    } finally {
      setLoadingLimits(false);
    }
  };

  useEffect(() => {
    if (isPostOpen) {
      fetchRateLimits();
    }
  }, [isPostOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen, activeTab, selectedStatus, searchQuery]);
// Preload reports on component mount for instant future opens
useEffect(() => {
  // Load default tab data in background without affecting UI state
  (async () => {
    try {
      await fetchReports(true);
    } catch (e) {
      console.error('Preload reports error', e);
    }
  })();
}, []);

  // Handle Native Back button click via custom event interceptor
  useEffect(() => {
    const handleNativeBack = (e: Event) => {
      if (!isOpen) return;

      if (lightboxMedia) {
        setLightboxMedia(null);
        setZoomScale(1);
        setPanPosition({ x: 0, y: 0 });
        setLightboxSlideOffset(0);
        e.preventDefault();
        return;
      }

      if (isPostOpen) {
        setIsPostOpen(false);
        e.preventDefault();
        return;
      }

      if (selectedReport) {
        setSelectedReport(null);
        e.preventDefault();
        return;
      }
      
      if (statusDropdownOpen) {
        setStatusDropdownOpen(false);
        e.preventDefault();
        return;
      }
    };

    window.addEventListener("bwNativeBack", handleNativeBack);
    return () => window.removeEventListener("bwNativeBack", handleNativeBack);
  }, [isOpen, isPostOpen, selectedReport, statusDropdownOpen, lightboxMedia]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Media Selection
  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const hasVideo = files.some(file => file.type.startsWith("video/"));
    const hasImage = files.some(file => file.type.startsWith("image/"));

    if (hasVideo && hasImage) {
      alert(t("bugs_suggestions.err_mix"));
      return;
    }

    if (hasVideo) {
      if (files.length > 1) {
        alert(t("bugs_suggestions.err_video_limit"));
        return;
      }
      // Mutually exclusive: clear existing previews and replace
      setMediaFiles([files[0]]);
      const url = URL.createObjectURL(files[0]);
      setMediaPreviews([url]);
    } else {
      // If we currently have a video attached, clear it
      let currentFiles = [...mediaFiles];
      if (currentFiles.some(f => f.type.startsWith("video/"))) {
        currentFiles = [];
        setMediaPreviews([]);
      }

      const newFiles = [...currentFiles, ...files].slice(0, 3);
      setMediaFiles(newFiles);

      const urls = newFiles.map(file => URL.createObjectURL(file));
      setMediaPreviews(urls);
    }
  };

  const removeMedia = (index: number) => {
    const newFiles = [...mediaFiles];
    newFiles.splice(index, 1);
    setMediaFiles(newFiles);

    const newPreviews = [...mediaPreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setMediaPreviews(newPreviews);
  };

  // Submit Feedback
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim() || !description.trim()) {
      setSubmitError(t("bugs_suggestions.err_required"));
      return;
    }

    const pendingData = {
      tag: postTag,
      headline: headline.trim(),
      description: description.trim(),
      media_urls: [] as string[]
    };
    setPendingSubmission(pendingData);

    const localHeadline = headline.trim();
    const localDescription = description.trim();
    const localPostTag = postTag;
    const localMediaFiles = [...mediaFiles];

    setIsSubmitting(true);
    setSubmitError(null);
    setUploadProgressMsg(t("bugs_suggestions.uploading"));

    // Close the submission form sheet instantly
    setHeadline("");
    setDescription("");
    setMediaFiles([]);
    setMediaPreviews([]);
    setIsPostOpen(false);

    // Asynchronous background task
    (async () => {
      try {
        const uploadedUrls: string[] = [];

        // 1. Upload files if any exist
        for (let i = 0; i < localMediaFiles.length; i++) {
          const file = localMediaFiles[i];
          const ext = file.name.split(".").pop() || "jpg";

          const urlRes = await postApi("/bugs_suggestions/get_upload_url", {
            tg_id: telegramUser.id,
            media_ext: ext
          });

          if (urlRes.error || !urlRes.signed_url) {
            throw new Error(urlRes.error || t("bugs_suggestions.err_signed_url"));
          }

          const uploadRes = await fetch(urlRes.signed_url, {
            method: "PUT",
            headers: {
              "Authorization": `Bearer ${urlRes.token}`,
              "Content-Type": file.type,
            },
            body: file
          });

          if (!uploadRes.ok) {
            throw new Error(t("bugs_suggestions.err_upload_failed"));
          }

          uploadedUrls.push(urlRes.public_url);
        }

        // 2. Submit record to backend
        const payload = {
          tg_id: telegramUser.id,
          bw_id: telegramUser.bw_id,
          first_name: telegramUser.first_name || telegramUser.name,
          username: telegramUser.username,
          tag: localPostTag,
          headline: localHeadline,
          description: localDescription,
          media_urls: uploadedUrls
        };

        const res = await postApi("/bugs_suggestions", payload);
        if (res.error) {
          throw new Error(res.error);
        }

        // Success! Reload lists
        fetchReports();
      } catch (err: any) {
        console.error("Background submission error:", err);
        if (typeof window !== "undefined") {
          const tg = (window as any).Telegram?.WebApp;
          if (tg?.showAlert) {
            tg.showAlert(t("bugs_suggestions.err_submit_failed").replace("{error}", err.message || "Network error"));
          } else {
            alert(t("bugs_suggestions.err_submit_failed").replace("{error}", err.message || "Network error"));
          }
        }
      } finally {
        setIsSubmitting(false);
        setUploadProgressMsg("");
        setPendingSubmission(null);
      }
    })();
  };

  // Helper formatting for Status Badges
  const getStatusStyle = (status: ReportItem["status"]) => {
    switch (status) {
      case "open":
        return { bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400", label: t("bugs_suggestions.status_open") };
      case "fix_coming":
        return { bg: "bg-amber-500/10 border-amber-500/30 text-amber-400", label: t("bugs_suggestions.status_fix_coming") };
      case "fixed":
        return { bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400", label: t("bugs_suggestions.status_fixed") };
      case "closed":
        return { bg: "bg-red-500/10 border-red-500/30 text-red-400", label: t("bugs_suggestions.status_closed") };
      default:
        return { bg: "bg-gray-500/10 border-gray-500/30 text-gray-400", label: status };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[130] flex flex-col text-text-main bg-app-bg/95 backdrop-blur-3xl overflow-hidden"
          style={{ 
            paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 12px)", 
            paddingBottom: "env(safe-area-inset-bottom, 0px)" 
          }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Main Feed Container */}
          <div className="flex-1 flex flex-col h-full overflow-hidden max-w-md mx-auto w-full px-6">
            
            {/* Search Bar - 30pt (approx 40px) space reserved above it for native Telegram header and Back Button */}
            <div className="mt-[50px] relative">
              <div className="flex items-center bg-app-card border border-app-border rounded-full pl-4 pr-2 py-1.5 shadow-lg group transition-all duration-300 focus-within:border-app-accent/40">
                <Search size={16} className="text-text-sub group-focus-within:text-app-accent transition-colors" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t("bugs_suggestions.search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none pl-3 pr-2 py-1 text-xs text-text-main placeholder-text-sub/50 font-medium"
                />
                
                {/* Status Dropdown Trigger inside Search */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    className="flex items-center gap-1 bg-app-bg/60 border border-app-border hover:border-app-accent/20 rounded-full px-3 py-1 text-[10px] uppercase font-black tracking-wider text-text-sub hover:text-text-main transition-all"
                  >
                    <span>
                      {selectedStatus ? statusOptions.find(o => o.value === selectedStatus)?.label : "Status"}
                    </span>
                    <ChevronDown size={10} className={`transform transition-transform ${statusDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {statusDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute right-0 mt-2 w-36 bg-app-card border border-app-border rounded-2xl shadow-xl py-1.5 z-50 overflow-hidden backdrop-blur-2xl"
                      >
                        {statusOptions.map((opt) => (
                          <button
                            key={opt.value || "all"}
                            onClick={() => {
                              setSelectedStatus(opt.value);
                              setStatusDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-[10px] uppercase font-black tracking-wider text-text-sub hover:text-app-accent hover:bg-app-accent/5 flex justify-between items-center transition-colors"
                          >
                            <span>{opt.label}</span>
                            {selectedStatus === opt.value && <Check size={10} className="text-app-accent" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Tabs - 10pt (approx 12px) space below search */}
            <div className="mt-3 flex bg-app-accent/5 border border-app-border rounded-2xl p-1 shrink-0">
              {(["all", "issues", "suggestions", "my"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${
                    activeTab === tab 
                      ? "bg-app-accent text-app-bg shadow-lg font-black" 
                      : "text-text-sub hover:text-text-main hover:bg-app-accent/5"
                  }`}
                >
                  {tab === "all" && `${t("bugs_suggestions.tab_all")} (${formatCount(counts.all)})`}
                  {tab === "issues" && `${t("bugs_suggestions.tab_issues")} (${formatCount(counts.issues)})`}
                  {tab === "suggestions" && `${t("bugs_suggestions.tab_suggestions")} (${formatCount(counts.suggestions)})`}
                  {tab === "my" && `${t("bugs_suggestions.tab_my")} (${formatCount(counts.my)})`}
                </button>
              ))}
            </div>

            {/* Submissions List Feed */}
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              className="flex-1 overflow-y-auto mt-4 pb-24 pr-1 -mr-2 select-none scrollbar-thin transition-transform duration-75"
              style={{ transform: `translateY(${pullY}px)` }}
            >
              {/* Pull-to-refresh Indicator */}
              {pullY > 0 && (
                <div 
                  style={{ height: `${pullY}px` }} 
                  className="overflow-hidden transition-all duration-150 flex items-center justify-center bg-app-accent/5 rounded-3xl border border-app-border/30 mb-2 gap-2 text-text-sub"
                >
                  <Loader2 size={12} className={`text-app-accent ${isRefreshing || pullY >= 60 ? "animate-spin" : ""}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    {isRefreshing ? t("bugs_suggestions.refreshing") : pullY >= 60 ? t("bugs_suggestions.release_to_refresh") : t("bugs_suggestions.pull_to_refresh")}
                  </span>
                </div>
              )}
              {loading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-app-card/30 border border-app-border/50 rounded-3xl p-5 flex gap-4 animate-pulse"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-app-border/30 shrink-0" />
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-center gap-2">
                            <div className="h-3 w-2/3 bg-white/10 rounded-full" />
                            <div className="h-4 w-16 bg-white/5 rounded-full" />
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full mt-2" />
                          <div className="h-2 w-4/5 bg-white/5 rounded-full mt-1.5" />
                        </div>
                        <div className="flex justify-between items-center mt-3">
                          <div className="h-2.5 w-16 bg-white/5 rounded-full" />
                          <div className="h-2.5 w-12 bg-white/5 rounded-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center text-xs text-red-400 font-bold flex flex-col gap-2 items-center">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                  <button onClick={() => fetchReports(true)} className="bg-red-500/20 px-4 py-1.5 rounded-full hover:bg-red-500/30 transition-all uppercase tracking-wider text-[9px] mt-1">Retry</button>
                </div>
              ) : (reports.length === 0 && !pendingSubmission) ? (
                <div className="text-center py-20 px-6 bg-app-card/30 border border-app-border rounded-[2rem] flex flex-col items-center gap-4">
                  <MessageSquare size={36} className="text-text-sub/20" />
                  <p className="text-xs text-text-sub uppercase font-black tracking-widest">{t("bugs_suggestions.no_reports")}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {pendingSubmission && (
                    <div className="bg-app-card/40 border border-app-border/50 rounded-3xl p-5 flex gap-4 animate-pulse">
                      {/* Left: image/thumbnail skeleton */}
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-app-border/30 shrink-0 flex items-center justify-center">
                        <Loader2 size={16} className="text-app-accent/85 animate-spin" />
                      </div>
                      {/* Right: text content skeleton */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-text-main font-bold text-xs uppercase tracking-tight truncate flex-1">
                              {pendingSubmission.headline}
                            </span>
                            <span className="px-2 py-0.5 border border-app-accent/20 rounded-full text-[8px] uppercase font-black tracking-widest text-app-accent bg-app-accent/5">
                              {t("bugs_suggestions.sending")}
                            </span>
                          </div>
                          <p className="text-text-muted text-[10px] leading-relaxed mt-1 line-clamp-2">
                            {pendingSubmission.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-3 text-[8px] font-black uppercase tracking-wider text-text-sub">
                          <span>@{telegramUser?.username || "anonymous"}</span>
                          <span>{t("bugs_suggestions.just_now")}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {reports.map((report) => {
                    const statusInfo = getStatusStyle(report.status);
                    const isBug = report.tag === "bug";
                    const firstMedia = report.media_urls?.[0];

                    return (
                      <button
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className="w-full text-left bg-app-card/60 border border-app-border rounded-3xl p-5 flex gap-4 transition-all duration-200 hover:border-app-accent/20 active:scale-[0.985] active:bg-app-card/80"
                      >
                        {/* Left side: Thumbnail or Tag Icon */}
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-app-border flex items-center justify-center bg-app-accent/5 shrink-0">
                          {firstMedia ? (
                            firstMedia.toLowerCase().endsWith(".mp4") || firstMedia.toLowerCase().endsWith(".mov") ? (
                              <video src={firstMedia} className="w-full h-full object-cover" muted />
                            ) : (
                              <img src={firstMedia} alt="media" className="w-full h-full object-cover" />
                            )
                          ) : (
                            <div className="text-text-sub/40 font-bold uppercase text-[9px]">
                              {isBug ? t("bugs_suggestions.tag_bug_lbl") : t("bugs_suggestions.tag_suggestion_lbl")}
                            </div>
                          )}
                        </div>

                        {/* Right side content */}
                        <div className="flex-1 flex flex-col min-w-0 justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-text-main font-bold text-xs uppercase tracking-tight truncate flex-1">
                                {report.headline}
                              </h4>
                              <span className={`px-2 py-0.5 border rounded-full text-[8px] uppercase font-black tracking-widest shrink-0 ${statusInfo.bg}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <p className="text-text-muted text-[10px] leading-relaxed mt-1 line-clamp-2">
                              {report.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-3 text-[8px] font-black uppercase tracking-wider text-text-sub">
                            <span>{report.bw_id || `@${report.username}` || "anonymous"}</span>
                            <span>{relativeTime(report.created_at)}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Floating Action Button (+) same position as Explore */}
            <AnimatePresence>
              {showFab && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => {
                    setSubmitError(null);
                    setIsPostOpen(true);
                  }}
                  className="fixed bottom-28 right-6 w-14 h-14 rounded-full bg-app-accent text-app-bg shadow-xl flex items-center justify-center active:scale-95 transition-all z-40 border-2 border-app-border/10"
                >
                  <Plus size={24} strokeWidth={2.5} />
                </motion.button>
              )}
            </AnimatePresence>

          </div>

          {/* ─── Card Detail View ─── */}
          <AnimatePresence>
            {selectedReport && (() => {
              const statusInfo = getStatusStyle(selectedReport.status);
              const mediaList = selectedReport.media_urls || [];
              return (
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 32, stiffness: 380 }}
                  className="fixed inset-0 z-[145] bg-app-bg flex flex-col text-text-main overflow-hidden"
                  style={{
                    paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 12px)",
                    paddingBottom: "env(safe-area-inset-bottom, 0px)"
                  }}
                >
                  {/* Header */}
                  <div className="h-14 px-5 border-b border-app-border flex items-center justify-between shrink-0 mt-[50px]">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`px-2.5 py-1 border rounded-full text-[8px] uppercase font-black tracking-widest shrink-0 ${statusInfo.bg}`}>
                        {statusInfo.label}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-sub truncate">
                        {selectedReport.tag === "bug" ? t("bugs_suggestions.tag_bug") : t("bugs_suggestions.tag_suggestion")}
                      </span>
                    </div>
                    <div className="text-[8px] font-black uppercase tracking-wider text-text-sub shrink-0 ml-3">
                      {relativeTime(selectedReport.created_at)}
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Media */}
                    {mediaList.length > 0 && (
                      <div className="w-full bg-black/40 px-5 pt-3">
                        {mediaList[0].toLowerCase().endsWith(".mp4") || mediaList[0].toLowerCase().endsWith(".mov") ? (
                          <div 
                            onClick={() => setLightboxMedia({ urls: mediaList, isVideos: mediaList.map(u => /\.(mp4|mov)$/i.test(u)), currentIndex: 0 })}
                            className="relative w-full max-h-72 overflow-hidden rounded-2xl border border-app-border bg-app-card cursor-pointer group"
                          >
                            <video
                              src={mediaList[0]}
                              className="w-full max-h-72 object-contain mx-auto"
                              muted
                              playsInline
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 flex items-center justify-center transition-all">
                              <span className="bg-app-accent text-app-bg px-3.5 py-1.5 rounded-full text-[9px] uppercase font-black tracking-wider shadow-lg">Tap to Play Fullscreen</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            {mediaList.length === 1 ? (
                              <div 
                                onClick={() => setLightboxMedia({ urls: mediaList, isVideos: mediaList.map(u => /\.(mp4|mov)$/i.test(u)), currentIndex: 0 })}
                                className="w-full max-h-80 overflow-hidden rounded-2xl border border-app-border cursor-zoom-in bg-app-card"
                              >
                                <img src={mediaList[0]} alt="attachment" className="w-full h-full object-contain mx-auto" />
                              </div>
                            ) : mediaList.length === 2 ? (
                              <div className="grid grid-cols-2 gap-2 h-48 overflow-hidden rounded-2xl border border-app-border">
                                {mediaList.map((url, i) => (
                                  <div 
                                    key={i}
                                    onClick={() => setLightboxMedia({ urls: mediaList, isVideos: mediaList.map(u => /\.(mp4|mov)$/i.test(u)), currentIndex: i })}
                                    className="h-full cursor-zoom-in bg-app-card border-r border-app-border last:border-0"
                                  >
                                    <img src={url} alt={`attachment ${i+1}`} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 gap-2 h-56 overflow-hidden rounded-2xl border border-app-border">
                                <div 
                                  onClick={() => setLightboxMedia({ urls: mediaList, isVideos: mediaList.map(u => /\.(mp4|mov)$/i.test(u)), currentIndex: 0 })}
                                  className="col-span-2 h-full cursor-zoom-in bg-app-card border-r border-app-border"
                                >
                                  <img src={mediaList[0]} alt="attachment 1" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col gap-2 h-full">
                                  <div 
                                    onClick={() => setLightboxMedia({ urls: mediaList, isVideos: mediaList.map(u => /\.(mp4|mov)$/i.test(u)), currentIndex: 1 })}
                                    className="w-full h-[calc(50%-4px)] cursor-zoom-in bg-app-card border-b border-app-border"
                                  >
                                    <img src={mediaList[1]} alt="attachment 2" className="w-full h-full object-cover" />
                                  </div>
                                  <div 
                                    onClick={() => setLightboxMedia({ urls: mediaList, isVideos: mediaList.map(u => /\.(mp4|mov)$/i.test(u)), currentIndex: 2 })}
                                    className="w-full h-[calc(50%-4px)] cursor-zoom-in bg-app-card"
                                  >
                                    <img src={mediaList[2]} alt="attachment 3" className="w-full h-full object-cover" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Body */}
                    <div className="px-5 py-5 flex flex-col gap-5">
                      {/* Headline */}
                      <h2 className="text-base font-black uppercase tracking-tight text-text-main leading-snug">
                        {selectedReport.headline}
                      </h2>

                      {/* Description */}
                      <p className="text-sm text-text-sub leading-relaxed">
                        {selectedReport.description}
                      </p>

                      {/* Meta row */}
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-text-sub border-t border-app-border pt-4">
                        <span className="text-app-accent">
                          {selectedReport.bw_id || `@${selectedReport.username}` || "anonymous"}
                        </span>
                        <span>{new Date(selectedReport.created_at).toLocaleDateString(undefined, {
                          day: "numeric", month: "long", year: "numeric"
                        })}</span>
                      </div>

                      {/* Admin response */}
                      {(selectedReport.admin_message || (selectedReport.admin_media_urls && selectedReport.admin_media_urls.length > 0)) && (
                        <div className="p-4 bg-app-accent/5 border border-app-accent/20 rounded-2xl">
                          <div className="text-[9px] font-black text-app-accent uppercase tracking-widest mb-2">{t("bugs_suggestions.team_response")}</div>
                          {selectedReport.admin_message && (
                            <p className="text-[11px] text-text-sub italic leading-relaxed">
                              {selectedReport.admin_message}
                            </p>
                          )}
                          {/* Admin attached images */}
                          {selectedReport.admin_media_urls && selectedReport.admin_media_urls.length > 0 && (
                            <div className={`mt-3 grid gap-2 ${
                              selectedReport.admin_media_urls.length === 1 ? 'grid-cols-1' :
                              selectedReport.admin_media_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                            }`}>
                              {selectedReport.admin_media_urls.map((url, i) => {
                                const isVideo = /\.(mp4|mov|avi)$/i.test(url);
                                return (
                                  <div
                                    key={i}
                                    onClick={() => setLightboxMedia({
                                      urls: selectedReport.admin_media_urls,
                                      isVideos: selectedReport.admin_media_urls.map(u => /\.(mp4|mov|avi)$/i.test(u)),
                                      currentIndex: i
                                    })}
                                    className="rounded-xl overflow-hidden border border-app-accent/15 cursor-zoom-in bg-app-card max-h-40"
                                  >
                                    {isVideo ? (
                                      <video src={url} className="w-full h-full object-cover" muted playsInline />
                                    ) : (
                                      <img src={url} alt={`team attachment ${i + 1}`} className="w-full h-full object-cover" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {/* Post Creation Full Screen Sheet */}
          <AnimatePresence>
            {isPostOpen && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="fixed inset-0 z-[140] bg-app-bg/98 backdrop-blur-3xl flex flex-col text-text-main"
                style={{ 
                  paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 12px)", 
                  paddingBottom: "env(safe-area-inset-bottom, 0px)" 
                }}
              >
                {/* Header */}
                <div className="h-16 px-6 border-b border-app-border flex justify-center items-center shrink-0">
                  <h3 className="text-sm font-black uppercase tracking-wider text-app-accent">
                    {t("bugs_suggestions.new_submission")}
                  </h3>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5 select-none">
                  {loadingLimits ? (
                    <div className="bg-app-card/30 border border-app-border/50 rounded-2xl p-4 flex items-center justify-center gap-2 animate-pulse">
                      <Loader2 size={12} className="text-app-accent/80 animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-text-sub">{t("bugs_suggestions.quota_checking")}</span>
                    </div>
                  ) : rateLimit ? (
                    <div className="bg-app-accent/5 border border-app-border rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-sub">
                        <span>{t("bugs_suggestions.quota_title")}</span>
                        <span className={rateLimit.can_submit ? "text-emerald-400" : "text-red-400 animate-pulse font-black"}>
                          {rateLimit.can_submit ? t("bugs_suggestions.quota_active") : t("bugs_suggestions.quota_limit_reached")}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-app-card/40 border border-app-border/40 rounded-xl py-2 px-3 flex flex-col gap-1">
                          <span className="text-[9px] uppercase font-black tracking-wider text-text-muted">{t("bugs_suggestions.quota_daily")}</span>
                          <span className={`text-xs font-black ${rateLimit.daily_count >= rateLimit.daily_limit ? "text-red-400" : "text-text-main"}`}>
                            {rateLimit.daily_count} / {rateLimit.daily_limit}
                          </span>
                        </div>
                        <div className="bg-app-card/40 border border-app-border/40 rounded-xl py-2 px-3 flex flex-col gap-1">
                          <span className="text-[9px] uppercase font-black tracking-wider text-text-muted">{t("bugs_suggestions.quota_weekly")}</span>
                          <span className={`text-xs font-black ${rateLimit.weekly_count >= rateLimit.weekly_limit ? "text-red-400" : "text-text-main"}`}>
                            {rateLimit.weekly_count} / {rateLimit.weekly_limit}
                          </span>
                        </div>
                      </div>
                      {!rateLimit.can_submit && (
                        <div className="text-[9px] font-bold text-red-400 leading-normal flex items-start gap-1.5 border-t border-app-border/30 pt-2 mt-1">
                          <AlertCircle size={12} className="shrink-0 mt-0.5" />
                          <span>
                            {rateLimit.daily_count >= rateLimit.daily_limit && rateLimit.reset_daily ? (
                              t("bugs_suggestions.quota_daily_reached").replace("{time}", formatResetDuration(rateLimit.reset_daily))
                            ) : rateLimit.weekly_count >= rateLimit.weekly_limit && rateLimit.reset_weekly ? (
                              t("bugs_suggestions.quota_weekly_reached").replace("{date}", new Date(rateLimit.reset_weekly).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }))
                            ) : (
                              t("bugs_suggestions.quota_exceeded")
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {submitError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-[10px] font-bold text-red-400 flex items-center gap-2">
                      <AlertCircle size={14} />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Tag Toggle: Bug vs Suggestion */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-sub pl-1">
                      {t("bugs_suggestions.report_type")}
                    </label>
                    <div className="flex bg-app-accent/5 border border-app-border rounded-2xl p-1 gap-1">
                      <button
                        type="button"
                        onClick={() => setPostTag("bug")}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          postTag === "bug" 
                            ? "bg-red-500 text-white font-black" 
                            : "text-text-sub hover:text-text-main hover:bg-app-accent/5"
                        }`}
                      >
                        {t("bugs_suggestions.tag_bug_lbl")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPostTag("suggestion")}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          postTag === "suggestion" 
                            ? "bg-app-accent text-app-bg font-black" 
                            : "text-text-sub hover:text-text-main hover:bg-app-accent/5"
                        }`}
                      >
                        {t("bugs_suggestions.tag_suggestion_lbl")}
                      </button>
                    </div>
                  </div>

                  {/* Headline Input */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-sub pl-1">
                      {t("bugs_suggestions.headline")}
                    </label>
                    <input
                      type="text"
                      placeholder={t("bugs_suggestions.headline_placeholder")}
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      maxLength={80}
                      className="bg-app-accent/5 border border-app-border rounded-2xl px-4 py-3 text-xs outline-none focus:border-app-accent/40 text-text-main placeholder-text-sub/40 font-semibold"
                    />
                  </div>

                  {/* Description Input */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-sub pl-1">
                      {t("bugs_suggestions.description")}
                    </label>
                    <textarea
                      placeholder={t("bugs_suggestions.description_placeholder")}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      maxLength={1000}
                      className="bg-app-accent/5 border border-app-border rounded-2xl px-4 py-3 text-xs outline-none focus:border-app-accent/40 text-text-main placeholder-text-sub/40 font-semibold resize-none min-h-[120px] leading-relaxed"
                    />
                  </div>

                  {/* Media Picker */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between pl-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-sub">
                        {t("bugs_suggestions.attach_media")}
                      </label>
                      <span className="text-[8px] font-black uppercase tracking-wider text-text-muted">
                        {t("bugs_suggestions.media_limit")}
                      </span>
                    </div>

                    {/* Previews Row */}
                    {mediaPreviews.length > 0 && (
                      <div className="flex flex-wrap gap-3 p-1">
                        {mediaPreviews.map((url, index) => {
                          const file = mediaFiles[index];
                          const isVideo = file?.type.startsWith("video/");

                          return (
                            <div key={url} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-app-border shadow-md shrink-0 bg-black/40">
                              {isVideo ? (
                                <video src={url} className="w-full h-full object-cover" muted />
                              ) : (
                                <img src={url} alt="preview" className="w-full h-full object-cover" />
                              )}
                              <button
                                type="button"
                                onClick={() => removeMedia(index)}
                                className="absolute top-1 right-1 p-1 bg-red-500 rounded-lg text-white shadow-lg"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Media Button Trigger */}
                    {mediaFiles.length < (mediaFiles[0]?.type.startsWith("video/") ? 1 : 3) && (
                      <label className="flex items-center justify-center gap-3 bg-app-accent/5 border border-dashed border-app-border rounded-2xl py-6 hover:bg-app-accent/10 transition-all cursor-pointer">
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={handleMediaChange}
                          className="hidden"
                          disabled={isSubmitting}
                        />
                        <div className="flex gap-2 text-text-sub">
                          <ImageIcon size={18} />
                          <VideoIcon size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-sub">
                          {t("bugs_suggestions.select_media")}
                        </span>
                      </label>
                    )}
                  </div>

                  {/* Submission and Status */}
                  <div className="mt-auto pt-6 flex flex-col gap-4">
                    {isSubmitting && (
                      <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider text-app-accent">
                        <Loader2 size={14} className="animate-spin" />
                        <span>{uploadProgressMsg}</span>
                      </div>
                    )}
                    
                    <button
                      type="submit"
                      disabled={isSubmitting || !headline.trim() || !description.trim() || (rateLimit !== null && !rateLimit.can_submit)}
                      className="w-full h-14 bg-app-accent text-app-bg font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-lg active:scale-98 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
                    >
                      {isSubmitting ? t("bugs_suggestions.submitting") : t("bugs_suggestions.submit_btn")}
                    </button>
                  </div>

                </form>

              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Premium Media Lightbox (Zoom, Pan & Swipe Carousel) ─── */}
          <AnimatePresence>
            {lightboxMedia && (() => {
              const currentUrl = lightboxMedia.urls[lightboxMedia.currentIndex];
              const currentIsVideo = lightboxMedia.isVideos[lightboxMedia.currentIndex];
              const totalSlides = lightboxMedia.urls.length;
              const canGoPrev = lightboxMedia.currentIndex > 0;
              const canGoNext = lightboxMedia.currentIndex < totalSlides - 1;

              const goToSlide = (index: number) => {
                setZoomScale(1);
                setPanPosition({ x: 0, y: 0 });
                setLightboxSlideOffset(0);
                setLightboxMedia(prev => prev ? { ...prev, currentIndex: index } : null);
              };

              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[150] bg-black/98 flex flex-col justify-between select-none"
                  style={{
                    paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 36px)",
                    paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)"
                  }}
                >
                  {/* Lightbox Header Controls */}
                  <div className="h-14 px-6 flex items-center justify-between z-10">
                    <div className="flex gap-2">
                      {!currentIsVideo && (
                        <>
                          <button
                            type="button"
                            onClick={() => setZoomScale(prev => Math.min(4, prev + 0.5))}
                            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-white text-xs font-black uppercase"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setZoomScale(prev => {
                                const newScale = Math.max(1, prev - 0.5);
                                if (newScale === 1) setPanPosition({ x: 0, y: 0 });
                                return newScale;
                              });
                            }}
                            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-white text-xs font-black uppercase"
                          >
                            -
                          </button>
                          {zoomScale > 1 && (
                            <button
                              type="button"
                              onClick={() => { setZoomScale(1); setPanPosition({ x: 0, y: 0 }); }}
                              className="px-3 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-white text-[9px] font-black uppercase tracking-wider"
                            >
                              Reset
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Slide counter */}
                    <div className="flex items-center">
                      {totalSlides > 1 && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
                          {lightboxMedia.currentIndex + 1} / {totalSlides}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Centered Media Content with Swipe */}
                  <div 
                    className="flex-1 w-full flex items-center justify-center relative overflow-hidden"
                    style={{ cursor: zoomScale > 1 ? 'grab' : (totalSlides > 1 ? 'default' : 'default') }}
                    onMouseDown={(e) => {
                      if (currentIsVideo) return;
                      if (zoomScale > 1) {
                        // Pan mode
                        setIsDraggingPan(true);
                        dragStartPos.current = { x: e.clientX - panPosition.x, y: e.clientY - panPosition.y };
                      } else if (totalSlides > 1) {
                        // Swipe mode
                        lightboxSwipeStart.current = { x: e.clientX, y: e.clientY };
                      }
                    }}
                    onMouseMove={(e) => {
                      if (isDraggingPan) {
                        setPanPosition({
                          x: e.clientX - dragStartPos.current.x,
                          y: e.clientY - dragStartPos.current.y
                        });
                      } else if (lightboxSwipeStart.current && zoomScale === 1) {
                        const diffX = e.clientX - lightboxSwipeStart.current.x;
                        setLightboxSlideOffset(diffX * 0.6);
                      }
                    }}
                    onMouseUp={(e) => {
                      setIsDraggingPan(false);
                      if (lightboxSwipeStart.current && zoomScale === 1) {
                        const diffX = e.clientX - lightboxSwipeStart.current.x;
                        if (diffX < -60 && canGoNext) {
                          goToSlide(lightboxMedia.currentIndex + 1);
                        } else if (diffX > 60 && canGoPrev) {
                          goToSlide(lightboxMedia.currentIndex - 1);
                        } else {
                          setLightboxSlideOffset(0);
                        }
                        lightboxSwipeStart.current = null;
                      }
                    }}
                    onMouseLeave={() => {
                      setIsDraggingPan(false);
                      if (lightboxSwipeStart.current) {
                        setLightboxSlideOffset(0);
                        lightboxSwipeStart.current = null;
                      }
                    }}
                    onTouchStart={(e) => {
                      if (currentIsVideo) return;
                      const touch = e.touches[0];
                      if (zoomScale > 1) {
                        setIsDraggingPan(true);
                        dragStartPos.current = { x: touch.clientX - panPosition.x, y: touch.clientY - panPosition.y };
                      } else if (totalSlides > 1) {
                        lightboxSwipeStart.current = { x: touch.clientX, y: touch.clientY };
                      }
                    }}
                    onTouchMove={(e) => {
                      if (isDraggingPan) {
                        const touch = e.touches[0];
                        setPanPosition({
                          x: touch.clientX - dragStartPos.current.x,
                          y: touch.clientY - dragStartPos.current.y
                        });
                      } else if (lightboxSwipeStart.current && zoomScale === 1) {
                        const touch = e.touches[0];
                        const diffX = touch.clientX - lightboxSwipeStart.current.x;
                        setLightboxSlideOffset(diffX * 0.6);
                        if (Math.abs(diffX) > 10 && e.cancelable) {
                          e.preventDefault();
                        }
                      }
                    }}
                    onTouchEnd={(e) => {
                      setIsDraggingPan(false);
                      if (lightboxSwipeStart.current && zoomScale === 1) {
                        const touch = e.changedTouches[0];
                        const diffX = touch.clientX - lightboxSwipeStart.current.x;
                        if (diffX < -60 && canGoNext) {
                          goToSlide(lightboxMedia.currentIndex + 1);
                        } else if (diffX > 60 && canGoPrev) {
                          goToSlide(lightboxMedia.currentIndex - 1);
                        } else {
                          setLightboxSlideOffset(0);
                        }
                        lightboxSwipeStart.current = null;
                      }
                    }}
                  >
                    <div
                      style={{
                        transform: currentIsVideo 
                          ? 'none' 
                          : zoomScale > 1 
                            ? `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`
                            : `translateX(${lightboxSlideOffset}px)`,
                        transition: (isDraggingPan || lightboxSwipeStart.current) ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      onDoubleClick={() => {
                        if (currentIsVideo) return;
                        if (zoomScale > 1) {
                          setZoomScale(1);
                          setPanPosition({ x: 0, y: 0 });
                        } else {
                          setZoomScale(2);
                        }
                      }}
                      className="w-full max-h-[80vh] flex items-center justify-center"
                    >
                      {currentIsVideo ? (
                        <video
                          key={currentUrl}
                          src={currentUrl}
                          controls
                          autoPlay
                          playsInline
                          className="w-full max-h-[80vh] object-contain shadow-2xl rounded-xl"
                        />
                      ) : (
                        <img
                          key={currentUrl}
                          src={currentUrl}
                          alt="fullscreen zoomable"
                          className="max-w-full max-h-[75vh] object-contain shadow-2xl rounded-lg pointer-events-none"
                          draggable={false}
                        />
                      )}
                    </div>
                  </div>

                  {/* Footer: Dot indicators + instructions */}
                  <div className="flex flex-col items-center gap-2 z-10 shrink-0 pb-1">
                    {totalSlides > 1 && (
                      <div className="flex items-center gap-2">
                        {lightboxMedia.urls.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => goToSlide(i)}
                            className={`rounded-full transition-all duration-200 ${
                              i === lightboxMedia.currentIndex
                                ? 'w-6 h-2 bg-app-accent'
                                : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    <div className="h-8 flex items-center justify-center text-[8px] font-black uppercase tracking-widest text-white/40">
                      {currentIsVideo 
                        ? "Use player controls" 
                        : zoomScale > 1 
                          ? "Drag to pan image" 
                          : totalSlides > 1 
                            ? (t("bugs_suggestions.swipe_hint") || "Swipe to browse · Double-tap to zoom")
                            : "Double-tap to zoom"
                      }
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
