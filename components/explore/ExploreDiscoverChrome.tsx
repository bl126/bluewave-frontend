"use client";

import {
  Shield,
  Rocket,
  Eye,
  Zap,
  ShoppingCart,
  Vote,
  BarChart2,
  UserCheck,
  Share2,
  Bot,
} from "lucide-react";

export const MOCK_MINI_APPS = [
  { id: "id-vault", name: "Identity Vault", icon: <Shield size={20} />, color: "from-cyan-500 to-blue-600" },
  { id: "missions", name: "Missions", icon: <Rocket size={20} />, color: "from-purple-500 to-indigo-600" },
  { id: "bwavescan", name: "BwaveScan", icon: <Eye size={20} />, color: "from-emerald-500 to-teal-600" },
  { id: "burner", name: "Signal Burner", icon: <Zap size={20} />, color: "from-orange-500 to-red-600" },
  { id: "market", name: "Marketplace", icon: <ShoppingCart size={20} />, color: "from-pink-500 to-rose-600" },
  { id: "gov", name: "Governance", icon: <Vote size={20} />, color: "from-blue-400 to-cyan-500" },
  { id: "stats", name: "Pulse Stats", icon: <BarChart2 size={20} />, color: "from-amber-400 to-orange-500" },
  { id: "human", name: "Humanity Check", icon: <UserCheck size={20} />, color: "from-cyan-400 to-teal-500" },
  { id: "bridge", name: "Wave Bridge", icon: <Share2 size={20} />, color: "from-indigo-400 to-purple-500" },
  { id: "agent", name: "Blu Agent", icon: <Bot size={20} />, color: "from-zinc-400 to-zinc-600" },
];

export function ExploreForYouHero() {
  return (
    <div className="mx-4 mt-2 mb-1 rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.35em] text-cyan-400/90">Signal network</p>
      <h2 className="text-lg font-black text-text-main mt-1 tracking-tight">Discover channels</h2>
      <p className="text-[11px] text-text-sub mt-1 leading-relaxed">
        Not a timeline clone — live pulses, mini apps, and channel signals in one place.
      </p>
    </div>
  );
}

export function LiveNowTray({ liveUsers }: { liveUsers: any[] }) {
  if (!liveUsers || liveUsers.length === 0) return null;

  return (
    <div className="w-full border-b border-white/5 bg-black/20 overflow-hidden shrink-0">
      <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar px-4 pt-3 pb-2 hide-scrollbar">
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
            className="flex flex-col items-center gap-1.5 shrink-0 group w-14"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-cyan-500/30 group-hover:border-cyan-400 transition-all p-0.5 relative z-10 bg-transparent">
                <div className="w-full h-full rounded-xl overflow-hidden border border-white/10 bg-black/40 relative pointer-events-none">
                  {u.telegram_channel_photo ? (
                    <img src={u.telegram_channel_photo} className="w-full h-full object-cover" alt="" />
                  ) : u.photo_url ? (
                    <img src={u.photo_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-cyan-500 bg-cyan-500/10 font-black text-[10px]">
                      {u.telegram_channel_title?.[0] || u.name?.[0] || u.first_name?.[0] || "U"}
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute inset-0 rounded-2xl border border-cyan-500/50 animate-[pulse_2s_ease-out_infinite] z-0 pointer-events-none" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-cyan-600 text-black text-[7px] font-black px-1 py-0.5 rounded-[3px] border border-cyan-300 shadow-[0_0_8px_rgba(0,230,255,0.8)] leading-none flex items-center gap-0.5 tracking-tight z-20 pointer-events-none">
                <span className="w-0.5 h-0.5 rounded-full bg-white animate-pulse" />
                LIVE
              </div>
            </div>
            <span className="text-[7px] font-black text-white/60 truncate w-12 text-center group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
              {u.telegram_channel_title || u.name || u.first_name || "User"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function MiniAppCarousel({ apps }: { apps: typeof MOCK_MINI_APPS }) {
  return (
    <div className="w-full py-5 border-y border-white/5 bg-white/[0.02] overflow-hidden">
      <div className="px-5 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-200/80">Wave apps</h3>
        </div>
        <span className="text-[8px] font-bold uppercase tracking-widest text-text-sub/60">Preview</span>
      </div>

      <div
        className="flex items-center gap-5 overflow-x-auto custom-scrollbar px-5 pb-2 hide-scrollbar snap-x"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {apps.map((app) => (
          <div key={app.id} className="flex flex-col items-center gap-3 shrink-0 snap-center group">
            <div className="w-16 h-16 rounded-2xl bg-active p-[1.5px] relative group-active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.4)]">
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${app.color} opacity-40 blur-[2px] transition-opacity group-hover:opacity-100`} />
              <div className="w-full h-full rounded-2xl bg-zinc-950 flex items-center justify-center text-white relative z-10 border border-white/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50" />
                {app.icon}
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[9px] font-black text-white/90 uppercase tracking-widest text-center w-20 truncate">
                {app.name}
              </span>
              <button
                type="button"
                disabled
                className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-text-sub/70 cursor-default"
              >
                Soon
              </button>
            </div>
          </div>
        ))}
        <div className="shrink-0 w-5" />
      </div>
    </div>
  );
}

export function ExploreDiscoverHeader({
  liveUsers,
  showMiniApps,
}: {
  liveUsers?: any[];
  showMiniApps?: boolean;
}) {
  return (
    <>
      <ExploreForYouHero />
      {liveUsers && liveUsers.length > 0 && <LiveNowTray liveUsers={liveUsers} />}
      {showMiniApps && <MiniAppCarousel apps={MOCK_MINI_APPS} />}
    </>
  );
}
