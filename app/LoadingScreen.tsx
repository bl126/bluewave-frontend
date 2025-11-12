"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-black relative overflow-hidden">
      {/* Soft glowing background */}
      <div className="absolute w-80 h-80 rounded-full bg-cyan-400/20 blur-3xl animate-pulse"></div>

      {/* Bluewave circular logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: [0.4, 1, 0.4],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative z-10 p-2 rounded-full bg-cyan-500/10 ring-2 ring-cyan-400/30 backdrop-blur-md"
      >
        <Image
          src="/bluewave_logo.png"
          alt="Bluewave Logo"
          width={150}
          height={150}
          className="rounded-full"
          priority
        />
      </motion.div>
    </div>
  );
}
