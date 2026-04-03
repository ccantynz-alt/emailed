"use client";

import { createContext, useContext, type ReactNode } from "react";
import { tokens, type Tokens } from "./tokens";

interface ThemeContextValue {
  tokens: Tokens;
  mode: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue>({
  tokens,
  mode: "light",
});

export interface ThemeProviderProps {
  children: ReactNode;
  mode?: "light" | "dark";
}

export function ThemeProvider({ children, mode = "light" }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={{ tokens, mode }}>
      {children}
    </ThemeContext.Provider>
  );
}

ThemeProvider.displayName = "ThemeProvider";

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
