"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface CountryCardProps {
    countryName: string;
    flag: string;
    dotX: number;
    dotY: number;
    onClose: () => void;
}

const CARD_W = 170;
const CARD_H = 72;
const EDGE_PAD = 14;

export default function CountryCard({
    countryName,
    flag,
    dotX,
    dotY,
    onClose,
}: CountryCardProps) {
    const [displayed, setDisplayed] = useState("");
    const [visible, setVisible] = useState(false);
    const [cardPos, setCardPos] = useState({ x: 0, y: 0 });
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Compute clamped card position ──
    useEffect(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let cx = dotX + 24;
        if (cx + CARD_W > vw - EDGE_PAD) cx = dotX - CARD_W - 24;
        cx = Math.max(EDGE_PAD, Math.min(cx, vw - CARD_W - EDGE_PAD));

        let cy = dotY - CARD_H / 2;
        cy = Math.max(EDGE_PAD, Math.min(cy, vh - CARD_H - EDGE_PAD));

        setCardPos({ x: cx, y: cy });
    }, [dotX, dotY]);

    // ── Fade-in ──
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 30);
        return () => clearTimeout(t);
    }, []);

    // ── Typewriter ──
    useEffect(() => {
        let idx = 0;
        setDisplayed("");
        const start = setTimeout(() => {
            timerRef.current = setInterval(() => {
                idx++;
                setDisplayed(countryName.slice(0, idx));
                if (idx >= countryName.length) clearInterval(timerRef.current!);
            }, 55);
        }, 280);
        return () => {
            clearTimeout(start);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [countryName]);

    return (
        <>
            {/* ── Floating Card ── */}
            <div
                style={{
                    position: "absolute",
                    left: cardPos.x,
                    top: cardPos.y,
                    width: CARD_W,
                    height: CARD_H,
                    zIndex: 60,
                    opacity: visible ? 1 : 0,
                    transform: visible
                        ? "translateY(0) scale(1)"
                        : "translateY(8px) scale(0.9)",
                    transition:
                        "opacity 0.3s cubic-bezier(0.22,1,0.36,1), transform 0.3s cubic-bezier(0.22,1,0.36,1)",
                    pointerEvents: "auto",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 14,
                        background:
                            "linear-gradient(135deg, rgba(0,12,26,0.96) 0%, rgba(0,6,16,0.98) 100%)",
                        border: "1px solid rgba(0,230,255,0.35)",
                        boxShadow:
                            "0 0 32px rgba(0,230,255,0.12), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,230,255,0.08)",
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "0 14px",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* Corner accent */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: 40,
                            height: 40,
                            background:
                                "radial-gradient(circle at 0% 0%, rgba(0,230,255,0.08), transparent 70%)",
                            pointerEvents: "none",
                        }}
                    />

                    {/* Flag */}
                    <span
                        style={{
                            fontSize: 26,
                            lineHeight: 1,
                            flexShrink: 0,
                            filter: "drop-shadow(0 0 6px rgba(0,230,255,0.3))",
                        }}
                    >
                        {flag}
                    </span>

                    {/* Country name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#e8f9ff",
                                letterSpacing: "0.04em",
                                fontFamily: "system-ui, -apple-system, sans-serif",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                textShadow: "0 0 12px rgba(0,230,255,0.35)",
                            }}
                        >
                            {displayed}
                            {displayed.length < countryName.length && (
                                <span
                                    style={{
                                        display: "inline-block",
                                        width: 2,
                                        height: 13,
                                        background: "#00e6ff",
                                        marginLeft: 2,
                                        verticalAlign: "middle",
                                        borderRadius: 1,
                                        animation: "tw-blink 0.6s step-end infinite",
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        style={{
                            flexShrink: 0,
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "rgba(0,230,255,0.08)",
                            border: "1px solid rgba(0,230,255,0.25)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            padding: 0,
                            transition: "background 0.2s, border-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background =
                                "rgba(0,230,255,0.18)";
                            (e.currentTarget as HTMLButtonElement).style.borderColor =
                                "rgba(0,230,255,0.5)";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background =
                                "rgba(0,230,255,0.08)";
                            (e.currentTarget as HTMLButtonElement).style.borderColor =
                                "rgba(0,230,255,0.25)";
                        }}
                    >
                        <X size={11} color="rgba(0,230,255,0.8)" strokeWidth={2.5} />
                    </button>

                    {/* Scan-line shimmer */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 14,
                            pointerEvents: "none",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                height: 1,
                                background:
                                    "linear-gradient(90deg, transparent 0%, rgba(0,230,255,0.2) 50%, transparent 100%)",
                                animation: "tw-scan 2.5s linear infinite",
                            }}
                        />
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes tw-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes tw-scan  { 0%{top:0} 100%{top:100%} }
      `}</style>
        </>
    );
}
