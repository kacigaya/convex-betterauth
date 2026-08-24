"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | null>(null);

function isTheme(value: string | null): value is Theme {
  return value === "dark" || value === "light" || value === "system";
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
}: ThemeProviderProps) {
  const subscribeToTheme = useCallback(
    (onStoreChange: () => void) => {
      const eventName = `theme-change:${storageKey}`;
      const handleStorage = (event: StorageEvent) => {
        if (event.key === storageKey) {
          onStoreChange();
        }
      };

      window.addEventListener("storage", handleStorage);
      window.addEventListener(eventName, onStoreChange);

      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(eventName, onStoreChange);
      };
    },
    [storageKey],
  );

  const getThemeSnapshot = useCallback(() => {
    const storedTheme = window.localStorage.getItem(storageKey);
    return isTheme(storedTheme) ? storedTheme : defaultTheme;
  }, [defaultTheme, storageKey]);

  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    () => defaultTheme,
  );

  const systemIsDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemThemeSnapshot,
    () => defaultTheme === "dark",
  );
  const isDark = theme === "dark" || (theme === "system" && systemIsDark);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
    root.style.colorScheme = isDark ? "dark" : "light";
  }, [isDark]);

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      window.localStorage.setItem(storageKey, nextTheme);
      window.dispatchEvent(new Event(`theme-change:${storageKey}`));
    },
    [storageKey],
  );

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  const value = useMemo(
    () => ({ theme, isDark, setTheme, toggleTheme }),
    [isDark, setTheme, theme, toggleTheme],
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}

function subscribeToSystemTheme(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getSystemThemeSnapshot() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
