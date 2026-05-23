"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Send, Bot, User, ArrowLeft, Loader2, Sparkles, Plus, Check, Settings, 
    Wallet, Coins, ChevronDown, X, MessageSquare, PlusCircle, ArrowRight, UserCheck 
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface Message {
    role: "user" | "ai";
    content: string;
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    model: string;
    personality: string;
    communicationStyle: string;
    timestamp: string;
}

const DEFAULT_PERSONALITY = "Analytical, confident, and highly knowledgeable about crypto and the Bluewave ecosystem.";
const DEFAULT_STYLE = "default";
const DEFAULT_MODEL = "Blu-1.5-Pro";

export default function AgentChat() {
    // ----------------------------------------------------
    // STATE & REFS
    // ----------------------------------------------------
    const [sessions, setSessions] = useState<ChatSession[]>([
        {
            id: "session-default",
            title: "Welcome Guide",
            messages: [
                { 
                    role: "ai", 
                    content: "I am Blu Intelligence, your ecosystem navigator. Tapping any of the guide pills below will explain how to interact with the protocol, connect your wallet, check your status, or explore PresenceFi!" 
                }
            ],
            model: DEFAULT_MODEL,
            personality: DEFAULT_PERSONALITY,
            communicationStyle: DEFAULT_STYLE,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [activeSessionId, setActiveSessionId] = useState<string>("session-default");
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [typingText, setTypingText] = useState("");
    
    // UI Panels & Navigation
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeModal, setActiveModal] = useState<"tokens" | "models" | "settings" | null>(null);
    
    // Custom user balance
    const [tokenBalance, setTokenBalance] = useState(50);
    
    // Settings configuration inputs (applied to active session)
    const [settingsPersonality, setSettingsPersonality] = useState(DEFAULT_PERSONALITY);
    const [settingsStyle, setSettingsStyle] = useState(DEFAULT_STYLE);
    
    // Scroll interaction for top right token pill
    const [isPillDimmed, setIsPillDimmed] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Gestures touch tracker
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);

    // ----------------------------------------------------
    // ACTIVE SESSION HELPERS
    // ----------------------------------------------------
    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

    // Synchronize settings form when switching sessions
    useEffect(() => {
        if (activeSession) {
            setSettingsPersonality(activeSession.personality);
            setSettingsStyle(activeSession.communicationStyle);
        }
    }, [activeSessionId]);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(scrollToBottom, [activeSession?.messages, isTyping, typingText]);

    // ----------------------------------------------------
    // TELEGRAM BACK BUTTON INTEGRATION
    // ----------------------------------------------------
    useEffect(() => {
        const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
        if (!tg) return;

        const backButton = tg.BackButton;
        
        if (activeModal !== null) {
            backButton.show();
            const handleBackClick = () => {
                setActiveModal(null);
            };
            backButton.onClick(handleBackClick);
            return () => {
                backButton.offClick(handleBackClick);
                backButton.hide();
            };
        } else if (isSidebarOpen) {
            backButton.show();
            const handleBackClick = () => {
                setIsSidebarOpen(false);
            };
            backButton.onClick(handleBackClick);
            return () => {
                backButton.offClick(handleBackClick);
                backButton.hide();
            };
        } else {
            backButton.hide();
        }
    }, [activeModal, isSidebarOpen]);

    // ----------------------------------------------------
    // SCROLL INTERACTION (DIMMING PILL)
    // ----------------------------------------------------
    const handleScroll = () => {
        setIsPillDimmed(true);
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
            setIsPillDimmed(false);
        }, 1000);
    };

    // ----------------------------------------------------
    // SWIPE GESTURES
    // ----------------------------------------------------
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;
        // Verify touch is mostly horizontal
        if (Math.abs(deltaY) < 55) {
            // Swipe right from left edge/screen to open sidebar
            if (deltaX > 80 && !isSidebarOpen && touchStartX.current < 80) {
                setIsSidebarOpen(true);
            }
            // Swipe left anywhere to close sidebar
            else if (deltaX < -80 && isSidebarOpen) {
                setIsSidebarOpen(false);
            }
        }
    };

    // ----------------------------------------------------
    // LOCAL TYPEWRITER RESPONSE SIMULATOR
    // ----------------------------------------------------
    const simulateTypewriterResponse = (responseContent: string) => {
        setIsTyping(true);
        setTypingText("");
        
        let index = 0;
        const speed = 15; // ms per character
        
        const timer = setInterval(() => {
            if (index < responseContent.length) {
                setTypingText(prev => prev + responseContent.charAt(index));
                index++;
            } else {
                clearInterval(timer);
                setIsTyping(false);
                
                // Commit to session messages
                setSessions(prev => prev.map(s => {
                    if (s.id === activeSessionId) {
                        return {
                            ...s,
                            messages: [...s.messages, { role: "ai", content: responseContent }]
                        };
                    }
                    return s;
                }));
                setTypingText("");
            }
        }, speed);
    };

    // ----------------------------------------------------
    // MESSAGE ACTIONS
    // ----------------------------------------------------
    const handleSend = (textToSend?: string) => {
        const messageText = (textToSend || input).trim();
        if (!messageText || isTyping) return;

        if (!textToSend) {
            setInput("");
        }

        // Add user message
        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                return {
                    ...s,
                    messages: [...s.messages, { role: "user", content: messageText }]
                };
            }
            return s;
        }));

        // Determine Response (offline fallback guide answers)
        let reply = "";
        const lowerText = messageText.toLowerCase();
        
        if (lowerText.includes("wallet") || lowerText.includes("ton")) {
            reply = `### How to Connect TON Wallet\n\nFollow these quick steps to sync your wallet with the Bluewave Protocol:\n\n1. **Open Wallet Portal**: Go back to the main app dashboard.\n2. **Tap Connect**: Click the **Connect TON Wallet** button in the header.\n3. **Choose Provider**: Pick your preferred wallet (e.g., *Tonkeeper*, *Tonhub*, or *Telegram @Wallet*).\n4. **Approve Authorization**: Approve the connection prompt inside your secure wallet app.\n5. **Verification**: Once connected, your wallet address and total **$BWAVE** balance will sync automatically here.`;
        } else if (lowerText.includes("activate") || lowerText.includes("presence")) {
            reply = `### Activating Your Presence\n\nActivating your presence connects you to the decentralized validation pool:\n\n1. Locate the **Presence** dashboard tab inside the application.\n2. Toggle **Active Broadcast** to "ON".\n3. This periodically transmits a lightweight connectivity ping (using zero battery degradation).\n4. Keep your daily streak active to accumulate multipliers on your **Presence Score**!`;
        } else if (lowerText.includes("presencefi")) {
            reply = `### What is PresenceFi?\n\n**PresenceFi** is the financial layer of the Bluewave Ecosystem. It rewards users for proving they are physically or digitally present in verified zones.\n\n* **Signal Mining**: Turn your active internet connectivity into high-value telemetry telemetry points.\n* **Treasury Distribution**: Active operators share daily $BWAVE tokens distributed from the protocol incentives pool.\n* **Proof of Transit**: Securely register path coordinates without compromising biological identity.`;
        } else if (lowerText.includes("profile") || lowerText.includes("details") || lowerText.includes("score")) {
            reply = `### Your Bluewave Profile Details\n\nHere is your synced registry data:\n\n* **BW ID**: \`BW-9872-TG\`\n* **Presence Score**: \`89.4\` (Tier 1 Operator)\n* **Streaks**: \`7 Days Active\`\n* **Ecosystem Tokens**: \`${tokenBalance} tokens\`\n* **Selected Agent Brain**: \`${activeSession.model}\`\n* **Behavior Mode**: \`${activeSession.communicationStyle.toUpperCase()}\``;
        } else {
            reply = `I am currently functioning as a localized Blu guide. To configure my response parameters, use the **Settings** or switch **LLM Models** from the left toggle sidebar. \n\nFeel free to tap one of the guided helper pills below!`;
        }

        setTimeout(() => {
            simulateTypewriterResponse(reply);
        }, 400);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ----------------------------------------------------
    // SESSION MANAGEMENT
    // ----------------------------------------------------
    const handleNewChat = () => {
        const newId = `session-${Date.now()}`;
        const newSession: ChatSession = {
            id: newId,
            title: `New Session #${sessions.length}`,
            messages: [
                { role: "ai", content: "New chat session initialized. How can I guide you inside the Bluewave Mini App today?" }
            ],
            model: activeSession?.model || DEFAULT_MODEL,
            personality: activeSession?.personality || DEFAULT_PERSONALITY,
            communicationStyle: activeSession?.communicationStyle || DEFAULT_STYLE,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newId);
        setIsSidebarOpen(false);
    };

    // ----------------------------------------------------
    // SAVING CONFIG / SETTINGS
    // ----------------------------------------------------
    const handleUpdateSettings = () => {
        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                return {
                    ...s,
                    personality: settingsPersonality,
                    communicationStyle: settingsStyle
                };
            }
            return s;
        }));
        
        // Show simulated response from updated agent
        setActiveModal(null);
        setTimeout(() => {
            simulateTypewriterResponse(`### System Update Successful\n\nMy neural profile has been re-synchronized. My personality instructions have been set to:\n\n*"${settingsPersonality}"*\n\nCommunication style: **${settingsStyle}**`);
        }, 300);
    };

    const handleModelChange = (modelName: string) => {
        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                return { ...s, model: modelName };
            }
            return s;
        }));
        setActiveModal(null);
        setTimeout(() => {
            simulateTypewriterResponse(`System switched active model successfully to **${modelName}**.`);
        }, 350);
    };

    // Guided buttons list
    const guidedQuestions = [
        { id: "wallet", text: "How to connect TON wallet" },
        { id: "activate", text: "How to activate presence" },
        { id: "presenceFi", text: "What is presenceFi?" },
        { id: "details", text: "My Profile Details" }
    ];

    // LLM Models list
    const modelsList = [
        { name: "Blu-1.5-Pro", desc: "Premium reasoning and deep context analysis (Default)" },
        { name: "Blu-1.5-Flash", desc: "Lightweight, ultra-fast responses for quick checks" },
        { name: "DeepSeek-R1-Distill", desc: "Enhanced logic, mathematical proofs, and system debugging" },
        { name: "Llama-3.3-70B", desc: "Warm, natural communication & advanced brainstorming" }
    ];

    // Communication styles
    const styleOptions = [
        { value: "default", label: "Default Protocol Tone" },
        { value: "friendly", label: "Friendly Guide" },
        { value: "listener", label: "Empathetic Listener" },
        { value: "corp", label: "Corporate Strategy Advisor" },
        { value: "formal", label: "Formal/Academic Academician" }
    ];

    return (
        <div 
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="flex flex-col h-screen bg-[#030303] text-white font-sans selection:bg-cyan-500/30 overflow-hidden relative"
        >
            {/* ----------------------------------------------------
                HEADER (Safe Area Compliant)
               ---------------------------------------------------- */}
            <header className="shrink-0 h-[56px] border-b border-white/5 bg-[#030303]/80 backdrop-blur-xl z-20 flex items-center justify-between px-4 mt-[env(safe-area-inset-top,0px)]">
                <div className="flex items-center gap-3">
                    {/* Sidebar trigger arrow button */}
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                        aria-label="Open navigation sidebar"
                    >
                        <ArrowRight size={20} className="text-cyan-400 animate-pulse" />
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(0,230,255,0.1)]">
                            <Bot size={16} className="text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="text-xs font-black tracking-wide flex items-center gap-1.5">
                                Blu Agent <Sparkles size={10} className="text-cyan-500" />
                            </h1>
                            <div className="text-[9px] text-gray-400 font-medium">
                                {activeSession.model}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Right Liquid Glass Token Pill (below tabs/header level, dims on scroll) */}
                <div 
                    onClick={() => setActiveModal("tokens")}
                    className={`cursor-pointer transition-opacity duration-300 ${isPillDimmed ? 'opacity-10' : 'opacity-100'} bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/35 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_4px_15px_rgba(0,0,0,0.4)]`}
                >
                    <Coins size={12} className="text-amber-400" />
                    <span className="text-xs font-black tracking-wide text-white">{tokenBalance}</span>
                </div>
            </header>

            {/* ----------------------------------------------------
                MAIN CHAT AREA (Scrollable)
               ---------------------------------------------------- */}
            <main 
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto px-4 py-6 custom-scrollbar"
            >
                <div className="flex flex-col gap-6 pb-20">
                    {activeSession.messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            {/* Avatar */}
                            {msg.role === "ai" && (
                                <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-950/50 border border-cyan-900/50 flex items-center justify-center mt-1">
                                    <Bot size={14} className="text-cyan-400" />
                                </div>
                            )}

                            {/* Message Bubble */}
                            <div
                                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed relative ${msg.role === "user"
                                        ? "bg-white text-black font-semibold rounded-tr-sm self-end shadow-md"
                                        : "bg-white/5 text-gray-100 border border-white/10 rounded-tl-sm prose prose-invert prose-p:leading-relaxed prose-a:text-cyan-400 prose-code:text-cyan-300 prose-code:bg-cyan-950/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-headings:text-white marker:text-cyan-500"
                                    }`}
                            >
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>

                            {msg.role === "user" && (
                                <div className="shrink-0 w-8 h-8 rounded-full bg-white/15 border border-white/20 flex items-center justify-center mt-1">
                                    <User size={14} className="text-white" />
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {/* Active typing placeholder */}
                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-3 justify-start"
                        >
                            <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-950/50 border border-cyan-900/50 flex items-center justify-center mt-1">
                                <Bot size={14} className="text-cyan-400" />
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 text-[14px] text-gray-300 max-w-[85%] prose prose-invert leading-relaxed">
                                <ReactMarkdown>{typingText}</ReactMarkdown>
                                <span className="inline-block w-1.5 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* ----------------------------------------------------
                HORIZONTAL GUIDED QUESTION PILLS
               ---------------------------------------------------- */}
            <div className="absolute bottom-[80px] left-0 right-0 z-10 w-full max-w-4xl mx-auto px-4 pointer-events-none">
                <AnimatePresence>
                    {!isTyping && (
                        <motion.div 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 15 }}
                            transition={{ duration: 0.2 }}
                            className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-2"
                        >
                            {guidedQuestions.map((q) => (
                                <button
                                    key={q.id}
                                    onClick={() => handleSend(q.text)}
                                    className="shrink-0 bg-white/10 hover:bg-white/20 border border-white/20 active:bg-cyan-500/20 active:border-cyan-500/50 text-[11px] font-bold text-white px-3 py-1.5 rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer"
                                >
                                    {q.text}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ----------------------------------------------------
                INPUT FOOTER (With increased opacity and split button)
               ---------------------------------------------------- */}
            <footer className="shrink-0 bg-[#030303] border-t border-white/5 p-3 pb-[env(safe-area-inset-bottom,12px)] z-20">
                <div className="max-w-4xl mx-auto flex items-end gap-2">
                    {/* Separate Circular Plus Button */}
                    <button
                        onClick={() => alert("File attachment integrations are currently offline.")}
                        className="shrink-0 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-95"
                        title="Attach Media"
                    >
                        <Plus size={20} />
                    </button>

                    {/* Defined Search Bar Input Container */}
                    <div className="flex-1 relative flex items-end gap-2 bg-[#121212] border border-white/40 hover:border-white/50 focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/50 rounded-2xl p-1.5 transition-all shadow-lg">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message to Blu..."
                            className="flex-1 max-h-24 min-h-[34px] bg-transparent text-white placeholder:text-gray-400 resize-none px-3 py-2 focus:outline-none text-[14px] leading-relaxed custom-scrollbar font-medium"
                            rows={1}
                            disabled={isTyping}
                        />

                        {/* "Auto" badge button inside search bar */}
                        <button
                            onClick={() => setActiveModal("models")}
                            className="shrink-0 px-2 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[10px] font-black uppercase tracking-wider transition-colors mr-1 self-center cursor-pointer"
                        >
                            Auto
                        </button>

                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isTyping}
                            className="shrink-0 w-8 h-8 rounded-xl bg-cyan-500 text-black flex items-center justify-center hover:bg-cyan-400 disabled:opacity-30 disabled:bg-white/10 disabled:text-gray-500 transition-colors self-center"
                        >
                            <Send size={14} className="translate-x-[0.5px]" />
                        </button>
                    </div>
                </div>

                {/* Subtext warning (Highly Visible) */}
                <div className="text-center mt-2">
                    <p className="text-[10px] text-gray-300 font-bold tracking-wide">
                        Blu Intelligence can make mistakes. Verify important profile data.
                    </p>
                </div>
            </footer>

            {/* ----------------------------------------------------
                LIQUID GLASS SIDEBAR MENU
               ---------------------------------------------------- */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        {/* Backdrop overlay */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30"
                        />

                        {/* Slide-out Panel */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#080808]/90 backdrop-blur-2xl border-r border-white/15 z-40 flex flex-col pt-[env(safe-area-inset-top,40px)] pb-[env(safe-area-inset-bottom,20px)]"
                        >
                            {/* Profile details card */}
                            <div className="p-4 border-b border-white/10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                                        <User className="text-cyan-400" size={18} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black tracking-wide">BW ID Registry</div>
                                        <div className="text-[10px] text-gray-400 font-semibold font-mono">BW-9872-TG</div>
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-1">
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-gray-400">Presence Score</span>
                                        <span className="text-cyan-400 font-black">89.4</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-gray-400">TON Wallet</span>
                                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                                            Connected <UserCheck size={10} />
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation stack */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                                {/* New Chat - First as requested */}
                                <button
                                    onClick={handleNewChat}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black text-cyan-400 bg-cyan-950/20 border border-cyan-500/30 hover:bg-cyan-950/40 transition-all text-left shadow-sm active:scale-[0.98]"
                                >
                                    <PlusCircle size={16} />
                                    <span>New Chat Session</span>
                                </button>

                                <div className="h-px bg-white/5 my-2" />

                                {/* My Tokens */}
                                <button
                                    onClick={() => { setActiveModal("tokens"); setIsSidebarOpen(false); }}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <Coins size={16} className="text-amber-400" />
                                        <span>My Tokens</span>
                                    </div>
                                    <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] text-white font-mono">{tokenBalance}</span>
                                </button>

                                {/* LLM Model */}
                                <button
                                    onClick={() => { setActiveModal("models"); setIsSidebarOpen(false); }}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <Bot size={16} className="text-purple-400" />
                                        <span>LLM Model</span>
                                    </div>
                                    <span className="text-[9px] text-purple-400 bg-purple-950/30 border border-purple-500/20 px-1.5 py-0.5 rounded font-mono">{activeSession.model}</span>
                                </button>

                                {/* Settings */}
                                <button
                                    onClick={() => { setActiveModal("settings"); setIsSidebarOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left"
                                >
                                    <Settings size={16} className="text-gray-400" />
                                    <span>Settings</span>
                                </button>

                                <div className="h-px bg-white/5 my-2" />

                                {/* Recent conversations */}
                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-4 py-1">
                                    Recent Sessions
                                </div>
                                <div className="space-y-1">
                                    {sessions.map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => { setActiveSessionId(s.id); setIsSidebarOpen(false); }}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs transition-all text-left border ${
                                                s.id === activeSessionId
                                                    ? 'bg-white/10 border-white/15 text-white'
                                                    : 'text-gray-400 hover:text-white border-transparent'
                                            }`}
                                        >
                                            <span className="truncate max-w-[150px]">{s.title}</span>
                                            <span className="text-[9px] text-gray-600 font-mono">{s.timestamp}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ----------------------------------------------------
                FULLSCREEN MODALS (Comply with safe areas and offset below Telegram BackButton)
               ---------------------------------------------------- */}
            <AnimatePresence>
                {activeModal && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 250 }}
                        className="absolute inset-0 bg-[#030303] z-50 flex flex-col pt-[58px]"
                    >
                        {/* FALLBACK ON-SCREEN CLOSE HEADER (Required for browser simulation & safe area alignment) */}
                        <div className="shrink-0 h-[48px] px-4 border-b border-white/5 flex items-center justify-between">
                            <button
                                onClick={() => setActiveModal(null)}
                                className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold hover:text-cyan-300 transition-colors"
                            >
                                <ArrowLeft size={16} /> Back
                            </button>
                            <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                                {activeModal === "tokens" && "Tokens & Topups"}
                                {activeModal === "models" && "LLM Models"}
                                {activeModal === "settings" && "Custom Identity"}
                            </span>
                            <div className="w-12 h-6" /> {/* spacer */}
                        </div>

                        {/* MODAL CONTENT CONTAINER */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-[env(safe-area-inset-bottom,20px)]">
                            
                            {/* 1. TOKENS & TOPUPS MODAL */}
                            {activeModal === "tokens" && (
                                <div className="space-y-6">
                                    {/* Glass balance card */}
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-2 relative overflow-hidden shadow-2xl">
                                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
                                        <Coins size={36} className="text-amber-400 mx-auto" />
                                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Active Balance</div>
                                        <div className="text-4xl font-black text-white">{tokenBalance}</div>
                                        <p className="text-[11px] text-gray-300 max-w-xs mx-auto">
                                            Ecosystem tokens fuel deep research responses, AI translations, and presence validator alerts.
                                        </p>
                                    </div>

                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Top-up Packages</h3>

                                    {/* Star packs grid */}
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { name: "Starter Star Pack", count: 100, price: "$0.99", desc: "Perfect for quick answers" },
                                            { name: "Pro Signal Booster", count: 500, price: "$3.99", desc: "For extensive research analysis" },
                                            { name: "Protocol Validator", count: 1200, price: "$6.99", desc: "Heavy developer usage tier" }
                                        ].map((pack) => (
                                            <div 
                                                key={pack.name}
                                                className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors group"
                                            >
                                                <div className="space-y-1">
                                                    <div className="text-xs font-black text-white">{pack.name}</div>
                                                    <div className="text-[10px] text-gray-300">{pack.desc}</div>
                                                    <div className="text-[11px] text-amber-400 font-black flex items-center gap-1">
                                                        +{pack.count} tokens
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setTokenBalance(prev => prev + pack.count);
                                                        alert(`Purchased ${pack.count} tokens successfully!`);
                                                    }}
                                                    className="px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black tracking-wider transition-all"
                                                >
                                                    {pack.price}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 2. LLM MODELS MODAL */}
                            {activeModal === "models" && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Select Active Brain</h3>
                                    <div className="space-y-2">
                                        {modelsList.map((m) => {
                                            const isSelected = activeSession.model === m.name;
                                            return (
                                                <button
                                                    key={m.name}
                                                    onClick={() => handleModelChange(m.name)}
                                                    className={`w-full p-4 rounded-xl border text-left flex items-start justify-between transition-all ${
                                                        isSelected
                                                            ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                                                            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                                    }`}
                                                >
                                                    <div className="space-y-1">
                                                        <div className="text-xs font-black">{m.name}</div>
                                                        <div className="text-[11px] text-gray-300">{m.desc}</div>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center shrink-0">
                                                            <Check size={12} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 3. SETTINGS & PERSONALITY MODAL */}
                            {activeModal === "settings" && (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400">
                                                Custom Personality / System Prompt
                                            </label>
                                            <textarea
                                                value={settingsPersonality}
                                                onChange={(e) => setSettingsPersonality(e.target.value)}
                                                rows={4}
                                                className="w-full bg-[#121212] border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none leading-relaxed text-white font-medium"
                                                placeholder="Provide prompt details here..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400">
                                                Communication Style
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={settingsStyle}
                                                    onChange={(e) => setSettingsStyle(e.target.value)}
                                                    className="w-full bg-[#121212] border border-white/20 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
                                                >
                                                    {styleOptions.map((opt) => (
                                                        <option key={opt.value} value={opt.value} className="bg-[#0f0f0f] text-white">
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                    <ChevronDown size={14} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-px bg-white/5 my-4" />

                                        <button
                                            onClick={handleUpdateSettings}
                                            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black text-xs font-black uppercase tracking-widest transition-all shadow-lg text-center"
                                        >
                                            Update Agent Personality
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
