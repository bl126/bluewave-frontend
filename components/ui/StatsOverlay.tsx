"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Rocket, Zap, Globe, RefreshCcw, Landmark, Activity } from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import TopRightMenu from "./TopRightMenu";

interface StatsData {
    verified_humans: { date: string; value: number }[];
    missions_completed: { date: string; value: number }[];
    points_distributed: { date: string; value: number }[];
    active_countries: { country: string; joined_at: string }[];
    total_stats?: {
        users: number;
        missions: number;
        points: number;
    };
    timestamp?: string;
}

export default function StatsOverlay({
    isOpen,
    onClose,
    onOpenAbout,
    onOpenLedger,
    onOpenFAQ,
    onOpenWhitepaper,
}: {
    isOpen: boolean;
    onClose: () => void;
    onOpenAbout?: () => void;
    onOpenLedger?: () => void;
    onOpenFAQ?: () => void;
    onOpenWhitepaper?: () => void;
}) {
    const [data, setData] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchStats();
        }
    }, [isOpen]);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
            const res = await fetch(`${apiUrl}/api/stats`);
            if (!res.ok) throw new Error("Network protocol error");
            const json = await res.json();
            setData(json);
        } catch (err: any) {
            console.error("Stats fetch error:", err);
            setError(err.message || "Failed to sync protocol stats");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-3xl flex flex-col overflow-hidden text-white"
                >
                    {/* Header Bar */}
                    <div className="flex items-center justify-between px-6 h-20 shrink-0 border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-[110]">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-all font-medium uppercase tracking-widest text-xs"
                        >
                            <ArrowLeft size={18} />
                            <span>Back</span>
                        </button>

                        <TopRightMenu
                            onOpenAbout={onOpenAbout}
                            onOpenLedger={onOpenLedger}
                            onOpenFAQ={onOpenFAQ}
                            onOpenStats={() => { }}
                            onOpenWhitepaper={onOpenWhitepaper}
                            isStatsActive={true}
                        />
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto scrollbar-none pb-24">
                        <div className="max-w-4xl mx-auto px-6 pt-12 space-y-16">

                            {/* Hero Title */}
                            <div className="text-center space-y-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-center gap-2 text-cyan-500"
                                >
                                    <Activity size={14} className="animate-pulse" />
                                    <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Network Proof of Activity</span>
                                </motion.div>
                                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                                    Protocol Statistics
                                </h1>
                                <p className="text-sm text-cyan-400/40 uppercase tracking-widest font-mono">
                                    Cycle 2025 — 2026
                                </p>
                            </div>

                            {loading ? (
                                <div className="py-24 flex flex-col items-center justify-center gap-6">
                                    <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                                    <p className="text-[10px] text-cyan-500/40 uppercase tracking-[0.2em] animate-pulse">Synchronizing Ledger...</p>
                                </div>
                            ) : error ? (
                                <div className="py-24 text-center space-y-6">
                                    <p className="text-sm text-red-400/60 font-mono uppercase tracking-widest">{error}</p>
                                    <button
                                        onClick={fetchStats}
                                        className="px-6 py-2 rounded-full border border-cyan-500/30 text-cyan-400 text-[10px] uppercase tracking-widest hover:bg-cyan-500/10 transition-colors"
                                    >
                                        Retry Connection
                                    </button>
                                </div>
                            ) : data ? (
                                <div className="space-y-16">

                                    {/* Total Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <StatHeroCard
                                            title="Verified Humans"
                                            value={data?.total_stats?.users ?? 0}
                                            icon={Users}
                                        />
                                        <StatHeroCard
                                            title="Missions Completed"
                                            value={data?.total_stats?.missions ?? 0}
                                            icon={Rocket}
                                        />
                                        <StatHeroCard
                                            title="$BWAVE Distributed"
                                            value={data?.total_stats?.points ?? 0}
                                            icon={Zap}
                                            isPoints
                                        />
                                    </div>

                                    {/* Charts Section */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <ChartSection
                                            title="Network Adoption"
                                            description="Cumulative Human Verification"
                                            chartData={data?.verified_humans ?? []}
                                            id="adoption"
                                        />
                                        <ChartSection
                                            title="Mission Velocity"
                                            description="Cumulative Task Settlement"
                                            chartData={data?.missions_completed ?? []}
                                            id="velocity"
                                        />
                                    </div>

                                    {/* Country List */}
                                    <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl">
                                        <div className="text-center mb-8">
                                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-500">Global Presence</h3>
                                            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Verified Nodes by Territory</p>
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-3">
                                            {(data?.active_countries ?? []).map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/5 border border-cyan-500/10 hover:border-cyan-500/30 transition-colors"
                                                >
                                                    <span className="text-lg">{getFlagEmoji(item?.country)}</span>
                                                    <span className="text-[10px] font-bold text-cyan-100/60 uppercase tracking-widest truncate max-w-[80px]">
                                                        {item?.country ?? "???"}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Metadata Footer */}
                                    <div className="text-center pt-8 border-t border-white/5 opacity-30">
                                        <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] font-mono">
                                            <Landmark size={12} />
                                            <span>Bluewave Mainnet Ledger</span>
                                        </div>
                                        <p className="text-[8px] uppercase tracking-widest mt-2">
                                            Last Updated: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>

                                </div>
                            ) : null}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function StatHeroCard({ title, value, icon: Icon, isPoints }: { title: string, value: number, icon: any, isPoints?: boolean }) {
    return (
        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.05] transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-4 -translate-y-4">
                <Icon size={40} />
            </div>
            <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-2 text-cyan-400">
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                        <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 font-mono">{title}</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-mono font-bold tracking-tighter">
                        {value.toLocaleString()}
                    </span>
                    {isPoints && <span className="text-xs font-bold text-cyan-500 italic">$BWAVE</span>}
                </div>
            </div>
        </div>
    );
}

function ChartSection({ title, description, chartData, id }: { title: string, description: string, chartData: any[], id: string }) {
    return (
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl space-y-6">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h3 className="text-lg font-bold tracking-tight text-white/90">{title}</h3>
                    <p className="text-[10px] text-cyan-500/50 uppercase tracking-widest font-mono">{description}</p>
                </div>
                <div className="text-[10px] text-white/20 font-mono">2025-2026</div>
            </div>
            <div className="h-40 relative">
                <Sparkline chartData={chartData} color="#06b6d4" id={id} />
            </div>
        </div>
    );
}

function Sparkline({ chartData, color, id }: { chartData: any[], color: string, id: string }) {
    if (!chartData || chartData.length < 2) return <div className="w-full h-full bg-white/5 rounded-2xl flex items-center justify-center text-[10px] text-white/10 uppercase tracking-widest font-mono">Initializing Nodes...</div>;

    const width = 400;
    const height = 150;

    const { pathD, areaD, lastPoint } = useMemo(() => {
        const vals = chartData.map(d => d.value);
        const max = Math.max(...vals, 10);
        const min = Math.min(...vals, 0);
        const range = max - min || 1;

        const pts = chartData.map((d, i) => ({
            x: (i / (chartData.length - 1)) * width,
            y: height - ((d.value - min) / range) * height
        }));

        const d = `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
        const area = `${d} L ${width} ${height} L 0 ${height} Z`;
        return { pathD: d, areaD: area, lastPoint: pts[pts.length - 1] };
    }, [chartData, width, height]);

    const gradientId = `chartGradient-${id}`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#${gradientId})`} />
            <motion.path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r="3"
                fill={color}
                className="animate-pulse"
            />
        </svg>
    );
}

function getFlagEmoji(countryCode: string) {
    if (!countryCode || countryCode.length !== 2) return "🌍";
    const codePoints = countryCode
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}
