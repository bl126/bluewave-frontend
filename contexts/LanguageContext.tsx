"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import en from "../translations/en.json";
import ru from "../translations/ru.json";
import th from "../translations/th.json";
import pt from "../translations/pt.json";
import hi from "../translations/hi.json";
import id from "../translations/id.json";
import es from "../translations/es.json";

type Translations = typeof en;

interface LanguageContextType {
    language: string;
    setLanguage: (lang: string) => void;
    t: (key: string) => any;
}

const translations: Record<string, any> = { en, ru, th, pt, hi, id, es };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState("en");

    useEffect(() => {
        const saved = localStorage.getItem("bw_language");
        if (saved && translations[saved]) {
            setLanguageState(saved);
        }
    }, []);

    const setLanguage = (lang: string) => {
        if (translations[lang]) {
            setLanguageState(lang);
            localStorage.setItem("bw_language", lang);
        }
    };

    const t = (keyPath: string) => {
        const keys = keyPath.split(".");
        let result = translations[language];

        for (const key of keys) {
            if (result && result[key] !== undefined) {
                result = result[key];
            } else {
                // Fallback to English if translation is missing
                let fallback = translations["en"];
                for (const fKey of keys) {
                    if (fallback && fallback[fKey] !== undefined) {
                        fallback = fallback[fKey];
                    } else {
                        return keyPath; // Return key path if even English is missing
                    }
                }
                return fallback;
            }
        }
        return result;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};
