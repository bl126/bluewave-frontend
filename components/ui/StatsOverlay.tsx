"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Rocket, Zap, Globe, RefreshCcw, Landmark, Activity } from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import TopRightMenu from "./TopRightMenu";

interface StatsData {
    verified_humans: { date: string; value: number }[];
    missions_completed: { date: string; value: number }[];
    points_distributed: { date: string; value: number }[];
    active_countries: { code: string; count: number }[];
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
                            <div className="text-center space-y-2">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-center gap-2 text-cyan-500/60"
                                >
                                    <Activity size={12} />
                                    <span className="text-[10px] uppercase tracking-[0.4em] font-medium">Network Protocol Metrics</span>
                                </motion.div>
                                <h1 className="text-4xl font-bold tracking-tight text-white/90">
                                    Network Stats
                                </h1>
                            </div>

                            {loading ? (
                                <div className="py-24 flex flex-col items-center justify-center gap-6">
                                    <div className="w-6 h-6 border-2 border-cyan-500/10 border-t-cyan-500/60 rounded-full animate-spin" />
                                    <p className="text-[10px] text-cyan-500/30 uppercase tracking-[0.2em]">Syncing Snapshot...</p>
                                </div>
                            ) : error ? (
                                <div className="py-24 text-center space-y-6">
                                    <p className="text-xs text-red-400/50 font-mono uppercase tracking-[0.2em]">{error}</p>
                                    <button
                                        onClick={fetchStats}
                                        className="px-6 py-2 rounded-xl border border-white/5 text-white/40 text-[10px] uppercase tracking-widest hover:bg-white/5 transition-colors"
                                    >
                                        Reconnect
                                    </button>
                                </div>
                            ) : data ? (
                                <div className="space-y-12">

                                    {/* Charts Section */}
                                    <div className="grid grid-cols-1 gap-12">
                                        <ChartSection
                                            title="Verified Human Presence"
                                            value={data.total_stats?.users ?? 0}
                                            description="Cumulative network growth"
                                            chartData={data.verified_humans}
                                            id="humans"
                                        />
                                        <ChartSection
                                            title="Presence Mission Completion"
                                            value={data.total_stats?.missions ?? 0}
                                            description="Total protocol tasks finalized"
                                            chartData={data.missions_completed}
                                            id="missions"
                                            isArea
                                        />
                                        <ChartSection
                                            title="Presence Points Distributed"
                                            value={data.total_stats?.points ?? 0}
                                            description="Cumulative $BWAVE ecosystem rewards"
                                            chartData={data.points_distributed}
                                            id="points"
                                            isPoints
                                        />
                                    </div>

                                    {/* Country List */}
                                    <div className="p-10 rounded-[32px] bg-white/[0.01] border border-white/5 backdrop-blur-3xl">
                                        <div className="mb-8 text-center md:text-left">
                                            <h3 className="text-sm font-bold tracking-tight text-white/80">Active Countries</h3>
                                            <p className="text-[10px] text-white/20 uppercase tracking-widest mt-1">Global Presence Verified</p>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {(data?.active_countries ?? []).map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-3 py-2 px-1 opacity-60 hover:opacity-100 transition-opacity"
                                                >
                                                    <span className="text-2xl drop-shadow-sm">{getFlagEmoji(item?.code)}</span>
                                                    <span className="text-[11px] font-medium text-white/70 tracking-tight truncate">
                                                        {getCountryName(item?.code)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Metadata Footer */}
                                    <div className="text-center pt-8 border-t border-white/5 opacity-20">
                                        <div className="flex items-center justify-center gap-2 text-[9px] uppercase tracking-[0.3em] font-medium">
                                            <span>Protocol Snapshot v1.0.2</span>
                                        </div>
                                        <p className="text-[8px] uppercase tracking-widest mt-1 opacity-50">
                                            Updated: {data?.timestamp ? new Date(data.timestamp).toLocaleDateString() : 'N/A'}
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

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

function getCountryName(code: string) {
    try {
        return regionNames.of(code.toUpperCase()) || code;
    } catch {
        return code;
    }
}

function ChartSection({
    title,
    value,
    description,
    chartData,
    id,
    isPoints,
    isArea
}: {
    title: string,
    value: number,
    description: string,
    chartData: any[],
    id: string,
    isPoints?: boolean,
    isArea?: boolean
}) {
    return (
        <div className="p-8 rounded-[32px] bg-white/[0.01] border border-white/5 backdrop-blur-3xl space-y-8 relative overflow-hidden group">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div className="space-y-1">
                    <h3 className="text-sm font-medium text-white/40 tracking-tight uppercase tracking-[0.1em]">{title}</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold tracking-tighter text-white">
                            {value.toLocaleString()}
                        </span>
                        {isPoints && <span className="text-sm font-bold text-cyan-500/60 uppercase tracking-widest">$BWAVE</span>}
                    </div>
                    <p className="text-[10px] text-white/20 font-medium tracking-wide uppercase tracking-[0.05em]">{description}</p>
                </div>
                <div className="text-[10px] text-white/10 font-medium tracking-widest uppercase">2025-2026 Snapshot</div>
            </div>
            <div className="h-48 relative z-10">
                <Sparkline chartData={chartData} color="#22d3ee" id={id} isArea={isArea} />
            </div>
        </div>
    );
}

function Sparkline({ chartData, color, id, isArea }: { chartData: any[], color: string, id: string, isArea?: boolean }) {
    const width = 800;
    const height = 200;

    const { pathD, areaD, lastPoint } = useMemo(() => {
        if (!chartData || chartData.length < 2) {
            return { pathD: "", areaD: "", lastPoint: { x: 0, y: 0 } };
        }

        const vals = chartData.map(d => d.value);
        const max = Math.max(...vals) * 1.1; // Add 10% padding
        const min = Math.min(...vals) * 0.9;
        const range = max - min || 1;

        const pts = chartData.map((d, i) => ({
            x: (i / (chartData.length - 1)) * width,
            y: height - ((d.value - min) / range) * height
        }));

        // Catmull-Rom or Cubic curve would be nice but simple smooth curves:
        const d = pts.length > 1 ? pts.reduce((acc, point, i, a) => {
            if (i === 0) return `M ${point.x} ${point.y}`;
            const p0 = a[i - 1];
            const cp1x = p0.x + (point.x - p0.x) / 2;
            return `${acc} C ${cp1x} ${p0.y}, ${cp1x} ${point.y}, ${point.x} ${point.y}`;
        }, "") : "";

        const area = `${d} L ${width} ${height} L 0 ${height} Z`;
        return { pathD: d, areaD: area, lastPoint: pts[pts.length - 1] };
    }, [chartData, width, height]);

    if (!chartData || chartData.length < 2) return <div className="w-full h-full flex items-center justify-center text-[10px] text-white/10 uppercase tracking-widest">Initializing Protocol Snapshot...</div>;

    const gradientId = `chartGradient-${id}`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.1" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            {isArea && <path d={areaD} fill={`url(#${gradientId})`} />}
            <motion.path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeOpacity="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
            />
            <motion.circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r="3"
                fill={color}
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
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
