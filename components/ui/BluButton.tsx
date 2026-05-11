"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface Message {
    role: "user" | "blu";
    content: string;
}

interface BluButtonProps {
    isExpanded?: boolean;
    onToggleExpand?: (expanded: boolean) => void;
}

export default function BluButton({ isExpanded = false, onToggleExpand }: BluButtonProps) {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "blu", content: "I am Blu. How can I help you navigate the Human Presence Layer?" }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    // Theme-aware styles
    const styles = useMemo(() => {
        switch (theme) {
            case "light":
                return {
                    buttonBg: "bg-black",
                    buttonBorder: "border-black",
                    buttonText: "text-white",
                    buttonShadow: "shadow-lg shadow-black/30",
                    panelBg: "bg-white/95",
                    panelBorder: "border-black/10",
                    panelShadow: "shadow-2xl shadow-black/20",
                    headerBg: "bg-white",
                    headerText: "text-black",
                    headerSub: "text-black/50",
                    userBubble: "bg-black text-white border-black rounded-br-sm",
                    bluBubble: "bg-slate-100 text-slate-800 border-slate-200 rounded-bl-sm",
                    inputBg: "bg-slate-50",
                    inputBorder: "border-black/20",
                    inputText: "text-black",
                    inputPlaceholder: "placeholder-slate-400",
                    inputFocus: "focus:border-black",
                    sendBtn: "bg-black text-white",
                    iconColor: "text-black"
                };
            case "dim":
                return {
                    buttonBg: "bg-black/70",
                    buttonBorder: "border-cyan-500/40",
                    buttonText: "text-cyan-400",
                    buttonShadow: "shadow-[0_0_16px_rgba(0,230,255,0.2)]",
                    panelBg: "bg-slate-900/90",
                    panelBorder: "border-cyan-900/50",
                    panelShadow: "shadow-[0_0_40px_rgba(0,230,255,0.15)]",
                    headerBg: "bg-black/40",
                    headerText: "text-cyan-50",
                    headerSub: "text-cyan-400/60",
                    userBubble: "bg-cyan-600/20 text-cyan-50 border-cyan-500/30 rounded-br-sm",
                    bluBubble: "bg-[#0a0a0a] text-gray-300 border-white/5 rounded-bl-sm",
                    inputBg: "bg-[#0a0a0a]",
                    inputBorder: "border-cyan-900/50",
                    inputText: "text-cyan-50",
                    inputPlaceholder: "placeholder-cyan-700/50",
                    inputFocus: "focus:border-cyan-500/50",
                    sendBtn: "bg-cyan-500 text-black",
                    iconColor: "text-cyan-500"
                };
            default: // original/night
                return {
                    buttonBg: "bg-black/70",
                    buttonBorder: "border-cyan-500/40",
                    buttonText: "text-cyan-400",
                    buttonShadow: "shadow-[0_0_16px_rgba(0,230,255,0.2)]",
                    panelBg: "bg-black/70",
                    panelBorder: "border-cyan-900/50",
                    panelShadow: "shadow-[0_0_40px_rgba(0,230,255,0.15)]",
                    headerBg: "bg-black/40",
                    headerText: "text-cyan-50",
                    headerSub: "text-cyan-400/60",
                    userBubble: "bg-cyan-600/20 text-cyan-50 border-cyan-500/30 rounded-br-sm",
                    bluBubble: "bg-[#0a0a0a] text-gray-300 border-white/5 rounded-bl-sm",
                    inputBg: "bg-[#0a0a0a]",
                    inputBorder: "border-cyan-900/50",
                    inputText: "text-cyan-50",
                    inputPlaceholder: "placeholder-cyan-700/50",
                    inputFocus: "focus:border-cyan-500/50",
                    sendBtn: "bg-cyan-500 text-black",
                    iconColor: "text-cyan-500"
                };
        }
    }, [theme]);

    // Static position: 15% from top, 4px from left
    const buttonStyle: React.CSSProperties = {
        position: "fixed",
        zIndex: 85,
        top: "15%",
        left: "4px",
        touchAction: "none",
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMsg = inputValue.trim();
        setInputValue("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setIsLoading(true);

        // [BLU_FREEZE] Logic marked off
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: "blu",
                content: "Blu is currently syncing with the main network. Full integration coming soon."
            }]);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <>
            {/* BLU Static Button */}
            <motion.div style={buttonStyle} className="select-none">
                <motion.button
                    onClick={() => setIsOpen(prev => !prev)}
                    whileHover={{ opacity: 1, scale: 1.1 }}
                    whileTap={{ scale: 0.92 }}
                    animate={{ opacity: isOpen ? 1 : 0.55 }}
                    transition={{ duration: 0.2 }}
                    className={`w-12 h-12 rounded-full border backdrop-blur-xl flex items-center justify-center ${styles.buttonBg} ${styles.buttonBorder} ${styles.buttonShadow}`}
                >
                    <span className={`text-[9px] font-black tracking-widest uppercase leading-none ${styles.buttonText}`}>
                        BLU
                    </span>
                </motion.button>
            </motion.div>

            {/* Chat Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className={`fixed inset-0 z-[86] backdrop-blur-sm ${theme === 'light' ? 'bg-black/10' : 'bg-black/40'}`}
                            onClick={() => setIsOpen(false)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />

                        {/* Chat Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.96 }}
                            transition={{ type: "spring", stiffness: 320, damping: 28 }}
                            className={`fixed z-[87] left-1/2 -translate-x-1/2 flex flex-col backdrop-blur-2xl overflow-hidden transition-all duration-300 ${styles.panelBg} ${styles.panelShadow}
                                ${isExpanded
                                    ? "inset-0 w-full h-full max-w-none rounded-none border-none"
                                    : `bottom-24 w-[90vw] max-w-sm h-[60vh] rounded-3xl border ${styles.panelBorder}`
                                }`}
                        >
                            {/* Header */}
                            {!isExpanded && (
                                <div className={`flex items-center justify-between px-5 pt-4 pb-3 border-b ${theme === 'light' ? 'border-black/10' : 'border-cyan-900/40'} ${styles.headerBg}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${theme === 'light' ? 'bg-black border-black shadow-lg' : 'bg-cyan-950/80 border-cyan-500/50 shadow-[0_0_10px_rgba(0,230,255,0.3)]'}`}>
                                            <span className={`text-[9px] font-black tracking-widest ${theme === 'light' ? 'text-white' : 'text-cyan-300'}`}>BLU</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-[12px] font-bold tracking-wide ${styles.headerText}`}>Bluewave Intelligence</span>
                                            <span className={`text-[9px] uppercase tracking-widest ${styles.headerSub}`}>Online</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onToggleExpand?.(true)}
                                            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${theme === 'light' ? 'bg-black/5 hover:bg-black/10 text-black' : 'bg-white/5 hover:bg-white/10 text-cyan-500 hover:text-cyan-300'}`}
                                        >
                                            <Maximize2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${theme === 'light' ? 'bg-black/5 hover:bg-black/10 text-black font-bold' : 'bg-white/5 hover:bg-white/10 text-cyan-500 hover:text-cyan-300'}`}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Messages Area */}
                            <div className={`flex-1 overflow-y-auto p-4 flex flex-col gap-4 ${isExpanded ? "pt-28" : ""}`}>
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed border ${msg.role === "user" ? styles.userBubble : styles.bluBubble}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}

                                {/* Typing Indicator */}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className={`border rounded-2xl rounded-bl-sm p-4 flex items-center gap-1.5 ${styles.bluBubble}`}>
                                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0 }} className={`w-1.5 h-1.5 rounded-full ${theme === 'light' ? 'bg-black/40' : 'bg-cyan-500/60'}`} />
                                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.2 }} className={`w-1.5 h-1.5 rounded-full ${theme === 'light' ? 'bg-black/40' : 'bg-cyan-500/60'}`} />
                                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.4 }} className={`w-1.5 h-1.5 rounded-full ${theme === 'light' ? 'bg-black/40' : 'bg-cyan-500/60'}`} />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Form */}
                            <div className={isExpanded
                                ? `p-3 mb-8 mx-4 backdrop-blur-xl border rounded-2xl ${theme === 'light' ? 'bg-white border-black/10 shadow-lg' : 'bg-cyan-950/20 border-cyan-500/20 shadow-[0_0_30px_rgba(0,230,255,0.1)]'}`
                                : `p-3 border-t ${styles.headerBg} ${theme === 'light' ? 'border-black/10' : 'border-cyan-900/40'}`
                            }>
                                <form onSubmit={handleSendMessage} className="relative flex items-center">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Ask Blu anything..."
                                        disabled={isLoading}
                                        className={`w-full border rounded-2xl pl-4 pr-12 py-3 text-sm outline-none transition-colors disabled:opacity-50 ${styles.inputBg} ${styles.inputBorder} ${styles.inputText} ${styles.inputPlaceholder} ${styles.inputFocus}`}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!inputValue.trim() || isLoading}
                                        className={`absolute right-2 w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${styles.sendBtn} disabled:opacity-30`}
                                    >
                                        <svg className={`w-4 h-4 ${theme === 'light' ? 'text-white' : 'text-black'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
