"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface CountryCardProps {
    countryName: string;
    flag: string;
    dotX: number;
    dotY: number;
    onClose: () => void;
}

const MIN_CARD_W = 180;
const MAX_CARD_W = 260; // wider for very long names
const EDGE_PAD = 14;

export default function CountryCard({
    countryName,
    flag,
    dotX,
    dotY,
    onClose,
}: CountryCardProps) {
    const { theme } = useTheme();
    const [displayed, setDisplayed] = useState("");
    const [visible, setVisible] = useState(false);
    const [cardPos, setCardPos] = useState({ x: 0, y: 0, width: MIN_CARD_W });
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Theme-aware styles
    const styles = useMemo(() => {
        switch (theme) {
            case "dim":
                return {
                    bg: "linear-gradient(135deg, rgba(23,33,43,0.96) 0%, rgba(36,47,61,0.98) 100%)",
                    border: "1px solid rgba(0,230,255,0.25)",
                    shadow: "0 0 32px rgba(0,230,255,0.08), 0 8px 32px rgba(0,0,0,0.4)",
                    text: "#f5f5f5",
                    subtext: "#708499",
                    accent: "#00f6ff",
                    closeBg: "rgba(0,246,255,0.1)",
                    scanColor: "rgba(0,246,255,0.15)",
                    glow: "drop-shadow(0 0 6px rgba(0,230,255,0.3))"
                };
            default: // glass theme / default
                return {
                    bg: "rgba(0, 0, 0, 0.55)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    shadow: "inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 8px 32px rgba(0, 0, 0, 0.5)",
                    text: "#ffffff",
                    subtext: "rgba(255, 255, 255, 0.6)",
                    accent: "#ffffff",
                    closeBg: "rgba(255, 255, 255, 0.08)",
                    scanColor: "rgba(255, 255, 255, 0.1)",
                    glow: "drop-shadow(0 0 6px rgba(255, 255, 255, 0.15))"
                };
        }
    }, [theme]);

    // ── Compute dynamic width & position ──
    useEffect(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const estimatedW = Math.max(MIN_CARD_W, Math.min(MAX_CARD_W, 60 + countryName.length * 8));
        const cardH = 72;

        let cx = dotX + 24;
        if (cx + estimatedW > vw - EDGE_PAD) cx = dotX - estimatedW - 24;
        cx = Math.max(EDGE_PAD, Math.min(cx, vw - estimatedW - EDGE_PAD));

        let cy = dotY - cardH / 2;
        cy = Math.max(EDGE_PAD, Math.min(cy, vh - cardH - EDGE_PAD));

        setCardPos({ x: cx, y: cy, width: estimatedW });
    }, [dotX, dotY, countryName]);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 30);
        return () => clearTimeout(t);
    }, []);

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
            <div
                style={{
                    position: "absolute",
                    left: cardPos.x,
                    top: cardPos.y,
                    width: cardPos.width,
                    minHeight: 72,
                    zIndex: 200,
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
                        background: styles.bg,
                        border: styles.border,
                        boxShadow: styles.shadow,
                        backdropFilter: "blur(24px)",
                        WebkitBackdropFilter: "blur(24px)",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 14px",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: 40,
                            height: 40,
                            background: `radial-gradient(circle at 0% 0%, ${styles.scanColor}, transparent 70%)`,
                            pointerEvents: "none",
                        }}
                    />

                    <span
                        style={{
                            fontSize: 26,
                            lineHeight: 1,
                            flexShrink: 0,
                            filter: styles.glow,
                        }}
                    >
                        {flag}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: styles.text,
                                letterSpacing: "0.04em",
                                fontFamily: "system-ui, -apple-system, sans-serif",
                                lineHeight: 1.2,
                                wordBreak: "break-word",
                                whiteSpace: "normal",
                            }}
                        >
                            {displayed}
                            {displayed.length < countryName.length && (
                                <span
                                    style={{
                                        display: "inline-block",
                                        width: 2,
                                        height: 13,
                                        background: styles.accent,
                                        marginLeft: 2,
                                        verticalAlign: "middle",
                                        borderRadius: 1,
                                        animation: "tw-blink 0.6s step-end infinite",
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            flexShrink: 0,
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: styles.closeBg,
                            border: `1px solid ${styles.scanColor}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            padding: 0,
                            transition: "background 0.2s, border-color 0.2s",
                        }}
                    >
                        <X size={11} color={styles.accent} strokeWidth={2.5} />
                    </button>

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
                                    `linear-gradient(90deg, transparent 0%, ${styles.scanColor} 50%, transparent 100%)`,
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
