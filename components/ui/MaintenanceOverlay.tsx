"use client";

import React from "react";
import { motion } from "framer-motion";
import BluewaveGlobe from "./BluewaveGlobe";

export default function MaintenanceOverlay() {
    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 text-center overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 flex flex-col items-center gap-8 max-w-md"
            >
                {/* Animated Globe/Logo Area */}
                <div className="w-64 h-64 relative mb-4">
                    <BluewaveGlobe />
                    {/* Pulsing Ring */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.1, 0.3]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute inset-0 border-2 border-cyan-400 rounded-full blur-sm"
                    />
                </div>

                <div className="space-y-4">
                    <p className="text-cyan-200/80 text-lg font-medium leading-relaxed">
                        Mini app under maintenance, we&apos;re cooking some magic with the app, please give us some time and follow update in the telegram community
                    </p>

                    <div className="flex items-center justify-center gap-3 text-cyan-500/60 text-sm font-mono uppercase tracking-[0.2em] pt-4">
                        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        Maintenance Mode Active
                    </div>
                </div>
            </motion.div>

            {/* Decorative Elements */}
            <div className="absolute bottom-12 left-0 right-0 flex justify-center opacity-30">
                <div className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">
                    Signal Status: Offline | Secure Link: Active
                </div>
            </div>
        </div>
    );
}
