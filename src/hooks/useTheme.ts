import { useEffect, useState, useCallback } from "react";
import type { Theme } from "../types";
import { FAVICON_LIGHT, FAVICON_DARK, THEME_STORAGE_KEY } from "../constants";

const getSystemPrefersDark = (): boolean =>
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

const readStoredTheme = (): Theme | null => {
    try {
        if (typeof window === "undefined") return null;
        const v = localStorage.getItem(THEME_STORAGE_KEY);
        if (v === "light" || v === "dark") return v;
        return null;
    } catch {
        return null;
    }
};

const persistTheme = (theme: Theme | null) => {
    try {
        if (typeof window === "undefined") return;
        if (theme === null) {
            localStorage.removeItem(THEME_STORAGE_KEY);
        } else {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        }
    } catch {
        // ignore
    }
};

const setFaviconForTheme = (theme: Theme) => {
    if (typeof document === "undefined") return;
    const href = theme === "dark" ? FAVICON_DARK : FAVICON_LIGHT;

    let reactFavicon = document.getElementById(
        "react-favicon",
    ) as HTMLLinkElement | null;
    if (!reactFavicon) {
        reactFavicon = document.createElement("link");
        reactFavicon.id = "react-favicon";
        reactFavicon.rel = "icon";
        reactFavicon.type = "image/svg+xml";
        document.head.appendChild(reactFavicon);
    }
    reactFavicon.href = href;

    document
        .querySelectorAll<HTMLLinkElement>('link[rel*="icon"]')
        .forEach((lnk) => {
            if (lnk.id === "react-favicon") return;
            lnk.href = href;
        });
};

const applyHtmlDarkClass = (theme: Theme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") {
        root.classList.add("dark");
    } else {
        root.classList.remove("dark");
    }
};

export function useTheme() {
    const stored = readStoredTheme();
    const initialTheme: Theme =
        stored ?? (getSystemPrefersDark() ? "dark" : "light");

    const [theme, setThemeState] = useState<Theme>(initialTheme);

    useEffect(() => {
        applyHtmlDarkClass(theme);
        setFaviconForTheme(theme);
    }, [theme]);

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return;

        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const storedTheme = readStoredTheme();

        const handler = (e: MediaQueryListEvent | MediaQueryList) => {
            const systemIsDark = "matches" in e ? e.matches : mq.matches;
            if (!readStoredTheme()) {
                setThemeState(systemIsDark ? "dark" : "light");
            }
        };

        if (!storedTheme) {
            setThemeState(mq.matches ? "dark" : "light");
        }

        if (typeof mq.addEventListener === "function") {
            mq.addEventListener("change", handler as EventListener);
        }

        return () => {
            if (typeof mq.removeEventListener === "function") {
                mq.removeEventListener("change", handler as EventListener);
            }
        };
    }, []);

    const toggleTheme = useCallback(() => {
        const next = theme === "light" ? "dark" : "light";
        setThemeState(next);
        persistTheme(next);
    }, [theme]);

    const clearThemePreference = useCallback(() => {
        persistTheme(null);
        const sys = getSystemPrefersDark() ? "dark" : "light";
        setThemeState(sys);
    }, []);

    return { theme, toggleTheme, clearThemePreference };
}
