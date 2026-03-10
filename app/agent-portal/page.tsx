"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Shield, Zap, Info, ChevronLeft, Bot, Save, MessageSquare } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type SpamFilterLevel = 'off' | 'standard' | 'aggressive';

type BotConfig = {
    botName: string;
    botPersona: string;
    spamFilterLevel: SpamFilterLevel;
    welcomeMessage: string;
    allowLinks: boolean;
    signalThreshold: number;
};

// Mock data until API is wired up
const mockConfig: BotConfig = {
    botName: "Blu Intelligence",
    botPersona: "Analytical, confident, and highly knowledgeable about crypto and the Bluewave ecosystem.",
    spamFilterLevel: "aggressive",
    welcomeMessage: "Welcome to the community! I'm Blu, your resident AI. Read the rules and let's build.",
    allowLinks: false,
    signalThreshold: 80,
};

export default function AgentPortal() {
    const [config, setConfig] = useState(mockConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"personality" | "moderation" | "rewards">("personality");

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            // Optionally show a toast here
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#030303] text-white flex flex-col font-sans selection:bg-cyan-500/30 relative">
            {/* [BLU_FREEZE] Mark off Overlay */}
            <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 rounded-full bg-cyan-950/50 border border-cyan-500/50 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,230,255,0.2)]">
                    <Bot size={40} className="text-cyan-400" />
                </div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 italic">
                    Agent Portal <span className="text-cyan-500">Frozen</span>
                </h2>
                <p className="max-w-md text-gray-400 text-sm leading-relaxed mb-8 font-medium">
                    The intelligence layer is currently under neural synchronization. This portal will remain offline until the next protocol expansion.
                </p>
                <Link
                    href="/"
                    className="px-8 py-3 bg-white text-black text-xs font-black uppercase tracking-widest rounded-full hover:bg-cyan-400 transition-colors"
                >
                    Return to Mission Control
                </Link>
            </div>
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-white/5 bg-[#030303]/80 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                            <ChevronLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                                <Bot size={16} className="text-cyan-400" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold tracking-wide">Agent Portal</h1>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Blu is Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-cyan-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                        ) : (
                            <Save size={14} />
                        )}
                        <span>{isSaving ? 'Deploying...' : 'Save Config'}</span>
                    </button>
                </div>
            </header>

            {/* Main Layout */}
            <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 flex flex-col md:flex-row gap-8">

                {/* Sidebar Navigation */}
                <aside className="md:w-64 shrink-0 flex flex-col gap-2">
                    <TabButton
                        active={activeTab === "personality"}
                        onClick={() => setActiveTab("personality")}
                        icon={<MessageSquare size={16} />}
                        label="Identity & Voice"
                    />
                    <TabButton
                        active={activeTab === "moderation"}
                        onClick={() => setActiveTab("moderation")}
                        icon={<Shield size={16} />}
                        label="Security & Filters"
                    />
                    <TabButton
                        active={activeTab === "rewards"}
                        onClick={() => setActiveTab("rewards")}
                        icon={<Zap size={16} />}
                        label="Signal Economy"
                    />
                </aside>

                {/* Configuration Area */}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        {activeTab === "personality" && (
                            <motion.div
                                key="personality"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <section>
                                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                                        <Bot className="text-cyan-500" size={20} /> Agent Identity
                                    </h2>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                                Designation Name
                                            </label>
                                            <input
                                                type="text"
                                                value={config.botName}
                                                onChange={(e) => setConfig({ ...config, botName: e.target.value })}
                                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium"
                                                placeholder="e.g. Blu Intelligence"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                                Core Instructions (System Prompt)
                                            </label>
                                            <textarea
                                                value={config.botPersona}
                                                onChange={(e) => setConfig({ ...config, botPersona: e.target.value })}
                                                rows={4}
                                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none leading-relaxed text-gray-300"
                                                placeholder="Describe how the AI should behave, speak, and interact..."
                                            />
                                            <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1">
                                                <Info size={12} /> This dictates every response the AI generates.
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white mt-10">
                                        <MessageSquare className="text-blue-500" size={20} /> Automation
                                    </h2>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                                New Member Greeting
                                            </label>
                                            <textarea
                                                value={config.welcomeMessage}
                                                onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                                                rows={3}
                                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none leading-relaxed text-gray-300"
                                                placeholder="Leave blank to disable welcome messages."
                                            />
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {activeTab === "moderation" && (
                            <motion.div
                                key="moderation"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <section>
                                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                                        <Shield className="text-emerald-500" size={20} /> Community Safety
                                    </h2>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-6">

                                        {/* Spam Filter Level */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                                AI Spam Heuristics
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(['off', 'standard', 'aggressive'] as const).map((level) => (
                                                    <button
                                                        key={level}
                                                        onClick={() => setConfig({ ...config, spamFilterLevel: level })}
                                                        className={`py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${config.spamFilterLevel === level
                                                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                                            : 'bg-black/50 border-white/5 text-gray-500 hover:bg-white/5'
                                                            }`}
                                                    >
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-[11px] text-gray-500 mt-2">
                                                {config.spamFilterLevel === 'off' && "AI will not autonomously delete messages."}
                                                {config.spamFilterLevel === 'standard' && "AI deletes obvious bot spam and malicious links."}
                                                {config.spamFilterLevel === 'aggressive' && "AI strictly enforces community rules, deleting low-effort shilling and all unauthorized links."}
                                            </p>
                                        </div>

                                        <div className="h-px w-full bg-white/5" />

                                        {/* Toggle: Allow Links */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-semibold text-white">Permit External URLs</h3>
                                                <p className="text-xs text-gray-500 mt-1">If disabled, the bot destroys any message containing a hyperlink.</p>
                                            </div>
                                            <button
                                                onClick={() => setConfig({ ...config, allowLinks: !config.allowLinks })}
                                                className={`relative w-12 h-6 rounded-full transition-colors ${config.allowLinks ? 'bg-emerald-500' : 'bg-gray-800'}`}
                                            >
                                                <motion.div
                                                    animate={{ x: config.allowLinks ? 26 : 4 }}
                                                    className="absolute top-1 bottom-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                                />
                                            </button>
                                        </div>

                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {activeTab === "rewards" && (
                            <motion.div
                                key="rewards"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <section>
                                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                                        <Zap className="text-amber-500" size={20} /> Proof of Signal
                                    </h2>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-6">

                                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                                            <Info className="text-amber-400 shrink-0 mt-0.5" size={16} />
                                            <p className="text-xs text-amber-200/80 leading-relaxed">
                                                Blu Intelligence evaluates every message in your group based on constructiveness, length, and context. Messages passing the threshold are rewarded with $BWAVE points injected from your community treasury.
                                            </p>
                                        </div>

                                        {/* Threshold Slider */}
                                        <div>
                                            <div className="flex justify-between items-end mb-4">
                                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                    Minimum Signal Threshold
                                                </label>
                                                <span className="text-xl font-black text-amber-500">{config.signalThreshold}</span>
                                            </div>

                                            <input
                                                type="range"
                                                min="0" max="100"
                                                value={config.signalThreshold}
                                                onChange={(e) => setConfig({ ...config, signalThreshold: Number(e.target.value) })}
                                                className="w-full accent-amber-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                                            />

                                            <div className="flex justify-between text-[10px] text-gray-500 font-medium uppercase mt-2">
                                                <span>Lenient (0)</span>
                                                <span>Strict (100)</span>
                                            </div>
                                        </div>

                                        <div className="h-px w-full bg-white/5" />

                                        {/* Info Display */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/5">
                                                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Max Reward / Hour</div>
                                                <div className="text-2xl font-black text-white">1,000 <span className="text-sm font-bold text-gray-600">XP</span></div>
                                            </div>
                                            <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/5">
                                                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Epoch Settlement</div>
                                                <div className="text-2xl font-black text-white">24<span className="text-sm font-bold text-gray-600">h</span></div>
                                            </div>
                                        </div>

                                    </div>
                                </section>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

// Side Navigation Tab Component
function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active
                ? 'bg-white/10 text-white shadow-sm border border-white/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
        >
            <span className={active ? 'opacity-100' : 'opacity-70'}>{icon}</span>
            <span>{label}</span>
        </button>
    );
}
