"use client";

import Snowfall from "react-snowfall";
import { useTheme } from "@/contexts/ThemeContext";
import { useMemo } from "react";
import { motion } from "framer-motion";

export default function BackgroundAmbience() {
  const { theme } = useTheme();

  const config = useMemo(() => {
    switch (theme) {
      case "light":
        return {
          color: "#FFFFFF",
          opacity: 0.4,
          count: 25,
          speed: [0.05, 0.2] as [number, number],
          radius: [0.5, 2.0] as [number, number],
          wind: [-0.1, 0.1] as [number, number],
        };
      case "dim":
        return {
          color: "#00F6FF",
          opacity: 0.15,
          count: 30,
          speed: [0.2, 0.5] as [number, number],
          radius: [0.5, 2.0] as [number, number],
          wind: [-0.2, 0.2] as [number, number],
        };
      default: // original/night
        return {
          color: "#00F6FF",
          opacity: 0.25,
          count: 50,
          speed: [0.2, 0.6] as [number, number],
          radius: [0.5, 2.4] as [number, number],
          wind: [-0.2, 0.2] as [number, number],
        };
    }
  }, [theme]);

  return (
    <>
      {/* 🌤️ LIGHT MODE: Dynamic Sky Background */}
      {theme === "light" && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[var(--app-bg)] bg-[length:400%_400%] animate-[skyShift_30s_infinite_ease-in-out]">
          {/* Volumetric Clouds */}
          <motion.div 
            className="absolute top-[-20%] left-[-10%] w-[80%] h-[60%] rounded-full bg-white opacity-40 blur-[100px]"
            animate={{ 
              x: [0, 50, 0], 
              y: [0, 30, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[50%] rounded-full bg-blue-100/50 opacity-30 blur-[120px]"
            animate={{ 
              x: [0, -40, 0], 
              y: [0, -20, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-white opacity-20 blur-[80px]"
            animate={{ 
              x: [0, -30, 0], 
              y: [0, 40, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Sun Glow Overlay */}
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.4)_0%,transparent_50%)]" />
        </div>
      )}
 
      {/* ❄️ Global Particles Layer */}
      <div 
        className="fixed inset-0 pointer-events-none z-[1]" 
        style={{ opacity: config.opacity }}
      >
        <Snowfall
          snowflakeCount={config.count}
          speed={config.speed}
          wind={config.wind}
          radius={config.radius}
          color={config.color}
        />
      </div>
    </>
  );
}
