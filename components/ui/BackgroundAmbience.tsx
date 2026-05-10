"use client";

import Snowfall from "react-snowfall";
import { useTheme } from "@/contexts/ThemeContext";
import { useMemo } from "react";

export default function BackgroundAmbience() {
  const { theme } = useTheme();

  const config = useMemo(() => {
    switch (theme) {
      case "light":
        return {
          color: "#000000",
          opacity: 0.06,
          count: 40,
          speed: [0.1, 0.4] as [number, number],
          radius: [0.5, 1.5] as [number, number],
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
  );
}
