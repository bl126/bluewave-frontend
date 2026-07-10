"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dim" | "original" | "glass";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("glass");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Force the theme to glass for everyone automatically
        setThemeState("glass");
        document.documentElement.setAttribute("data-theme", "glass");
        localStorage.setItem("bw_theme", "glass");
    }, []);

    const setTheme = (newTheme: Theme) => {
        // Locked to glass
        setThemeState("glass");
        localStorage.setItem("bw_theme", "glass");
        document.documentElement.setAttribute("data-theme", "glass");

        const tg = (window as any).Telegram?.WebApp;
        if (tg) {
            let color = "#000000";
            if (newTheme === "dim") color = "#17212B";
            else if (newTheme === "glass") color = "#030303";
            tg.setHeaderColor(color);
            tg.setBackgroundColor(color);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, mounted }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
