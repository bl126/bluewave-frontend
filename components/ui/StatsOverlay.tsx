"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Users, Rocket, Coins } from "lucide-react";
import { useEffect, useState } from "react";

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
}: {
    isOpen: boolean;
    onClose: () => void;
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
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center overflow-hidden"
                >
                    {/* Header */}
                    <div className="w-full max-w-xl flex items-center justify-between p-6 mt-4">
                        <div>
                            <h2 className="text-xl font-medium text-cyan-50 tracking-tight">
                                Presence Network Stats
                            </h2>
                            <p className="text-sm text-cyan-400/50 mt-0.5 font-light">
                                Current state of the Bluewave network
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-cyan-500/10 rounded-full transition-all border border-transparent hover:border-cyan-500/20 text-cyan-400"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="w-full max-w-xl flex-1 overflow-y-auto px-6 space-y-16 pb-32 scrollbar-none">
                        {loading ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-4">
                                <div className="w-6 h-6 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                                <span className="text-xs text-cyan-500/40 uppercase tracking-widest animate-pulse">Syncing Network Data...</span>
                            </div>
                        ) : data ? (
                            <>
                                <section>
                                    <StatHeader
                                        title="Total Verified Humans"
                                        description="Cumulative verified users over time"
                                        icon={<Users size={14} />}
                                    />
                                    <LineChart data={data.verified_humans} />
                                </section>

                                <section>
                                    <StatHeader
                                        title="Total Missions Completed"
                                        description="Verified mission completions"
                                        icon={<Rocket size={14} />}
                                    />
                                    <LineChart data={data.missions_completed} />
                                </section>

                                <section>
                                    <StatHeader
                                        title="Presence Points Distributed"
                                        description="Total points issued to users"
                                        icon={<Coins size={14} />}
                                    />
                                    <LineChart data={data.points_distributed} />
                                </section>

                                <section>
                                    <StatHeader
                                        title="Active Countries"
                                        description="Verified humans by country"
                                        icon={<Globe size={14} />}
                                    />
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
        <div className="mb-8 border-l-2 border-cyan-500/30 pl-4 py-1">
            <div className="flex items-center gap-2 text-cyan-500 mb-1">
                {icon}
                <h3 className="text-xs font-bold uppercase tracking-[0.2em]">
                    {title}
                </h3>
            </div>
            <p className="text-[11px] text-cyan-100/30 font-medium uppercase tracking-wider">{description}</p>
        </div>
    );
}

function LineChart({ data }: { data: { date: string; value: number }[] }) {
    if (!data || data.length === 0) return <div className="h-40 bg-white/5 rounded-xl border border-white/5" />;

    const height = 180;
    const width = 500;
    const paddingX = 0;
    const paddingY = 20;

    const values = data.map((d) => d.value);
    const maxVal = Math.max(...values) || 1;
    const minVal = 0;

    const getX = (i: number) => (i / (Math.max(1, data.length - 1))) * (width - 2 * paddingX) + paddingX;
    const getY = (v: number) => height - paddingY - ((v - minVal) / (maxVal - minVal)) * (height - 2 * paddingY);

    // Generate smooth cubic bezier path
    const points = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));

    let pathData = `M ${points[0].x} ${points[0].y}`;

    if (points.length > 2) {
        for (let i = 0; i < points.length - 1; i++) {
            const curr = points[i];
            const next = points[i + 1];
            const cpX = curr.x + (next.x - curr.x) / 2;
            pathData += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
        }
    } else if (points.length === 2) {
        pathData += ` L ${points[1].x} ${points[1].y}`;
    }

    return (
        <div className="relative">
            <div className="absolute top-[-30px] right-0 text-right">
                <span className="text-2xl font-light text-white tracking-tight">
                    {data[data.length - 1].value.toLocaleString()}
                </span>
            </div>

            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full overflow-visible"
                preserveAspectRatio="none"
            >
                {/* Horizontal Grids */}
                {[0, 0.5, 1].map((p) => (
                    <line
                        key={p}
                        x1="0"
                        y1={paddingY + p * (height - 2 * paddingY)}
                        x2={width}
                        y2={paddingY + p * (height - 2 * paddingY)}
                        className="stroke-cyan-500/10"
                        strokeWidth="0.5"
                        strokeDasharray="4 4"
                    />
                ))}

                {/* Path */}
                <motion.path
                    d={pathData}
                    fill="none"
                    stroke="#06b6d4" // cyan-500
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, ease: [0.33, 1, 0.68, 1] }}
                />

                {/* Area fill */}
                <motion.path
                    d={`${pathData} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`}
                    fill="url(#statGradient)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.15 }}
                    transition={{ duration: 1, delay: 1 }}
                />

                <defs>
                    <linearGradient id="statGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>

            <div className="flex justify-between mt-2 text-[9px] text-cyan-500/40 font-bold uppercase tracking-widest">
                <span>{data[0].date}</span>
                <span>Today</span>
            </div>
        </div>
    );
}

function BarChart({ data }: { data: StatsData["active_countries"] }) {
    const maxCount = Math.max(...data.top.map((d) => d.count)) || 1;

    return (
        <div className="space-y-6">
            {data.top.map((item, idx) => (
                <div key={item.country} className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold text-cyan-100/60 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-cyan-500" />
                            {countryCodeToName(item.country)}
                        </span>
                        <span className="text-xs font-medium text-cyan-400">{item.count.toLocaleString()}</span>
                    </div>
                    <div className="h-[3px] w-full bg-cyan-950/40 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.count / maxCount) * 100}%` }}
                            transition={{ duration: 1.2, delay: idx * 0.1, ease: "circOut" }}
                            className="h-full bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                        />
                    </div>
                </div>
            ))}
            {data.others > 0 && (
                <div className="pt-4 flex items-center gap-3">
                    <div className="h-[1px] flex-1 bg-cyan-900/40" />
                    <p className="text-[9px] text-cyan-500/30 font-bold uppercase tracking-widest">
                        + {data.others} other territories
                    </p>
                    <div className="h-[1px] flex-1 bg-cyan-900/40" />
                </div>
            )}
        </div>
    );
}

function countryCodeToName(code: string) {
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
    return names[code] || code;
}
