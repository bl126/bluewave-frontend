"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import QRCode from "react-qr-code";

interface ReferralShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    telegramId: number | null;
    bwId: string;
    referralLink?: string;
}

export default function ReferralShareModal({ isOpen, onClose, telegramId, bwId, referralLink }: ReferralShareModalProps) {
    const [copied, setCopied] = useState(false);
    const link = referralLink || `https://t.me/Bluewave_Ecosystem_bot?start=ref_${telegramId}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Bluewave Network',
                    text: `Join my network on Bluewave! My BW ID: ${bwId}`,
                    url: link,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback to copy if share is not supported
            handleCopy();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="relative w-full max-w-sm bg-black border border-cyan-500/20 rounded-[2.5rem] p-8 overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)]"
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    >
                        {/* Exit Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-cyan-400 transition-colors z-10"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center gap-8">
                            {/* BW ID Header */}
                            <div className="text-center space-y-1 mt-2">
                                <span className="text-[10px] font-black text-cyan-500/50 uppercase tracking-[0.3em]">YOUR BW ID</span>
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">{bwId}</h2>
                            </div>

                            {/* QR Code Container */}
                            <div className="p-4 bg-white rounded-3xl shadow-[0_0_30px_rgba(255,255,255,0.1)]">
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
                            <p className="text-cyan-500/40 text-[10px] font-bold uppercase tracking-widest text-center px-4 leading-relaxed">
                                Share this code to grow your human network and earn $BWAVE rewards.
                            </p>

                            {/* Primary Buttons */}
                            <div className="w-full flex flex-col gap-3">
                                <button
                                    onClick={handleShare}
                                    className="w-full h-14 bg-cyan-500 text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-cyan-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(6,182,212,0.2)]"
                                >
                                    <Share2 size={16} />
                                    Share Code
                                </button>

                                <button
                                    onClick={handleCopy}
                                    className="w-full h-14 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    {copied ? <Check size={16} className="text-cyan-400" /> : <Copy size={16} />}
                                    {copied ? "Copied Link" : "Copy Link"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
