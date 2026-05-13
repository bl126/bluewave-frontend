"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, ArrowLeft, MessageSquare, Shield, Globe, Award, Wallet, Search, Sparkles, X, ChevronRight, Clock, Send, ChevronLeft } from "lucide-react";
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

// Advanced Typewriter with Deletion (Backspacing) support
const Typewriter = ({ text, onComplete }: { text: string, onComplete?: () => void }) => {
    const [currentText, setCurrentText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!isDeleting && index < text.length) {
            const timeout = setTimeout(() => {
                setCurrentText(prev => prev + text[index]);
                setIndex(prev => prev + 1);
            }, 20);
            return () => clearTimeout(timeout);
        } else if (!isDeleting && index === text.length) {
            // Hold for 3 seconds then start deleting
            const timeout = setTimeout(() => setIsDeleting(true), 3000);
            return () => clearTimeout(timeout);
        } else if (isDeleting && currentText.length > 0) {
            const timeout = setTimeout(() => {
                setCurrentText(prev => prev.slice(0, -1));
            }, 20);
            return () => clearTimeout(timeout);
        } else if (isDeleting && currentText.length === 0) {
            onComplete?.();
        }
    }, [index, text, isDeleting, currentText, onComplete]);

    return <span>{currentText}</span>;
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
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const firstName = telegramUser?.first_name || "there";

    useEffect(() => {
        const timer = setTimeout(() => { if (!isOpen) setShowGreeting(true); }, 1000);
        return () => clearTimeout(timer);
    }, [isOpen]);

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
            return `🌊 Welcome to the Wave, ${firstName}! Tap me to see how PresenceFi works.`;
        }

        const hasSocial = socialMissionCount > 0;
        const hasPresence = presenceMissionCount > 0;

        if (hasSocial && hasPresence) {
            return `🌊 Welcome back, ${firstName}. You have ${presenceMissionCount} presence mission${presenceMissionCount > 1 ? 's' : ''} and ${socialMissionCount} social mission${socialMissionCount > 1 ? 's' : ''} to complete.`;
        } else if (hasPresence) {
            return `🌊 Welcome back, ${firstName}. You have ${presenceMissionCount} presence mission${presenceMissionCount > 1 ? 's' : ''} to activate.`;
        } else if (hasSocial) {
            return `🌊 Welcome back, ${firstName}. You have ${socialMissionCount} mission${socialMissionCount > 1 ? 's' : ''} in the social tab to complete.`;
        }
        return `🌊 Welcome back, ${firstName}. All your Presence signals are active.`;
    }, [firstName, isNewUser, socialMissionCount, presenceMissionCount]);

    const [isGuideStarted, setIsGuideStarted] = useState(false);

    const startGuide = () => {
        if (isGuideStarted) return;
        setIsGuideStarted(true);
        setIsLoading(true);

        const steps = [
            { content: `Welcome to the Wave, ${firstName}! I'm Blu. To start your journey, first go to your **Profile** and connect your **TON Wallet**. This is essential for your $BWAVE rewards.`, delay: 1000 },
            { content: `Next, open the **Mission Center** and go to the **Presence Tab**. Activate your 1h, 4h, or 24h signals. The more you sync, the more points you earn!`, delay: 5000 },
            { content: `Want to stack points faster? Complete **Social Missions** in the Social tab. Every follow and share counts towards your reputation.`, delay: 9000 },
            { content: `Keep an eye on the **Explore Tab** to see the Leaderboard. Watch your rank climb as you stay active in the ecosystem!`, delay: 13000 },
            { content: `PRO TIP: Tap the **3 dots** on your Profile to see **Ecosystem Roles**. Be active in our community to earn roles that multiply your rewards! 🚀`, delay: 17000 }
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

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        
        if (!isExpanded) onToggleExpand?.(true);
        setIsOpen(true);
        
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
        }, 8000); // Dramatic wait
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
            {/* 1. THE MINI ORB (Shrunken & Liquid Glass) */}
            <div className="fixed z-[85] top-[18%] left-2 select-none">
                <motion.button
                    onClick={() => { setIsOpen(true); setShowGreeting(false); }}
                    whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(0, 246, 255, 0.4)" }}
                    whileTap={{ scale: 0.9 }}
                    className="relative w-11 h-11 rounded-full border border-cyan-500/30 backdrop-blur-3xl bg-black/40 flex items-center justify-center overflow-hidden group"
                >
                    {/* Animated Liquid Interior */}
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(0,246,255,0.1)_180deg,transparent_360deg)]"
                    />
                    <span className="relative text-[8px] font-black tracking-[0.2em] text-cyan-400 group-hover:text-cyan-200 transition-colors">BLU</span>
                    
                    {/* Glow Pulse */}
                    <motion.div 
                        animate={{ opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-cyan-500/10 blur-xl"
                    />
                </motion.button>

                {/* 2. THE TYPEWRITER BUBBLE */}
                <AnimatePresence>
                    {showGreeting && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -10, scale: 0.9 }}
                            className="absolute left-14 top-0 w-56 p-4 rounded-2xl rounded-tl-none bg-black/60 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-[86]"
                        >
                            <p className="text-[11px] text-cyan-50/90 leading-relaxed font-medium">
                                <Typewriter 
                                    text={greetingMessage} 
                                    onComplete={() => setShowGreeting(false)} 
                                />
                            </p>
                            <div className="mt-3 flex justify-end">
                                <button onClick={() => setShowGreeting(false)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest hover:bg-white/10 transition-colors">Dismiss</button>
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
                            className={`fixed z-[87] flex flex-col backdrop-blur-[40px] bg-black/40 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden
                                ${isExpanded 
                                    ? "inset-0 w-full h-full rounded-none border-none" 
                                    : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-sm h-[75vh] rounded-[2.5rem]"
                                }`}
                        >
                            {/* Ambient Background Mesh */}
                            <div className="absolute inset-0 pointer-events-none opacity-20">
                                <div className="absolute top-[-20%] right-[-20%] w-full h-full bg-[radial-gradient(circle,rgba(0,246,255,0.15),transparent_70%)]" />
                                <div className="absolute bottom-[-20%] left-[-20%] w-full h-full bg-[radial-gradient(circle,rgba(123,47,190,0.1),transparent_70%)]" />
                            </div>

                            {/* Header (Only for Small Mode) */}
                            {!isExpanded && (
                                <div className="relative z-20 flex items-center justify-between px-6 py-5 bg-black/20 border-b border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Blu OS v2.1</span>
                                    </div>
                                    <button onClick={() => { setIsOpen(false); onToggleExpand?.(false); }} className="p-2 text-white/20 hover:text-white"><X size={18} /></button>
                                </div>
                            )}

                            {/* Scroll Area */}
                            <div className={`relative z-10 flex-1 overflow-y-auto px-6 pb-32 flex flex-col gap-6
                                ${isExpanded ? "pt-[160px]" : "pt-6"}`}>
                                {/* Welcome Card */}
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-black text-white tracking-tighter">
                                        Good evening, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{firstName}</span>.
                                    </h2>
                                    
                                    {/* Action Pills */}
                                    <div className="flex flex-col gap-3">
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
                                            label="Wallet & Financial Assets" 
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
                                        <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed border backdrop-blur-md
                                            ${msg.role === "user" 
                                                ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-50 rounded-br-none" 
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

                            {/* 4. FLOATING INPUT (ChatGPT Style) */}
                            <div className="absolute bottom-5 left-0 right-0 px-6 z-20">
                                <motion.form 
                                    onSubmit={handleSendMessage}
                                    className="relative max-w-lg mx-auto"
                                >
                                    <div className="absolute inset-0 bg-cyan-400/5 blur-2xl rounded-full pointer-events-none" />
                                    <input 
                                        type="text" 
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Message Blu..." 
                                        className="w-full bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[2rem] px-6 py-4 text-sm text-white focus:border-cyan-500/50 outline-none transition-all shadow-[0_8px_32px_rgba(0,0,0,0.3)] pr-14" 
                                    />
                                    <button 
                                        type="submit" 
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-cyan-500 text-black flex items-center justify-center hover:scale-105 transition-transform"
                                    >
                                        <Send size={16} />
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
                                className="fixed left-0 top-[25%] z-[90] w-8 h-20 bg-white/5 backdrop-blur-xl border border-white/10 border-l-0 rounded-r-2xl flex items-center justify-center group"
                            >
                                <ChevronRight size={18} className="text-white/40 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                            </motion.button>
                        )}

                        {/* 6. HISTORY DRAWER (Half Screen) */}
                        <AnimatePresence>
                            {isHistoryOpen && (
                                <>
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setIsHistoryOpen(false)} />
                                    <motion.div
                                        initial={{ x: "-100%" }}
                                        animate={{ x: 0 }}
                                        exit={{ x: "-100%" }}
                                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                        className="fixed z-[101] left-0 top-0 bottom-0 w-1/2 max-w-sm bg-black/80 border-r border-white/10 backdrop-blur-[60px] p-8 pt-[160px] flex flex-col"
                                    >
                                        <div className="flex items-center justify-between mb-10">
                                            <span className="text-xs font-black text-cyan-400 uppercase tracking-[0.4em]">Archives</span>
                                            <button onClick={() => setIsHistoryOpen(false)} className="p-2 text-white/20"><ChevronLeft size={20} /></button>
                                        </div>
                                        
                                        <div className="flex-1 space-y-6 overflow-y-auto pr-2">
                                            <HistoryItem date="Today" items={["PresenceFi Strategy", "Cocoon Nodes"]} />
                                            <HistoryItem date="Yesterday" items={["Wallet Recovery Flow", "Mission Multipliers"]} />
                                        </div>

                                        <button className="mt-8 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-white/30 tracking-widest hover:text-cyan-400 transition-colors">
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
            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all hover:bg-white/5 active:scale-95 ${color || "border-white/10 text-white/60"}`}
        >
            <div className="shrink-0">{icon}</div>
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}

function HistoryItem({ date, items }: { date: string, items: string[] }) {
    return (
        <div className="space-y-3">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{date}</span>
            {items.map((item, i) => (
                <button key={i} className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all">
                    <span className="text-xs text-white/70 font-medium block truncate">{item}</span>
                </button>
            ))}
        </div>
    );
}
