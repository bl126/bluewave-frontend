"use client";

import { motion } from "framer-motion";
import { spaceAudio } from "./SpaceAudio";

interface PortalButtonProps {
  onClick: () => void;
}

export default function PortalButton({ onClick }: PortalButtonProps) {
  const handleClick = () => {
    spaceAudio.playPortalClick();
    onClick();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed z-[85] select-none right-2 top-[16%] touch-none"
    >
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.15, boxShadow: "0 0 25px rgba(249, 115, 22, 0.6)" }}
        whileTap={{ scale: 0.95 }}
        className="relative w-12 h-12 rounded-full border border-orange-500/40 bg-black/60 flex items-center justify-center overflow-visible transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.4)] cursor-pointer group"
      >
        {/* Outer Rotating Flame Ring (Doctor Strange Spark Effect) */}
        <div className="absolute inset-[-4px] rounded-full border-2 border-dashed border-orange-500 animate-[spin_8s_linear_infinite]" />
        
        {/* Inner Counter-Rotating Golden Ring */}
        <div className="absolute inset-[-2px] rounded-full border border-yellow-400 opacity-80 animate-[spin_4s_linear_infinite_reverse]" />
        
        {/* Core Pulsing Nebula Glow */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-orange-600 via-yellow-500 to-amber-700 blur-[4px] opacity-70 group-hover:opacity-90 transition-opacity animate-pulse" />

        {/* Portal Portal Core Center */}
        <div className="relative w-8 h-8 rounded-full bg-black/90 flex items-center justify-center overflow-hidden border border-orange-500/30">
          {/* Swirling space texture */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.4)_0%,rgba(0,0,0,0.9)_70%)] animate-[pulse_2s_infinite]" />
          
          <span className="relative text-[7px] font-black tracking-widest text-orange-400 group-hover:text-yellow-200 drop-shadow-[0_0_5px_rgba(249,115,22,0.8)] uppercase">
            PORTAL
          </span>
        </div>

        {/* Sparkling particles orbiting the button */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-3px] left-[50%] w-1.5 h-1.5 rounded-full bg-yellow-400 blur-[0.5px] animate-[ping_1.5s_infinite]" />
          <div className="absolute bottom-[-3px] left-[50%] w-1 h-1 rounded-full bg-orange-400 blur-[0.5px] animate-[ping_2s_infinite]" />
          <div className="absolute left-[-3px] top-[50%] w-1 h-1 rounded-full bg-amber-400 blur-[0.5px] animate-[ping_1.7s_infinite]" />
        </div>
      </motion.button>
    </motion.div>
  );
}
