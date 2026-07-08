// Component for sharing referral links and QR codes
"use client";

import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Share2, Copy, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import QRCode from "react-qr-code";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReferralShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    telegramId: number | null;
    bwId: string;
    referralLink?: string;
}

export default function ReferralShareModal({ isOpen, onClose, telegramId, bwId, referralLink }: ReferralShareModalProps) {
    const [copied, setCopied] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const qrRef = useRef<HTMLDivElement>(null);
    const link = referralLink || `https://t.me/Bluewave_Ecosystem_bot/bluewave?startapp=ref_${telegramId}`;
    const { t } = useLanguage();
    const dragControls = useDragControls();

    const SHARE_CAPTION = `${t("referral.share_caption")}\n${link}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        if (!isOpen) return;

        const handleBack = () => {
            onClose();
        };

        if (typeof window !== "undefined") {
            (window as any).bwBackStack = (window as any).bwBackStack || [];
            (window as any).bwBackStack.push(handleBack);
        }

        const handleNativeBack = (e: Event) => {
            const stack = (window as any).bwBackStack || [];
            if (stack[stack.length - 1] === handleBack) {
                e.preventDefault();
                handleBack();
            }
        };

        window.addEventListener("bwNativeBack", handleNativeBack);

        return () => {
            window.removeEventListener("bwNativeBack", handleNativeBack);
            if (typeof window !== "undefined") {
                (window as any).bwBackStack = ((window as any).bwBackStack || []).filter(
                    (item: any) => item !== handleBack
                );
            }
        };
    }, [isOpen, onClose]);

    /**
     * Builds a branded share card
     */
    const buildShareImage = async (): Promise<Blob | null> => {
        const svg = qrRef.current?.querySelector("svg");
        if (!svg) return null;

        // Rasterise the QR SVG first
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const svgUrl = URL.createObjectURL(svgBlob);

        const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = svgUrl;
        });

        URL.revokeObjectURL(svgUrl);

        // Build the branded card
        const W = 1080;
        const H = 1350; // portrait card
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        // --- Background ---
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, "#050c18");
        grad.addColorStop(1, "#030a12");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // --- Subtle glow behind QR ---
        const style = getComputedStyle(document.documentElement);
        const accent = style.getPropertyValue('--accent').trim() || "#06b6d4";
        const accentGlow = style.getPropertyValue('--accent-glow').trim() || "rgba(6,182,212,0.18)";
        const textSub = style.getPropertyValue('--text-sub').trim() || "rgba(255,255,255,0.35)";

        const glow = ctx.createRadialGradient(W / 2, H / 2 - 60, 20, W / 2, H / 2 - 60, 380);
        glow.addColorStop(0, accentGlow);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);

        // --- Header: BLUEWAVE ---
        ctx.font = "bold 64px -apple-system, system-ui, sans-serif";
        ctx.letterSpacing = "8px";
        ctx.fillStyle = accent;
        ctx.textAlign = "center";
        ctx.fillText(t("referral.canvas_header"), W / 2, 140);

        // Sub-header
        ctx.font = "500 32px -apple-system, system-ui, sans-serif";
        ctx.fillStyle = textSub;
        ctx.fillText(t("referral.canvas_subheader"), W / 2, 200);

        // --- Divider line ---
        ctx.strokeStyle = accent + "40"; // 25% opacity
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(140, 240);
        ctx.lineTo(W - 140, 240);
        ctx.stroke();

        // --- QR card (white rounded rect) ---
        const qrPad = 48;
        const qrSize = 640;
        const qrX = (W - qrSize) / 2;
        const qrY = 300;

        const rr = 40; // border radius
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(qrX + rr, qrY);
        ctx.lineTo(qrX + qrSize - rr, qrY);
        ctx.quadraticCurveTo(qrX + qrSize, qrY, qrX + qrSize, qrY + rr);
        ctx.lineTo(qrX + qrSize, qrY + qrSize - rr);
        ctx.quadraticCurveTo(qrX + qrSize, qrY + qrSize, qrX + qrSize - rr, qrY + qrSize);
        ctx.lineTo(qrX + rr, qrY + qrSize);
        ctx.quadraticCurveTo(qrX, qrY + qrSize, qrX, qrY + qrSize - rr);
        ctx.quadraticCurveTo(qrX, qrY + qrSize, qrX, qrY + qrSize - rr);
        ctx.lineTo(qrX, qrY + rr);
        ctx.quadraticCurveTo(qrX, qrY, qrX + rr, qrY);
        ctx.closePath();
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.restore();

        // Draw the QR inside the white card
        ctx.drawImage(qrImg, qrX + qrPad, qrY + qrPad, qrSize - qrPad * 2, qrSize - qrPad * 2);

        // --- Caption ---
        const captionY = qrY + qrSize + 70;
        ctx.font = "bold 46px -apple-system, system-ui, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(t("referral.canvas_scan_1"), W / 2, captionY);
        ctx.fillText(t("referral.canvas_scan_2"), W / 2, captionY + 64);

        // --- BW ID badge ---
        const badgeY = captionY + 150;
        ctx.font = "bold 36px -apple-system, system-ui, sans-serif";
        ctx.fillStyle = "rgba(6,182,212,0.9)";
        ctx.fillText(bwId, W / 2, badgeY);

        // --- Bottom link (small) ---
        ctx.font = "500 26px -apple-system, system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillText("t.me/Bluewave_Ecosystem_bot", W / 2, H - 72);

        return new Promise<Blob | null>((resolve) => {
            canvas.toBlob((blob) => resolve(blob), "image/png");
        });
    };

    const handleShare = async () => {
        if (isSharing) return;
        setIsSharing(true);

        try {
            if (!navigator.share) {
                // No Web Share API — just copy the link
                handleCopy();
                setIsSharing(false);
                return;
            }

            const blob = await buildShareImage();

            if (blob && navigator.canShare) {
                const file = new File([blob], "bluewave-referral.png", { type: "image/png" });
                const shareData: ShareData = {
                    title: t("referral.share_title"),
                    text: SHARE_CAPTION,
                    files: [file],
                };

                if (navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                    return;
                }
            }

            // Fallback: share without image
            await navigator.share({
                title: t("referral.share_title"),
                text: SHARE_CAPTION,
                url: link,
            });

        } catch (err: unknown) {
            // User cancelled is not a real error
            if (err instanceof Error && err.name !== "AbortError") {
                console.error("Share failed:", err);
                handleCopy();
            }
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop — above nav */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[1018] bg-app-bg/60 backdrop-blur-sm"
                    />

                    {/* Sheet — above nav */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        drag="y"
                        dragControls={dragControls}
                        dragListener={false}
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100) onClose();
                        }}
                        className="fixed bottom-0 left-0 right-0 z-[1019] bg-app-card border-t border-app-border rounded-t-[2.5rem] flex flex-col max-h-[70vh] shadow-app-shadow text-text-main"
                    >
                        {/* Drag Handle */}
                        <div
                            onPointerDown={(e) => dragControls.start(e)}
                            className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing touch-none"
                        >
                            <div className="w-12 h-1.5 bg-app-border/50 rounded-full" />
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto px-8 pb-24 custom-scrollbar flex flex-col items-center gap-8">
                            {/* BW ID Header */}
                            <div className="text-center space-y-1 mt-2">
                                <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">{bwId}</h2>
                            </div>

                            {/* QR Code Container (used by canvas renderer) */}
                            <div ref={qrRef} className="p-4 bg-white rounded-3xl shadow-app-shadow">
                                <div className="bg-white p-2 rounded-xl">
                                    <QRCode
                                        value={link}
                                        size={180}
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                        viewBox={`0 0 256 256`}
                                        level="H"
                                    />
                                </div>
                            </div>

                            {/* Info Text */}
                            <p className="text-text-sub text-[10px] font-bold uppercase tracking-widest text-center px-4 leading-relaxed">
                                {t("referral.share_desc")}
                            </p>

                            {/* Primary Buttons */}
                            <div className="w-full flex flex-col gap-3">
                                <button
                                    onClick={handleShare}
                                    disabled={isSharing}
                                    className="w-full h-14 bg-app-accent text-app-bg rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-app-accent/80 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-app-shadow disabled:opacity-50"
                                >
                                    {isSharing ? (
                                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <Share2 size={16} />
                                    )}
                                    {isSharing ? t("referral.preparing") : t("referral.share_btn")}
                                </button>

                                <button
                                    onClick={handleCopy}
                                    className="w-full h-14 bg-app-accent/5 border border-app-border text-text-main rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-app-accent/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    {copied ? <Check size={16} className="text-app-accent" /> : <Copy size={16} />}
                                    {copied ? t("referral.copied_link") : t("referral.copy_link")}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
