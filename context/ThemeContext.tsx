"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

type ThemeContextValue = {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  refreshTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function normalizeHex(value: string | null | undefined) {
  if (!value) return null;

  const color = value.trim();

  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  if (/^[0-9a-fA-F]{6}$/.test(color)) return `#${color}`;

  return null;
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;

  const value = Number.parseInt(clean, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function mixWithWhite(hex: string, amount: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  return `rgb(
    ${Math.round(rgb.r + (255 - rgb.r) * amount)},
    ${Math.round(rgb.g + (255 - rgb.g) * amount)},
    ${Math.round(rgb.b + (255 - rgb.b) * amount)}
  )`;
}

function darken(hex: string, amount: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  return `rgb(
    ${Math.round(rgb.r * (1 - amount))},
    ${Math.round(rgb.g * (1 - amount))},
    ${Math.round(rgb.b * (1 - amount))}
  )`;
}

function applyTheme(color: string) {
  const root = document.documentElement;

  root.style.setProperty("--school-primary", color);
  root.style.setProperty("--school-primary-hover", darken(color, 0.14));
  root.style.setProperty("--school-primary-soft", mixWithWhite(color, 0.91));
  root.style.setProperty("--school-primary-border", mixWithWhite(color, 0.55));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [primaryColor, setPrimaryColorState] = useState("#64748b");
  const supabase = createClient();

  async function refreshTheme() {
    const { data } = await supabase
      .from("school_settings")
      .select("theme_color")
      .eq("id", 1)
      .maybeSingle();

    const color = normalizeHex(data?.theme_color);

    if (color) {
      setPrimaryColorState(color);
      window.localStorage.setItem("ctms_theme_color", color);
      applyTheme(color);
    }
  }

  useEffect(() => {
    const savedColor = normalizeHex(
      window.localStorage.getItem("ctms_theme_color")
    );

    if (savedColor) {
      setPrimaryColorState(savedColor);
      applyTheme(savedColor);
    }

    void refreshTheme();
  }, []);

  function setPrimaryColor(color: string) {
    const normalized = normalizeHex(color);

    if (!normalized) return;

    setPrimaryColorState(normalized);
    window.localStorage.setItem("ctms_theme_color", normalized);
    applyTheme(normalized);
  }

  return (
    <ThemeContext.Provider
      value={{
        primaryColor,
        setPrimaryColor,
        refreshTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
