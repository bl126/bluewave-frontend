"use client";

import { useState, useRef, useEffect, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Plus,
  Send,
  Settings,
  Zap,
  MessageSquare,
  History,
  Check,
  X,
  Menu,
  Sparkles,
  Wallet,
  Bot,
} from "lucide-react";

interface Message {
  role: "user" | "blu";
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  messageCount: number;
}

interface LLMModel {
  id: string;
  name: string;
  description: string;
}

interface BluAgentProps {
  isExpanded?: boolean;
  onClose?: () => void;
  telegramUser?: any;
  userTokens?: number;
  userBWID?: string;
  userPresenceScore?: number;
}

const MOCK_LLM_MODELS: LLMModel[] = [
  { id: "gpt4", name: "GPT-4 Turbo", description: "Advanced reasoning" },
  { id: "claude", name: "Claude 3.5", description: "Long context understanding" },
  { id: "local", name: "Bluewave Local", description: "Privacy-first processing" },
];

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: "1", title: "How to activate presence", timestamp: "Today", messageCount: 5 },
  { id: "2", title: "What is PresenceFi?", timestamp: "Yesterday", messageCount: 3 },
  { id: "3", title: "Wallet connection guide", timestamp: "2 days ago", messageCount: 8 },
];

const SUGGESTED_QUESTIONS = [
  "How do I connect my TON wallet?",
  "What is PresenceFi?",
  "How to activate presence?",
  "Tell me about rewards",
];

export default function BluAgent({
  isExpanded = false,
  onClose,
  telegramUser,
  userTokens = 50,
  userBWID = "BW_abc123xyz",
  userPresenceScore = 8450,
}: BluAgentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<
    "tokens" | "models" | "settings" | null
  >(null);
  const [selectedModel, setSelectedModel] = useState("gpt4");
  const [communicationStyle, setCommunicationStyle] = useState("friendly");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isExpanded) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isExpanded]);

  // Auto-hide suggestions when agent starts typing
  const showSuggestions = !isLoading && messages.length === 0;

  const handleSendMessage = (questionText?: string) => {
    const textToSend = questionText || inputValue.trim();
    if (!textToSend) return;

    // Hide suggestions immediately
    setInputValue("");

    // Add user message
    const userMsg: Message = {
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Simulate agent typing
    setIsTyping(true);
    setIsLoading(true);

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
    }, 2500);
  };

  const generateBluResponse = (question: string): string => {
    if (question.toLowerCase().includes("wallet"))
      return "To connect your TON wallet:\n1. Tap the wallet icon\n2. Select TonConnect\n3. Approve in your wallet app\n✅ Connected! Your address is now linked to your Bluewave account.";
    if (question.toLowerCase().includes("presence"))
      return "Presence is verified human activity detected through timing, interaction patterns, and behavioral signals. Activate by:\n• Completing daily missions\n• Engaging in presence activities\n• Building your streak\n🌊 Your current presence score: 8450";
    if (question.toLowerCase().includes("presencefi"))
      return "PresenceFi is Bluewave's core innovation—infrastructure that rewards *real* human activity instead of bots. It combines:\n💎 HumanScore (behavioral verification)\n⭐ StreakScore (consistency)\n🎯 PresenceScore (activity depth)\nUsers earn tokens for verified presence.";
    if (question.toLowerCase().includes("reward"))
      return "You earn rewards by:\n• Completing missions (+100-500 points)\n• Maintaining streaks (2x multiplier)\n• Referral bonuses (+50 per active referral)\n📊 Your current balance: 50 tokens\nWithdraw anytime to your wallet.";
    return "I'm Blu, your Bluewave guide. I can help you with:\n• Wallet setup\n• Understanding PresenceFi\n• Missions & rewards\n• Account settings\n\nWhat would you like to know?";
  };

  const handleNewChat = () => {
    setMessages([]);
    setInputValue("");
    setActiveModal(null);
    inputRef.current?.focus();
  };

  // Modal Components
  const TokensModal = () => (
    <FullscreenModal title="My Tokens" onClose={() => setActiveModal(null)}>
      <div className="space-y-6 px-6 pb-12">
        {/* Current Balance */}
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10" />
          <div className="relative backdrop-blur-2xl bg-white/5 border border-white/10 p-8 text-center">
            <p className="text-white/60 text-sm mb-2">Total Balance</p>
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">
              {userTokens}
            </h2>
            <p className="text-white/40 text-xs uppercase tracking-widest">
              Bluewave Tokens
            </p>
          </div>
        </div>

        {/* Topup History */}
        <div>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <History size={16} />
            Recent Topups
          </h3>
          <div className="space-y-3">
            {[
              { amount: 20, date: "Today", type: "TON Direct" },
              { amount: 30, date: "Yesterday", type: "Buy Stars" },
            ].map((topup, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <div>
                  <p className="text-white font-semibold text-sm">
                    +{topup.amount} Tokens
                  </p>
                  <p className="text-white/40 text-xs">{topup.type}</p>
                </div>
                <p className="text-white/60 text-xs">{topup.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-2xl hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all uppercase text-sm tracking-wide">
          Buy More Tokens
        </button>
      </div>
    </FullscreenModal>
  );

  const ModelsModal = () => (
    <FullscreenModal title="LLM Models" onClose={() => setActiveModal(null)}>
      <div className="space-y-4 px-6 pb-12">
        {MOCK_LLM_MODELS.map((model) => (
          <button
            key={model.id}
            onClick={() => {
              setSelectedModel(model.id);
              setActiveModal(null);
            }}
            className="w-full text-left p-4 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-white font-semibold text-sm group-hover:text-cyan-400 transition-colors">
                  {model.name}
                </h4>
                <p className="text-white/40 text-xs mt-1">{model.description}</p>
              </div>
              {selectedModel === model.id && (
                <Check size={20} className="text-cyan-400 shrink-0 mt-0.5" />
              )}
            </div>
          </button>
        ))}
      </div>
    </FullscreenModal>
  );

  const SettingsModal = () => (
    <FullscreenModal title="Settings" onClose={() => setActiveModal(null)}>
      <div className="space-y-8 px-6 pb-12">
        {/* Personality Section */}
        <section>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles size={16} />
            Personality
          </h3>
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest">
              Communication Style
            </label>
            <select
              value={communicationStyle}
              onChange={(e) => setCommunicationStyle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
            >
              <option value="friendly">Friendly & Casual</option>
              <option value="formal">Formal & Professional</option>
              <option value="listener">Listener & Empathetic</option>
              <option value="corp">Corporate</option>
            </select>
          </div>
        </section>

        {/* Edit Custom Personality */}
        <section>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-3">
            Custom Personality (Optional)
          </label>
          <textarea
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 resize-none"
            placeholder="Describe how you'd like Blu to interact with you..."
            rows={4}
            defaultValue="Helpful, clear, and concise"
          />
        </section>

        {/* Update Button */}
        <button className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-2xl hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all uppercase text-sm tracking-wide">
          Update Settings
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
        className="fixed inset-0 z-[9999] bg-[#030303] flex flex-col overflow-hidden safe-area"
      >
        {/* ========== HEADER WITH SAFE AREA ========== */}
        <header className="relative border-b border-white/5 bg-[#030303]/80 backdrop-blur-xl pt-4 pb-4">
          <div className="px-4 flex items-center justify-between">
            {/* Left: Back Button */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onClose}
              className="p-2 -ml-2 rounded-full hover:bg-white/5 text-white transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft size={24} />
            </motion.button>

            {/* Center: Title */}
            <div className="flex-1 text-center">
              <h1 className="text-sm font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Blu Guide
              </h1>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">
                Bluewave Intelligence
              </p>
            </div>

            {/* Right: Token Pill */}
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
              onClick={() => setActiveModal("tokens")}
            >
              <Zap size={14} className="text-yellow-400" />
              <span className="text-xs font-black text-white tracking-widest">
                {userTokens}
              </span>
            </motion.div>

            {/* Hamburger Menu */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -mr-2 rounded-full hover:bg-white/5 text-white transition-colors ml-2"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </motion.button>
          </div>
        </header>

        {/* ========== MAIN CONTENT AREA ========== */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          {/* Welcome State */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex flex-col items-center justify-center px-6 py-12 text-center"
            >
              {/* Blu Avatar */}
              <motion.div
                animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="mb-8"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <Bot size={48} className="text-cyan-400" />
                </div>
              </motion.div>

              <h2 className="text-2xl font-black text-white mb-2">
                Hello, I'm <span className="text-cyan-400">Blu</span>
              </h2>
              <p className="text-white/50 text-sm mb-12 max-w-xs">
                Your personal Bluewave guide. I can help you understand wallets,
                PresenceFi, missions, and more.
              </p>

              {/* User Info Cards */}
              {userBWID && (
                <div className="grid grid-cols-3 gap-3 w-full mb-12">
                  <div className="p-3 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
                      ID
                    </p>
                    <p className="text-xs font-bold text-cyan-400">{userBWID}</p>
                  </div>
                  <div className="p-3 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
                      Score
                    </p>
                    <p className="text-xs font-bold text-cyan-400">
                      {userPresenceScore}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
                      Level
                    </p>
                    <p className="text-xs font-bold text-cyan-400">5</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Chat Messages */}
          {messages.length > 0 && (
            <div className="px-6 py-6 space-y-6">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs p-4 rounded-2xl backdrop-blur-xl border ${
                      msg.role === "user"
                        ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-50 rounded-br-none"
                        : "bg-white/5 border-white/10 text-white/80 rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <p className="text-[10px] mt-2 opacity-40">
                      {msg.timestamp}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-1"
                >
                  <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce animation-delay-200" />
                  <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce animation-delay-400" />
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* ========== SUGGESTED QUESTIONS (With Auto-hide) ========== */}
        <AnimatePresence>
          {showSuggestions && messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="px-6 pb-4"
            >
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3">
                Try asking:
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {SUGGESTED_QUESTIONS.map((question, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => handleSendMessage(question)}
                    className="px-3 py-2 rounded-full backdrop-blur-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 text-white text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
                  >
                    {question}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========== INPUT AREA WITH SAFE AREA ========== */}
        <div className="relative border-t border-white/5 bg-[#030303]/80 backdrop-blur-xl px-6 py-4 pb-safe">
          {/* Input Container (Liquid Glass) */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-[40px] rounded-2xl p-1 flex items-center gap-2 shadow-2xl overflow-hidden">
            {/* Plus Button (Circular, Separate) */}
            <button
              onClick={() => handleNewChat()}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-cyan-400 hover:bg-white/10 transition-all flex-shrink-0"
            >
              <Plus size={20} />
            </button>

            {/* Search/Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask Blu anything..."
              className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-white/20 py-3"
            />

            {/* Model Selector (Auto button) */}
            <button
              onClick={() => setActiveModal("models")}
              className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:bg-white/10 transition-all flex-shrink-0"
            >
              Auto
            </button>

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-20 disabled:cursor-not-allowed enabled:bg-gradient-to-br enabled:from-cyan-400 enabled:to-blue-600 enabled:text-black enabled:shadow-[0_0_20px_rgba(6,182,212,0.4)] enabled:hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
            >
              <Send size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ========== SIDEBAR ========== */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
              />

              {/* Sidebar Panel */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 20 }}
                className="fixed left-0 top-0 z-[9999] w-80 h-full bg-[#030303] border-r border-white/5 overflow-y-auto custom-scrollbar flex flex-col pt-4"
              >
                {/* Sidebar Header */}
                <div className="px-6 pb-6 border-b border-white/5">
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="mb-4 p-2 -ml-2 rounded-full hover:bg-white/5"
                  >
                    <X size={20} className="text-white" />
                  </button>
                  <h2 className="text-sm font-black text-white uppercase tracking-widest">
                    Menu
                  </h2>
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 px-6 py-6 space-y-2">
                  {/* My Tokens */}
                  <SidebarItem
                    icon={<Zap size={18} />}
                    label="My Tokens"
                    badge={userTokens}
                    onClick={() => {
                      setActiveModal("tokens");
                      setIsSidebarOpen(false);
                    }}
                  />

                  {/* LLM Models */}
                  <SidebarItem
                    icon={<Bot size={18} />}
                    label="AI Models"
                    badge={selectedModel}
                    onClick={() => {
                      setActiveModal("models");
                      setIsSidebarOpen(false);
                    }}
                  />

                  {/* Settings */}
                  <SidebarItem
                    icon={<Settings size={18} />}
                    label="Settings"
                    onClick={() => {
                      setActiveModal("settings");
                      setIsSidebarOpen(false);
                    }}
                  />
                </div>

                {/* Sidebar Footer: Recent Conversations */}
                <div className="px-6 py-6 border-t border-white/5">
                  <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">
                    <History size={12} className="inline mr-1" />
                    Recent
                  </h3>
                  <div className="space-y-2">
                    {MOCK_CONVERSATIONS.map((conv) => (
                      <button
                        key={conv.id}
                        className="w-full text-left p-3 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5 transition-all truncate"
                      >
                        {conv.title}
                      </button>
                    ))}
                  </div>

                  {/* New Chat Button */}
                  <button
                    onClick={() => {
                      handleNewChat();
                      setIsSidebarOpen(false);
                    }}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 font-bold rounded-lg hover:border-cyan-500/50 transition-all text-xs uppercase tracking-widest"
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
          {activeModal === "models" && <ModelsModal />}
          {activeModal === "settings" && <SettingsModal />}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Fullscreen Modal with Safe Area
 */
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
      className="fixed inset-0 z-[10000] bg-[#030303] flex flex-col overflow-hidden pt-4"
    >
      {/* Header with Back Button */}
      <div className="border-b border-white/5 px-4 pb-4">
        <div className="flex items-center gap-4">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-white/5 text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </motion.button>
          <h2 className="text-sm font-black uppercase tracking-widest text-white">
            {title}
          </h2>
        </div>
      </div>

      {/* Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">{children}</div>
    </motion.div>
  );
}

/**
 * Sidebar Menu Item
 */
function SidebarItem({
  icon,
  label,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 rounded-xl text-white/80 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="text-cyan-400">{icon}</div>
        <span className="text-sm font-semibold">{label}</span>
      </div>
      {badge && (
        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
          {badge}
        </span>
      )}
    </motion.button>
  );
}
