"use client";

import { useState, useRef, useEffect, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, Globe, Award, Wallet, Sparkles, Send, Terminal, Plus, Mic, 
    ChevronDown, LayoutGrid, Image as ImageIcon, Coins, Menu, Check, 
    Settings, PlusCircle, ArrowLeft, ArrowRight, UserCheck, Bot, User 
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
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

interface BluButtonProps {
    isExpanded?: boolean;
    onToggleExpand?: (expanded: boolean) => void;
    telegramUser: any;
    balance: number | null;
    pendingMissionCount?: number;
    socialMissionCount?: number;
    presenceMissionCount?: number;
    onOpenCocoon?: () => void;
    userAvatarUrl?: string | null;
    onNavigateToTab?: (tab: "home" | "missions" | "explore" | "market" | "profile") => void;
    welcomeBubble?: {
        message: string;
        isNewUser: boolean;
        onDismiss: () => void;
    } | null;
}

const DEFAULT_PERSONALITY = "Analytical, confident, and highly knowledgeable about crypto and the Bluewave ecosystem.";
const DEFAULT_STYLE = "default";
const DEFAULT_MODEL = "Blu-1.5-Pro";

function formatTokenBalance(value: number | null): string {
    if (value === null) return "0";
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (value >= 1000) {
        return (value / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return value.toString();
}

function formatLifetimeEntropy(value: number): string {
    if (value >= 10000) {
        return (value / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return value.toString();
}

export default function BluButton({ 
    isExpanded = false,
    onToggleExpand,
    telegramUser, 
    balance,
    pendingMissionCount = 0,
    socialMissionCount = 0,
    presenceMissionCount = 0,
    onOpenCocoon,
    userAvatarUrl = null,
    onNavigateToTab,
    welcomeBubble = null,
}: BluButtonProps) {
    const { theme } = useTheme();
    
    // ----------------------------------------------------
    // MULTI-SESSION CHAT STATE
    // ----------------------------------------------------
    const [sessions, setSessions] = useState<ChatSession[]>([
        {
            id: "session-default",
            title: "Welcome Guide",
            messages: [], // Starts empty so it shows the welcoming orb layout first
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
    
    // UI Panels & Navigation inside Expanded Command Center
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeModal, setActiveModal] = useState<"tokens" | "models" | "settings" | null>(null);
    const [isModelsDropdownOpen, setIsModelsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close models dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsModelsDropdownOpen(false);
            }
        }
        if (isModelsDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isModelsDropdownOpen]);

    // Close overlays with Escape key on desktop
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (isModelsDropdownOpen) {
                    setIsModelsDropdownOpen(false);
                } else if (activeModal !== null) {
                    setActiveModal(null);
                } else if (isSidebarOpen) {
                    setIsSidebarOpen(false);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeModal, isSidebarOpen, isModelsDropdownOpen]);
    
    // Custom user token balance
    const [tokenBalance, setTokenBalance] = useState(50);

    // Sync prop balance to local tokenBalance state if it changes
    useEffect(() => {
        if (balance !== null) {
            setTokenBalance(balance);
        }
    }, [balance]);
    
    // Settings configuration inputs (applied to active session)
    const [settingsPersonality, setSettingsPersonality] = useState(DEFAULT_PERSONALITY);
    const [settingsStyle, setSettingsStyle] = useState(DEFAULT_STYLE);
    
    // Scroll interaction for top right token pill + sidebar button
    const [isPillDimmed, setIsPillDimmed] = useState(false);
    const [isSidebarButtonHidden, setIsSidebarButtonHidden] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Draggable Orb States
    const [position, setPosition] = useState({ x: 8, y: 120 });
    const [isDragging, setIsDragging] = useState(false);
    const [isSnappedToLeft, setIsSnappedToLeft] = useState(true);
    const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0 });
    const [labBubbleText, setLabBubbleText] = useState<string | null>(null);
    const labBubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (labBubbleTimeoutRef.current) {
                clearTimeout(labBubbleTimeoutRef.current);
            }
        };
    }, []);


    const dragStart = useRef({ x: 0, y: 0 });
    const orbStart = useRef({ x: 0, y: 0 });
    const isDraggingDistance = useRef(0);
    const buttonRef = useRef<HTMLDivElement>(null);

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

    // Initialize orb position ONLY once on fresh App Mount
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

    // Calculate bubble position based on actual button element position
    useEffect(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const bubbleTop = rect.top + (rect.height / 2) - 24; // center vertically (24 = half height of bubble ~48px)
            const bubbleLeft = rect.right + 8; // 8px gap to the right
            setBubblePosition({ top: bubbleTop, left: bubbleLeft });
        }
    }, [position]);

    // ------------------------------------
    // INTERCEPT TELEGRAM BACK BUTTON (INTERCEPT STATE FLOW)
    // ----------------------------------------------------
    useEffect(() => {
        if (!isExpanded) return;
        
        const handleNativeBack = (e: Event) => {
            if (isModelsDropdownOpen) {
                e.preventDefault();
                setIsModelsDropdownOpen(false);
            } else if (activeModal !== null) {
                e.preventDefault();
                setActiveModal(null);
            } else if (isSidebarOpen) {
                e.preventDefault();
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener("bwNativeBack", handleNativeBack);
        return () => {
            window.removeEventListener("bwNativeBack", handleNativeBack);
        };
    }, [isExpanded, activeModal, isSidebarOpen, isModelsDropdownOpen]);

    // ----------------------------------------------------
    // POINTER & TOUCH GESTURES
    // ----------------------------------------------------
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

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - touchStartX.current;
        const deltaY = currentY - touchStartY.current;

        if (Math.abs(deltaY) < 40) {
            if (deltaX > 35 && !isSidebarOpen && touchStartX.current < 60) {
                setIsSidebarOpen(true);
            } else if (deltaX < -35 && isSidebarOpen) {
                setIsSidebarOpen(false);
            }
        }
    };

    // ----------------------------------------------------
    // SCROLL INTERACTION (DIMMING PILL)
    // ----------------------------------------------------
    const handleScroll = () => {
        setIsPillDimmed(true);
        setIsSidebarButtonHidden(true);
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
            setIsPillDimmed(false);
            setIsSidebarButtonHidden(false);
        }, 1000);
    };

    // 🔓 Access Control Logic: Now open to everyone
    const isAuthorized = true;
    const ADMIN_IDS = [5023869471];
    const isAdmin = telegramUser?.id ? ADMIN_IDS.includes(Number(telegramUser.id)) : false;
    const showGreeting = false; // Disable popup greeting if handled via guiding pills


    // ----------------------------------------------------
    // LOCAL TYPEWRITER SIMULATION
    // ----------------------------------------------------
    const simulateTypewriterResponse = (responseContent: string) => {
        setIsTyping(true);
        setTypingText("");
        
        let index = 0;
        const speed = 12; // Character typing speed
        
        const timer = setInterval(() => {
            if (index < responseContent.length) {
                setTypingText(prev => prev + responseContent.charAt(index));
                index++;
            } else {
                clearInterval(timer);
                setIsTyping(false);
                
                // Commit to active session history
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
    // SEND MESSAGE ACTIONS
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

        // Answer matching
        let reply = "";
        const lowerText = messageText.toLowerCase();
        
        if (lowerText.includes("wallet") || lowerText.includes("ton")) {
            reply = `### How to Connect TON Wallet\n\nFollow these quick steps to sync your wallet with the Bluewave Protocol:\n\n1. **Open Wallet Portal**: Go back to the main app dashboard.\n2. **Tap Connect**: Click the **Connect TON Wallet** button in the header.\n3. **Choose Provider**: Pick your preferred wallet (e.g., *Tonkeeper*, *Tonhub*, or *Telegram @Wallet*).\n4. **Approve Authorization**: Approve the connection prompt inside your secure wallet app.\n5. **Verification**: Once connected, your wallet address and total **$BWAVE** balance will sync automatically here.`;
        } else if (lowerText.includes("activate") || lowerText.includes("presence")) {
            reply = `### Activating Your Presence\n\nActivating your presence connects you to the decentralized validation pool:\n\n1. Locate the **Presence** dashboard tab inside the application.\n2. Toggle **Active Broadcast** to "ON".\n3. This periodically transmits a lightweight connectivity ping (using zero battery degradation).\n4. Keep your daily streak active to accumulate multipliers on your **Presence Score**!`;
        } else if (lowerText.includes("presencefi")) {
            reply = `### What is PresenceFi?\n\n**PresenceFi** is the financial layer of the Bluewave Ecosystem. It rewards users for proving they are physically or digitally present in verified zones.\n\n* **Signal Mining**: Turn your active internet connectivity into high-value telemetry points.\n* **Treasury Distribution**: Active operators share daily $BWAVE tokens distributed from the protocol incentives pool.\n* **Proof of Transit**: Securely register path coordinates without compromising biological identity.`;
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
    // SESSION ACTIONS
    // ----------------------------------------------------
    const handleNewChat = () => {
        const newId = `session-${Date.now()}`;
        const newSession: ChatSession = {
            id: newId,
            title: `New Session #${sessions.length}`,
            messages: [], // Fresh new session (displays center orb)
            model: activeSession?.model || DEFAULT_MODEL,
            personality: activeSession?.personality || DEFAULT_PERSONALITY,
            communicationStyle: activeSession?.communicationStyle || DEFAULT_STYLE,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newId);
        setIsSidebarOpen(false);
    };

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
        setIsModelsDropdownOpen(false);
        setTimeout(() => {
            simulateTypewriterResponse(`System switched active model successfully to **${modelName}**.`);
        }, 350);
    };

    // Guided questions
    const guidedQuestions = [
        { id: "wallet", text: "How to connect TON wallet" },
        { id: "activate", text: "How to activate presence" },
        { id: "presenceFi", text: "What is presenceFi?" },
        { id: "details", text: "My Profile Details" }
    ];

    // LLM Models
    const modelsList = [
        { name: "Blu-1.5-Pro", desc: "Premium reasoning and deep context analysis (Default)" },
        { name: "Blu-1.5-Flash", desc: "Lightweight, ultra-fast responses for quick checks" },
        { name: "DeepSeek-R1-Distill", desc: "Enhanced logic, mathematical proofs, and system debugging" },
        { name: "Llama-3.3-70B", desc: "Warm, natural communication & advanced brainstorming" }
    ];

    // Style options
    const styleOptions = [
        { value: "default", label: "Default Protocol Tone" },
        { value: "friendly", label: "Friendly Guide" },
        { value: "listener", label: "Empathetic Listener" },
        { value: "corp", label: "Corporate Strategy Advisor" },
        { value: "formal", label: "Formal/Academic Academician" }
    ];

    return (
        <>
            {/* 1. THE MINI ORB BUTTON (Circle + BLU Text - Draggable on Home Screen) */}
            <motion.div
                ref={buttonRef}
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
                            if (isAdmin) {
                                onToggleExpand?.(true); 
                            } else {
                                if (labBubbleTimeoutRef.current) {
                                    clearTimeout(labBubbleTimeoutRef.current);
                                }
                                setLabBubbleText("I'm still in the lab, they are working on my brain.");
                                labBubbleTimeoutRef.current = setTimeout(() => {
                                    setLabBubbleText(null);
                                }, 8000);
                            }
                        }}
                        whileHover={isAuthorized ? { scale: 1.1, boxShadow: "0 0 20px rgba(6, 182, 212, 0.3)" } : {}}
                        whileTap={isAuthorized ? { scale: 0.95 } : {}}
                        className={`relative w-12 h-12 rounded-full border backdrop-blur-3xl bg-black/40 flex items-center justify-center overflow-hidden transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.6)] ${
                            isAuthorized 
                                ? "border-cyan-500/40 group-hover:border-cyan-400" 
                                : "border-white/5 opacity-50 cursor-default"
                        }`}
                    >
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
                        
                        <span className={`relative text-[8px] font-black tracking-[0.3em] text-cyan-300 group-hover:text-white drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]`}>
                            BLU
                        </span>
                    </motion.button>
                </motion.div>
            </motion.div>

            {/* 💬 Speech bubble — anchored right of the BLU orb, exact reference design */}
            <AnimatePresence>
                {!isExpanded && (welcomeBubble?.message || labBubbleText) && (
                    <motion.div
                        key="orb-bubble"
                        initial={{ opacity: 0, x: -10, scale: 0.94 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -8, scale: 0.94 }}
                        transition={{ type: "spring", damping: 22, stiffness: 200, delay: 0.4 }}
                        className="fixed z-[86] pointer-events-auto"
                        style={{
                            left: position.x + 60,
                            top: position.y - 4,
                            width: 210,
                        }}
                    >
                        {/* Left-pointing tail toward the BLU orb */}
                        <div style={{
                            position: 'absolute',
                            left: '-7px',
                            top: '16px',
                            width: 0,
                            height: 0,
                            borderTop: '7px solid transparent',
                            borderBottom: '7px solid transparent',
                            borderRight: '8px solid rgba(14,30,38,0.93)',
                        }} />

                        {/* Dark glass card */}
                        <div style={{
                            background: 'rgba(14,30,38,0.93)',
                            backdropFilter: 'blur(20px) saturate(160%)',
                            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '14px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
                            padding: '12px 14px',
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            {/* Subtle inner highlight */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.05)' }} />

                            {/* • BLU INTELLIGENCE label */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '7px' }}>
                                <div style={{
                                    width: '7px', height: '7px', borderRadius: '50%',
                                    background: '#00e8ff',
                                    boxShadow: '0 0 6px rgba(0,232,255,0.8)',
                                    flexShrink: 0,
                                }} />
                                <span style={{
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    color: '#00e8ff',
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                }}>
                                    Blu Intelligence
                                </span>
                            </div>

                            {/* Message body */}
                            <p style={{
                                fontSize: '13px',
                                color: 'rgba(255,255,255,0.90)',
                                fontWeight: 400,
                                lineHeight: 1.45,
                                margin: 0,
                            }}>
                                {labBubbleText || welcomeBubble?.message}
                            </p>

                            {/* DISMISS */}
                            <button
                                onClick={labBubbleText ? () => setLabBubbleText(null) : welcomeBubble?.onDismiss}
                                style={{
                                    display: 'block',
                                    marginTop: '10px',
                                    fontSize: '10px',
                                    color: 'rgba(255,255,255,0.28)',
                                    fontWeight: 700,
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                }}
                            >
                                Dismiss
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. REDESIGNED FULL SCREEN COCOON COMMAND CENTER OVERLAY */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        className="fixed inset-0 z-[9999] bg-black flex flex-col overflow-hidden font-sans selection:bg-cyan-500/30"
                    >
                        {/* ──────────────────────────────────────────────────
                            TOP ROW CONTROLS — Below Telegram Back Button
                            Uses --tg-content-safe-area-inset-top so nothing
                            overlaps Telegram's native back button header.
                           ────────────────────────────────────────────────── */}
                        {/* 🌊 HEADER CONTROLS 🌊 */}
                        {/* Cocoon Dynamic Island pill — brought down 40pt total */}
                        <div 
                            className="absolute left-1/2 -translate-x-1/2 z-[101]"
                            style={{ top: 'calc((var(--tg-content-safe-area-inset-top, 56px) - 32px) / 2 + 40px)' }}
                        >
                            <motion.button 
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                onClick={() => onOpenCocoon?.()}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl hover:bg-white/10 transition-all group cursor-pointer"
                            >
                                <img 
                                    src="/cocoon_egg.webp" 
                                    alt="Cocoon" 
                                    loading="eager"
                                    className="w-4 h-5 object-contain filter drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-transform"
                                    onError={(e) => { (e.target as any).src = "https://cdn-icons-png.flaticon.com/512/3233/3233150.png" }}
                                />
                                <span className="text-[10px] font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                                    Cocoon
                                </span>
                            </motion.button>
                        </div>

                        {/* Left: Edge attached Sidebar toggle block — 43px below Telegram Back Button level, hides on scroll, z-[300] so it floats above all modals */}
                        <motion.button 
                            onClick={() => setIsSidebarOpen(prev => !prev)}
                            animate={{ 
                                x: isSidebarOpen ? 280 : 0,
                                opacity: isSidebarButtonHidden && !isSidebarOpen ? 0 : 1,
                                pointerEvents: isSidebarButtonHidden && !isSidebarOpen ? "none" : "auto"
                            }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="absolute left-0 w-8 h-16 rounded-r-xl bg-white/10 border-y border-r border-white/20 backdrop-blur-2xl text-cyan-400 hover:text-white shadow-[2px_0_10px_rgba(0,0,0,0.5)] active:scale-95 cursor-pointer z-[300] flex items-center justify-center"
                            style={{ top: 'calc(var(--tg-content-safe-area-inset-top, 56px) + 43px)' }}
                            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                        />

                        {/* Right: Liquid Glass Token Pill — 43px below Telegram Back Button level, hidden when token modal is open */}
                        <AnimatePresence>
                            {activeModal !== "tokens" && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: isPillDimmed ? 0.1 : 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-4 z-[101]"
                                    style={{ top: 'calc(var(--tg-content-safe-area-inset-top, 56px) + 43px)' }}
                                >
                                    <div 
                                        onClick={() => setActiveModal("tokens")}
                                        className="cursor-pointer bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/35 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_4px_15px_rgba(0,0,0,0.4)]"
                                    >
                                        <Coins size={12} className="text-amber-400" />
                                        <span className="text-xs font-black tracking-wide text-white">{formatTokenBalance(tokenBalance)}</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 🌌 BLU MATRIX RAIN (Activates when messaging has started) */}
                        <AnimatePresence>
                            {activeSession.messages.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.7 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1.2 }}
                                    className="absolute inset-0 pointer-events-none overflow-hidden z-0"
                                >
                                    <MatrixRain />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Background Ambient Glows */}
                        <div className="absolute inset-0 pointer-events-none z-0">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-cyan-500/5 blur-[120px] rounded-full" />
                            <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-purple-500/5 blur-[100px] rounded-full" />
                        </div>

                        {/* ──────────────────────────────────────────────────
                            MAIN CENTRAL ORB VIEW (Blurs/Fades out when messaging begins)
                           ────────────────────────────────────────────────── */}
                        <motion.div 
                            animate={{ 
                                filter: activeSession.messages.length > 0 ? "blur(8px)" : "blur(0px)",
                                opacity: activeSession.messages.length > 0 ? 0.2 : 1,
                                scale: activeSession.messages.length > 0 ? 0.92 : 1,
                            }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="flex-1 flex flex-col items-center justify-center px-8 absolute inset-0 z-0 pointer-events-none"
                            style={{ paddingTop: 'calc(var(--tg-content-safe-area-inset-top, 56px) + 50px)' }}
                        >
                            {/* Central Asset */}
                            <div className="relative mb-8">
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="relative w-48 h-48 flex items-center justify-center"
                                >
                                    <img 
                                        src="/blu_image.webp" 
                                        alt="Blu Orb" 
                                        loading="eager"
                                        className="w-40 h-40 object-contain relative z-20"
                                        onError={(e) => { (e.target as any).src = "https://cdn-icons-png.flaticon.com/512/3233/3233150.png" }}
                                    />
                                </motion.div>
                            </div>

                            {/* Welcome Text */}
                            <div className="text-center space-y-3">
                                <h1 className="text-3xl font-black text-white tracking-tighter">
                                    Hello, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Blu</span>
                                </h1>
                                <p className="text-white/40 text-sm font-medium tracking-wide uppercase text-[10px] tracking-[0.2em]">
                                    Bluewave intelligence agent
                                </p>
                            </div>
                        </motion.div>

                        {/* ──────────────────────────────────────────────────
                            MESSAGES CONTAINER
                           ────────────────────────────────────────────────── */}
                        <AnimatePresence>
                            {activeSession.messages.length > 0 && (
                                <motion.div 
                                    ref={chatContainerRef}
                                    onScroll={handleScroll}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 pb-44 px-6 overflow-y-auto z-10 flex flex-col gap-6 custom-scrollbar"
                                    style={{ paddingTop: 'calc(var(--tg-content-safe-area-inset-top, 56px) + 70px)' }}
                                >
                                    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
                                        {activeSession.messages.map((msg, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                            >
                                                {/* Message Bubble */}
                                                <div
                                                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed relative backdrop-blur-md shadow-md ${msg.role === "user"
                                                            ? "bg-white text-black font-semibold"
                                                            : "bg-white/5 text-gray-100 border border-white/10 prose prose-invert prose-p:leading-relaxed prose-a:text-cyan-400 prose-code:text-cyan-300 prose-code:bg-cyan-950/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-headings:text-white marker:text-cyan-500"
                                                        }`}
                                                >
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            </motion.div>
                                        ))}

                                        {/* Typewriter placeholder */}
                                        {isTyping && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex w-full justify-start"
                                            >
                                                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[14px] text-gray-300 max-w-[85%] prose prose-invert leading-relaxed backdrop-blur-md shadow-md">
                                                    <ReactMarkdown>{typingText}</ReactMarkdown>
                                                    <span className="inline-block w-1.5 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
                                                </div>
                                            </motion.div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ──────────────────────────────────────────────────
                            FOOTER PILLS & TACTICAL INPUT BAR
                           ────────────────────────────────────────────────── */}
                        <div className="mt-auto w-full max-w-4xl mx-auto px-6 pb-10 relative z-30 flex flex-col">
                            {/* Horizontal ready questions */}
                            <div className="relative w-full h-[38px] mb-2 pointer-events-none">
                                <AnimatePresence>
                                    {!isTyping && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-1"
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

                            {/* Main Input Row */}
                            <div className="flex items-end gap-2">
                                {/* Plus attachment button */}
                                <button
                                    onClick={() => alert("File attachment integrations are currently offline.")}
                                    className="shrink-0 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-95"
                                    title="Attach Media"
                                >
                                    <Plus size={20} />
                                </button>

                                {/* Defined Search Bar Container */}
                                <div className="flex-1 relative flex items-end gap-2 bg-[#121212]/90 border border-white/40 hover:border-white/50 focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/50 rounded-[2rem] p-1.5 pr-2 transition-all shadow-lg">
                                    {/* Models Dropdown */}
                                    <AnimatePresence>
                                        {isModelsDropdownOpen && (
                                            <motion.div
                                                ref={dropdownRef}
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute bottom-full right-2 mb-2 w-64 bg-[#0c0c0c]/90 border border-white/10 backdrop-blur-3xl shadow-[0_12px_40px_rgba(0,0,0,0.9)] rounded-xl z-50 p-2 overflow-hidden flex flex-col text-left"
                                            >
                                                <div className="px-2.5 py-1.5 border-b border-white/5 mb-1.5 flex justify-between items-center">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                                        Select Model
                                                    </span>
                                                    <span className="text-[9px] font-bold text-cyan-400 font-mono">
                                                        {activeSession.model}
                                                    </span>
                                                </div>
                                                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 pr-0.5">
                                                    {modelsList.map((m) => {
                                                        const isSelected = activeSession.model === m.name;
                                                        return (
                                                            <button
                                                                key={m.name}
                                                                onClick={() => handleModelChange(m.name)}
                                                                className={`w-full px-2.5 py-2 rounded-lg text-left flex items-start justify-between transition-all cursor-pointer ${
                                                                    isSelected
                                                                        ? 'bg-cyan-500/10 text-white'
                                                                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                                                                }`}
                                                            >
                                                                <div className="space-y-0.5 pr-2">
                                                                    <div className="text-[11px] font-black">{m.name}</div>
                                                                    <div className="text-[9px] text-gray-400 leading-tight">{m.desc}</div>
                                                                </div>
                                                                {isSelected && (
                                                                    <div className="w-4 h-4 rounded-full bg-cyan-500 text-black flex items-center justify-center shrink-0 mt-0.5">
                                                                        <Check size={10} strokeWidth={3} />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type a message to Blu..."
                                        className="flex-1 max-h-24 min-h-[34px] bg-transparent text-white placeholder:text-gray-400 resize-none px-3 py-2 focus:outline-none text-[14px] leading-relaxed custom-scrollbar font-medium"
                                        rows={1}
                                        disabled={isTyping}
                                    />

                                    {/* Auto badge inside search bar */}
                                    <button
                                        onClick={() => setIsModelsDropdownOpen(prev => !prev)}
                                        className="shrink-0 px-1.5 py-0.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400/90 text-[9px] font-black uppercase tracking-wider transition-colors mr-1 self-center cursor-pointer"
                                    >
                                        Auto
                                    </button>

                                    {/* Send button */}
                                    <button
                                        onClick={() => handleSend()}
                                        disabled={!input.trim() || isTyping}
                                        className="shrink-0 w-8 h-8 rounded-xl bg-cyan-500 text-black flex items-center justify-center hover:bg-cyan-400 disabled:opacity-30 disabled:bg-white/10 disabled:text-gray-500 transition-colors self-center cursor-pointer"
                                    >
                                        <Send size={14} className="translate-x-[0.5px]" />
                                    </button>
                                </div>
                            </div>

                            {/* Subtext info warning (highly visible) */}
                            <div className="text-center mt-2">
                                <p className="text-[10px] text-gray-300 font-bold tracking-wide">
                                    Blu Intelligence can make mistakes. Verify important profile data.
                                </p>
                            </div>
                        </div>

                        {/* ──────────────────────────────────────────────────
                            LIQUID GLASS SIDEBAR MENU — z-[250] so it overlays token/settings modals
                           ────────────────────────────────────────────────── */}
                        <AnimatePresence>
                            {isSidebarOpen && (
                                <>
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[240]"
                                    />

                                    <motion.div
                                        initial={{ x: "-100%" }}
                                        animate={{ x: 0 }}
                                        exit={{ x: "-100%" }}
                                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                        className="absolute left-0 bottom-0 w-[280px] bg-[#080808]/95 backdrop-blur-2xl border-r border-white/15 z-[250] flex flex-col pt-3 pb-[env(safe-area-inset-bottom,20px)]"
                                        style={{ top: 'calc(var(--tg-content-safe-area-inset-top, 56px) + 18px)' }}
                                    >
                                        <div className="p-4 border-b border-white/10">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-full overflow-hidden border border-cyan-500/30 flex items-center justify-center bg-cyan-500/10 shrink-0">
                                                    {(userAvatarUrl || telegramUser?.photo_url) ? (
                                                        <img src={userAvatarUrl || telegramUser?.photo_url} alt="User Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="text-cyan-400" size={18} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black tracking-wide text-white">BW ID</div>
                                                    <div className="text-[10px] text-gray-400 font-semibold font-mono">
                                                        {telegramUser?.wallet_address ? (telegramUser?.bw_id || "not assigned") : "not assigned"}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-1.5">
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-gray-400">Lifetime Entropy</span>
                                                    <span className="text-cyan-400 font-black">
                                                        {formatLifetimeEntropy(telegramUser?.lifetime_entropy ?? 0)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-gray-400">TON Wallet</span>
                                                    {telegramUser?.wallet_address ? (
                                                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                                                            Connected <UserCheck size={10} />
                                                        </span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => onNavigateToTab?.("profile")}
                                                            className="px-2 py-0.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                                                        >
                                                            Connect
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                                            <button
                                                onClick={handleNewChat}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black text-cyan-400 bg-cyan-950/20 border border-cyan-500/30 hover:bg-cyan-950/40 transition-all text-left shadow-sm active:scale-[0.98] cursor-pointer"
                                            >
                                                <PlusCircle size={16} />
                                                <span>New Chat Session</span>
                                            </button>

                                            <div className="h-px bg-white/5 my-2" />

                                            <button
                                                onClick={() => { setActiveModal("tokens"); setIsSidebarOpen(false); }}
                                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Coins size={16} className="text-amber-400" />
                                                    <span>My Tokens</span>
                                                </div>
                                                <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] text-white font-mono">{tokenBalance}</span>
                                            </button>

                                            <button
                                                onClick={() => { setIsModelsDropdownOpen(true); setIsSidebarOpen(false); }}
                                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Bot size={16} className="text-purple-400" />
                                                    <span>LLM Model</span>
                                                </div>
                                                <span className="text-[9px] text-purple-400 bg-purple-950/30 border border-purple-500/20 px-1.5 py-0.5 rounded font-mono">{activeSession.model}</span>
                                            </button>

                                            <button
                                                onClick={() => { setActiveModal("settings"); setIsSidebarOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left cursor-pointer"
                                            >
                                                <Settings size={16} className="text-gray-400" />
                                                <span>Settings</span>
                                            </button>

                                            <div className="h-px bg-white/5 my-2" />

                                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-4 py-1">
                                                Recent Sessions
                                            </div>
                                            <div className="space-y-1">
                                                {sessions.map((s) => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => { setActiveSessionId(s.id); setIsSidebarOpen(false); }}
                                                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs transition-all text-left border cursor-pointer ${
                                                            s.id === activeSessionId
                                                                ? 'bg-white/10 border-white/15 text-white'
                                                                : 'text-gray-400 hover:text-white border-transparent'
                                                        }`}
                                                    >
                                                        <span className="truncate max-w-[140px]">{s.title}</span>
                                                        <span className="text-[9px] text-gray-600 font-mono">{s.timestamp}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>

                        {/* ──────────────────────────────────────────────────
                            SUB MODAL STACKS — z-[200], sidebar sits above at z-[250]
                           ────────────────────────────────────────────────── */}
                        <AnimatePresence>
                            {activeModal && (
                                <motion.div
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    exit={{ y: "100%" }}
                                    transition={{ type: "spring", damping: 30, stiffness: 250 }}
                                    className="absolute inset-0 bg-[#030303] z-[200] flex flex-col pt-[58px]"
                                >
                                    {activeModal !== "tokens" ? (
                                        <div className="shrink-0 h-[48px] px-4 border-b border-white/5 flex items-center" />
                                    ) : (
                                        <div className="shrink-0 h-4" />
                                    )}

                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-12">
                                        {/* Tokens Topup list */}
                                        {activeModal === "tokens" && (
                                            <div className="space-y-6">
                                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-2 relative overflow-hidden shadow-2xl">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
                                                    <Coins size={36} className="text-amber-400 mx-auto" />
                                                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Active Balance</div>
                                                    <div className="text-4xl font-black text-white">{tokenBalance}</div>
                                                    <p className="text-[11px] text-gray-300 max-w-xs mx-auto">
                                                        Tokens fund intelligence features, routing validation telemetry, and dynamic AI personality layers.
                                                    </p>
                                                </div>

                                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Top-up Packages</h3>

                                                <div className="grid grid-cols-1 gap-3">
                                                    {[
                                                        { name: "Starter Star Pack", count: 100, price: "$0.99", desc: "Perfect for quick answers" },
                                                        { name: "Pro Signal Booster", count: 500, price: "$3.99", desc: "For extensive research analysis" },
                                                        { name: "Protocol Validator", count: 1200, price: "$6.99", desc: "Heavy developer usage tier" }
                                                    ].map((pack) => (
                                                        <div 
                                                            key={pack.name}
                                                            className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                                                        >
                                                            <div className="space-y-1">
                                                                <div className="text-xs font-black text-white">{pack.name}</div>
                                                                <div className="text-[10px] text-gray-300">{pack.desc}</div>
                                                                <div className="text-[11px] text-amber-400 font-black">
                                                                    +{pack.count} tokens
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    setTokenBalance(prev => prev + pack.count);
                                                                    alert(`Purchased ${pack.count} tokens successfully!`);
                                                                }}
                                                                className="px-3 py-2 rounded-lg bg-cyan-50 hover:bg-cyan-400 text-black text-xs font-black tracking-wider transition-all cursor-pointer"
                                                            >
                                                                {pack.price}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Models Selector list is handled by the floating dropdown */}

                                        {/* Personality settings */}
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
                                                            placeholder="Provide prompt details..."
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
                                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black text-xs font-black uppercase tracking-widest transition-all shadow-lg text-center cursor-pointer"
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

        const chars = "01アイウエオカキクケコサシスセソタチツテト◈⬡∞ΔABCDEF0123456789⬢◆▲♦><#@!";
        const fontSize = 11;
        const cols = Math.floor(canvas.width / fontSize);

        const drops: number[] = Array.from({ length: cols }, () => Math.random() * -100);

        const brandPalettes = [
            { head: "rgba(255,255,255,0.95)", body: "rgba(34,211,238,0.85)", mid: "rgba(34,211,238,0.5)", tail: "rgba(34,211,238,0.15)" },
            { head: "rgba(255,255,255,0.95)", body: "rgba(168,85,247,0.85)", mid: "rgba(168,85,247,0.5)", tail: "rgba(168,85,247,0.15)" },
            { head: "rgba(255,255,255,0.95)", body: "rgba(59,130,246,0.85)", mid: "rgba(59,130,246,0.5)", tail: "rgba(59,130,246,0.15)" },
            { head: "rgba(255,255,255,0.95)", body: "rgba(99,102,241,0.85)", mid: "rgba(99,102,241,0.5)", tail: "rgba(99,102,241,0.15)" },
        ];

        const colPalettes = Array.from({ length: cols }, () =>
            brandPalettes[Math.floor(Math.random() * brandPalettes.length)]
        );

        const speeds = Array.from({ length: cols }, (_, i) => 1.2 + ((i * 7) % 9) / 6);

        let animId: number;
        const draw = () => {
            ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const palette = colPalettes[i];
                const char = chars[Math.floor(Math.random() * chars.length)];
                const x = i * fontSize;
                const y = Math.floor(drops[i]) * fontSize;

                ctx.fillStyle = palette.head;
                ctx.shadowColor = palette.body;
                ctx.shadowBlur = 8;
                ctx.fillText(char, x, y);

                if (y > fontSize) {
                    ctx.fillStyle = palette.body;
                    ctx.shadowBlur = 4;
                    ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, y - fontSize);
                }

                ctx.shadowBlur = 0;

                drops[i] += speeds[i];

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
