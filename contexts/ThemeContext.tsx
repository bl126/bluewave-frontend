"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dim" | "original";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("original");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem("bw_theme") as Theme;
        if (savedTheme && (savedTheme === "original" || savedTheme === "dim")) {
            setThemeState(savedTheme);
            document.documentElement.setAttribute("data-theme", savedTheme);
        } else {
            setThemeState("original");
            document.documentElement.setAttribute("data-theme", "original");
            localStorage.setItem("bw_theme", "original");
        }
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem("bw_theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);

        const tg = (window as any).Telegram?.WebApp;
        if (tg) {
            tg.setHeaderColor(newTheme === "original" ? "#000000" : "#17212B");
            tg.setBackgroundColor(newTheme === "original" ? "#000000" : "#17212B");
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
