"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

type BalanceType = "points" | "ton" | "stars";

interface BalancePillProps {
    balance: number | null;
    isVisible: boolean;
}

export default function BalancePill({ balance, isVisible }: BalancePillProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [primaryType, setPrimaryType] = useState<BalanceType>("points");
    const [isScrollHidden, setIsScrollHidden] = useState(false);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastScrollYRef = useRef(0);
    const pillRef = useRef<HTMLDivElement>(null);

    // Static balances for now
    const tonBalance = 0;
    const starBalance = 0;

    // Formatting helpers
    const formatAbbreviated = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
        if (num >= 10000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
        return num.toLocaleString();
    };

    const formatFull = (num: number) => {
        return num.toLocaleString();
    };

    // Click outside to collapse
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pillRef.current && !pillRef.current.contains(e.target as Node)) {
                setIsExpanded(false);
            }
        };
        if (isExpanded) {
            // Small delay prevents immediate collapse from the opening click
            setTimeout(() => document.addEventListener("click", handleClickOutside), 50);
        }
        return () => document.removeEventListener("click", handleClickOutside);
    }, [isExpanded]);

    const handleSwitch = (type: BalanceType) => {
        if (type === primaryType) {
            setIsExpanded(!isExpanded);
        } else {
            setPrimaryType(type);
            setIsExpanded(false);
        }
    };

    const StarIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
        </svg>
    );

    const types: BalanceType[] = ["points", "ton", "stars"];
    const orderedTypes = [primaryType, ...types.filter(t => t !== primaryType)];

    // Global scroll listener for auto-hide
    useEffect(() => {
        const handleScroll = (e: Event) => {
            // Find the scrollable element that triggered this
            const target = e.target as HTMLElement | Document;

            // We only care about vertical scrolls from main containers 
            // (avoiding tiny internal scrolls if possible, though capturing matches most)
            const currentScrollY = target === document ? window.scrollY : (target as HTMLElement).scrollTop;

            if (currentScrollY > lastScrollYRef.current + 5) {
                // Scrolling DOWN (moving down the page) -> Hide Pill
                setIsScrollHidden(true);
                setIsExpanded(false); // Collapse if open

                // Clear old timeout
                if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

                // Show again after scrolling stops for 1.2s
                hideTimeoutRef.current = setTimeout(() => {
                    setIsScrollHidden(false);
                }, 1200);

            } else if (currentScrollY < lastScrollYRef.current - 5) {
                // Scrolling UP -> Show Pill
                setIsScrollHidden(false);
                if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
            }

            lastScrollYRef.current = currentScrollY;
        };

        // Use capturing phase since React modals/sheets often stop propagation
        window.addEventListener("scroll", handleScroll, true);

        return () => {
            window.removeEventListener("scroll", handleScroll, true);
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        };
    }, []);

    // Overall visibility boolean (props + scroll state)
    const shouldRender = isVisible && !isScrollHidden;

    return (
        <>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[140]"
                        onClick={() => setIsExpanded(false)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {shouldRender && (
                    <motion.div
                        ref={pillRef}
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed left-1/2 -translate-x-1/2 z-[150] flex flex-col items-center gap-2"
                        style={{ top: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) - 2px)" }}
                    >
                        {orderedTypes.map((type, idx) => {
                            if (!isExpanded && idx !== 0) return null;

                            const isPrimary = idx === 0;
                            const displayBalance = type === "points" ? balance : (type === "ton" ? tonBalance : starBalance);
                            const amount = displayBalance !== null ? displayBalance : 0;

                            return (
                                <motion.button
                                    key={type}
                                    layout
                                    onClick={() => handleSwitch(type)}
                                    whileTap={{ scale: 0.95 }}
                                    className={`flex items-center justify-between bg-black/40 backdrop-blur-xl border border-cyan-500/30 
                                    text-cyan-400 font-bold shadow-[0_0_15px_rgba(0,230,255,0.15)] overflow-hidden ${isExpanded ? "w-40 sm:w-48" : "w-auto min-w-fit px-3"}`}
                                    initial={!isPrimary ? { opacity: 0, scale: 0.8, y: -20 } : false}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        y: 0,
                                        borderRadius: isExpanded ? "12px" : "9999px",
                                        padding: isExpanded ? "8px 12px" : "4px 10px",
                                    }}
                                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                >
                                    <div className={`flex items-center gap-2 flex-1 ${type === "points" ? "" : "pl-1"}`}>
                                        <motion.span layout="position" className="tracking-tight whitespace-nowrap text-[11px] font-black flex-1">
                                            {type === "points" ? (
                                                balance !== null ? (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-cyan-400 font-black">
                                                            {isExpanded ? formatFull(balance) : formatAbbreviated(balance)}
                                                        </span>
                                                        <span className="text-[9px] sm:text-[10px] tracking-widest text-cyan-400 font-black ml-0.5 uppercase">$BWAVE</span>
                                                    </div>
                                                ) : (
                                                    <span className="animate-pulse text-cyan-400">...</span>
                                                )
                                            ) : (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex items-center gap-0.5">
                                                        <span className="opacity-60 font-mono text-[10px]">$</span>
                                                        <span className="text-cyan-400 font-black">0</span>
                                                        <span className="opacity-40 mx-0.5">~</span>
                                                        <span className="text-cyan-400 font-black">0</span>
                                                    </div>
                                                    
                                                    {/* Currency Icon comes after number for TON/Stars */}
                                                    <div className="w-4 h-4 flex items-center justify-center shrink-0 ml-0.5">
                                                        {type === "ton" && (
                                                            <img src="/ton-transparent.png" alt="TON" className="w-3.5 h-3.5 object-contain" />
                                                        )}
                                                        {type === "stars" && (
                                                            <div className="text-cyan-400 flex items-center justify-center scale-90">
                                                                <StarIcon />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.span>
                                    </div>

                                    {/* Plus icon - Only visible when expanded for TON/Stars */}
                                    {isExpanded && type !== "points" ? (
                                        <div className="shrink-0 bg-cyan-500/10 p-0.5 rounded-md border border-cyan-500/20 shadow-[0_0_10px_rgba(0,230,255,0.1)]">
                                            <Plus size={10} strokeWidth={4} className="text-cyan-400" />
                                        </div>
                                    ) : (
                                        // Invisible spacer to maintain layout consistency ONLY when expanded
                                        isExpanded && type === "points" ? <div className="w-[20px]" /> : null
                                    )}
                                </motion.button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
