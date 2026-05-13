"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, ArrowLeft, MessageSquare, Shield, Globe, Award, Wallet, Search, Sparkles, X, Menu, History, Clock } from "lucide-react";
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
    onOpenCocoon?: () => void;
}

export default function BluButton({ 
    isExpanded = false, 
    onToggleExpand, 
    telegramUser, 
    balance,
    pendingMissionCount = 0,
    onOpenCocoon
}: BluButtonProps) {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showGreeting, setShowGreeting] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Mock history for now
    const chatHistory = [
        { id: 1, title: "What is PresenceFi?", date: "2 hours ago" },
        { id: 2, title: "Mission Activation Help", date: "Yesterday" },
        { id: 3, title: "Cocoon Privacy Explained", date: "3 days ago" },
    ];

    const firstName = telegramUser?.first_name || "there";
    const isNewUser = useMemo(() => {
        if (!telegramUser?.joined_at) return true;
        const joinedDate = new Date(telegramUser.joined_at).getTime();
        const fortyEightHours = 48 * 60 * 60 * 1000;
        return (Date.now() - joinedDate < fortyEightHours) || !telegramUser?.wallet_address;
    }, [telegramUser]);

    useEffect(() => {
        const timer = setTimeout(() => { if (!isOpen) setShowGreeting(true); }, 1500);
        return () => clearTimeout(timer);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen, selectedQuestion]);

    const CocoonEggIcon = () => (
        <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <defs>
                <linearGradient id="eggGradient" x1="10" y1="0" x2="10" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00BFFF" />
                    <stop offset="1" stopColor="#7B2FBE" />
                </linearGradient>
            </defs>
            <path d="M10 0C4.47715 0 0 5.37258 0 12C0 18.6274 4.47715 24 10 24C15.5228 24 20 18.6274 20 12C20 5.37258 15.5228 0 10 0Z" fill="url(#eggGradient)" fillOpacity="0.8" />
            <path d="M10 2C14.4183 2 18 6.47715 18 12C18 17.5228 14.4183 22 10 22C5.58172 22 2 17.5228 2 12C2 6.47715 5.58172 2 10 2Z" stroke="white" strokeOpacity="0.2" strokeWidth="0.5" />
            {/* Mesh Grid Lines */}
            <path d="M10 0V24M0 12H20M3 5L17 19M3 19L17 5" stroke="white" strokeOpacity="0.1" strokeWidth="0.5" />
            {/* Nodes */}
            <circle cx="10" cy="12" r="1" fill="white" fillOpacity="0.5" />
            <circle cx="3" cy="5" r="0.5" fill="white" fillOpacity="0.5" />
            <circle cx="17" cy="19" r="0.5" fill="white" fillOpacity="0.5" />
            <circle cx="3" cy="19" r="0.5" fill="white" fillOpacity="0.5" />
            <circle cx="17" cy="5" r="0.5" fill="white" fillOpacity="0.5" />
        </svg>
    );

    const KNOWLEDGE_BASE: Record<string, { answer: string, icon: any, color?: string, actionLabel?: string, action?: () => void }> = {
        "what_is_bluewave": {
            icon: <Globe size={16} />,
            answer: `Bluewave is a Human Presence Layer built on the TON blockchain. It's a decentralized protocol where real humans prove their presence and earn $BWAVE tokens.`,
        },
        "what_is_presencefi": {
            icon: <Sparkles size={16} />,
            answer: `PresenceFi is where you build your digital presence, own it as an asset, and monetize it in the future marketplace. Turn consistency into financial value. 💎`,
        },
        "activate_mission": {
            icon: <Award size={16} />,
            answer: `Missions earn you extra $BWAVE! Tap the Missions tab, complete tasks, and claim your rewards. Daily Presence claims give bonus multipliers!`,
            actionLabel: "Open Missions →",
            action: () => window.dispatchEvent(new CustomEvent("setActiveTab", { detail: "missions" }))
        },
        "bw_id": {
            icon: <MessageSquare size={16} />,
            answer: `Your Bluewave ID (BW ID) is: ${telegramUser?.bw_id || "Loading..."}. It tracks your history and links your wallet.`,
        },
        "connect_wallet": {
            icon: <Wallet size={16} />,
            answer: `Connecting unlocks the full protocol! Link any TON wallet in your Profile to receive $BWAVE rewards. ${telegramUser?.wallet_address ? "✅ Already connected!" : "⚠️ Not connected yet."}`,
            actionLabel: "Go to Profile →",
            action: () => window.dispatchEvent(new CustomEvent("setActiveTab", { detail: "profile" }))
        },
        "cocoon": {
            icon: <CocoonEggIcon />,
            color: "border-purple-500/50 text-purple-400 bg-purple-500/5",
            answer: `Cocoon is a decentralized AI network on TON. Your requests run inside Trusted Execution Environments (TEEs)—data is encrypted even WHILE being processed.`,
            actionLabel: "Explore Cocoon →",
            action: () => onOpenCocoon?.()
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        
        // Auto-expand to full screen when sending a message
        onToggleExpand?.(true);
        setIsOpen(true);
        
        const userMsg = inputValue.trim();
        setInputValue("");
        setMessages(prev => [...prev, { role: "user", content: userMsg, timestamp: new Date().toLocaleTimeString() }]);
        
        setIsLoading(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { 
                role: "blu", 
                content: "I'm currently indexing the network. This query will be processed in the next node update.",
                timestamp: new Date().toLocaleTimeString()
            }]);
            setIsLoading(false);
        }, 1000);
    };

    const handleQuestionSelect = (key: string) => {
        setSelectedQuestion(key);
        setMessages(prev => [
            ...prev, 
            { role: "user", content: "Tell me about: " + key.replace(/_/g, ' '), timestamp: new Date().toLocaleTimeString() },
            { role: "blu", content: KNOWLEDGE_BASE[key].answer, timestamp: new Date().toLocaleTimeString() }
        ]);
    };

    const styles = useMemo(() => {
        const isDim = theme === "dim";
        return {
            btn: `bg-black/70 border-cyan-500/40 shadow-[0_0_16px_rgba(0,230,255,0.2)]`,
            panel: isDim ? "bg-slate-900/95 border-cyan-900/50" : "bg-black/85 border-cyan-900/50",
            bubble: "bg-cyan-600/20 text-cyan-50 border-cyan-500/30 rounded-2xl rounded-br-sm",
            blu: "bg-[#0a0a0a] text-gray-300 border-white/5 rounded-2xl rounded-bl-sm",
        };
    }, [theme]);

    return (
        <>
            {/* Entry Button */}
            <div className="fixed z-[85] top-[15%] left-1 select-none">
                <motion.button
                    onClick={() => { setIsOpen(true); setShowGreeting(false); }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`w-14 h-14 rounded-full border backdrop-blur-xl flex items-center justify-center ${styles.btn}`}
                >
                    <span className="text-[10px] font-black tracking-widest text-cyan-400">BLU</span>
                </motion.button>

                <AnimatePresence>
                    {showGreeting && (
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="absolute left-16 top-0 w-48 p-3 rounded-2xl rounded-tl-none bg-black/90 border border-cyan-500/30 backdrop-blur-xl shadow-2xl z-[86]">
                            <p className="text-[11px] text-cyan-50 leading-relaxed">
                                {isNewUser ? `🌊 Welcome, ${firstName}! Tap to see how everything works.` : `👋 Welcome back, ${firstName}! Check your missions.`}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Chat Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                            className="fixed inset-0 z-[86] backdrop-blur-md bg-black/60" onClick={() => { setIsOpen(false); onToggleExpand?.(false); }} />

                        <motion.div
                            initial={isExpanded ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className={`fixed z-[87] flex flex-col backdrop-blur-3xl overflow-hidden shadow-2xl transition-all duration-500 ${styles.panel}
                                ${isExpanded 
                                    ? "inset-0 w-full h-full rounded-none border-none" 
                                    : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-sm h-[65vh] rounded-[2.5rem] border"
                                }`}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/5">
                                <div className="flex items-center gap-3">
                                    {isExpanded && (
                                        <button onClick={() => setIsHistoryOpen(true)} className="p-2 rounded-full bg-white/5 text-cyan-400">
                                            <Menu size={20} />
                                        </button>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white uppercase tracking-tighter">Blu Assistant</span>
                                        <span className="text-[9px] text-cyan-400 uppercase tracking-widest">Command Center</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {!isExpanded && <button onClick={() => onToggleExpand?.(true)} className="text-white/40"><Maximize2 size={16} /></button>}
                                    <button onClick={() => { setIsOpen(false); onToggleExpand?.(false); }} className="text-white/40"><X size={20} /></button>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                                {/* Welcome & Input - Top Aligned for both modes */}
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[10px] text-cyan-400 font-bold shrink-0">BLU</div>
                                        <div className={`p-4 text-sm leading-relaxed border ${styles.blu}`}>
                                            Hey {firstName}! 👋 What do you want to ask?
                                        </div>
                                    </div>

                                    {/* Input Field - Now below welcome */}
                                    <form onSubmit={handleSendMessage} className="relative">
                                        <input 
                                            type="text" 
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="Ask about PresenceFi, Missions..." 
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-cyan-500/50 outline-none transition-all pr-12" 
                                        />
                                        <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400">
                                            <Search size={20} />
                                        </button>
                                    </form>

                                    {/* Knowledge Pills - Arranged below input */}
                                    {!selectedQuestion && !messages.length && (
                                        <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-bottom-2">
                                            {Object.entries(KNOWLEDGE_BASE).map(([key, data]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => handleQuestionSelect(key)}
                                                    className={`flex items-center gap-2 p-3 text-left text-[11px] font-bold rounded-xl border transition-all hover:scale-105 ${data.color || "border-white/10 text-gray-400 bg-white/5"}`}
                                                >
                                                    {data.icon}
                                                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Chat Thread (Shows after first interaction) */}
                                {(messages.length > 0) && (
                                    <div className="flex flex-col gap-4 border-t border-white/5 pt-6">
                                        {messages.map((msg, idx) => (
                                            <div key={idx} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                                <div className={`max-w-[85%] p-4 text-sm leading-relaxed border ${msg.role === "user" ? styles.bubble : styles.blu}`}>
                                                    {msg.content}
                                                    {msg.role === "blu" && selectedQuestion && KNOWLEDGE_BASE[selectedQuestion]?.actionLabel && (
                                                        <button onClick={KNOWLEDGE_BASE[selectedQuestion].action} className="mt-3 flex items-center gap-2 text-cyan-400 font-bold text-xs">
                                                            {KNOWLEDGE_BASE[selectedQuestion].actionLabel}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {selectedQuestion && (
                                            <button onClick={() => setSelectedQuestion(null)} className="text-[10px] uppercase tracking-widest text-cyan-500/50 hover:text-cyan-400 self-center">
                                                Show all pills
                                            </button>
                                        )}
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </motion.div>

                        {/* History Sidebar */}
                        <AnimatePresence>
                            {isHistoryOpen && (
                                <>
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[88] bg-black/40 backdrop-blur-sm" onClick={() => setIsHistoryOpen(false)} />
                                    <motion.div
                                        initial={{ x: -300 }}
                                        animate={{ x: 0 }}
                                        exit={{ x: -300 }}
                                        className="fixed z-[89] left-0 top-0 bottom-0 w-72 bg-[#050C16] border-r border-white/10 p-6 flex flex-col"
                                    >
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                                                <History size={16} className="text-cyan-400" /> History
                                            </h3>
                                            <button onClick={() => setIsHistoryOpen(false)} className="text-white/40"><X size={18} /></button>
                                        </div>
                                        <div className="flex-1 space-y-3 overflow-y-auto">
                                            {chatHistory.map(item => (
                                                <button key={item.id} className="w-full text-left p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group">
                                                    <div className="text-xs text-white/80 font-medium mb-1 group-hover:text-cyan-400">{item.title}</div>
                                                    <div className="text-[10px] text-white/20 flex items-center gap-1"><Clock size={10} /> {item.date}</div>
                                                </button>
                                            ))}
                                        </div>
                                        <button className="mt-auto w-full py-3 rounded-xl border border-dashed border-white/20 text-white/40 text-[10px] uppercase tracking-widest hover:border-cyan-500/50 hover:text-cyan-400 transition-all">
                                            Clear All History
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
