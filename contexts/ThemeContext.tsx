"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dim" | "original";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Initialize from the attribute set by the blocking script in layout.tsx
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            return (document.documentElement.getAttribute("data-theme") as Theme) || "original";
        }
        return "original";
    });

    useEffect(() => {
        // Sync any manual changes or storage updates
        const savedTheme = localStorage.getItem("bw_theme") as Theme;
        if (savedTheme && savedTheme !== theme) {
            setThemeState(savedTheme);
            document.documentElement.setAttribute("data-theme", savedTheme);
        }
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem("bw_theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
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
