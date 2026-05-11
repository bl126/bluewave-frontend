"use client";

import React, { createContext, useContext, useState } from "react";

type Theme = "light" | "dim" | "original";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // ⚡ Read theme synchronously from the data-theme attribute set by the
    // blocking <script> in layout.tsx — runs before React, so no flicker ever.
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            return (document.documentElement.getAttribute("data-theme") as Theme) || "original";
        }
        return "original";
    });

    // No useEffect needed — the blocking script already set the correct theme
    // before React mounted. setTheme() below keeps everything in sync on changes.

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
