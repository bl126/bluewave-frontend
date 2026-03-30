"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-black relative">
      {/* Bluewave circular logo - STATIC as requested */}
      <div className="relative z-10">
        <Image
          src="/bluewave_logo.png"
          alt="Bluewave Logo"
          width={150}
          height={150}
          className="rounded-full shadow-2xl"
          priority
        />
      </div>
    </div>
  );
}
