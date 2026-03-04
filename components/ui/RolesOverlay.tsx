"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Verified, Zap, ShieldAlert, Sparkles, Target, Star, Trophy, UserCheck, Flame, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface RolesOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RolesOverlay({ isOpen, onClose }: RolesOverlayProps) {
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<any>(null);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const roleCategories = [
    {
      title: "Core Team Roles",
      description: "Official team and trusted partners.",
      roles: [
        { name: "Bluewave Core", color: "from-red-500/20 to-red-600/20", border: "border-red-500/50", text: "text-red-400", desc: "Official Bluewave team members.", benefit: "Authority, announcements, ecosystem decisions.", icon: Shield, boost: "+100%" },
        { name: "Community Moderator", color: "from-green-500/20 to-green-600/20", border: "border-green-500/50", text: "text-green-400", desc: "Keeps the space human, clean, and safe.", benefit: "Moderation powers, direct access to core team.", icon: ShieldAlert, boost: "+25%" },
        { name: "Verified Partner", color: "from-blue-500/20 to-blue-600/20", border: "border-blue-500/50", text: "text-blue-400", desc: "Collaborating projects or communities.", benefit: "Visibility + trusted badge.", icon: Verified, boost: "+20%" }
      ]
    },
    {
      title: "Identity & Presence Roles",
      description: "Verifiable reputation signals.",
      roles: [
        { name: "Verified Human", color: "from-blue-400/20 to-blue-500/20", border: "border-blue-400/50", text: "text-blue-300", desc: "Passed Bluewave human verification.", benefit: "Access to gated chats, missions, and drops.", icon: UserCheck, boost: "+10%" },
        { name: "Presence Holder", color: "from-emerald-500/20 to-emerald-600/20", border: "border-emerald-500/50", text: "text-emerald-400", desc: "Maintains consistent on-chain/off-chain presence.", benefit: "Higher reputation score, future rewards weighting.", icon: Zap, boost: "+10%" },
        { name: "Genesis Member", color: "from-amber-700/20 to-amber-800/20", border: "border-amber-700/50", text: "text-amber-600", desc: "Early Bluewave believers.", benefit: "Priority access to features, snapshots, perks.", icon: Sparkles, boost: "+15%" },
        { name: "Beta Explorer", color: "from-gray-500/20 to-gray-600/20", border: "border-gray-500/50", text: "text-gray-400", desc: "Actively testing Bluewave features.", benefit: "Early tools, feedback influence, recognition.", icon: Target, boost: "+10%" }
      ]
    },
    {
      title: "Community Progression Roles",
      description: "Earnable through consistent organic participation.",
      roles: [
        { name: "New Wave", color: "from-teal-500/20 to-teal-600/20", border: "border-teal-500/50", text: "text-teal-400", desc: "Just arrived. Welcome", benefit: "Goal: Learn, observe, interact meaningfully.", icon: Star, boost: "+1%" },
        { name: "Active Human", color: "from-cyan-500/20 to-cyan-600/20", border: "border-cyan-500/50", text: "text-cyan-400", desc: "Consistent participation without spam.", benefit: "Higher visibility, eligibility for advanced roles.", icon: Star, boost: "+5%" },
        { name: "Contributor", color: "from-gray-300/20 to-gray-400/20", border: "border-gray-300/50", text: "text-gray-300", desc: "Adds value through ideas, feedback, or help.", benefit: "Reputation boost, private contributor chats.", icon: Star, boost: "+8%" },
        { name: "OG", color: "from-purple-500/20 to-purple-600/20", border: "border-purple-500/50", text: "text-purple-400", desc: "Long-term, consistent, value-driven member.", benefit: "Priority access, special drops, status.", icon: Trophy, boost: "+15%" },
        { name: "Super OG", color: "from-fuchsia-500/20 to-fuchsia-600/20", border: "border-fuchsia-500/50", text: "text-fuchsia-400", desc: "Elite contributors who shaped the community early.", benefit: "Governance weight, exclusive perks, recognition.", icon: Trophy, boost: "+25%" }
      ]
    },
    {
      title: "Creator & Signal Roles",
      description: "Amplifiers of the Bluewave culture.",
      roles: [
        { name: "Content Creator", color: "from-orange-500/20 to-orange-600/20", border: "border-orange-500/50", text: "text-orange-400", desc: "Creates quality Bluewave content.", benefit: "Amplification, rewards, featured spotlights.", icon: Sparkles, boost: "+25%" },
        { name: "Best Commentator", color: "from-amber-500/20 to-amber-600/20", border: "border-amber-500/50", text: "text-amber-400", desc: "Consistently adds insight in discussions.", benefit: "Reputation boost + community trust.", icon: Sparkles, boost: "+10%" },
        { name: "Meme Architect", color: "from-sky-300/20 to-sky-400/20", border: "border-sky-300/50", text: "text-sky-300", desc: "Creates high-signal, culture-defining memes.", benefit: "Viral amplification, fun rewards.", icon: Sparkles, boost: "+25%" }
      ]
    },
    {
      title: "X (Twitter) Roles",
      description: "Commanders of the social presence.",
      roles: [
        { name: "X Supporter", color: "from-stone-600/20 to-stone-700/20", border: "border-stone-600/50", text: "text-stone-400", desc: "Engages with posts authentically.", benefit: "Access to X-based missions.", icon: Target, boost: "+5%" },
        { name: "X Raider", color: "from-rose-600/20 to-rose-700/20", border: "border-rose-600/50", text: "text-rose-500", desc: "Coordinates meaningful raids (no bot behavior).", benefit: "Raid-only rewards & leaderboards.", icon: Zap, boost: "+10%" },
        { name: "X Ambassador", color: "from-cyan-400/20 to-cyan-500/20", border: "border-cyan-400/50", text: "text-cyan-300", desc: "Represents Bluewave publicly with high-quality threads.", benefit: "Ambassador rewards, early announcements.", icon: Verified, boost: "+20%" }
      ]
    },
    {
      title: "Special Recognition Roles",
      description: "Exceptional members of the ecosystem.",
      roles: [
        { name: "Signal Guardian", color: "from-zinc-100/20 to-zinc-300/20", border: "border-zinc-300/50", text: "text-zinc-300", desc: "Protects the community from bots and noise.", benefit: "Trust badge + moderator attention.", icon: Shield, boost: "+15%" },
        { name: "Human Legend", color: "from-slate-400/20 to-slate-500/20", border: "border-slate-400/50", text: "text-slate-300", desc: "Rare role for exceptional long-term impact.", benefit: "Eternal flex + future ecosystem privileges.", icon: Trophy, boost: "+50%" }
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black backdrop-blur-3xl flex flex-col overflow-y-auto"
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          {/* Navigation Bar */}
          <div className="flex justify-between items-center p-4 sticky top-0 z-50 bg-black/60 backdrop-blur-xl">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-full active:bg-white/10 transition-colors"
            >
              <ArrowLeft size={24} className="text-cyan-400" />
            </button>
            <div className="w-10"></div> {/* Spacer for TopRightMenu which is fixed at z-150 */}
          </div>

          <div className="max-w-2xl mx-auto w-full p-6 pb-24 flex flex-col gap-10">

            <div className="text-center space-y-4 pt-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Ecosystem Roles</h2>
              <div className="text-cyan-100/70 font-medium text-sm leading-relaxed max-w-lg mx-auto text-left space-y-4 bg-cyan-950/20 p-5 rounded-2xl border border-cyan-500/20">
                <p>
                  <strong className="text-cyan-300">Roles are not just titles, they are multipliers.</strong> Every role you earn permanently increases your standard yield across the entire Bluewave Ecosystem.
                </p>
                <p>
                  When you claim rewards from <strong className="text-cyan-300">Network Referrals</strong> or <strong className="text-cyan-300">Presence Missions</strong>, your base reward is multiplied by the combined boost of your active roles.
                </p>
                <div className="flex bg-cyan-900/40 border border-cyan-500/30 p-3 rounded-xl gap-3 items-center">
                  <Flame className="text-orange-400 shrink-0" size={20} />
                  <p className="text-xs text-orange-200/90 leading-tight">
                    <strong className="text-orange-400">Additive Stacking:</strong> If you are a <span className="text-blue-300 font-bold">Verified Human (+10%)</span> and a <span className="text-sky-300 font-bold">Meme Architect (+25%)</span>, every reward you claim is multiplied by <strong className="text-white text-sm bg-black/40 px-1.5 py-0.5 rounded">1.35x</strong>!
                  </p>
                </div>
              </div>

              <div className="flex justify-center gap-4 py-4 mt-2">
                <div className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-cyan-500/70 tracking-widest">Core Value 01</span>
                  <span className="text-xs font-black text-cyan-50 uppercase tracking-widest mt-1">Quality &gt; Quantity</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-cyan-500/70 tracking-widest">Core Value 02</span>
                  <span className="text-xs font-black text-cyan-50 uppercase tracking-widest mt-1">Presence &gt; Performance</span>
                </div>
              </div>
            </div>

            {roleCategories.map((category, idx) => (
              <div key={idx} className="flex flex-col gap-6">
                <div className="flex flex-col">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{category.title}</h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-cyan-400/60 mt-1">{category.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {category.roles.map((role, ridx) => {
                    const Icon = role.icon;
                    return (
                      <motion.button
                        key={ridx}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedRole(role)}
                        className={`aspect-square bg-gradient-to-br ${role.color} border ${role.border} rounded-3xl p-3 flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden group shadow-[0_0_30px_#00e6ff05]`}
                      >
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-active:opacity-100 transition-opacity" />

                        <div className="p-2.5 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/5">
                          <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${role.text}`} />
                        </div>

                        <span className={`font-black text-[10px] sm:text-[11px] uppercase tracking-tighter text-center leading-none px-1 overflow-hidden text-ellipsis w-full ${role.text}`}>
                          {role.name}
                        </span>

                        <div className="absolute top-1 right-1 px-1 py-0.5 rounded-lg bg-black/40 border border-white/5 backdrop-blur-md">
                          <span className="text-orange-400 font-black text-[8px] flex items-center gap-0.5">
                            <Flame size={8} /> {role.boost.replace("+", "")}
                          </span>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            ))}

          </div>

          {/* Popup Modal */}
          <AnimatePresence>
            {selectedRole && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedRole(null)}
                  className="fixed inset-0 z-[210] bg-black/70 backdrop-blur-sm"
                />

                {/* Centered Popup */}
                <div className="fixed inset-0 z-[220] flex items-center justify-center p-6 pointer-events-none">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ type: "spring", damping: 22, stiffness: 260 }}
                    className="relative w-full max-w-sm bg-zinc-900 rounded-[2.5rem] border border-white/10 p-8 flex flex-col items-center gap-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)] pointer-events-auto"
                  >
                    {/* X Close Button */}
                    <button
                      onClick={() => setSelectedRole(null)}
                      className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 transition-colors"
                    >
                      <X size={18} className="text-white/60" />
                    </button>

                    {/* Icon */}
                    <div className={`p-6 rounded-[2rem] bg-gradient-to-br ${selectedRole.color} border-2 ${selectedRole.border} shadow-[0_0_40px_rgba(34,211,238,0.1)]`}>
                      <selectedRole.icon className={`w-16 h-16 ${selectedRole.text}`} />
                    </div>

                    {/* Title & Boost */}
                    <div className="text-center space-y-2">
                      <h2 className={`text-3xl font-black uppercase tracking-tight ${selectedRole.text}`}>
                        {selectedRole.name}
                      </h2>
                      <div className="flex justify-center">
                        <div className="px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center gap-2">
                          <Flame className="text-orange-400" size={18} />
                          <span className="text-orange-400 font-black text-lg tracking-widest">{selectedRole.boost} BOOST</span>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="w-full space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60 block">Status Signal</span>
                        <p className="text-base text-white font-medium leading-relaxed italic">
                          "{selectedRole.desc}"
                        </p>
                      </div>

                      <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60 flex items-center gap-2">
                          <Star size={12} className="text-yellow-400" /> Key Benefit
                        </span>
                        <p className="text-cyan-50 font-bold leading-snug">
                          {selectedRole.benefit}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
