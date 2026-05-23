"use client";

import { useState, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Plus,
  Send,
  Settings,
  Zap,
  Check,
  X,
  Menu,
  Sparkles,
  Bot,
  Egg,
} from "lucide-react";

interface Message {
  role: "user" | "blu";
  content: string;
  timestamp: string;
}

interface BluAgentProps {
  isExpanded?: boolean;
  onClose?: () => void;
  userTokens?: number;
  userBWID?: string;
  userPresenceScore?: number;
  userLevel?: number;
}

const SUGGESTED_QUESTIONS = [
  "How do I connect my TON wallet?",
  "What is PresenceFi?",
  "My account details",
  "Rewards & missions",
];

// ========== KNOWLEDGE BASE (Backend-ready) ==========
const KNOWLEDGE_BASE: Record<string, string> = {
  wallet: `To connect your TON wallet:
  
1️⃣ Tap Settings in the sidebar
2️⃣ Select "Connect Wallet"
3️⃣ Choose TonConnect
4️⃣ Approve in your mobile wallet
5️⃣ Done! Your wallet is linked

✅ Your TON wallet is now registered to your Bluewave account and ready for deposits.`,

  presencefi: `PresenceFi is Bluewave's core infrastructure that rewards *real human activity*.

It combines three scores:
💎 HumanScore — behavioral patterns
⭐ StreakScore — consistency rewards  
🎯 PresenceScore — activity depth

Unlike farming bots, PresenceFi detects genuine humans through timing analysis, interaction patterns, and presence mining.

💰 Earn tokens for verified presence, not automation.`,

  account: `Here's your Bluewave Account:

🆔 ID: {BWID}
🏆 Presence Score: {SCORE}
⭐ Level: {LEVEL}
💰 Tokens: {TOKENS}

Backend call: GET /user/{tg_id} from Supabase`,

  rewards: `You earn rewards through:

✅ Daily Missions (+100-500 points)
✅ Streaks (2x multiplier for consistency)
✅ Referrals (+50 per active friend)
✅ Presence Activities (varies by type)

📊 Max daily earnings: 2,000 tokens
💸 Withdraw anytime to your TON wallet`,

  default: `I'm Blu, your Bluewave guide. I can help with:
• Wallet connection
• PresenceFi explained
• Your account details
• Rewards & missions

What would you like to know?`,
};

export default function BluAgent({
  isExpanded = false,
  onClose,
  userTokens = 50,
  userBWID = "BW_abc123xyz",
  userPresenceScore = 8450,
  userLevel = 5,
}: BluAgentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"tokens" | "settings" | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showMatrixRain, setShowMatrixRain] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isExpanded]);

  const showSuggestions = messages.length === 0 && !isLoading;

  // ========== SMART RESPONSE GENERATOR ==========
  const generateBluResponse = (question: string): string => {
    const q = question.toLowerCase();

    if (q.includes("wallet") || q.includes("connect"))
      return KNOWLEDGE_BASE.wallet;

    if (q.includes("presence") && q.includes("fi"))
      return KNOWLEDGE_BASE.presencefi;

    if (q.includes("presencefi"))
      return KNOWLEDGE_BASE.presencefi;

    if (q.includes("account") || q.includes("detail") || q.includes("my info"))
      return KNOWLEDGE_BASE.account
        .replace("{BWID}", userBWID)
        .replace("{SCORE}", userPresenceScore.toString())
        .replace("{LEVEL}", userLevel.toString())
        .replace("{TOKENS}", userTokens.toString());

    if (q.includes("reward") || q.includes("earn") || q.includes("mission"))
      return KNOWLEDGE_BASE.rewards;

    return KNOWLEDGE_BASE.default;
  };

  const handleSendMessage = (questionText?: string) => {
    const textToSend = questionText || inputValue.trim();
    if (!textToSend) return;

    setInputValue("");
    setShowMatrixRain(true); // Trigger matrix rain effect

    const userMsg: Message = {
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMsg]);

    setIsTyping(true);
    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const bluMsg: Message = {
        role: "blu",
        content: generateBluResponse(textToSend),
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, bluMsg]);
      setIsTyping(false);
      setIsLoading(false);
      setShowMatrixRain(false); // Stop matrix rain after response
    }, 2500);
  };

  const handleNewChat = () => {
    setMessages([]);
    setInputValue("");
    setActiveModal(null);
    inputRef.current?.focus();
  };

  const TokensModal = () => (
    <FullscreenModal title="My Tokens" onClose={() => setActiveModal(null)}>
      <div className="px-6 py-6 space-y-6 pb-12">
        <div className="text-center">
          <p className="text-white/60 text-xs mb-2 uppercase tracking-widest">
            Current Balance
          </p>
          <h2 className="text-5xl font-black text-cyan-400 mb-2">{userTokens}</h2>
          <p className="text-white/40 text-xs">Bluewave Tokens</p>
        </div>

        <button className="w-full py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-all uppercase text-xs tracking-widest">
          Buy More
        </button>

        <div>
          <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">
            Recent Topups
          </p>
          <div className="space-y-2">
            {[
              { amount: 20, date: "Today" },
              { amount: 30, date: "Yesterday" },
            ].map((topup, idx) => (
              <div key={idx} className="flex justify-between text-xs p-3 rounded-lg bg-white/5">
                <span className="text-white">+{topup.amount} Tokens</span>
                <span className="text-white/40">{topup.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FullscreenModal>
  );

  const SettingsModal = () => (
    <FullscreenModal title="Settings" onClose={() => setActiveModal(null)}>
      <div className="px-6 py-6 space-y-6 pb-12">
        <div>
          <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-3">
            Communication Style
          </label>
          <select className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50">
            <option>Friendly</option>
            <option>Formal</option>
            <option>Listener</option>
          </select>
        </div>

        <button className="w-full py-3 bg-cyan-500 text-black font-bold rounded-lg uppercase text-xs tracking-widest hover:bg-cyan-400 transition-all">
          Save Settings
        </button>
      </div>
    </FullscreenModal>
  );

  if (!isExpanded) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-[#030303] flex flex-col overflow-hidden"
      >
        {/* ========== COCOON PILL (Dynamic Island Style) ========== */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[101]">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-2xl bg-white/5 border border-white/10"
          >
            <Egg size={14} className="text-purple-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">
              Cocoon
            </span>
          </motion.div>
        </div>

        {/* ========== MATRIX RAIN EFFECT ========== */}
        {showMatrixRain && <MatrixRain />}

        {/* ========== HEADER ========== */}
        <header className="relative border-b border-white/5 bg-[#030303]/80 backdrop-blur-xl px-4 py-4 pt-16">
          <div className="flex items-center justify-between">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onClose}
              className="p-2 -ml-2 rounded-full hover:bg-white/5 text-white"
            >
              <ChevronLeft size={20} />
            </motion.button>

            <div className="text-center flex-1">
              <h1 className="text-xs font-black uppercase tracking-widest text-cyan-400">
                Blu Guide
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                onClick={() => setActiveModal("tokens")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-xl bg-white/5 border border-white/10 cursor-pointer hover:border-cyan-500/30 transition-all"
              >
                <Zap size={12} className="text-yellow-400" />
                <span className="text-xs font-bold text-white">{userTokens}</span>
              </motion.div>

              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -mr-2 rounded-full hover:bg-white/5 text-white"
              >
                <Menu size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* ========== MAIN CONTENT ========== */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center px-6 py-12 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center mb-6"
              >
                <Bot size={40} className="text-cyan-400" />
              </motion.div>

              <h2 className="text-xl font-black text-white mb-2">
                Hello, I'm <span className="text-cyan-400">Blu</span>
              </h2>
              <p className="text-white/50 text-xs mb-8 max-w-xs leading-relaxed">
                Your Bluewave guide. Ask me about wallets, PresenceFi, your account,
                or rewards.
              </p>

              {/* User Info Cards */}
              <div className="grid grid-cols-3 gap-2 w-full mb-8">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center">
                  <p className="text-[9px] text-white/40 uppercase mb-1">ID</p>
                  <p className="text-[10px] font-bold text-cyan-400 truncate">
                    {userBWID}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center">
                  <p className="text-[9px] text-white/40 uppercase mb-1">Score</p>
                  <p className="text-[10px] font-bold text-cyan-400">
                    {userPresenceScore}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center">
                  <p className="text-[9px] text-white/40 uppercase mb-1">Level</p>
                  <p className="text-[10px] font-bold text-cyan-400">{userLevel}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="px-6 py-6 space-y-4">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-50 rounded-br-none"
                        : "bg-white/5 border border-white/10 text-white/80 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-xs">{msg.content}</p>
                    <p className="text-[9px] mt-1 opacity-30">{msg.timestamp}</p>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce animation-delay-200" />
                  <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce animation-delay-400" />
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* ========== SUGGESTED PILLS ========== */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-6 pb-4 border-t border-white/5"
            >
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => handleSendMessage(q)}
                    className="px-3 py-1.5 rounded-full text-[10px] font-bold text-white backdrop-blur-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 whitespace-nowrap transition-all flex-shrink-0"
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========== INPUT AREA ========== */}
        <div className="border-t border-white/5 bg-[#030303]/80 backdrop-blur-xl px-4 py-3">
          <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-xl p-1 flex items-center gap-2">
            <button
              onClick={handleNewChat}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-cyan-400 transition-all"
            >
              <Plus size={18} />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-white/20 py-2"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim()}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-20 enabled:bg-cyan-500 enabled:text-black enabled:hover:bg-cyan-400"
            >
              <Send size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ========== SIDEBAR ========== */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
              />

              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                className="fixed left-0 top-0 z-[9999] w-72 h-full bg-[#030303] border-r border-white/5 overflow-y-auto custom-scrollbar flex flex-col"
              >
                <div className="px-4 py-4 border-b border-white/5">
                  <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-white/5 rounded-lg">
                    <X size={18} className="text-white" />
                  </button>
                  <h2 className="text-xs font-black uppercase tracking-widest text-white mt-4">
                    Menu
                  </h2>
                </div>

                <div className="flex-1 px-4 py-4 space-y-2">
                  <button
                    onClick={() => {
                      setActiveModal("tokens");
                      setIsSidebarOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-all text-sm flex items-center justify-between"
                  >
                    <span>My Tokens</span>
                    <span className="text-xs bg-cyan-500/20 px-2 py-1 rounded-full">{userTokens}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveModal("settings");
                      setIsSidebarOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-all text-sm"
                  >
                    Settings
                  </button>

                  <button
                    onClick={() => {
                      handleNewChat();
                      setIsSidebarOpen(false);
                    }}
                    className="w-full mt-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold rounded-lg text-xs uppercase hover:border-cyan-500/50 transition-all"
                  >
                    + New Chat
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ========== MODALS ========== */}
        <AnimatePresence>
          {activeModal === "tokens" && <TokensModal />}
          {activeModal === "settings" && <SettingsModal />}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

function FullscreenModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-[#030303] flex flex-col overflow-hidden"
    >
      <div className="border-b border-white/5 px-4 py-4">
        <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg mb-3">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <h2 className="text-xs font-black uppercase tracking-widest text-white">
          {title}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">{children}</div>
    </motion.div>
  );
}

// ========== MATRIX RAIN COMPONENT ========== 
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

    const chars = "01アイウエオカキクケコサシスセソタチツテト◈⬡∞ΔBW_⬢◆";
    const fontSize = 14;
    const cols = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array.from({ length: cols }, () => Math.random() * -100);

    const brandPalettes = [
      { head: "rgba(255,255,255,0.95)", body: "rgba(34,211,238,0.85)" },
      { head: "rgba(255,255,255,0.95)", body: "rgba(168,85,247,0.85)" },
      { head: "rgba(255,255,255,0.95)", body: "rgba(59,130,246,0.85)" },
    ];

    const colPalettes = Array.from({ length: cols }, () =>
      brandPalettes[Math.floor(Math.random() * brandPalettes.length)]
    );

    const speeds = Array.from({ length: cols }, (_, i) => 1.5 + ((i * 7) % 9) / 8);

    let animId: number;
    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
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
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.4 }}
    />
  );
});
