"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BalancePillProps {
    balance: number | null;
    isVisible: boolean;
}

export default function BalancePill({ balance, isVisible }: BalancePillProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isScrollHidden, setIsScrollHidden] = useState(false);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastScrollYRef = useRef(0);
    const pillRef = useRef<HTMLDivElement>(null);

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
        <AnimatePresence>
            {shouldRender && (
                <motion.div
                    ref={pillRef}
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="fixed left-1/2 -translate-x-1/2 z-[150]"
                    style={{ top: "calc(env(safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 10px)" }}
                >
                    <motion.button
                        onClick={() => setIsExpanded(true)}
                        layout
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center bg-black/40 backdrop-blur-xl border border-cyan-500/30 
                       text-cyan-400 font-black shadow-[0_0_15px_rgba(0,230,255,0.15)] overflow-hidden"
                        animate={{
                            borderRadius: isExpanded ? "16px" : "9999px",
                            padding: isExpanded ? "6px 16px" : "4px 12px",
                            scale: isExpanded ? 1.05 : 1,
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                        <motion.span layout="position" className="tracking-wider whitespace-nowrap text-xs">
                            {balance !== null ? (
                                <>
                                    {isExpanded ? formatFull(balance) : formatAbbreviated(balance)}{" "}
                                    <span className="text-[9px] sm:text-[10px] tracking-widest text-cyan-200/80">$BWAVE</span>
                                </>
                            ) : (
                                <span className="animate-pulse">...</span>
                            )}
                        </motion.span>
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
