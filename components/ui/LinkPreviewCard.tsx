"use client";

import { useApi } from "@/lib/useApi";
import { ExternalLink } from "lucide-react";

interface LinkPreviewCardProps {
  url: string;
}

export default function LinkPreviewCard({ url }: LinkPreviewCardProps) {
  const encodedUrl = encodeURIComponent(url);
  const { data, loading, error } = useApi(`/explore/link-preview?url=${encodedUrl}`, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // Cache for 1 min in memory
  });

  if (!url || error) return null;

  if (loading && !data) {
    return (
      <div className="my-2.5 p-3 rounded-2xl bg-zinc-950/70 border border-white/10 border-l-[3.5px] border-l-white/40 animate-pulse flex flex-col gap-2 w-full max-w-full overflow-hidden">
        <div className="h-3 w-24 bg-white/10 rounded-full" />
        <div className="h-4 w-3/4 bg-white/15 rounded-md" />
        <div className="h-3 w-full bg-white/5 rounded-md" />
      </div>
    );
  }

  const title = data?.title || data?.domain || url;
  const description = data?.description || "";
  const siteName = data?.site_name || data?.domain || "Link Preview";
  const imageUrl = data?.image_url;

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const tg = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;
    if (tg?.openLink) {
      tg.openLink(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      onClick={handleOpenLink}
      className="my-2.5 w-full max-w-full bg-zinc-950/80 hover:bg-zinc-900/90 border border-white/10 border-l-[3.5px] border-l-white/60 rounded-2xl p-3.5 shadow-xl transition-all cursor-pointer group select-none relative overflow-hidden break-words"
    >
      {/* Top Header: Site Name & Icon */}
      <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
          {data?.favicon_url && (
            <img
              src={data.favicon_url}
              alt=""
              className="w-3.5 h-3.5 rounded-full object-cover shrink-0 opacity-80"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          )}
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/75 truncate">
            {siteName}
          </span>
        </div>
        <ExternalLink size={12} className="text-white/40 group-hover:text-white/90 transition-colors shrink-0" />
      </div>

      {/* Title */}
      <h4 className="text-[12.5px] font-bold text-white/95 group-hover:text-white transition-colors line-clamp-1 leading-snug break-all">
        {title}
      </h4>

      {/* Description */}
      {description && (
        <p className="text-[11px] text-white/65 font-medium line-clamp-2 leading-relaxed mt-0.5 break-words">
          {description}
        </p>
      )}

      {/* Preview Image Banner */}
      {imageUrl && (
        <div className="mt-2.5 w-full rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-inner">
          <img
            src={imageUrl}
            alt={title}
            className="w-full max-h-48 object-cover group-hover:scale-[1.02] transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>
      )}
    </div>
  );
}
