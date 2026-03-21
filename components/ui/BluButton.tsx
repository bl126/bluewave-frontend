"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2 } from "lucide-react";

interface Message {
    role: "user" | "blu";
    content: string;
}

interface BluButtonProps {
    isExpanded?: boolean;
    onToggleExpand?: (expanded: boolean) => void;
}

export default function BluButton({ isExpanded = false, onToggleExpand }: BluButtonProps) {
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
                    className="w-12 h-12 rounded-full bg-black/70 border border-cyan-500/40 backdrop-blur-xl flex items-center justify-center shadow-[0_0_16px_rgba(0,230,255,0.2)]"
                >
                    <span className="text-[9px] font-black tracking-widest text-cyan-400 uppercase leading-none">
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
                            className="fixed inset-0 z-[86] bg-black/40 backdrop-blur-sm"
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
                            className={`fixed z-[87] left-1/2 -translate-x-1/2 flex flex-col bg-black/70 backdrop-blur-2xl overflow-hidden shadow-[0_0_40px_rgba(0,230,255,0.15)] transition-all duration-300
                                ${isExpanded
                                    ? "inset-0 w-full h-full max-w-none rounded-none border-none"
                                    : "bottom-24 w-[90vw] max-w-sm h-[60vh] rounded-3xl border border-cyan-900/50"
                                }`}
                        >
                            {/* Header */}
                            {!isExpanded && (
                                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-cyan-900/40 bg-black/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_10px_rgba(0,230,255,0.3)]">
                                            <span className="text-[9px] font-black text-cyan-300 tracking-widest">BLU</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[12px] font-bold text-cyan-50 tracking-wide">Bluewave Intelligence</span>
                                            <span className="text-[9px] text-cyan-400/60 uppercase tracking-widest">Online</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onToggleExpand?.(true)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-cyan-500 hover:text-cyan-300 transition-colors"
                                        >
                                            <Maximize2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-cyan-500 hover:text-cyan-300 transition-colors"
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
                                        <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${msg.role === "user"
                                            ? "bg-cyan-600/20 text-cyan-50 border border-cyan-500/30 rounded-br-sm"
                                            : "bg-[#0a0a0a] text-gray-300 border border-white/5 rounded-bl-sm shadow-inner"
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}

                                {/* Typing Indicator */}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl rounded-bl-sm p-4 flex items-center gap-1.5">
                                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-cyan-500/60" />
                                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-cyan-500/60" />
                                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-cyan-500/60" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Form */}
                            <div className={isExpanded
                                ? "p-3 mb-8 mx-4 bg-cyan-950/20 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-[0_0_30px_rgba(0,230,255,0.1)]"
                                : "p-3 bg-black/40 border-t border-cyan-900/40"
                            }>
                                <form onSubmit={handleSendMessage} className="relative flex items-center">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Ask Blu anything..."
                                        disabled={isLoading}
                                        className="w-full bg-[#0a0a0a] border border-cyan-900/50 rounded-2xl pl-4 pr-12 py-3 text-sm text-cyan-50 placeholder-cyan-700/50 outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!inputValue.trim() || isLoading}
                                        className="absolute right-2 w-8 h-8 flex items-center justify-center rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-900/30 transition-colors"
                                    >
                                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
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
