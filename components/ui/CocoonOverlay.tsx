"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, Cpu, Link as LinkIcon, ArrowRight, ExternalLink, Lock } from "lucide-react";
import { useEffect } from "react";

interface CocoonOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CocoonOverlay({ isOpen, onClose }: CocoonOverlayProps) {
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

  // Native Back Button Interceptor -> Close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleNativeBack = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    window.addEventListener("bwNativeBack", handleNativeBack);
    return () => window.removeEventListener("bwNativeBack", handleNativeBack);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex flex-col justify-end overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[8px]"
            onClick={onClose}
          />

          {/* Bottom Sheet Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 190 }}
            className="relative w-full z-10 overflow-hidden text-text-main flex flex-col rounded-t-[2.5rem] max-h-[85vh] pb-safe"
            style={{
              background: "rgba(28, 28, 30, 0.75)",
              backdropFilter: "blur(30px) saturate(190%)",
              WebkitBackdropFilter: "blur(30px) saturate(190%)",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 -10px 40px rgba(0, 0, 0, 0.5)"
            }}
          >
            {/* Ambient specular glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none" />

            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-4 pb-2 shrink-0">
              <div className="w-12 h-1.5 bg-white/15 rounded-full" />
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-44 custom-scrollbar">
              
              {/* Hero Section */}
              <div className="flex flex-col items-center text-center mb-8">
                {/* Cocoon Egg Image */}
                <div className="relative w-36 mb-6">
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-full relative"
                  >
                    <img 
                      src="/cocoon_egg.webp" 
                      alt="Cocoon Egg" 
                      className="w-full h-auto drop-shadow-[0_0_25px_rgba(255,255,255,0.15)]"
                      onError={(e) => { (e.target as any).src = "https://cdn-icons-png.flaticon.com/512/3233/3233150.png" }}
                    />
                  </motion.div>
                  
                  {/* Shadow */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-3 bg-black/40 blur-md rounded-full" />
                </div>

                <motion.div
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-1.5 justify-center mb-3">
                    <span className="text-purple-400 font-bold text-[9px] uppercase tracking-[0.3em]">Confidential Compute</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-3 tracking-tight uppercase" style={{ letterSpacing: "-0.5px" }}>
                    Cocoon <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-400">Network</span>
                  </h1>
                  <p className="text-white/60 max-w-xs mx-auto text-sm leading-relaxed mb-5">
                    The privacy shell for the human network. Secure, verifiable AI inference powered by TON.
                  </p>

                  {/* TEE Banner */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md text-white/70 text-[10px] font-semibold max-w-xs mx-auto">
                    <Shield size={13} className="text-white/60 shrink-0" />
                    <span className="text-left leading-normal">
                      Confidential execution powered by Cocoon TEE coming soon
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Feature Cards Grid */}
              <div className="grid gap-3 mb-6">
                <FeatureCard 
                  icon={<Shield className="text-white/80" size={20} />}
                  title="TEE Protection"
                  description="Data is encrypted even while being processed inside Trusted Execution Environments."
                  delay={0.2}
                />
                <FeatureCard 
                  icon={<Cpu className="text-white/80" size={20} />}
                  title="GPU-Powered"
                  description="Decentralized network of graphics processors monetization via AI inference."
                  delay={0.3}
                />
                <FeatureCard 
                  icon={<LinkIcon className="text-white/80" size={20} />}
                  title="TON Integrated"
                  description="Built on The Open Network for secure payments, attestation, and transparency."
                  delay={0.4}
                />
              </div>

              {/* Why it Matters Section */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-white/5 border border-white/5 rounded-2xl p-5 mb-4"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 rounded-xl bg-white/5 text-white/80">
                    <Lock size={16} />
                  </div>
                  <h3 className="font-bold text-white uppercase tracking-wider text-xs">Why Cocoon?</h3>
                </div>
                <p className="text-white/60 text-xs leading-relaxed mb-4">
                  Traditional AI services store your data on their servers. Cocoon keeps it encrypted even during processing—so nobody, not even the server owner, can see what you're running.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-white/40 uppercase tracking-wider">Privacy-First</span>
                  <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-white/40 uppercase tracking-wider">Tamper-Proof</span>
                  <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-white/40 uppercase tracking-wider">Decentralized</span>
                </div>
              </motion.div>
            </div>

            {/* Pinned Footer Actions */}
            <div 
              className="absolute bottom-0 left-0 right-0 p-5 z-20 flex flex-col gap-2.5"
              style={{
                background: "linear-gradient(to top, rgba(28, 28, 30, 0.98) 70%, rgba(28, 28, 30, 0) 100%)",
                paddingBottom: "calc(16px + var(--tg-safe-area-inset-bottom, 0px))"
              }}
            >
              <a 
                href="https://cocoon.org" 
                target="_blank" 
                className="w-full h-12 bg-white text-black font-semibold text-sm flex items-center justify-center gap-2 rounded-full transition-all active:scale-[0.97] hover:bg-white/95 shadow-md"
              >
                <span>Learn More</span>
                <ExternalLink size={14} />
              </a>
              <button 
                onClick={onClose}
                className="w-full h-12 bg-white/5 border border-white/10 text-white font-semibold text-sm rounded-full transition-all active:scale-[0.97] hover:bg-white/10"
              >
                Back to Wave
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div
      initial={{ x: -15, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay }}
      className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/5 border border-white/5"
    >
      <div className="mt-0.5 p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-white mb-0.5 uppercase tracking-wider text-[11px]">{title}</h4>
        <p className="text-white/40 text-[11px] leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}
