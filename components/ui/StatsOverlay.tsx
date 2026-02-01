"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Users, Rocket, Coins, ArrowLeft, Menu, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import TopRightMenu from "./TopRightMenu";

interface StatsData {
    verified_humans: { date: string; value: number }[];
    missions_completed: { date: string; value: number }[];
    points_distributed: { date: string; value: number }[];
    active_countries: {
        top: { country: string; count: number }[];
        others: number;
    };
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

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats`)
                .then((res) => res.json())
                .then((json) => {
                    setData(json);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Stats fetch error:", err);
                    setLoading(false);
                });
        }
    }, [isOpen]);

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-2xl flex flex-col items-center overflow-hidden"
                >
                    {/* Floating Navigation */}
                    <div className="absolute top-0 left-0 right-0 h-20 z-[110] flex items-center justify-between px-6 pointer-events-none">
                        {/* Exit Back Button */}
                        <button
                            onClick={onClose}
                            className="group flex items-center gap-2 text-cyan-400 hover:text-cyan-200 transition-colors pointer-events-auto"
                        >
                            <div className="p-2.5 rounded-full bg-cyan-950/30 group-hover:bg-cyan-900/50 transition-colors border border-cyan-900/50 backdrop-blur-md">
                                <ArrowLeft size={20} />
                            </div>
                            <span className="text-sm font-medium tracking-wide uppercase hidden sm:block">Exit</span>
                        </button>

                        <TopRightMenu
                            onOpenAbout={onOpenAbout}
                            onOpenLedger={onOpenLedger}
                            onOpenFAQ={onOpenFAQ}
                            onOpenStats={() => { }} // Already on stats
                            onOpenWhitepaper={onOpenWhitepaper}
                            isStatsActive={true}
                        />
                    </div>

                    {/* Content */}
                    <div className="w-full max-w-2xl flex-1 overflow-y-auto px-6 space-y-12 pt-24 pb-32 scrollbar-none">
                        {/* Centered Header */}
                        <div className="text-center space-y-2 mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-200">
                                Presence Network Stats
                            </h2>
                            <p className="text-sm md:text-base text-cyan-400/50 font-light tracking-wide uppercase">
                                Current state of the Bluewave network
                            </p>
                            <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mx-auto mt-6" />
                        </div>
                        {loading ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-4">
                                <div className="w-6 h-6 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                                <span className="text-xs text-cyan-500/40 uppercase tracking-widest animate-pulse">Syncing Network Data...</span>
                            </div>
                        ) : data ? (
                            <>
                                <section className="relative p-6 rounded-3xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                                    <div className="flex justify-between items-start mb-6">
                                        <StatHeader
                                            title="Total Verified Humans"
                                            description="2025-2026"
                                            icon={<Users size={14} />}
                                        />
                                    </div>
                                    <LineChart data={data.verified_humans} label="Daily Volume" />
                                </section>

                                <section className="relative p-6 rounded-3xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                                    <div className="flex justify-between items-start mb-6">
                                        <StatHeader
                                            title="Total Missions Completed"
                                            description="2025-2026"
                                            icon={<Rocket size={14} />}
                                        />
                                    </div>
                                    <LineChart data={data.missions_completed} />
                                </section>

                                <section className="relative p-6 rounded-3xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                                    <div className="flex justify-between items-start mb-6">
                                        <StatHeader
                                            title="Presence Points Distributed"
                                            description="2025-2026"
                                            icon={<Coins size={14} />}
                                        />
                                    </div>
                                    <LineChart data={data.points_distributed} isPoints={true} />
                                </section>

                                <section className="relative p-8 rounded-3xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                                    <div className="text-center mb-8">
                                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-500 mb-2">
                                            Active Countries
                                        </h3>
                                        <p className="text-[10px] text-cyan-100/30 uppercase tracking-widest font-medium">Verified humans by territory</p>
                                    </div>
                                    <BarChart data={data.active_countries} />
                                </section>
                            </>
                        ) : (
                            <div className="text-white/40 text-center py-20 bg-white/5 rounded-2xl border border-white/5">
                                <p>Failed to sync network stats.</p>
                                <button onClick={() => window.location.reload()} className="mt-4 text-xs text-cyan-400 underline uppercase tracking-widest">Retry</button>
                            </div>
                        )}
                    </div>

                    {/* Subtle bottom fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent pointer-events-none" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function StatHeader({
    title,
    description,
    icon,
}: {
    title: string;
    description: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight">
                {title}
            </h3>
            <p className="text-xs text-white/40 font-medium tracking-wider">{description}</p>
        </div>
    );
}

function TimeFrameDropdown() {
    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white/60 uppercase tracking-widest cursor-pointer hover:bg-white/10 transition-colors">
            1Y <ChevronDown size={12} className="text-white/40" />
        </div>
    )
}

function LineChart({ data, label, isPoints }: { data: { date: string; value: number }[], label?: string, isPoints?: boolean }) {
    if (!data || data.length === 0) return <div className="h-48 bg-white/5 rounded-2xl border border-white/5" />;

    const height = 180;
    const width = 400;
    const paddingLeft = 60;
    const paddingBottom = 40;
    const paddingTop = 20;
    const paddingRight = 20;

    const values = data.map((d) => d.value);
    const maxVal = Math.max(...values, 10) * 1.2;
    const minVal = 0;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const getX = (i: number) => paddingLeft + (i / Math.max(1, data.length - 1)) * chartWidth;
    const getY = (v: number) => paddingTop + chartHeight - ((v - minVal) / (maxVal - minVal)) * chartHeight;

    const points = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));
    let pathData = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const cpX = curr.x + (next.x - curr.x) / 2;
        pathData += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
    }

    const lastVal = data[data.length - 1].value;
    const lastY = getY(lastVal);

    // Grid labels
    const gridValues = [
        { label: "250", val: 250 },
        { label: "150", val: 150 },
        { label: "50", val: 50 },
        { label: "0", val: 0 }
    ].map(g => ({ ...g, y: getY(g.val) }));

    const formattedLastVal = lastVal.toLocaleString();

    return (
        <div className="relative mt-4">
            <div className="mb-4">
                <span className="text-4xl font-bold text-white tracking-tighter">
                    {lastVal.toLocaleString()}
                </span>
                {isPoints && (
                    <span className="text-sm font-medium text-cyan-400 ml-2 uppercase tracking-tight">
                        $BWAVE
                    </span>
                )}
            </div>

            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full overflow-visible"
            >
                {/* Axes */}
                <line
                    x1={paddingLeft} y1={paddingTop}
                    x2={paddingLeft} y2={height - paddingBottom}
                    className="stroke-white/10" strokeWidth="1"
                />
                <line
                    x1={paddingLeft} y1={height - paddingBottom}
                    x2={width - paddingRight} y2={height - paddingBottom}
                    className="stroke-white/10" strokeWidth="1"
                />

                {/* Y-Axis Labels & Grid removed as per request */}

                {/* Current Value Highlight on Y-axis */}
                <g>
                    <rect
                        x={paddingLeft - 60}
                        y={lastY - 10}
                        width="55"
                        height="20"
                        rx="4"
                        className="fill-cyan-500"
                    />
                    <text
                        x={paddingLeft - 32.5}
                        y={lastY + 1}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        className="fill-white text-[10px] font-bold"
                    >
                        {formattedLastVal}
                    </text>
                </g>

                {/* Path */}
                <motion.path
                    d={pathData}
                    fill="none"
                    stroke="#06b6d4" // cyan-500
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />

                {/* Area Fill */}
                <motion.path
                    d={`${pathData} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`}
                    fill="url(#cyanGradient)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                />

                {/* X-Axis Labels removed as per request */}

                <defs>
                    <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}

function BarChart({ data }: { data: StatsData["active_countries"] }) {
    const top3 = data.top.slice(0, 3);

    const height = 220;
    const width = 400;
    const paddingLeft = 40;
    const paddingBottom = 40;
    const paddingTop = 20;
    const paddingRight = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Bar dimensions
    const barWidth = 40;
    const barSpacing = (chartWidth - barWidth * top3.length) / (top3.length + 1);

    const getX = (idx: number) => paddingLeft + barSpacing + idx * (barWidth + barSpacing);
    const getY = (val: number) => paddingTop + chartHeight - (Math.min(val, 250) / 250) * chartHeight;

    return (
        <div className="relative mt-4">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full overflow-visible"
            >
                {/* Vertical Axis (Y) */}
                <line
                    x1={paddingLeft} y1={paddingTop}
                    x2={paddingLeft} y2={height - paddingBottom}
                    className="stroke-white/10" strokeWidth="1"
                />
                {/* Horizontal Axis (X) */}
                <line
                    x1={paddingLeft} y1={height - paddingBottom}
                    x2={width - paddingRight} y2={height - paddingBottom}
                    className="stroke-white/10" strokeWidth="1"
                />

                {/* Bars & Country Names */}
                {top3.map((item, idx) => {
                    const x = getX(idx);
                    const barY = getY(item.count);
                    const barHeight = height - paddingBottom - barY;

                    return (
                        <g key={item.country}>
                            {/* Bar Overlay */}
                            <motion.rect
                                x={x}
                                y={barY}
                                width={barWidth}
                                height={barHeight}
                                rx={4}
                                initial={{ height: 0, y: height - paddingBottom }}
                                animate={{ height: barHeight, y: barY }}
                                transition={{ duration: 1.2, delay: idx * 0.1, ease: "circOut" }}
                                className="fill-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                            />

                            {/* Country Name (Below bar) */}
                            <text
                                x={x + barWidth / 2}
                                y={height - paddingBottom + 20}
                                textAnchor="middle"
                                className="fill-white text-[10px] font-bold uppercase tracking-wider"
                            >
                                {item.country}
                            </text>

                            {/* Value Label (Above bar) */}
                            <text
                                x={x + barWidth / 2}
                                y={barY - 8}
                                textAnchor="middle"
                                className="fill-cyan-400 text-[11px] font-bold"
                            >
                                {item.count}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

function countryCodeToName(code: string) {
    if (!code || code === "?" || code.trim() === "") return "Global Territory";

    const names: Record<string, string> = {
        US: "United States",
        GB: "United Kingdom",
        NG: "Nigeria",
        NL: "Netherlands",
        DE: "Germany",
        FR: "France",
        ID: "Indonesia",
        VN: "Vietnam",
        RU: "Russia",
        UA: "Ukraine",
        IN: "India",
        BR: "Brazil",
        PH: "Philippines",
        TR: "Turkey",
        CN: "China",
        JP: "Japan",
        CA: "Canada",
        AU: "Australia",
        SA: "Saudi Arabia",
        AE: "UAE"
    };
    return names[code] || `Territory (${code})`;
}
