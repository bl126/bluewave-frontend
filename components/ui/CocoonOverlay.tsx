"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Cpu, Link as LinkIcon, ArrowRight, ExternalLink, Lock } from "lucide-react";
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] bg-[#040B1A] overflow-y-auto"
        >
          {/* Background Starfield (Reusing logic similar to BackgroundStars) */}
          <div className="absolute inset-0 z-0 opacity-40">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(123,47,190,0.15),transparent_70%)]" />
          </div>

          <div className="relative z-10 min-h-screen flex flex-col px-6 pt-20 pb-12">
            {/* Close button removed as per request - using Telegram Back Button */}

            {/* Hero Section */}
            <div className="flex flex-col items-center text-center mb-16">
              {/* CSS-Rendered Cocoon Egg */}
              <div className="relative w-40 h-52 mb-10">
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    filter: [
                      "drop-shadow(0 0 20px rgba(0, 191, 255, 0.3))",
                      "drop-shadow(0 0 40px rgba(123, 47, 190, 0.5))",
                      "drop-shadow(0 0 20px rgba(0, 191, 255, 0.3))"
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full h-full relative"
                >
                  {/* Egg Shape */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00BFFF] via-[#4B0082] to-[#040B1A] rounded-[50%_50%_50%_50%/60%_60%_40%_40%] border border-white/20 overflow-hidden shadow-2xl">
                    {/* Mesh Overlay */}
                    <div className="absolute inset-0 opacity-30" 
                      style={{ 
                        backgroundImage: `linear-gradient(30deg, transparent 45%, #fff 45%, #fff 55%, transparent 55%), linear-gradient(-30deg, transparent 45%, #fff 45%, #fff 55%, transparent 55%)`,
                        backgroundSize: '30px 30px'
                      }} 
                    />
                    {/* Inner Glow */}
                    <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-white/20 blur-2xl rounded-full" />
                  </div>
                </motion.div>
                
                {/* Floor Shadow */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/40 blur-lg rounded-full" />
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 justify-center mb-4">
                  <span className="text-purple-400 font-black text-xs uppercase tracking-[0.4em]">Confidential Compute</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                </div>
                <h1 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">
                  Cocoon <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Network</span>
                </h1>
                <p className="text-gray-400 max-w-xs mx-auto text-sm leading-relaxed font-medium">
                  The privacy shell for the human network. Secure, verifiable AI inference powered by TON.
                </p>
              </motion.div>
            </div>

            {/* Feature Cards */}
            <div className="grid gap-4 mb-12">
              <FeatureCard 
                icon={<Shield className="text-cyan-400" size={24} />}
                title="TEE Protection"
                description="Data is encrypted even while being processed inside Trusted Execution Environments."
                delay={0.3}
              />
              <FeatureCard 
                icon={<Cpu className="text-purple-400" size={24} />}
                title="GPU-Powered"
                description="Decentralized network of graphics processors monetization via AI inference."
                delay={0.4}
              />
              <FeatureCard 
                icon={<LinkIcon className="text-blue-400" size={24} />}
                title="TON Integrated"
                description="Built on The Open Network for secure payments, attestation, and transparency."
                delay={0.5}
              />
            </div>

            {/* Why it Matters Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <Lock size={20} />
                </div>
                <h3 className="font-bold text-white uppercase tracking-wider text-sm">Why Cocoon?</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Traditional AI services store your data on their servers. Cocoon keeps it encrypted even during processing—so nobody, not even the server owner, can see what you're running.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Privacy-First</span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tamper-Proof</span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Decentralized</span>
              </div>
            </motion.div>

            {/* Footer Actions */}
            <div className="mt-auto flex flex-col gap-3">
              <a 
                href="https://cocoon.org" 
                target="_blank" 
                className="w-full h-14 bg-white text-black font-black uppercase tracking-widest flex items-center justify-center gap-2 rounded-2xl hover:opacity-90 transition-opacity"
              >
                Learn More <ExternalLink size={18} />
              </a>
              <button 
                onClick={onClose}
                className="w-full h-14 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-colors"
              >
                Back to Wave
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay }}
      className="flex items-start gap-4 p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm"
    >
      <div className="mt-1 p-3 rounded-2xl bg-white/5 border border-white/10">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-white mb-1 uppercase tracking-wider text-xs">{title}</h4>
        <p className="text-gray-500 text-xs leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}
