"use client";
/**
 * 🧭 Ecosystem Tour Component
 * A premium, spotlight-based walkthrough for new Bluewave users.
 * Optimized for ghost mode onboarding.
 */
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Globe, Radio, Trophy, User, ChevronRight, X } from "lucide-react";

interface TourStep {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    target: string; // Used for descriptive positioning logic
}

const TOUR_STEPS: TourStep[] = [
    {
        id: "globe",
        title: "The Global Pulse",
        description: "Welcome, Ghost. This is the heart of the Protocol. Watch real-time human activity being processed into social signal across the globe.",
        icon: <Globe className="text-cyan-400" size={24} />,
        target: "center"
    },
    {
        id: "explore",
        title: "Social Intelligence",
        description: "The Signal Feed. Engage with the ecosystem's most vital streams. As a guest, you can Like and Comment to shape the protocol's intelligence.",
        icon: <Radio className="text-cyan-400" size={24} />,
        target: "bottom-explore"
    },
    {
        id: "missions",
        title: "Reward Ecosystem",
        description: "Earn & Grow. Complete presence and social missions to build your $BWAVE balance. This sector remains encrypted until your wallet is linked.",
        icon: <Trophy className="text-cyan-400" size={24} />,
        target: "bottom-missions"
    },
    {
        id: "profile",
        title: "Digital Activation",
        description: "Finalize your identity. Connect your TON wallet here to activate your permanent BW ID and unlock full protocol features.",
        icon: <User className="text-cyan-400" size={24} />,
        target: "bottom-profile"
    }
];

interface EcosystemTourProps {
    isOpen: boolean;
    onComplete: () => void;
}

export default function EcosystemTour({ isOpen, onComplete }: EcosystemTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const step = TOUR_STEPS[currentStep];

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
                {/* Backdrop with "Spotlight" effect simulation */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                {/* Spotlight Overlay (CSS Masking simulation) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                        animate={{
                            scale: step.target === "center" ? 1.2 : 0.8,
                            x: step.target.includes("explore") ? "-20%" : step.target.includes("missions") ? "-10%" : step.target.includes("profile") ? "20%" : "0%",
                            y: step.target.includes("bottom") ? "40%" : "0%",
                        }}
                        transition={{ type: "spring", damping: 25, stiffness: 120 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full shadow-[0_0_0_2000px_rgba(0,0,0,0.4)] border-4 border-cyan-500/30"
                    />
                </div>

                {/* Tour Card */}
                <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="relative w-full max-w-sm bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(6,182,212,0.2)]"
                >
                    <div className="flex flex-col items-center text-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                            {step.icon}
                        </div>

                        <div>
                            <h3 className="text-white font-black text-xl uppercase tracking-tight">{step.title}</h3>
                            <p className="text-cyan-500/50 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">Protocol Initialization</p>
                        </div>

                        <p className="text-white/60 text-sm font-medium leading-relaxed">
                            {step.description}
                        </p>

                        <div className="w-full flex items-center justify-between mt-4">
                            <div className="flex gap-1.5">
                                {TOUR_STEPS.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? "w-8 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "w-3 bg-white/10"}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-cyan-400 transition-all active:scale-95 shadow-[0_4px_15px_rgba(6,182,212,0.3)] group"
                            >
                                {currentStep === TOUR_STEPS.length - 1 ? "Initialize" : "Next"}
                                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Skip button */}
                    <button
                        onClick={onComplete}
                        className="absolute top-4 right-4 p-2 text-white/20 hover:text-white/40 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
