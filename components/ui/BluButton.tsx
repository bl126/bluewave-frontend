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
    const [isOpen, setIsOpen] = useState(false);
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
        if (hasGreetingBeenDismissed || isOpen) return;
        const timer = setTimeout(() => { setShowGreeting(true); }, 1500);
        return () => clearTimeout(timer);
    }, [isOpen, hasGreetingBeenDismissed]);

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

    // 📱 Telegram Back Button Integration
    useEffect(() => {
        const tg = (window as any).Telegram?.WebApp;
        if (!tg) return;

        if (isOpen) {
            tg.BackButton.show();
            tg.BackButton.onClick(() => {
                setIsOpen(false);
            });
        } else {
            tg.BackButton.hide();
        }

        return () => {
            tg.BackButton.offClick();
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

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
                            setIsOpen(true); 
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
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black flex flex-col overflow-hidden"
                    >
                        {/* Slim Cocoon Dynamic Island (Top Navigation) - Lowered by 10pt */}
                        <div className="absolute top-9 left-1/2 -translate-x-1/2 z-[101]">
                            <motion.button 
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                onClick={onOpenCocoon}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl hover:bg-white/10 transition-all group"
                            >
                                <div className="relative w-5 h-6 overflow-hidden">
                                    <img 
                                        src="/cocoon_egg.png" 
                                        alt="Cocoon" 
                                        className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-transform"
                                        onError={(e) => { (e.target as any).src = "https://cdn-icons-png.flaticon.com/512/3233/3233150.png" }}
                                    />
                                </div>
                                <span className="text-[10px] font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                                    Cocoon
                                </span>
                            </motion.button>
                        </div>

                        {/* Background Ambient Glows */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-cyan-500/5 blur-[120px] rounded-full" />
                            <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-purple-500/5 blur-[100px] rounded-full" />
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10 pt-20">
                            
                            {/* The Central Asset (Replaced Orb with blu_image.png) */}
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
                                    className="text-white/40 text-sm font-medium tracking-wide"
                                >
                                    Your AI agent for everything
                                </motion.p>
                            </div>

                            {/* Chat View (Only if messages exist) */}
                            {messages.length > 0 && (
                                <div className="absolute inset-0 pt-[400px] pb-40 px-6 overflow-y-auto z-20 flex flex-col gap-6 custom-scrollbar">
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
                                </div>
                            )}
                        </div>

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
