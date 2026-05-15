"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Award, Wallet, Sparkles, Send, Terminal, Plus, Mic, ChevronDown, LayoutGrid, Image as ImageIcon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface Message {
    role: "user" | "blu";
    content: string;
    timestamp: string;
    image?: string;
}

interface BluButtonProps {
    isExpanded?: boolean;
    onToggleExpand?: (expanded: boolean) => void;
    telegramUser: any;
    balance: number | null;
    pendingMissionCount?: number;
    socialMissionCount?: number;
    presenceMissionCount?: number;
    onOpenCocoon?: () => void;
}

export default function BluButton({ 
    isExpanded = false,
    onToggleExpand,
    telegramUser, 
    balance,
    pendingMissionCount = 0,
    socialMissionCount = 0,
    presenceMissionCount = 0,
    onOpenCocoon
}: BluButtonProps) {
    const { theme } = useTheme();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showGreeting, setShowGreeting] = useState(false);
    const [hasGreetingBeenDismissed, setHasGreetingBeenDismissed] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 🔓 Access Control Logic: Now open to everyone
    const isAuthorized = true;

    const firstName = telegramUser?.first_name || "there";

    useEffect(() => {
        if (hasGreetingBeenDismissed || isExpanded) return;
        const timer = setTimeout(() => { setShowGreeting(true); }, 1500);
        return () => clearTimeout(timer);
    }, [isExpanded, hasGreetingBeenDismissed]);

    // 🕒 Auto-dismiss bubble after 10 seconds
    useEffect(() => {
        if (showGreeting) {
            const timer = setTimeout(() => {
                setShowGreeting(false);
                setHasGreetingBeenDismissed(true);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [showGreeting]);

    // Navigation is now handled globally via isExpanded prop and LandingPage.tsx Back Button logic.

    useEffect(() => {
        if (isExpanded) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isExpanded]);

    const greetingMessage = useMemo(() => {
        const hasSocial = socialMissionCount > 0;
        const hasPresence = presenceMissionCount > 0;

        if (hasSocial && hasPresence) {
            return `Missions pending in Presence & Social tabs.`;
        } else if (hasPresence) {
            return `Check the Presence tab—signals need activation.`;
        } else if (hasSocial) {
            return `New missions available in the Social tab.`;
        }
        return `Everything is operational. How can I assist you?`;
    }, [socialMissionCount, presenceMissionCount]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() && !selectedImage) return;
        
        const userMsg = inputValue.trim();
        setInputValue("");
        setMessages(prev => [...prev, { 
            role: "user", 
            content: userMsg, 
            image: selectedImage || undefined,
            timestamp: new Date().toLocaleTimeString() 
        }]);
        
        setSelectedImage(null);
        setIsLoading(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { 
                role: "blu", 
                content: "Processing your request through the Bluewave nodes. Please stand by...",
                timestamp: new Date().toLocaleTimeString()
            }]);
            setIsLoading(false);
        }, 3000); 
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSelectedImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <>
            {/* 1. THE MINI ORB BUTTON (Circle + BLU Text) */}
            <div className="fixed z-[85] top-[16%] left-2 select-none group">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <motion.button
                        onClick={() => { 
                            if (!isAuthorized) return;
                            onToggleExpand?.(true); 
                            setShowGreeting(false); 
                            setHasGreetingBeenDismissed(true);
                        }}
                        whileHover={isAuthorized ? { scale: 1.1, boxShadow: "0 0 20px rgba(6, 182, 212, 0.3)" } : {}}
                        whileTap={isAuthorized ? { scale: 0.95 } : {}}
                        className={`relative w-12 h-12 rounded-full border backdrop-blur-3xl bg-black/40 flex items-center justify-center overflow-hidden transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.6)] ${
                            isAuthorized 
                                ? "border-cyan-500/40 group-hover:border-cyan-400" 
                                : "border-white/5 opacity-50 cursor-default"
                        }`}
                    >
                        {/* Internal Liquid Orb Animation (Minimal) */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div 
                                animate={{ 
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 180, 360],
                                    opacity: [0.3, 0.6, 0.3]
                                }}
                                transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                                className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 blur-xl opacity-20"
                            />
                        </div>
                        
                        <span className={`relative text-[8px] font-black tracking-[0.3em] transition-colors ${isAuthorized ? "text-cyan-300 group-hover:text-white drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "text-white/20"}`}>
                            BLU
                        </span>

                        {/* Outer Atmospheric Glow */}
                        {isAuthorized && (
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute inset-0 bg-cyan-400/20 blur-2xl -z-10"
                            />
                        )}
                    </motion.button>
                </motion.div>

                {/* Mini Greeting Bubble */}
                <AnimatePresence>
                    {showGreeting && (
                        <motion.div 
                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -20, scale: 0.95 }}
                            className="absolute left-16 top-0 w-52 rounded-[1.5rem] rounded-tl-none border border-white/10 bg-white/5 backdrop-blur-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[86] overflow-hidden"
                        >
                            <div className="relative p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                    <span className="text-[8px] font-black text-cyan-400/60 uppercase tracking-widest">Blu Intelligence</span>
                                </div>
                                <p className="text-[10px] text-white/90 leading-snug font-medium">
                                    {greetingMessage}
                                </p>
                                <button onClick={() => { setShowGreeting(false); setHasGreetingBeenDismissed(true); }} className="text-[8px] font-bold text-white/30 uppercase tracking-widest hover:text-white transition-colors">
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 2. FULL SCREEN COCOON-STYLE COMMAND CENTER */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black flex flex-col overflow-hidden"
                    >
                        {/* Slim Cocoon Dynamic Island (Top Navigation) - Lowered by 20pt total */}
                        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[101]">
                            <motion.button 
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                onClick={() => {
                                    console.log("Cocoon Pill Clicked");
                                    onOpenCocoon?.();
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl hover:bg-white/10 transition-all group"
                            >
                                <div className="relative w-5 h-6 overflow-hidden">
                                    <img 
                                        src="/cocoon_egg.png" 
                                        alt="Cocoon" 
                                        loading="eager"
                                        className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-transform"
                                        onError={(e) => { (e.target as any).src = "https://cdn-icons-png.flaticon.com/512/3233/3233150.png" }}
                                    />
                                </div>
                                <span className="text-[10px] font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                                    Cocoon
                                </span>
                            </motion.button>
                        </div>

                        {/* 🌌 ZERO-GRAVITY PARTICLE SYSTEM (Activates on first message) */}
                        <AnimatePresence>
                            {messages.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 pointer-events-none overflow-hidden z-0"
                                >
                                    {[...Array(25)].map((_, i) => (
                                        <FloatingShape key={i} index={i} />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Background Ambient Glows */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-cyan-500/5 blur-[120px] rounded-full" />
                            <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-purple-500/5 blur-[100px] rounded-full" />
                        </div>

                        {/* Main Content Area (Subtle blur when chatting) */}
                        <motion.div 
                            animate={{ 
                                filter: messages.length > 0 ? "blur(4px)" : "blur(0px)",
                                opacity: messages.length > 0 ? 0.8 : 1,
                            }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="flex-1 flex flex-col items-center justify-center px-8 relative z-10 pt-20"
                        >
                            
                            {/* The Central Asset */}
                            <div className="relative mb-12">
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="relative w-48 h-48 flex items-center justify-center"
                                >
                                    <div className="absolute inset-0 bg-cyan-500/5 blur-[60px] rounded-full animate-pulse" />
                                    <img 
                                        src="/blu_image.png" 
                                        alt="Blu" 
                                        loading="eager"
                                        className="w-40 h-40 object-contain relative z-20"
                                        onError={(e) => { (e.target as any).src = "https://cdn-icons-png.flaticon.com/512/3233/3233150.png" }}
                                    />
                                </motion.div>
                            </div>

                            {/* Welcome Text */}
                            <div className="text-center space-y-3 mb-12">
                                <motion.h1 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-3xl font-black text-white tracking-tighter"
                                >
                                    Hello, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Blu</span>
                                </motion.h1>
                                <motion.p 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-white/40 text-sm font-medium tracking-wide uppercase text-[10px] tracking-[0.2em]"
                                >
                                    Bluewave intelligence agent
                                </motion.p>
                            </div>
                        </motion.div>

                        {/* Chat View (Stays focused/clear) */}
                        <AnimatePresence>
                            {messages.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 pt-[400px] pb-40 px-6 overflow-y-auto z-20 flex flex-col gap-6 custom-scrollbar"
                                >
                                    {messages.map((msg, idx) => (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={idx} 
                                            className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed border backdrop-blur-md
                                                ${msg.role === "user" 
                                                    ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-50 rounded-br-none" 
                                                    : "bg-white/5 border-white/10 text-white/70 rounded-bl-none"
                                                }`}
                                            >
                                                {msg.image && (
                                                    <img src={msg.image} alt="User Upload" className="mb-3 rounded-xl w-full object-cover max-h-40" />
                                                )}
                                                {msg.content}
                                            </div>
                                        </motion.div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* REDESIGNED TACTICAL INPUT BAR */}
                        <div className="mt-auto px-6 pb-10 relative z-30">
                            {/* Input Container (Single Row ChatGPT Style) */}
                            <div className="bg-white/5 border border-white/10 backdrop-blur-[40px] rounded-[2rem] p-1.5 pr-2 flex items-center gap-2 shadow-2xl overflow-hidden">
                                {/* Hidden File Input */}
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    accept="image/*"
                                />

                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${selectedImage ? "text-cyan-400 bg-cyan-400/10" : "text-white/20 hover:text-white/40 hover:bg-white/5"}`}
                                >
                                    {selectedImage ? <ImageIcon size={18} /> : <Plus size={20} />}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <input 
                                        type="text" 
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Ask Blu anything..." 
                                        className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-white/20 py-2"
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e as any)}
                                    />
                                </div>

                                <button 
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim() && !selectedImage}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                        (inputValue.trim() || selectedImage)
                                            ? "bg-gradient-to-br from-cyan-400 to-blue-600 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]" 
                                            : "bg-white/5 text-white/10"
                                    }`}
                                >
                                    <Send size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function ToolButton({ icon }: { icon: any }) {
    return (
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:bg-white/5 transition-colors">
            {icon}
        </button>
    );
}

function ToolPill({ icon, label }: { icon: any, label: string }) {
    return (
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white/50 uppercase tracking-widest hover:bg-white/10 transition-colors">
            {icon}
            <span>{label}</span>
            <ChevronDown size={10} className="opacity-40" />
        </button>
    );
}

function FloatingShape({ index }: { index: number }) {
    // Seeded values based on index — avoids Math.random() in render (SSR safe)
    const seed = (n: number) => ((index * 9301 + n * 49297 + 233995) % 1000) / 1000;

    const size = seed(1) * 28 + 6; // 6-34px
    const duration = seed(2) * 7 + 8; // 8-15s (fast)
    const shapeType = index % 3; // 0: Circle, 1: Square, 2: Triangle

    const colors = [
        "rgba(34, 211, 238, 0.25)",  // Cyan
        "rgba(168, 85, 247, 0.25)",  // Purple
        "rgba(59, 130, 246, 0.25)",  // Blue
        "rgba(255, 255, 255, 0.2)",  // White
    ];
    const color = colors[index % colors.length];

    // Spread particles across the full viewport using deterministic seed values
    const x0 = seed(3) * 100;
    const y0 = seed(4) * 100;
    const x1 = seed(5) * 100;
    const y1 = seed(6) * 100;
    const x2 = seed(7) * 100;
    const y2 = seed(8) * 100;

    return (
        <motion.div
            initial={{ x: `${x0}vw`, y: `${y0}vh`, opacity: 0, rotate: 0 }}
            animate={{
                x: [`${x0}vw`, `${x1}vw`, `${x2}vw`, `${x0}vw`],
                y: [`${y0}vh`, `${y1}vh`, `${y2}vh`, `${y0}vh`],
                opacity: [0.15, 0.45, 0.25, 0.15],
                rotate: [0, 120, 240, 360],
            }}
            transition={{
                duration,
                repeat: Infinity,
                ease: "linear",
                delay: seed(9) * 5, // staggered starts
            }}
            style={{
                position: "absolute",
                width: size,
                height: size,
                backgroundColor: shapeType !== 2 ? color : "transparent",
                borderRadius: shapeType === 0 ? "50%" : "3px",
                filter: "blur(1px)",
                border: shapeType !== 0 ? `1.5px solid ${color}` : "none",
                clipPath: shapeType === 2 ? "polygon(50% 0%, 0% 100%, 100% 100%)" : "none",
            }}
        />
    );
}
