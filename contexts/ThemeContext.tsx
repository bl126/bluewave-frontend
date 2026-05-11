"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dim" | "original";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // ⚡ SYNC INIT: Read the attribute set by the blocking script in layout.tsx.
    // This ensures the first React render matches the visually applied CSS theme.
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            return (document.documentElement.getAttribute("data-theme") as Theme) || "original";
        }
        return "original";
    });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Double-check localStorage on mount just in case, but usually unnecessary
        // due to the blocking script + synchronous init above.
        const savedTheme = (localStorage.getItem("bw_theme") as Theme) || "original";
        if (savedTheme !== theme) setThemeState(savedTheme);
        setMounted(true);
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem("bw_theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
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
