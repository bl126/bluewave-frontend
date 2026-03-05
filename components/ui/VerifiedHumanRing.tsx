"use client";

import { motion } from "framer-motion";

interface VerifiedHumanRingProps {
    children: React.ReactNode;
    size?: "sm" | "md" | "lg";
}

export default function VerifiedHumanRing({ children, size = "md" }: VerifiedHumanRingProps) {
    const sizes = {
        sm: "w-12 h-12",
        md: "w-24 h-24",
        lg: "w-32 h-32"
    };

    const ringSizes = {
        sm: 52,
        md: 104,
        lg: 136
    };

    const strokeWidth = {
        sm: 2,
        md: 3,
        lg: 4
    };

    return (
        <div className={`relative flex items-center justify-center ${sizes[size]}`}>
            {/* The Swirling Flame Ring (SVG) */}
            <div className="absolute inset-[-4px] pointer-events-none">
                <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                >
                    <defs>
                        <linearGradient id="cyanPlasma" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
                            <stop offset="50%" stopColor="#0891b2" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#22d3ee" stopOpacity="1" />
                        </linearGradient>

                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Background Glow */}
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="48"
                        fill="none"
                        stroke="url(#cyanPlasma)"
                        strokeWidth="0.5"
                        strokeOpacity="0.3"
                        filter="url(#glow)"
                        animate={{
                            scale: [1, 1.05, 1],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Swirling Plasma Layers */}
                    {[...Array(3)].map((_, i) => (
                        <motion.circle
                            key={i}
                            cx="50"
                            cy="50"
                            r="46"
                            fill="none"
                            stroke="url(#cyanPlasma)"
                            strokeWidth={strokeWidth[size]}
                            strokeDasharray="40 160"
                            strokeLinecap="round"
                            filter="url(#glow)"
                            animate={{
                                rotate: 360,
                                strokeDasharray: ["40 160", "80 120", "40 160"],
                            }}
                            transition={{
                                duration: 3 + i,
                                repeat: Infinity,
                                ease: "linear",
                                delay: i * 0.5
                            }}
                        />
                    ))}

                    {/* Flicker Particles */}
                    {[...Array(6)].map((_, i) => (
                        <motion.circle
                            key={`p-${i}`}
                            r="1.5"
                            fill="#22d3ee"
                            filter="url(#glow)"
                            animate={{
                                cy: [50, 48, 52, 50],
                                cx: [50, 52, 48, 50],
                                scale: [0, 1, 0],
                                opacity: [0, 0.8, 0],
                                rotate: 360
                            }}
                            style={{
                                originX: "50px",
                                originY: "50px",
                                transform: `rotate(${i * 60}deg) translate(46px)`
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.3,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </svg>
            </div>

            {/* The Avatar Container */}
            <div className="relative z-10 w-full h-full rounded-full overflow-hidden border border-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                {children}
            </div>
        </div>
    );
}
