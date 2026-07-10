"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { fetchTonPriceUsd } from "@/lib/tonPriceCache";

/** Warm deposit + withdrawal chunks as soon as the mini app is interactive */
function prefetchDepositModal() {
    void import("./DepositModal");
}

// Lazy-load so TON Connect hooks only run client-side; no loading shell (instant open)
const DepositModal = dynamic(() => import("./DepositModal"), {
    ssr: false,
    loading: () => null,
});

const WalletRequiredBeforeDepositModal = dynamic(
    () => import("./WalletRequiredBeforeDepositModal"),
    { ssr: false }
);

type BalanceType = "points" | "ton" | "stars";

interface BalancePillProps {
    balance: number | null;
    isVisible: boolean;
    telegramUser?: any;
    onGoToProfile?: () => void;
}

export default function BalancePill({ balance, isVisible, telegramUser, onGoToProfile }: BalancePillProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [primaryType, setPrimaryType] = useState<BalanceType>("points");
    const [isScrollHidden, setIsScrollHidden] = useState(false);
    const [depositType, setDepositType] = useState<"ton" | "stars" | null>(null);
    const [walletGateOpen, setWalletGateOpen] = useState(false);
    const [pendingDepositType, setPendingDepositType] = useState<"ton" | "stars" | null>(null);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastScrollYRef = useRef(0);
    const pillRef = useRef<HTMLDivElement>(null);

    // Fetch live balances from telegramUser prop
    const tonBalance = telegramUser?.ton_balance || 0;
    const starBalance = telegramUser?.stars_balance || 0;
    const [tonPrice, setTonPrice] = useState(3.0);

    // Preload modals + TON price on mount so first open is instant
    useEffect(() => {
        prefetchDepositModal();
        void fetchTonPriceUsd();
    }, []);

    // Preload again when user expands the pill (likely to tap +)
    useEffect(() => {
        if (isExpanded) prefetchDepositModal();
    }, [isExpanded]);

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd");
                const data = await res.json();
                const p = data["the-open-network"]?.usd;
                if (p) setTonPrice(p);
            } catch (e) {
                console.warn("Failed to fetch TON price for BalancePill:", e);
            }
        };
        fetchPrice();
    }, []);

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
                        className="fixed inset-0 bg-app-bg/20 backdrop-blur-sm z-[140]"
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
                                    className={`flex items-center justify-between border border-app-border 
                                    text-app-accent font-bold shadow-app-shadow overflow-hidden bg-app-card backdrop-blur-xl ${isExpanded ? "w-40 sm:w-48" : "w-auto min-w-fit px-3"}`}
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
                                                        <span className="text-app-accent font-black">
                                                            {isExpanded ? formatFull(balance) : formatAbbreviated(balance)}
                                                        </span>
                                                        <span className={`text-[9px] sm:text-[10px] tracking-widest font-black ml-0.5 uppercase text-app-accent`}>$BWAVE</span>
                                                    </div>
                                                ) : (
                                                    <span className="animate-pulse text-app-accent">...</span>
                                                )
                                            ) : (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex items-center gap-0.5">
                                                        <span className="text-app-accent font-black">
                                                            {type === "ton" 
                                                                ? (isExpanded ? amount.toFixed(4) : amount.toFixed(2)) 
                                                                : amount.toLocaleString()}
                                                        </span>
                                                        <span className="text-text-muted text-[10px] font-bold ml-1">
                                                            (${type === "ton" 
                                                                ? (amount * tonPrice).toFixed(2) 
                                                                : (amount * 0.013).toFixed(2)})
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Currency Icon comes after number for TON/Stars */}
                                                    <div className="w-4 h-4 flex items-center justify-center shrink-0 ml-0.5">
                                                         {type === "ton" && (
                                                             <div>
                                                                 <img src="/gram icon.png" alt="Gram" className="w-3.5 h-3.5 object-contain" />
                                                             </div>
                                                         )}
                                                        {type === "stars" && (
                                                            <div className="text-app-accent flex items-center justify-center scale-90">
                                                                <StarIcon />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.span>
                                    </div>
 
                                    {/* Plus icon — clickable for TON/Stars, opens deposit modal */}
                                    {isExpanded && type !== "points" ? (
                                        <motion.button
                                            whileTap={{ scale: 0.85 }}
                                            onPointerEnter={prefetchDepositModal}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                prefetchDepositModal();
                                                setIsExpanded(false);
                                                const kind = type as "ton" | "stars";
                                                if (!telegramUser?.wallet_address) {
                                                    setPendingDepositType(kind);
                                                    setWalletGateOpen(true);
                                                    return;
                                                }
                                                setDepositType(kind);
                                            }}
                                            className="shrink-0 p-0.5 rounded-md border shadow-app-shadow bg-app-accent/10 border-app-border hover:bg-app-accent/20 active:scale-90 transition-all"
                                        >
                                            <Plus size={10} strokeWidth={4} className="text-app-accent" />
                                        </motion.button>
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

            <WalletRequiredBeforeDepositModal
                isOpen={walletGateOpen}
                onClose={() => {
                    setWalletGateOpen(false);
                    setPendingDepositType(null);
                }}
                onReady={() => {
                    if (pendingDepositType) {
                        setDepositType(pendingDepositType);
                    }
                    setWalletGateOpen(false);
                    setPendingDepositType(null);
                }}
                onGoToProfile={() => onGoToProfile?.()}
                telegramUser={telegramUser}
            />

            {/* Deposit Modal — portal rendered at body level */}
            {depositType && (
                <DepositModal
                    type={depositType === "ton" ? "ton_direct" : "stars"}
                    telegramUser={telegramUser}
                    onClose={() => setDepositType(null)}
                    onSuccess={(tonAdded, starsAdded) => {
                        const updates: any = {};
                        if (tonAdded !== undefined) {
                            updates.ton_balance = (telegramUser?.ton_balance || 0) + tonAdded;
                        }
                        if (starsAdded !== undefined) {
                            updates.stars_balance = (telegramUser?.stars_balance || 0) + starsAdded;
                        }
                        if (Object.keys(updates).length > 0) {
                            window.dispatchEvent(new CustomEvent("updateUser", { detail: updates }));
                        }
                        setDepositType(null);
                    }}
                />
            )}
        </>
    );
}
