"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, Plus, Minus } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface WhitepaperOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

// ------------------------------------
// WHITEPAPER CONTENT DATA
// ------------------------------------
const WHITEPAPER_CONTENT = [
    {
        id: "header",
        type: "header",
        title: "Bluewave – The Human Presence Layer on TON",
        subtitle: "(whitepaper v1.0 January 2026)",
        author: "Reuben Ezema – Founder & Builder",
        contact: "bluewavefx7@gmail.com",
    },
    {
        id: "abstract",
        title: "Abstract",
        content: `Bluewave is the human presence layer built natively on The Open Network (TON) and Telegram. In the current digital landscape, user attention and presence generate significant value, yet most of this value flows to centralized platforms and a limited group of creators. Bluewave introduces a new model where presence becomes a user-owned asset — transparently measured, verifiably proven, and fairly rewarded.
    
Users build verifiable presence scores by completing simple daily missions, building network and maintaining streaks in a Telegram mini app, earning $BWAVE points along the way. The system is privacy-first, requiring only Telegram ID and no personal KYC. With the upcoming on-chain presence ledger and ethical marketplace, Bluewave transforms everyday consistency into a portable, monetizable asset.

Launched in mid-2025, Bluewave is already live with over 250+ active users across 16 countries and 5 continents — achieved entirely through organic growth. The protocol stands apart by rewarding long-term human presence over short-term attention or social hype, creating a foundation for trust, utility, and fair value distribution in web3.

Bluewave begins as a web2-integrated system with seamless on-chain expansion to TON, enabling scalable adoption today and decentralized settlement tomorrow. This whitepaper outlines the problem, technical architecture, tokenomics, roadmap, and vision for scaling Bluewave into the leading presence economy on TON.`,
    },
    {
        id: "introduction",
        title: "Introduction",
        content: `The journey of Bluewave began in the world of Forex trading, where I spent years studying charts, mentoring students, and educating strategies digitally. Over time, I noticed a troubling pattern: truly skilled traders with real, consistent results were often overlooked or dismissed. The focus had shifted toward profit screenshots and polished lifestyles — visuals that could be edited, faked, or taken out of context — rather than verifiable proof of how trades were actually made or why they succeeded. Chart analysis, risk management, and steady discipline were being overshadowed by spectacle.

This wasn't unique to Forex. As I researched further, I saw the same dynamic playing out across digital spaces: attention and presence generate enormous value every day, yet most of that value flows to centralized platforms and a small group of highly visible creators. Everyday consistency — the quiet, reliable effort that defines real skill and reliability — rarely receives the recognition or reward it deserves.

Bluewave was created to change that dynamic.

Built natively on The Open Network (TON) and deeply integrated with Telegram's 900 million+ users, Bluewave is the human presence layer — a protocol that allows individuals to own, prove, and eventually monetize their consistent online participation. Through a simple Telegram mini app, users build verifiable presence scores by completing daily missions, maintaining streaks, and growing their networks — all without chasing followers, virality, or superficial metrics.

Bluewave transforms everyday consistency into a portable, monetizable asset — starting with a reputation layer for Forex traders coming soon and expanding to broader digital skills.

Bluewave is already live with over 250+ active users spanning 16 countries and 5 continents — achieved entirely through organic growth. This early traction shows that meaningful utility can emerge without aggressive marketing or speculation.

Bluewave is not about competing with existing models. It is about creating a new layer where presence becomes a user-owned foundation for trust, reputation, and fair value distribution in web3. The future of presence ownership and monetization begins here.`,
    },
    {
        id: "problem-statement",
        title: "Problem Statement",
        content: `In the current digital landscape, user attention and presence generate enormous value every day. Yet most of this value flows to centralized platforms and a limited group of highly visible creators. Everyday consistency — the steady, reliable participation that defines real skill, trust, and engagement — is often overlooked or undervalued.

Traditional visibility tools, including advertising and promotional campaigns, rely heavily on metrics such as impressions, clicks, followers, and short-term interactions. While these approaches drive reach, they frequently struggle to guarantee genuine, sustained human participation. Engagement can be inflated through bots, fake accounts, or superficial tactics, making it difficult for brands, projects, and individuals to distinguish real users from noise.

This dynamic is not limited to one industry. In Forex trading, skilled practitioners with consistent results are frequently overshadowed by edited screenshots, staged lifestyles, and unverified claims. Across broader digital ecosystems, the same pattern appears: attention is rewarded over substance, and verifiable proof of long-term presence remains scarce.

These limitations create broader challenges:
• Users lack ownership of the value they generate through their daily participation.
• Brands and projects struggle to build trust and loyalty with authentic, engaged communities.
• Reputation and skill remain tied to superficial signals rather than demonstrable consistency.

Bluewave addresses this gap by redefining presence as a measurable, user-owned asset — one that rewards sustained human involvement over fleeting attention.`,
    },
    {
        id: "solution",
        title: "Solution",
        content: `Bluewave introduces a new layer for digital ecosystems: the human presence layer. Built natively on The Open Network (TON) and deeply integrated with Telegram, Bluewave enables individuals to own, prove, and eventually monetize their consistent online participation in a simple, accessible way.

At its core, Bluewave redefines presence as a verifiable, user-owned asset — measured through everyday actions rather than fleeting attention or social metrics. The protocol rewards sustained human consistency, creating a foundation for trust, reputation, and fair value distribution in web3.

Core Mechanics
Bluewave operates through a lightweight Telegram mini app, making onboarding seamless for Telegram's 900 million+ users.

Daily Missions & Streaks
Users complete quick, optional tasks (check-ins, simple shares, or invites) to build their presence score. Streaks reward consecutive participation, reflecting real reliability over time.

Presence Score & Ledger
The system calculates a transparent presence score based on mission completions, streak length, and network growth. This score becomes a portable proof of consistency.
In the upcoming on-chain Presence Ledger, users will directly view, manage, and prove their score — an immutable, decentralized record stored on TON smart contracts, ensuring full ownership and verifiability without intermediaries.

$BWAVE Rewards
Participants earn $BWAVE points for their activity. These points serve as early utility and will later convert to the native $BWAVE token.

Privacy-First Design
Bluewave requires only Telegram ID for participation — no personal data, no KYC. Future zero-knowledge proofs (ZKPs) will enable verifiable claims without revealing underlying information.

Early Use Case: Bluewave Trading Passport (BTP upcoming)
Bluewave begins with a focused application for Forex traders: the Bluewave Trading Passport (BTP). Traders submit TradingView ideas and update outcomes to build a verifiable track record — win rate, risk-reward ratio, and consistency — all tied to their presence score. This creates a shareable, tamper-proof reputation layer, solving the common challenge of unverified claims in trading communities.

Phased Approach
Bluewave is designed for practical, scalable adoption:

Phase 1 – Web2 Integration (Current)
The live mini app operates primarily off-chain (FastAPI + Supabase backend) for speed and low friction. Users experience seamless participation today while the protocol collects real-world data and feedback.

Phase 2 – On-Chain Expansion (Upcoming)
Core elements — presence scores, proofs, and rewards — migrate to TON smart contracts for immutability and decentralization. This enables the full Presence Ledger, full user ownership, and composability within the TON ecosystem.

Phase 3 – Marketplace & Monetization
Users opt-in to monetize their presence (e.g., aggregated data sales) or skills through an ethical marketplace. Brands and projects can sponsor missions for targeted, verifiable engagement — with Bluewave facilitating fair value distribution.

Differentiation
Bluewave stands apart by focusing on long-term human presence rather than short-term attention:
• Rewards sustained consistency (streaks, missions, invites) over viral moments or social metrics.
• Prioritizes privacy and ownership (Telegram ID only, user-controlled data).
• Built for mass accessibility (Telegram-native, no complex wallets).
• Starts with real utility (reputation for Forex traders upcoming) and expands to broader digital skills.

By transforming everyday participation into a verifiable asset stored in the Presence Ledger, Bluewave creates a new economic layer where presence works for the individual — not against them.`,
    },
    {
        id: "technical-architecture",
        title: "Technical Architecture",
        content: `Bluewave is engineered for simplicity, scalability, and user-centric design, leveraging a hybrid architecture that balances immediate accessibility with long-term decentralization. The protocol begins with web2-integrated components for fast iteration and low-friction onboarding, while planning a seamless migration to on-chain elements on The Open Network (TON). This phased approach ensures robust performance today and verifiable trust tomorrow.

The system is built to prioritize privacy, consistency, and security, with AI-driven mechanisms to maintain a bot-free, 100% human ecosystem. Below, we outline the key components, data flow, and security features.

System Overview
Bluewave operates as a Telegram mini app, powered by a backend that handles mission processing, score calculation, and user data management. The architecture is divided into:

Frontend (Mini App Interface): Built with Telegram's mini app framework for seamless mobile access. Users interact via simple screens: showing globe presence tracker (real-time country mapping), mission center, leaderboards, and profiles. Design emphasizes a futuristic, clean aesthetic with dark star field backgrounds and cyan accents (#00f6ff) for a web3 feel.

Backend: Utilizes FastAPI for API endpoints and Supabase (Postgres database) for off-chain storage. This enables quick mission logging, anti-double-claim protection, and real-time score updates without blockchain latency.

On-Chain Layer (Future Integration): TON smart contracts (using Tact) for immutable presence proofs, rewards settlement, and $BWAVE token distribution. Migration will start with testnet deployments, followed by mainnet audits.

The hybrid model allows for rapid prototyping (off-chain speed) while preparing for decentralization (on-chain verifiability), drawing from TON's low fees and Telegram's 900 million+ users for global scale.

Data Flow
The core process follows a straightforward loop:
User Onboarding: Via Telegram ID only — no additional data required. verify code, select their country, and start missions immediately.

Mission Execution: Users complete daily tasks (e.g., social reaction & comments, invites). Backend records time-stamped behavioral data (e.g., completion time, frequency) in Supabase's missions table.

Presence Score Calculation: Server-side logic computes the score based on mission proofs, streak length, and network contributions. The presence score is a weighted combination of mission completions, streak duration, and network contributions, with weights adjustable based on ecosystem needs. This score is displayed in-app and will be mirrored on the on-chain presence ledger.

Rewards Distribution: $BWAVE points accrued off-chain; future on-chain claims via TON contracts.

Monetization (Marketplace/Ledger): Users opt-in to share aggregated proofs; backend handles escrows for gigs/missions.

[User → Telegram Mini App → Missions Claim → FastAPI Endpoint → Supabase Storage → Score Calculation → Presence Ledger (On-Chain Proof) → Rewards/Marketplace]

Security & Anti-Bot Mechanisms
Security is foundational to Bluewave, ensuring a bot-free, 100% human ecosystem. We employ AI-driven tools to verify authenticity and maintain integrity:

AI PvP 1 (Proof-of-Presence Verification): An AI system that analyzes behavioral patterns in every mission submission. It records time-stamped data (e.g., interaction speed, patterns) and compares against a baseline of proven human actions. If anomalies suggest bots (e.g., unnatural speed or repetition), the submission is flagged and rejected. This creates a "total human mission baseline" — a dynamic threshold calculated from aggregated real-user data to detect non-human activity.

AI PvP 1.1 (Ghost Mode): An advanced extension that monitors inactive users and the broader ecosystem. It scans for dormant accounts, potential bot infiltrations, or suspicious patterns across missions. Detected bots, points farmers or inactive entities are "ghosted" — kept offline or isolated to prevent ecosystem contamination. This ensures all interactions remain human-driven, with ongoing recalibration based on community data.

These mechanisms operate off-chain initially for efficiency, with future on-chain integration for immutable audits. Combined with Telegram's built-in security and no-KYC design, Bluewave minimizes risks while fostering a trusted environment.

Scalability & Future Enhancements
The architecture is designed for growth: Supabase handles initial loads (thousands of users), while TON's high throughput (100k+ TPS) supports future on-chain scaling. Enhancements include ZKPs for privacy-preserving proofs and API integrations for BTP (Trading Passport) with platforms like TradingView.

This technical foundation ensures Bluewave is accessible today, secure always, and ready for the presence economy of tomorrow.`,
    },
    {
        id: "tokenomics",
        title: "Tokenomics",
        content: `The $BWAVE token (ticker: $BWAVE) is the native utility and governance token of the Bluewave protocol, designed to reward consistent participation, secure the ecosystem, and enable fair value distribution.

Token Overview
Token Standard: JETTON on The Open Network (TON)
Total Supply: 1,000,000,000 $BWAVE (fixed cap — no future minting)
Purpose: $BWAVE incentivizes long-term human presence, powers marketplace transactions, and enables community governance.

Token Allocation
The total supply is distributed as follows:

Community & Rewards — 50%
15% allocated as airdrop at TGE to early active users and network builders (based on presence scores).
The remaining 35% is released gradually through ongoing mission rewards, streak bonuses, and marketplace participation — ensuring users continue to earn based on real consistency.

Early Builders & Team — 20%
Reserved for the founder and early contributors (designers, moderators, community builders). Vested over 24 months with a 6-month cliff (first release at 6 months, then monthly thereafter) to align long-term incentives.

Ecosystem & Partnerships — 20%
For grants, integrations, and ecosystem growth. Released at predefined milestones to ensure alignment with real progress.

Liquidity & Reserves — 10%
5% allocated to DEX liquidity pools at TGE for trading stability. Remaining 5% reserved for treasury and future needs.

Vesting & Release Schedule
Community rewards are distributed continuously through participation (no cliff).
Team & builders allocation features a 6-month cliff followed by linear monthly vesting over 18 months.
Ecosystem funds are milestone-gated to ensure release aligns with protocol development and adoption.

Token Utility
$BWAVE serves multiple core functions within the ecosystem:
Rewards — Earned through missions, streaks, network, and marketplace contributions.
Staking — Lock $BWAVE to earn yields from marketplace fees and ecosystem rewards.
Marketplace Payments — Used to sponsor missions, list gigs, or access premium features (with discounts for holders).
Governance — Future voting rights on protocol upgrades and mission priorities.

Deflationary Mechanisms
A portion of marketplace fees (15%) will be burned, reducing circulating supply over time as user activity and monetization grow.

Token Generation Event (TGE)
The TGE will occur after key milestones are achieved (on-chain presence ledger live, marketplace beta launch, and meaningful user/mission growth). Distribution will be fair and community-first, with no presale and priority allocation to active participants.

This tokenomics design ensures $BWAVE remains utility-driven, community-aligned, and sustainable — rewarding long-term consistency rather than short-term speculation.`,
    },
    {
        id: "roadmap",
        title: "Roadmap",
        content: `Bluewave follows a milestone-based roadmap designed for practical, iterative progress. Rather than fixed dates, each phase is tied to key achievements that ensure real value is delivered before advancing. This approach prioritizes organic growth, user feedback, and technical stability while aligning with the protocol's core focus on long-term human presence and utility.

The roadmap is divided into three primary phases, with milestones driving progression.

Phase 1: Foundation & Early Adoption (Current – Ongoing)
Live Telegram mini app with daily missions, streaks, presence scores, and global tracker.
Organic growth to 250+ users across 16 countries and 5 continents.
Launch of community Builders Team with token allocation incentives (open roles for X Community Builders with 200+ followers and web3 graphics designers).
Beta testing of core mechanics and user feedback loops.

Milestone achieved: Functional off-chain system with real user engagement and no bots (AI PvP 1 & 1.1 active).
Next milestone: 10,000+ active users with sustained engagement + expansion to 20+ countries.

Phase 2: On-Chain Expansion & Utility Launch
Migration of presence scores and proofs to TON smart contracts (Presence Ledger).
Launch of BTP (Bluewave Trading Passport) MVP for Forex traders (verifiable reputation layer).
Introduction of ethical marketplace for mission sponsorships and skills gigs.

Key Milestones:
On-chain ledger live and audited.
Marketplace beta with first B2B pilots (brands and products renting presence).
100,000–500,000 active users + 5–10 million total missions completed.

Phase 3: Scale & Ecosystem Growth
Full TGE (Token Generation Event) upon achievement of Phase 2 milestones.
Expansion of marketplace: More B2B integrations.
Governance activation via $BWAVE holders.
Cross-use case development (e.g., loyalty programs, skill verification beyond Forex).

Key Milestones:
1,000,000+ active users + 10 million total missions completed.
First major partnerships.
Community-driven governance proposals live.

This roadmap remains flexible and community-guided. Milestones are defined by real adoption metrics (users, missions, marketplace volume) rather than calendar dates, ensuring Bluewave evolves based on actual usage and feedback.

Long-term vision: Bluewave becomes the leading presence economy on TON, where consistent human participation is rewarded, owned, and monetized ethically across digital ecosystems.`,
    },
    {
        id: "team-governance",
        title: "Team & Governance",
        content: `Bluewave is currently led by a focused, lean team with a clear emphasis on execution and community alignment.

Core Team
Bluewave was founded and is currently led by Reuben Ezema, who brings extensive experience as a Forex trader and independent builder. Having spent years analyzing markets, risk, and consistent performance, Reuben identified the need for verifiable presence and reputation in digital ecosystems. As the sole founder, he has bootstrapped the project from concept to live Telegram mini app, achieving 250+ active users across 16 countries through organic growth.

Early Builders & Contributors
Bluewave is intentionally community-first. A growing group of early builders (including community moderators, web3 graphics designers, and X engagers) is already contributing to the project's development, branding, and outreach. These contributors will receive meaningful team token allocation from the $BWAVE pool, aligning their incentives with long-term success.

Governance Philosophy
Bluewave's governance model is designed to evolve gradually and responsibly, prioritizing stability, founder stewardship, and eventual community ownership.

Current Phase (Pre-TGE): Governance remains founder-led. Reuben maintains final decision-making authority on protocol development, roadmap, and resource allocation. Community input is actively encouraged through the Builders Team, X discussions, and Telegram channels, but remains advisory at this stage.

Post-TGE Transition (Medium-Term): As $BWAVE token distribution progresses and the protocol matures (on-chain ledger live, marketplace operational), governance will shift to a hybrid model. $BWAVE holders will gain the ability to propose and vote on protocol upgrades, mission types, and treasury usage. Founder veto rights and supermajority thresholds will be implemented initially to ensure stability and prevent premature or malicious changes.

Long-Term Vision: Full decentralized governance via $BWAVE holders (DAO structure) will be activated once the ecosystem reaches significant scale and proven sustainability. This gradual approach ensures Bluewave remains focused on its core mission — rewarding human consistency — while empowering the community that helped build it.

This structure protects against short-term volatility and aligns decision-making with long-term value creation for all participants.`,
    },
    {
        id: "risk-mitigations",
        title: "Risks & Mitigations",
        content: `While Bluewave is designed with a focus on simplicity, privacy, and sustainability, all web3 protocols face inherent risks. This section outlines key potential challenges and the proactive steps we are taking to address them. By acknowledging these risks early, Bluewave demonstrates a commitment to transparency and long-term resilience.

Adoption & Growth Risk
Achieving widespread user adoption can be challenging in the competitive web3 landscape, where new protocols must demonstrate clear value to attract and retain participants. Slow initial growth could delay milestones like marketplace activation or ecosystem partnerships.

Mitigation: Bluewave leverages TON's integration with Telegram's 900 million+ users for low-barrier onboarding and organic expansion. We prioritize real utility through daily missions and presence scores, with community incentives (e.g., Builders Team roles) to foster word-of-mouth growth. Early traction (250+ users across 16 countries) is being built upon through targeted pilots and X engagements.

Technical & Implementation Risk
Developing and maintaining a hybrid architecture (off-chain backend with future on-chain migration) involves potential bugs, scalability issues, or integration challenges. For instance, the on-chain migration to TON smart contracts requires specialized expertise in blockchain development, and errors could impact user experience or security.

Mitigation: The founder has handled all programming to date, with quick fixes for identified bugs through iterative testing. Off-chain components (FastAPI + Supabase) allow for rapid updates, while the migration will incorporate community contributions and partnerships with TON-specialized developers (opportunities open through the Builders Team). We plan for external audits and testnet phases before mainnet deployment to minimize downtime and ensure robustness.

Regulatory & Compliance Risk
Web3 protocols operate in an evolving regulatory environment, where privacy, data ownership, and token distribution could face scrutiny from authorities (e.g., data protection laws or securities regulations).

Mitigation: Bluewave's privacy-first design (Telegram ID only, no KYC) aligns with global standards like GDPR. We monitor regulatory developments and will engage legal experts as needed. Token distribution is fair and utility-focused, with no presale to reduce compliance concerns.

Financial & Operational Sustainability Risk
As a bootstrapped project, operational costs (e.g., backend infrastructure like Supabase and Render) are currently covered from the founder's personal resources. This enables agility but could strain scalability if growth accelerates without additional support.

Mitigation: We are pursuing non-dilutive grants (from TON ecosystem) and early monetization pilots (premium features, B2B mission sponsorships) to build runway. Marketplace fees and $BWAVE staking yields will provide ongoing revenue streams post-launch, transitioning to self-sustainability.

Market & Competition Risk
Crypto markets are volatile, and emerging competitors in attention or reputation economies could impact Bluewave's positioning.

Mitigation: Bluewave differentiates through its focus on long-term presence over short-term attention, with TON-native accessibility. We monitor market trends and adapt via community feedback, ensuring utility remains core to user retention.

Security & Bot Risk
Potential vulnerabilities in the mini app or ledger could lead to exploits, while bots could undermine the "100% human" ecosystem.

Mitigation: AI PvP 1 and 1.1 (Ghost Mode) actively verify human behavior and isolate inactive or suspicious accounts. Regular security reviews, phased on-chain migration, and community reporting will further strengthen defenses.

These risks are inherent to innovative web3 projects, but Bluewave's phased, user-focused approach positions us to mitigate them effectively. Ongoing community involvement and transparency will be key to navigating challenges as we grow.`,
    },
    // Placeholder for future sections
    {
        id: "conclusion",
        title: "Conclusion",
        content: `Bluewave is more than a protocol — it is a movement toward a fairer digital future. In a world where centralized platforms capture value from user participation while offering little in return, Bluewave empowers individuals to own their presence, prove their consistency, and monetize it ethically.

Through a simple Telegram mini app, users are already building verifiable presence scores via daily missions and streaks — with over 250+ active participants across 16 countries and 5 continents, achieved entirely through organic growth. The upcoming on-chain Presence Ledger and marketplace will transform this everyday consistency into a portable, monetizable asset — starting with reputation for Forex traders and expanding to broader digital skills.

Bluewave stands apart by rewarding long-term human presence over short-term attention or social hype. It is privacy-first, community-driven, and built on TON for global accessibility. The tokenomics ensure alignment between users, builders, and the ecosystem, while the phased roadmap guarantees steady, sustainable progress.

The future of presence monetization begins with those who show up consistently. We invite you to join the wave — /start the mini app, complete your first mission, build your presence score, or contribute as a Builder. As Bluewave grows, we welcome strategic collaborations and partnerships that accelerate adoption and unlock new opportunities for users and the broader ecosystem.

Together, we can create a web3 where value flows back to the people who generate it.

Thank you for reading this whitepaper v1.0
We are just getting started.

Reuben Ezema
Founder & Builder, Bluewave
bluewavefx7@gmail.com
January 2026`,
    }
];

// ... (rest of imports)

const WhitepaperSection = ({ section }: { section: typeof WHITEPAPER_CONTENT[0] }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-cyan-900/30 last:border-0 pb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-4 text-left group transition-all"
            >
                <h2 className="text-xl md:text-2xl font-bold text-cyan-100 flex items-center gap-3">
                    <span className={`w-1 h-6 bg-cyan-500 rounded-full shadow-[0_0_10px_#06b6d4] transition-all duration-300 ${isOpen ? 'h-8 bg-cyan-400' : ''}`}></span>
                    <span className="group-hover:text-cyan-200 transition-colors">{section.title}</span>
                </h2>
                <div className={`p-2 rounded-full border border-cyan-900/30 bg-cyan-950/20 text-cyan-400 transition-all duration-300 ${isOpen ? 'bg-cyan-900/40 border-cyan-500/50 rotate-180' : 'group-hover:border-cyan-700/50'}`}>
                    {isOpen ? <Minus size={20} /> : <Plus size={20} />}
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="pb-6 text-gray-300 leading-relaxed space-y-4 text-base md:text-lg font-light tracking-wide pl-4 border-l-2 border-cyan-900/20 ml-1.5">
                            {section.content!.split('\n').map((paragraph, idx) => (
                                paragraph.trim() && <p key={idx}>{paragraph}</p>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function WhitepaperOverlay({ isOpen, onClose }: WhitepaperOverlayProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Lock body scroll when open
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

    // Reset scroll on open
    useEffect(() => {
        if (isOpen && scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-xl"
                    onClick={onClose}
                >
                    {/* Main Container */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="relative w-full h-full md:max-w-4xl md:h-[90vh] md:rounded-2xl md:border md:border-cyan-900/30 overflow-hidden bg-gradient-to-b from-[#0B0F14] to-[#05070a] shadow-[0_0_50px_-10px_rgba(0,230,255,0.1)]"
                        onClick={(e) => e.stopPropagation()} // Prevent close on content click
                    >
                        {/* Floating Download Button (Top Right, below Hamburger) */}
                        <div className="absolute top-16 right-4 z-50">
                            <a
                                href="/bluewavewhitepaper.pdf"
                                download
                                className="group flex flex-col items-center gap-1 text-cyan-400 hover:text-cyan-200 transition-colors"
                                title="Download Whitepaper"
                            >
                                <div className="p-3 rounded-full bg-cyan-950/30 group-hover:bg-cyan-900/50 transition-colors border border-cyan-900/50 shadow-[0_0_15px_-5px_#22d3ee]">
                                    <Download size={20} />
                                </div>
                                <span className="text-[10px] font-medium tracking-wide uppercase opacity-70 group-hover:opacity-100">PDF</span>
                            </a>
                        </div>

                        {/* Top Bar (Sticky) */}
                        <div className="absolute top-0 left-0 right-0 h-16 z-20 flex items-center justify-between px-6 bg-gradient-to-b from-[#0B0F14] via-[#0B0F14]/90 to-transparent pointer-events-none">
                            {/* Back Button */}
                            <button
                                onClick={onClose}
                                className="group flex items-center gap-2 text-cyan-400 hover:text-cyan-200 transition-colors pointer-events-auto"
                            >
                                <div className="p-2 rounded-full bg-cyan-950/30 group-hover:bg-cyan-900/50 transition-colors border border-cyan-900/50">
                                    <ArrowLeft size={20} />
                                </div>
                                <span className="text-sm font-medium tracking-wide uppercase hidden sm:block">Back</span>
                            </button>
                        </div>

                        {/* Scrollable Content Area */}
                        <div
                            ref={scrollRef}
                            className="w-full h-full overflow-y-auto px-6 pt-24 pb-20 scrollbar-hide"
                        >
                            <div className="max-w-2xl mx-auto space-y-12">

                                {WHITEPAPER_CONTENT.map((section) => {
                                    if (section.type === "header") {
                                        return (
                                            <div key={section.id} className="text-center space-y-4 mb-12 animate-fade-in">
                                                <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-200 pb-2">
                                                    {section.title}
                                                </h1>
                                                <p className="text-cyan-400/80 text-sm tracking-widest uppercase">{section.subtitle}</p>
                                                <div className="pt-4 text-xs text-gray-400">
                                                    <p>{section.author}</p>
                                                    <a href={`mailto:${section.contact}`} className="text-cyan-600 hover:text-cyan-400 transition-colors">{section.contact}</a>
                                                </div>
                                                <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mx-auto mt-8" />
                                            </div>
                                        );
                                    }

                                    return <WhitepaperSection key={section.id} section={section} />;
                                })}

                                {/* Footer Divider */}
                                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-900/30 to-transparent my-12" />

                                <div className="text-center text-gray-500 text-sm pb-8">
                                    <p>© 2026 Bluewave Protocol. All rights reserved.</p>
                                </div>
                            </div>
                        </div>

                        {/* Scroll Gradient Indicator (Bottom) */}
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0B0F14] to-transparent pointer-events-none z-10" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
