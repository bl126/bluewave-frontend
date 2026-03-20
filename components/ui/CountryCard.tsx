"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface CountryCardProps {
    countryName: string;
    flag: string;
    bwCount: number;
    /** Card anchor in px from top-left of the canvas container */
    screenX: number;
    screenY: number;
    /** Dot position in px — for the SVG line start */
    dotX: number;
    dotY: number;
    onClose: () => void;
}

const FULL_TEXT = (name: string, count: number) =>
    `${name}\n${count} BW ID${count !== 1 ? "s" : ""}`;

export default function CountryCard({
    countryName,
    flag,
    bwCount,
    screenX,
    screenY,
    dotX,
    dotY,
    onClose,
}: CountryCardProps) {
    const [displayed, setDisplayed] = useState("");
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fullText = FULL_TEXT(countryName, bwCount);

    // Fade-in on mount
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 20);
        return () => clearTimeout(t);
    }, []);

    // Typewriter effect
    useEffect(() => {
        let idx = 0;
        setDisplayed("");

        // Small delay before typing starts (let the card appear first)
        const startDelay = setTimeout(() => {
            timerRef.current = setInterval(() => {
                idx++;
                setDisplayed(fullText.slice(0, idx));
                if (idx >= fullText.length) {
                    clearInterval(timerRef.current!);
                }
            }, 45);
        }, 300);

        return () => {
            clearTimeout(startDelay);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [fullText]);

    // Clamp card to stay within a 380px wide viewport (mobile)
    const CARD_W = 160;
    const CARD_H = 80;

    // Place card offset from the dot, adjusting if near edges
    let cardX = screenX + 20;
    let cardY = screenY - CARD_H / 2;

    // Flip horizontal if card would overflow right
    if (cardX + CARD_W > 360) cardX = screenX - CARD_W - 20;
    // Keep vertically on screen
    if (cardY < 10) cardY = 10;

    // Line endpoints: from dot center → nearest card edge
    const lineEndX = cardX > screenX ? cardX : cardX + CARD_W;
    const lineEndY = cardY + CARD_H / 2;

    const lines = displayed.split("\n");

    return (
        <>
            {/* ── SVG Connector Line ── */}
            <svg
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 50,
                }}
            >
                <defs>
                    <filter id="glow-line">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {/* Glow copy */}
                <line
                    x1={dotX}
                    y1={dotY}
                    x2={lineEndX}
                    y2={lineEndY}
                    stroke="#00e6ff"
                    strokeWidth="2"
                    strokeOpacity="0.25"
                    filter="url(#glow-line)"
                    strokeLinecap="round"
                />
                {/* Sharp line */}
                <line
                    x1={dotX}
                    y1={dotY}
                    x2={lineEndX}
                    y2={lineEndY}
                    stroke="#00e6ff"
                    strokeWidth="1.2"
                    strokeOpacity="0.85"
                    strokeLinecap="round"
                    strokeDasharray="4 3"
                />
                {/* Dot at origin */}
                <circle cx={dotX} cy={dotY} r={4} fill="#00e6ff" opacity="0.9" />
            </svg>

            {/* ── Floating Card ── */}
            <div
                style={{
                    position: "absolute",
                    left: cardX,
                    top: cardY,
                    width: CARD_W,
                    zIndex: 60,
                    opacity: visible ? 1 : 0,
                    transform: visible ? "scale(1)" : "scale(0.85)",
                    transition: "opacity 0.25s ease, transform 0.25s ease",
                    pointerEvents: "auto",
                }}
            >
                {/* Card body */}
                <div
                    style={{
                        background: "rgba(0, 10, 20, 0.92)",
                        border: "1px solid rgba(0, 230, 255, 0.45)",
                        borderRadius: 12,
                        boxShadow:
                            "0 0 24px rgba(0,230,255,0.18), 0 0 6px rgba(0,230,255,0.1)",
                        backdropFilter: "blur(12px)",
                        padding: "10px 12px 10px 12px",
                        position: "relative",
                    }}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "rgba(0,230,255,0.12)",
                            border: "1px solid rgba(0,230,255,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            padding: 0,
                        }}
                    >
                        <X size={10} color="#00e6ff" />
                    </button>

                    {/* Flag */}
                    <div style={{ fontSize: 22, lineHeight: 1, marginBottom: 6 }}>
                        {flag}
                    </div>

                    {/* Typewriter text */}
                    <div
                        style={{
                            fontFamily: "'Courier New', monospace",
                            fontSize: 11,
                            color: "#00e6ff",
                            lineHeight: 1.5,
                            whiteSpace: "pre-wrap",
                            textShadow: "0 0 8px rgba(0,230,255,0.6)",
                            minHeight: 34,
                        }}
                    >
                        {lines[0] && (
                            <div
                                style={{
                                    fontWeight: 700,
                                    letterSpacing: "0.05em",
                                    fontSize: 11,
                                    color: "#e0f9ff",
                                }}
                            >
                                {lines[0]}
                            </div>
                        )}
                        {lines[1] && (
                            <div
                                style={{
                                    fontSize: 10,
                                    color: "#00e6ff",
                                    opacity: 0.8,
                                    marginTop: 2,
                                }}
                            >
                                {lines[1]}
                            </div>
                        )}
                        {/* Blinking cursor */}
                        {displayed.length < fullText.length && (
                            <span
                                style={{
                                    display: "inline-block",
                                    width: 6,
                                    height: 12,
                                    background: "#00e6ff",
                                    marginLeft: 2,
                                    verticalAlign: "middle",
                                    animation: "blink 0.7s step-end infinite",
                                }}
                            />
                        )}
                    </div>

                    {/* Scan line animation */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 12,
                            overflow: "hidden",
                            pointerEvents: "none",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                height: 2,
                                background:
                                    "linear-gradient(90deg, transparent, rgba(0,230,255,0.3), transparent)",
                                animation: "scanline 2s linear infinite",
                            }}
                        />
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes scanline {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
        </>
    );
}
