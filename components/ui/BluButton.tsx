"use client";

import { useState, useRef, useEffect, useMemo, memo } from "react";
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
    
    //  Magnetic Snapping & Draggable States
    const [position, setPosition] = useState({ x: 8, y: 120 });
    const [isDragging, setIsDragging] = useState(false);
    const [isSnappedToLeft, setIsSnappedToLeft] = useState(true);
    
    const dragStart = useRef({ x: 0, y: 0 });
    const orbStart = useRef({ x: 0, y: 0 });
    const isDraggingDistance = useRef(0);

    // Initialize position ONLY once on fresh App Mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const initialY = window.innerHeight * 0.16;
            setPosition({ x: 8, y: initialY });
            setIsSnappedToLeft(true);
        }
    }, []);

    // Track screen resizing separately to preserve active session positions
    useEffect(() => {
        if (typeof window !== "undefined") {
            const handleResize = () => {
                setPosition(prev => {
                    const screenWidth = window.innerWidth;
                    const orbWidth = 48;
                    const padding = 8;
                    if (!isSnappedToLeft) {
                        return { x: screenWidth - orbWidth - padding, y: prev.y };
                    }
                    return prev;
                });
            };
            window.addEventListener("resize", handleResize);
            return () => window.removeEventListener("resize", handleResize);
        }
    }, [isSnappedToLeft]);

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        isDraggingDistance.current = 0;
        dragStart.current = { x: e.clientX, y: e.clientY };
        orbStart.current = { x: position.x, y: position.y };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        
        isDraggingDistance.current = Math.sqrt(dx * dx + dy * dy);
        
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const orbWidth = 48;
        
        const nextX = Math.max(4, Math.min(screenWidth - orbWidth - 4, orbStart.current.x + dx));
        const nextY = Math.max(60, Math.min(screenHeight - orbWidth - 100, orbStart.current.y + dy));
        
        setPosition({ x: nextX, y: nextY });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return;
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const orbWidth = 48;
        const padding = 8; 
        
        const snapLeft = position.x < (screenWidth - orbWidth) / 2;
        setIsSnappedToLeft(snapLeft);
        
        const snapX = snapLeft ? padding : screenWidth - orbWidth - padding;
        
        const minY = 80;
        const maxY = screenHeight - orbWidth - 120;
        const snapY = Math.max(minY, Math.min(maxY, position.y));
        
        setPosition({ x: snapX, y: snapY });
    };
    
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
            {/* 1. THE MINI ORB BUTTON (Circle + BLU Text - Magnetic & Draggable) */}
            <motion.div 
                animate={{ 
                    left: position.x, 
                    top: position.y 
                }} 
                transition={isDragging ? { type: "tween", duration: 0 } : { type: "spring", stiffness: 260, damping: 24 }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="fixed z-[85] select-none group touch-none"
                style={{ position: "fixed" }}
            >
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                    <motion.button
                        onClick={() => { 
                            if (!isAuthorized || isDraggingDistance.current > 6) return;
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
                            initial={{ opacity: 0, x: isSnappedToLeft ? -20 : 20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: isSnappedToLeft ? -20 : 20, scale: 0.95 }}
                            className={`absolute top-0 w-52 border border-white/10 bg-white/5 backdrop-blur-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[86] overflow-hidden ${
                                isSnappedToLeft 
                                    ? "left-16 rounded-[1.5rem] rounded-tl-none" 
                                    : "right-16 rounded-[1.5rem] rounded-tr-none"
                            }`}
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
            </motion.div>

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
                                <img 
                                    src="/cocoon_egg.webp" 
                                    alt="Cocoon" 
                                    loading="eager"
                                    className="w-5 h-6 object-contain filter drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-transform"
                                    onError={(e) => { (e.target as any).src = "https://cdn-icons-png.flaticon.com/512/3233/3233150.png" }}
                                />
                                <span className="text-[10px] font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                                    Cocoon
                                </span>
                            </motion.button>
                        </div>

                        {/* 🌌 BLU MATRIX RAIN (Activates on first message) */}
                        <AnimatePresence>
                            {messages.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1 }}
                                    className="absolute inset-0 pointer-events-none overflow-hidden z-0"
                                >
                                    <MatrixRain />
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
                                        src="/blu_image.webp" 
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
                            {/* Input Container (Single Row ChatGPT Style, supports image preview at top) */}
                            <div className="bg-white/5 border border-white/10 backdrop-blur-[40px] rounded-[2rem] p-1.5 pr-2 flex flex-col gap-2 shadow-2xl overflow-hidden">
                                {selectedImage && (
                                    <div className="flex pl-12 pt-2">
                                        <div className="relative inline-block">
                                            <img 
                                                src={selectedImage} 
                                                alt="Preview" 
                                                className="w-20 h-20 object-cover rounded-2xl border border-white/20 shadow-lg"
                                            />
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedImage(null);
                                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                                }}
                                                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white hover:bg-black transition-colors shadow-md z-10"
                                            >
                                                <X size={12} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 w-full">
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
                                        <Plus size={20} />
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

const MatrixRain = memo(function MatrixRain() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        // Bluewave character set: binary + hex + katakana + symbols
        const chars = "01アイウエオカキクケコサシスセソタチツテト◈⬡∞ΔABCDEF0123456789⬢◆▲♦><#@!";
        const fontSize = 11; // Smaller = more columns = fuller screen
        const cols = Math.floor(canvas.width / fontSize);

        // Each column starts at a random y position off-screen
        const drops: number[] = Array.from({ length: cols }, () => Math.random() * -100);

        // 🎨 Each column gets a random brand color palette
        const brandPalettes = [
            // Cyan column
            { head: "rgba(255,255,255,0.95)", body: "rgba(34,211,238,0.85)", mid: "rgba(34,211,238,0.5)", tail: "rgba(34,211,238,0.15)" },
            // Purple column  
            { head: "rgba(255,255,255,0.95)", body: "rgba(168,85,247,0.85)", mid: "rgba(168,85,247,0.5)", tail: "rgba(168,85,247,0.15)" },
            // Blue column
            { head: "rgba(255,255,255,0.95)", body: "rgba(59,130,246,0.85)", mid: "rgba(59,130,246,0.5)", tail: "rgba(59,130,246,0.15)" },
            // Cyan-purple mix
            { head: "rgba(255,255,255,0.95)", body: "rgba(99,102,241,0.85)", mid: "rgba(99,102,241,0.5)", tail: "rgba(99,102,241,0.15)" },
        ];

        // Assign each column a fixed random palette
        const colPalettes = Array.from({ length: cols }, () =>
            brandPalettes[Math.floor(Math.random() * brandPalettes.length)]
        );

        // Per-column speed variation — much faster cinematic Matrix-style rain
        const speeds = Array.from({ length: cols }, (_, i) => 1.2 + ((i * 7) % 9) / 6);

        let animId: number;
        const draw = () => {
            // Semi-transparent overlay creates the glowing trail fade
            ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const palette = colPalettes[i];
                const char = chars[Math.floor(Math.random() * chars.length)];
                const x = i * fontSize;
                const y = Math.floor(drops[i]) * fontSize;

                // Head character — bright white pop
                ctx.fillStyle = palette.head;
                ctx.shadowColor = palette.body;
                ctx.shadowBlur = 8;
                ctx.fillText(char, x, y);

                // Body (one char below head) — brand color, full opacity
                if (y > fontSize) {
                    ctx.fillStyle = palette.body;
                    ctx.shadowBlur = 4;
                    ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, y - fontSize);
                }

                ctx.shadowBlur = 0;

                drops[i] += speeds[i];

                // Reset when off screen
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.95) {
                    drops[i] = Math.random() * -20;
                }
            }

            animId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 0.55 }}
        />
    );
});
