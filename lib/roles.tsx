import { Shield, Verified, Zap, ShieldAlert, Sparkles, Target, Star, Trophy, UserCheck } from "lucide-react";

export const ROLE_CATEGORIES = [
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
      { name: "TON Explorer", color: "from-sky-400/20 to-sky-500/20", border: "border-sky-400/50", text: "text-sky-300", desc: "Connected a TON ecosystem wallet.", benefit: "Eligible for on-chain drops. Yield: +5%", icon: Sparkles, image: "/ton-transparent.png", boost: "+5%" },
      { name: "Genesis Member", color: "from-amber-700/20 to-amber-800/20", border: "border-amber-700/50", text: "text-amber-600", desc: "Early Bluewave believers.", benefit: "Priority access to features, snapshots, perks.", icon: Sparkles, boost: "+15%" },
      { name: "Beta Explorer", color: "from-gray-500/20 to-gray-600/20", border: "border-gray-500/50", text: "text-gray-400", desc: "Actively testing Bluewave features.", benefit: "Early tools, feedback influence, recognition.", icon: Target, boost: "+10%" }
    ]
  },
  {
    title: "Community Progression Roles",
    description: "Earnable through consistent organic participation.",
    roles: [
      { name: "New Wave", color: "from-[var(--accent)]/20 to-[var(--accent)]/20", border: "border-[var(--accent)]/50", text: "text-app-accent", desc: "Just arrived. Welcome", benefit: "Goal: Learn, observe, interact meaningfully.", icon: Star, boost: "+1%" },
      { name: "Active Human", color: "from-[var(--accent)]/20 to-[var(--accent)]/20", border: "border-[var(--accent)]/50", text: "text-app-accent", desc: "Consistent participation without spam.", benefit: "Higher visibility, eligibility for advanced roles.", icon: Star, boost: "+5%" },
      { name: "Network Builder", color: "from-indigo-500/20 to-indigo-600/20", border: "border-indigo-500/50", text: "text-indigo-400", desc: "Invited 10+ active humans to the network.", benefit: "Higher referral yields and network influence.", icon: Target, boost: "+10%" },
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
      { name: "X Ambassador", color: "from-[var(--accent)]/20 to-[var(--accent)]/20", border: "border-[var(--accent)]/50", text: "text-app-accent", desc: "Represents Bluewave publicly with high-quality threads.", benefit: "Ambassador rewards, early announcements.", icon: Verified, boost: "+20%" }
    ]
  },
  {
    title: "Special Recognition Roles",
    description: "Exceptional members of the ecosystem.",
    roles: [
      { name: "Signal Guardian", color: "from-zinc-100/20 to-zinc-300/20", border: "border-zinc-300/50", text: "text-zinc-300", desc: "Protects the community from bots and noise.", benefit: "Trust badge + moderator attention.", icon: Shield, boost: "+15%" },
      { name: "Human Legend", color: "from-slate-400/20 to-slate-500/20", border: "border-slate-400/50", text: "text-slate-300", desc: "Rare role for exceptional long-term impact.", benefit: "Eternal flex + future ecosystem privileges.", icon: Trophy, boost: "+50%" }
    ]
  },
  {
    title: "Ecosystem Levels",
    description: "Your journey through the Bluewave Presence Economy.",
    roles: [
      { name: "LEVEL 1", color: "from-[var(--accent)]/20 to-[var(--accent)]/20", border: "border-[var(--accent)]/50", text: "text-app-accent", desc: "The 'New Wave'. Your journey begins here.", benefit: "Access to basic missions. Yield: +1%", icon: Star, boost: "+1%" },
      { name: "LEVEL 2", color: "from-[var(--accent)]/20 to-[var(--accent)]/20", border: "border-[var(--accent)]/50", text: "text-app-accent", desc: "Pulse Scout. Consistent presence builder.", benefit: "Improved referral yields. Yield: +5%", icon: Zap, boost: "+5%" },
      { name: "LEVEL 3", color: "from-indigo-500/20 to-indigo-600/20", border: "border-indigo-500/50", text: "text-indigo-400", desc: "Signal Architect. Growing the network structure.", benefit: "Advanced mission access. Yield: +10%", icon: Target, boost: "+10%" },
      { name: "LEVEL 4", color: "from-purple-500/20 to-purple-600/20", border: "border-purple-500/50", text: "text-purple-400", desc: "Wave Commander. A pillar of the ecosystem.", benefit: "Priority support & perks. Yield: +20%", icon: Shield, boost: "+20%" },
      { name: "LEVEL 5", color: "from-fuchsia-500/20 to-fuchsia-600/20", border: "border-fuchsia-500/50", text: "text-fuchsia-400", desc: "Blu Legend. Master of the Presence Economy.", benefit: "Alpha governance weight. Yield: +50%", icon: Trophy, boost: "+50%" }
    ]
  }
];

export const findRoleByName = (name: string) => {
  for (const category of ROLE_CATEGORIES) {
    const found = category.roles.find(r => r.name === name);
    if (found) return found;
  }
  return null;
};
