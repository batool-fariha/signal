"use client";
/**
 * Theme preference: "light", "dark" or "system" (follow the OS). Stored in localStorage and applied
 * as data-theme="dark" on <html>. The inline script in the root layout applies it before first paint.
 */
import { useSyncExternalStore } from "react";

export type ThemeMode = "light" | "dark" | "system";
const KEY = "signal.theme";
const listeners = new Set<() => void>();

export function readMode(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export const isDark = (mode: ThemeMode) => mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);

export function applyMode(mode: ThemeMode) {
  if (isDark(mode)) document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.removeAttribute("data-theme");
}

export function setMode(mode: ThemeMode) {
  try {
    if (mode === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, mode);
  } catch {
    // Storage blocked: the choice still applies for this session.
  }
  applyMode(mode);
  listeners.forEach((l) => l());
}

/** Switches between light and dark based on what is showing right now. */
export function toggleMode() {
  setMode(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribe, readMode, () => "system");
}
