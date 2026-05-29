"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { 
  X, Plus, Search, ChevronDown, Check, Loader2, 
  Image as ImageIcon, Video as VideoIcon, Trash2, MessageSquare, AlertCircle, Calendar 
} from "lucide-react";
import { postApi, getApi } from "@/lib/useApi";

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
  created_at: string;
}

export default function BugsSuggestions({ isOpen, onClose, telegramUser }: BugsSuggestionsProps) {
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<"all" | "issues" | "suggestions" | "my">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Status Filter Options
  const statusOptions = [
    { value: null, label: "All Statuses" },
    { value: "open", label: "Open" },
    { value: "fix_coming", label: "Fix Coming" },
    { value: "fixed", label: "Fixed" },
    { value: "closed", label: "Closed" }
  ];

  // Fetch Reports
  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const tabParam = activeTab === "issues" ? "issues" : (activeTab === "suggestions" ? "suggestions" : (activeTab === "my" ? "my" : "all"));
      let url = `/bugs_suggestions?tab=${tabParam}`;
      if (selectedStatus) {
        url += `&status=${selectedStatus}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      const res = await getApi(url);
      if (res.error) {
        setError(res.error);
      } else {
        setReports(res || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen, activeTab, selectedStatus, searchQuery]);

  // Handle Native Back button click via custom event interceptor
  useEffect(() => {
    const handleNativeBack = (e: Event) => {
      if (!isOpen) return;

      if (isPostOpen) {
        // If posting interface is open, close it and prevent default (do not close the main bugs overlay)
        setIsPostOpen(false);
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
  }, [isOpen, isPostOpen, statusDropdownOpen]);

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
      alert("Please select either images or a video (do not mix).");
      return;
    }

    if (hasVideo) {
      if (files.length > 1) {
        alert("You can only attach 1 video.");
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
      setSubmitError("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setUploadProgressMsg("Uploading attachments...");

    try {
      const uploadedUrls: string[] = [];

      // 1. Upload files if any exist
      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        const ext = file.name.split(".").pop() || "jpg";
        
        setUploadProgressMsg(`Uploading file ${i + 1} of ${mediaFiles.length}...`);

        // Request signed upload URL
        const urlRes = await postApi("/bugs_suggestions/get_upload_url", {
          tg_id: telegramUser.id,
          media_ext: ext
        });

        if (urlRes.error || !urlRes.signed_url) {
          throw new Error(urlRes.error || "Failed to generate upload URL.");
        }

        // Direct upload to Supabase bucket via PUT
        const uploadRes = await fetch(urlRes.signed_url, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${urlRes.token}`,
            "Content-Type": file.type,
          },
          body: file
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload file to storage.");
        }

        uploadedUrls.push(urlRes.public_url);
      }

      // 2. Submit record to backend
      setUploadProgressMsg("Saving feedback report...");
      const payload = {
        tg_id: telegramUser.id,
        bw_id: telegramUser.bw_id,
        first_name: telegramUser.first_name || telegramUser.name,
        username: telegramUser.username,
        tag: postTag,
        headline: headline.trim(),
        description: description.trim(),
        media_urls: uploadedUrls
      };

      const res = await postApi("/bugs_suggestions", payload);
      if (res.error) {
        throw new Error(res.error);
      }

      // Reset form states and close post screen
      setHeadline("");
      setDescription("");
      setMediaFiles([]);
      setMediaPreviews([]);
      setIsPostOpen(false);
      
      // Reload lists
      fetchReports();
    } catch (err: any) {
      setSubmitError(err.message || "An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
      setUploadProgressMsg("");
    }
  };

  // Helper formatting for Status Badges
  const getStatusStyle = (status: ReportItem["status"]) => {
    switch (status) {
      case "open":
        return { bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400", label: "Open" };
      case "fix_coming":
        return { bg: "bg-amber-500/10 border-amber-500/30 text-amber-400", label: "Fix Coming" };
      case "fixed":
        return { bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400", label: "Fixed" };
      case "closed":
        return { bg: "bg-red-500/10 border-red-500/30 text-red-400", label: "Closed" };
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
                  placeholder="Search issues and suggestions..."
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
                  {tab === "all" && "All"}
                  {tab === "issues" && "Issues"}
                  {tab === "suggestions" && "Suggestions"}
                  {tab === "my" && "My Card"}
                </button>
              ))}
            </div>

            {/* Submissions List Feed */}
            <div className="flex-1 overflow-y-auto mt-4 pb-24 pr-1 -mr-2 select-none scrollbar-thin">
              {loading ? (
                <div className="flex flex-col items-center justify-center pt-16 gap-3">
                  <Loader2 size={24} className="text-app-accent animate-spin" />
                  <span className="text-[10px] font-black text-text-sub uppercase tracking-wider">Syncing reports...</span>
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center text-xs text-red-400 font-bold flex flex-col gap-2 items-center">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                  <button onClick={fetchReports} className="bg-red-500/20 px-4 py-1.5 rounded-full hover:bg-red-500/30 transition-all uppercase tracking-wider text-[9px] mt-1">Retry</button>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-20 px-6 bg-app-card/30 border border-app-border rounded-[2rem] flex flex-col items-center gap-4">
                  <MessageSquare size={36} className="text-text-sub/20" />
                  <p className="text-xs text-text-sub uppercase font-black tracking-widest">No reports found</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {reports.map((report) => {
                    const statusInfo = getStatusStyle(report.status);
                    const isBug = report.tag === "bug";
                    const firstImage = report.media_urls?.[0];

                    return (
                      <div
                        key={report.id}
                        className="bg-app-card/60 border border-app-border rounded-3xl p-5 flex gap-4 transition-all duration-300 hover:border-app-accent/20"
                      >
                        {/* Left side: Thumbnail or Tag Icon */}
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-app-border flex items-center justify-center bg-app-accent/5 shrink-0">
                          {firstImage ? (
                            firstImage.toLowerCase().endsWith(".mp4") || firstImage.toLowerCase().endsWith(".mov") ? (
                              <video src={firstImage} className="w-full h-full object-cover" muted />
                            ) : (
                              <img src={firstImage} alt="media" className="w-full h-full object-cover" />
                            )
                          ) : (
                            <div className="text-text-sub/40 font-bold uppercase text-[9px]">
                              {isBug ? "Bug" : "Idea"}
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
                              <span className={`px-2 py-0.5 border rounded-full text-[8px] uppercase font-black tracking-widest ${statusInfo.bg}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <p className="text-text-muted text-[10px] leading-relaxed mt-1 line-clamp-2">
                              {report.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-3 text-[8px] font-black uppercase tracking-wider text-text-sub">
                            <span>@{report.username || "anonymous"}</span>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={10} className="text-text-sub/40" />
                              <span>
                                {new Date(report.created_at).toLocaleDateString(undefined, {
                                  day: "numeric",
                                  month: "short"
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Admin response message */}
                          {report.admin_message && (
                            <div className="mt-3 p-3 bg-app-accent/5 border-l-2 border-app-accent/30 rounded-r-xl">
                              <div className="text-[8px] font-black text-app-accent uppercase tracking-widest">Team Response</div>
                              <p className="text-[10px] text-text-sub italic leading-relaxed mt-1">
                                "{report.admin_message}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Floating Action Button (+) same position as Explore */}
            <button
              onClick={() => {
                setSubmitError(null);
                setIsPostOpen(true);
              }}
              className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-app-accent text-app-bg shadow-xl flex items-center justify-center active:scale-95 transition-all z-40 border-2 border-app-border/10"
            >
              <Plus size={24} strokeWidth={2.5} />
            </button>

          </div>

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
                <div className="h-16 px-6 border-b border-app-border flex justify-between items-center shrink-0">
                  <h3 className="text-sm font-black uppercase tracking-wider text-app-accent">
                    New Submission
                  </h3>
                  <button
                    onClick={() => setIsPostOpen(false)}
                    className="p-2 rounded-xl bg-white/5 border border-app-border text-text-sub hover:text-text-main transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5 select-none">
                  {submitError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-[10px] font-bold text-red-400 flex items-center gap-2">
                      <AlertCircle size={14} />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Tag Toggle: Bug vs Suggestion */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-sub pl-1">
                      Report Type
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
                        Bug
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
                        Suggestion
                      </button>
                    </div>
                  </div>

                  {/* Headline Input */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-sub pl-1">
                      Headline
                    </label>
                    <input
                      type="text"
                      placeholder="Short summary of the issue or suggestion..."
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      maxLength={80}
                      className="bg-app-accent/5 border border-app-border rounded-2xl px-4 py-3 text-xs outline-none focus:border-app-accent/40 text-text-main placeholder-text-sub/40 font-semibold"
                    />
                  </div>

                  {/* Description Input */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-sub pl-1">
                      Description
                    </label>
                    <textarea
                      placeholder="Details, steps to reproduce, or suggestions on how to improve..."
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
                        Attach Media
                      </label>
                      <span className="text-[8px] font-black uppercase tracking-wider text-text-muted">
                        Up to 3 images OR 1 video
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
                          Select Photos or Video
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
                      disabled={isSubmitting || !headline.trim() || !description.trim()}
                      className="w-full h-14 bg-app-accent text-app-bg font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-lg active:scale-98 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </button>
                  </div>

                </form>

              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
