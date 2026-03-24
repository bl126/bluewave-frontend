"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RefreshCcw, Home, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("🚨 FRONTEND_ERROR:", error);
    }, [error]);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black px-6 text-center">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full" />

            <AnimatePresence mode="wait">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative z-10 flex flex-col items-center max-w-md"
                >
                    {/* Icon Container */}
                    <div className="relative mb-8">
                        <motion.div
                            animate={{
                                rotate: [0, -10, 10, -10, 10, 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 3
                            }}
                            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-white/10 backdrop-blur-xl"
                        >
                            <ShieldAlert className="w-12 h-12 text-red-500" strokeWidth={1.5} />
                        </motion.div>

                        {/* Pulsing Ring */}
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-3xl border border-red-500/30"
                        />
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
                        Signal Disrupted
                    </h1>

                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        An unexpected fluctuation in the protocol layer has occurred.
                        We've logged this event for the technical architects.
                    </p>

                    <div className="flex flex-col w-full gap-3">
                        <Button
                            onClick={reset}
                            className="h-14 bg-white text-black hover:bg-zinc-200 font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 group"
                        >
                            <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                            Reconnect Signal
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => window.location.href = '/'}
                            className="h-14 border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5" />
                            Return to Base
                        </Button>
                    </div>

                    {/* Technical Info (Collapsible or subtle) */}
                    <div className="mt-12 pt-8 border-t border-white/5 w-full">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-mono">
                            Error Digest: {error.digest || "INTERNAL_PROTOCOL_ERROR"}
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
