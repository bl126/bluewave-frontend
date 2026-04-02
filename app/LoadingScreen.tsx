"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center h-screen w-full bg-black relative overflow-hidden"
    >
      {/* 🌌 Deep Radial Background for texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#001a20_0%,_#000000_100%)] opacity-60" />

      {/* ✨ Pulsing Cyan Glow Aura (Behind Logo) */}
      <motion.div
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.35, 0.2]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute w-80 h-80 bg-cyan-500/40 rounded-full blur-[100px] z-0"
      />

      {/* 🚀 Main Branding Logo with Subtle Bloom */}
      <motion.div 
        animate={{ 
          scale: [1, 1.02, 1],
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut"
        }}
        className="relative z-10"
      >
        <Image
          src="/bluewave_logo.png"
          alt="Bluewave Logo"
          width={180}
          height={180}
          className="rounded-full shadow-[0_0_50px_rgba(0,238,255,0.2)] filter drop-shadow(0 0 20px rgba(0,238,255,0.4))"
          priority
        />
      </motion.div>
    </motion.div>
  );
}
