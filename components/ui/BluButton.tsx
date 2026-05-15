"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, ArrowLeft, MessageSquare, Shield, Globe, Award, Wallet, Search, Sparkles, X, ChevronRight, Clock, Send, ChevronLeft, Terminal } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface Message {
    role: "user" | "blu";
    content: string;
    timestamp: string;
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

// Instant Display Component
const MessageDisplay = ({ text, onComplete }: { text: string, onComplete?: () => void }) => {
    useEffect(() => {
        const timeout = setTimeout(() => {
            onComplete?.();
        }, 5000);
        return () => clearTimeout(timeout);
    }, [text, onComplete]);

    return <span>{text}</span>;
};

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
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 🔒 Access Control Logic (Temporary for Development)
    // Locked to "Bluewave Core", "Beta Explorer" roles or Admin status
    const isAuthorized = useMemo(() => {
        const roles = telegramUser?.roles || [];
        return roles.includes("Bluewave Core") || roles.includes("Beta Explorer") || telegramUser?.is_admin;
    }, [telegramUser]);

    const firstName = telegramUser?.first_name || "there";

    useEffect(() => {
        if (hasGreetingBeenDismissed || isOpen) return;
        const timer = setTimeout(() => { setShowGreeting(true); }, 1500);
        return () => clearTimeout(timer);
    }, [isOpen, hasGreetingBeenDismissed]);

    useEffect(() => {
        if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const isNewUser = useMemo(() => {
        if (!telegramUser?.joined_at) return true;
        const joinedDate = new Date(telegramUser.joined_at).getTime();
        const fortyEightHours = 48 * 60 * 60 * 1000;
        return (Date.now() - joinedDate < fortyEightHours) || !telegramUser?.wallet_address;
    }, [telegramUser]);

    const greetingMessage = useMemo(() => {
        if (isNewUser) {
            return `🌊 Welcome to the Wave, ${firstName}! I am Blu, your presence assistant.`;
        }

        const hasSocial = socialMissionCount > 0;
        const hasPresence = presenceMissionCount > 0;

        if (hasSocial && hasPresence) {
            return `🌊 Welcome back, ${firstName}. You have ${presenceMissionCount} presence and ${socialMissionCount} social missions pending.`;
        } else if (hasPresence) {
            return `🌊 Welcome back, ${firstName}. Your presence signals need activation (${presenceMissionCount}).`;
        } else if (hasSocial) {
            return `🌊 Welcome back, ${firstName}. New opportunities available in social center.`;
        }
        return `🌊 Welcome back, ${firstName}. All your signals are currently synchronized.`;
    }, [firstName, isNewUser, socialMissionCount, presenceMissionCount]);

    const [isGuideStarted, setIsGuideStarted] = useState(false);

    const startGuide = () => {
        if (isGuideStarted) return;
        setIsGuideStarted(true);
        setIsLoading(true);

        const steps = [
            { content: `Welcome to the Wave, ${firstName}! I'm Blu. To start your journey, first go to your **Profile** and connect your **TON Wallet**. This is essential for your $BWAVE rewards.`, delay: 500 },
            { content: `Next, open the **Mission Center** and go to the **Presence Tab**. Activate your 1h, 4h, or 24h signals. The more you sync, the more points you earn!`, delay: 2500 },
            { content: `Want to stack points faster? Complete **Social Missions** in the Social tab. Every follow and share counts towards your reputation.`, delay: 4500 },
            { content: `Keep an eye on the **Explore Tab** to see the Leaderboard. Watch your rank climb as you stay active in the ecosystem!`, delay: 6500 },
            { content: `PRO TIP: Tap the **3 dots** on your Profile to see **Ecosystem Roles**. Be active in our community to earn roles that multiply your rewards! 🚀`, delay: 8500 }
        ];

        steps.forEach((step, i) => {
            setTimeout(() => {
                setMessages(prev => [...prev, { 
                    role: "blu", 
                    content: step.content,
                    timestamp: new Date().toLocaleTimeString()
                }]);
                if (i === steps.length - 1) setIsLoading(false);
            }, step.delay);
        });
    };

    useEffect(() => {
        if (isOpen && isNewUser && !isGuideStarted && messages.length === 0) {
            startGuide();
        }
    }, [isOpen, isNewUser, isGuideStarted]);

    useEffect(() => {
        if (isOpen && messages.length === 0 && !isNewUser) {
            setMessages([{ 
                role: "blu", 
                content: greetingMessage,
                timestamp: new Date().toLocaleTimeString()
            }]);
        }
    }, [isOpen, greetingMessage, isNewUser, messages.length]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        
        if (!isExpanded) onToggleExpand?.(true);
        setIsOpen(true);
        setShowGreeting(false);
        setHasGreetingBeenDismissed(true);
        
        const userMsg = inputValue.trim();
        setInputValue("");
        setMessages(prev => [...prev, { role: "user", content: userMsg, timestamp: new Date().toLocaleTimeString() }]);
        
        setIsLoading(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { 
                role: "blu", 
                content: "I'm processing that for you. Bluewave nodes are currently syncing your request.",
                timestamp: new Date().toLocaleTimeString()
            }]);
            setIsLoading(false);
        }, 8000); 
    };

    const handleQuickAction = (text: string, action?: () => void) => {
        if (action) {
            action();
            return;
        }
        setInputValue(text);
    };

    return (
        <>
            {/* 1. THE MINI AGENT CARD (Redesigned Small UI) */}
            <div className="fixed z-[85] top-[18%] left-2 select-none group">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative flex flex-col items-center gap-2"
                >
                    {/* Access Indicator (Only visible to you) */}
                    {isAuthorized && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,246,255,0.8)] z-10 animate-pulse" />
                    )}

                    <motion.button
                        onClick={() => { 
                            if (!isAuthorized) return; // 🔒 Locked for others
                            setIsOpen(true); 
                            setShowGreeting(false); 
                            setHasGreetingBeenDismissed(true);
                        }}
                        whileHover={isAuthorized ? { scale: 1.05 } : {}}
                        whileTap={isAuthorized ? { scale: 0.95 } : {}}
                        className={`relative w-12 h-12 rounded-2xl border backdrop-blur-3xl bg-black/40 flex items-center justify-center overflow-hidden transition-all duration-500 shadow-2xl ${
                            isAuthorized 
                                ? "border-cyan-500/30 group-hover:border-cyan-500/60" 
                                : "border-white/5 opacity-80 cursor-default"
                        }`}
                    >
                        {/* Animated Liquid Interior */}
                        {isAuthorized && (
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(0,246,255,0.05)_180deg,transparent_360deg)]"
                            />
                        )}
                        
                        {/* The Core Icon */}
                        <div className={`relative transition-all duration-500 ${isAuthorized ? "text-cyan-400 group-hover:scale-110" : "text-white/20"}`}>
                            <Sparkles size={20} strokeWidth={isAuthorized ? 2.5 : 1.5} />
                        </div>
                        
                        {/* Glow Pulse */}
                        {isAuthorized && (
                            <motion.div 
                                animate={{ opacity: [0.1, 0.3, 0.1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute inset-0 bg-cyan-500/5 blur-xl"
                            />
                        )}
                    </motion.button>
                    
                    {/* Status Label */}
                    <span className={`text-[6px] font-black tracking-[0.3em] uppercase transition-colors ${isAuthorized ? "text-cyan-500/60" : "text-white/10"}`}>
                        {isAuthorized ? "Agent Online" : "System Standby"}
                    </span>
                </motion.div>

                {/* 2. THE TYPEWRITER BUBBLE (Available to Everyone) */}
                <AnimatePresence>
                    {showGreeting && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -10, scale: 0.95 }}
                            className="absolute left-16 top-0 w-60 p-4 rounded-3xl rounded-tl-none bg-black/80 border border-white/10 backdrop-blur-3xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-[86]"
                        >
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                                    <MessageSquare size={12} className="text-cyan-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[11px] text-white/90 leading-relaxed font-medium">
                                        <MessageDisplay 
                                            text={greetingMessage} 
                                            onComplete={() => {
                                                setShowGreeting(false);
                                                setHasGreetingBeenDismissed(true);
                                            }} 
                                        />
                                    </p>
                                    <div className="mt-3 flex justify-end">
                                        <button 
                                            onClick={() => {
                                                setShowGreeting(false);
                                                setHasGreetingBeenDismissed(true);
                                            }} 
                                            className="text-[9px] font-black text-cyan-400/60 uppercase tracking-widest hover:text-cyan-400 transition-colors"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 3. THE HOLOGRAPHIC COMMAND CENTER */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                            className="fixed inset-0 z-[86] backdrop-blur-xl bg-black/40" onClick={() => { setIsOpen(false); onToggleExpand?.(false); }} />

                        <motion.div
                            layoutId="blu-panel"
                            className={`fixed z-[87] flex flex-col backdrop-blur-[40px] bg-black/60 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden
                                ${isExpanded 
                                    ? "inset-0 w-full h-full rounded-none border-none" 
                                    : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-sm h-[60vh] rounded-[3rem]"
                                }`}
                        >
                            {/* Ambient Background Mesh */}
                            <div className="absolute inset-0 pointer-events-none opacity-30">
                                <div className="absolute top-[-20%] right-[-20%] w-full h-full bg-[radial-gradient(circle,rgba(0,246,255,0.2),transparent_70%)]" />
                                <div className="absolute bottom-[-20%] left-[-20%] w-full h-full bg-[radial-gradient(circle,rgba(123,47,190,0.15),transparent_70%)]" />
                            </div>

                            {/* Header (Only for Small Mode) */}
                            {!isExpanded && (
                                <div className="relative z-20 flex items-center justify-between px-8 py-6 bg-black/20 border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(0,246,255,0.8)]" />
                                        <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em]">Blu Terminal</span>
                                    </div>
                                    <button onClick={() => { setIsOpen(false); onToggleExpand?.(false); }} className="p-2 text-white/20 hover:text-white transition-colors"><X size={20} /></button>
                                </div>
                            )}

                            {/* Scroll Area */}
                            <div 
                                className={`relative z-10 flex-1 overflow-y-auto px-8 pb-32 flex flex-col gap-8
                                    ${isExpanded ? "pt-[200px]" : "pt-8"}`}
                                style={isExpanded ? { paddingTop: "max(200px, env(safe-area-inset-top, 0px) + 160px)" } : {}}
                            >
                                {/* Welcome Card */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-cyan-400/60 mb-2">
                                        <Terminal size={12} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Authorized Access</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-white tracking-tighter leading-none">
                                        Welcome back, <br/>
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{firstName}</span>.
                                    </h2>
                                    
                                    {/* Action Pills */}
                                    <div className="flex flex-col gap-3 pt-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <QuickActionPill 
                                                icon={<Globe size={16} />} 
                                                label="PresenceFi" 
                                                onClick={() => handleQuickAction("Explain PresenceFi")}
                                            />
                                            <QuickActionPill 
                                                icon={<Award size={16} />} 
                                                label="Missions" 
                                                onClick={() => window.dispatchEvent(new CustomEvent("setActiveTab", { detail: "missions" }))}
                                            />
                                        </div>
                                        <QuickActionPill 
                                            icon={<img src="/cocoon_egg.png" alt="🥚" className="w-5 h-6 object-contain" onError={(e) => { (e.target as any).src = "https://cdn-icons-png.flaticon.com/512/3233/3233150.png" }} />} 
                                            label="Cocoon Network Experience" 
                                            color="border-purple-500/20 text-purple-400 bg-purple-500/5"
                                            onClick={onOpenCocoon}
                                        />
                                        <QuickActionPill 
                                            icon={<Wallet size={16} />} 
                                            label="Financial Assets" 
                                            onClick={() => window.dispatchEvent(new CustomEvent("setActiveTab", { detail: "profile" }))}
                                        />
                                    </div>
                                </div>

                                {/* Message Thread */}
                                {messages.map((msg, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={idx} 
                                        className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed border backdrop-blur-md
                                            ${msg.role === "user" 
                                                ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-50 rounded-br-none shadow-[0_8px_32px_rgba(0,246,255,0.05)]" 
                                                : "bg-white/5 border-white/10 text-white/70 rounded-bl-none"
                                            }`}
                                        >
                                            {msg.content}
                                        </div>
                                    </motion.div>
                                ))}
                                
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-1">
                                            <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                            <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                            <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* 4. FLOATING INPUT */}
                            <div className="absolute bottom-6 left-0 right-0 px-8 z-20">
                                <motion.form 
                                    onSubmit={handleSendMessage}
                                    className="relative max-w-lg mx-auto"
                                >
                                    <div className="absolute inset-0 bg-cyan-400/5 blur-3xl rounded-full pointer-events-none" />
                                    <input 
                                        type="text" 
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Command Blu..." 
                                        className="w-full bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[2.5rem] px-8 py-5 text-sm text-white focus:border-cyan-500/50 outline-none transition-all shadow-[0_8px_40px_rgba(0,0,0,0.4)] pr-16" 
                                    />
                                    <button 
                                        type="submit" 
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-cyan-500 text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
                                    >
                                        <Send size={18} />
                                    </button>
                                </motion.form>
                            </div>
                        </motion.div>

                        {/* 5. THE HANGING ARROW (History Trigger) */}
                        {isExpanded && (
                            <motion.button
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                onClick={() => setIsHistoryOpen(true)}
                                className="fixed left-0 top-[25%] z-[90] w-10 h-24 bg-white/5 backdrop-blur-2xl border border-white/10 border-l-0 rounded-r-[2rem] flex items-center justify-center group shadow-xl"
                            >
                                <ChevronRight size={20} className="text-white/40 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                            </motion.button>
                        )}

                        {/* 6. HISTORY DRAWER */}
                        <AnimatePresence>
                            {isHistoryOpen && (
                                <>
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md" onClick={() => setIsHistoryOpen(false)} />
                                    <motion.div
                                        initial={{ x: "-100%" }}
                                        animate={{ x: 0 }}
                                        exit={{ x: "-100%" }}
                                        transition={{ type: "spring", damping: 30, stiffness: 200 }}
                                        className="fixed z-[101] left-0 top-0 bottom-0 w-1/2 max-w-sm bg-black/90 border-r border-white/10 backdrop-blur-[80px] p-10 pt-[180px] flex flex-col shadow-2xl"
                                    >
                                        <div className="flex items-center justify-between mb-12">
                                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.5em]">Archives</span>
                                            <button onClick={() => setIsHistoryOpen(false)} className="p-2 text-white/20 transition-colors hover:text-white"><ChevronLeft size={24} /></button>
                                        </div>
                                        
                                        <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                                            <HistoryItem date="Today" items={["PresenceFi Strategy", "Cocoon Nodes"]} />
                                            <HistoryItem date="Yesterday" items={["Wallet Recovery Flow", "Mission Multipliers"]} />
                                        </div>

                                        <button className="mt-10 py-5 border border-white/10 rounded-[2rem] text-[10px] font-black uppercase text-white/30 tracking-widest hover:text-cyan-400 hover:border-cyan-500/30 transition-all">
                                            Clear All Archives
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

function QuickActionPill({ icon, label, onClick, color }: { icon: any, label: string, onClick?: () => void, color?: string }) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-3 p-5 rounded-[2rem] border transition-all hover:bg-white/5 active:scale-95 ${color || "border-white/10 text-white/60"}`}
        >
            <div className="shrink-0">{icon}</div>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{label}</span>
        </button>
    );
}

function HistoryItem({ date, items }: { date: string, items: string[] }) {
    return (
        <div className="space-y-4">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{date}</span>
            {items.map((item, i) => (
                <button key={i} className="w-full text-left p-5 rounded-[2rem] bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all group">
                    <span className="text-xs text-white/70 font-medium block truncate group-hover:text-white">{item}</span>
                </button>
            ))}
        </div>
    );
}
