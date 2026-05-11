"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dim" | "original";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // ⚠️ SSR SAFE: Always start with "original" on server to avoid hydration mismatch.
    // The blocking <script> in layout.tsx already sets the correct CSS/data-theme
    // attribute before React mounts, so there is ZERO visual flash.
    // The single useEffect below syncs React state to the real value after mount.
    const [theme, setThemeState] = useState<Theme>("original");

    useEffect(() => {
        // Runs once after mount — reads the true saved theme and syncs state.
        // By this point the blocking script has already applied correct CSS,
        // so this update is invisible to the user.
        const savedTheme = (localStorage.getItem("bw_theme") as Theme) || "original";
        setThemeState(savedTheme);
        // Also ensure the data-theme attribute is set (may be redundant, but safe)
        document.documentElement.setAttribute("data-theme", savedTheme);
    }, []); // Empty deps — run ONCE on mount only

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
