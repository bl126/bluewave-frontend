"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, ArrowLeft, Loader2, Sparkles, RefreshCcw } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface Message {
    role: "user" | "ai";
    content: string;
}

export default function AgentChat() {
    const [messages, setMessages] = useState<Message[]>([
        { role: "ai", content: "I am Blu Intelligence. Ask me anything about the Bluewave ecosystem, request translations, or conduct deep research. How can I assist you today?" }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(scrollToBottom, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setIsTyping(true);

        try {
            const response = await fetch("http://localhost:8000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    tg_id: 0, // Fallback or retrieve from auth
                    bw_id: "BW_WEB",
                    group_id: 0,
                    first_name: "User",
                    message: userMsg
                }),
            });

            if (!response.ok) throw new Error("Failed to fetch response");
            const data = await response.json();

            setMessages(prev => [...prev, { role: "ai", content: data.reply }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: "ai", content: "Sorry, my neural connection dropped. Could you repeat that?" }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#030303] text-white font-sans selection:bg-cyan-500/30 overflow-hidden">

            {/* Header */}
            <header className="shrink-0 h-16 border-b border-white/5 bg-[#030303]/80 backdrop-blur-xl z-20 flex items-center justify-between px-4 lg:px-8">
                <div className="flex items-center gap-4">
                    <Link href="/agent-portal" className="p-2 -ml-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,230,255,0.15)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]" />
                            <Bot size={20} className="text-cyan-400 relative z-10" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold tracking-wide flex items-center gap-2">
                                Blu Intelligence <Sparkles size={12} className="text-cyan-500" />
                            </h1>
                            <div className="text-[11px] text-gray-400 font-medium">Deep Research Mode</div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setMessages([{ role: "ai", content: "Memory cleared. How can I assist you?" }])}
                    className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-semibold"
                >
                    <RefreshCcw size={14} /> <span className="hidden sm:inline">Reset Context</span>
                </button>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto px-4 py-8 custom-scrollbar">
                <div className="flex flex-col gap-8 pb-4">
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            {/* AI Avatar */}
                            {msg.role === "ai" && (
                                <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-950/50 border border-cyan-900/50 flex items-center justify-center mt-1">
                                    <Bot size={14} className="text-cyan-500" />
                                </div>
                            )}

                            {/* Message Bubble */}
                            <div
                                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed relative ${msg.role === "user"
                                        ? "bg-white text-black font-medium rounded-tr-sm self-end"
                                        : "bg-white/5 text-gray-200 border border-white/10 rounded-tl-sm prose prose-invert prose-p:leading-relaxed prose-a:text-cyan-400 prose-code:text-cyan-300 prose-code:bg-cyan-950/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-headings:text-white marker:text-cyan-500"
                                    }`}
                            >
                                {msg.role === "ai" ? (
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                ) : (
                                    msg.content
                                )}
                            </div>

                            {/* User Avatar */}
                            {msg.role === "user" && (
                                <div className="shrink-0 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mt-1">
                                    <User size={14} className="text-white" />
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-4 justify-start"
                        >
                            <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-950/50 border border-cyan-900/50 flex items-center justify-center mt-1">
                                <Bot size={14} className="text-cyan-500" />
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2 text-cyan-500">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-xs font-semibold tracking-widest uppercase">Synthesizing...</span>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input Area */}
            <footer className="shrink-0 bg-[#030303] border-t border-white/5 p-4 z-20">
                <div className="max-w-4xl mx-auto relative group">
                    {/* Ambient glow container */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-blue-500/0 rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />

                    <div className="relative flex items-end gap-2 bg-[#0a0a0a] border border-white/10 hover:border-white/20 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/50 rounded-3xl p-2 transition-all shadow-lg">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Message Blu Intelligence..."
                            className="flex-1 max-h-32 min-h-[44px] bg-transparent text-white placeholder:text-gray-500 resize-none px-4 py-3 focus:outline-none text-[15px] leading-relaxed custom-scrollbar"
                            rows={1}
                            disabled={isTyping}
                        />

                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                            className="shrink-0 w-11 h-11 rounded-full bg-cyan-500 text-black flex items-center justify-center hover:bg-cyan-400 disabled:opacity-50 disabled:bg-white/10 disabled:text-gray-500 transition-colors mb-0.5"
                        >
                            <Send size={18} className="translate-x-[1px]" />
                        </button>
                    </div>

                    <div className="text-center mt-3">
                        <p className="text-[10px] text-gray-600 font-medium">Blu Intelligence can make mistakes. Verify important information.</p>
                    </div>
                </div>
            </footer>

            {/* Add custom scrollbar styles globally for this page */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
        }
      `}} />
        </div>
    );
}
