import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";

export type Theme = "light" | "dark";

const THEME_KEY = "alcon.theme";
const ZOOM_KEY = "alcon.zoom";

// Zoom presets, in ascending order. 1 = 100%. Kept as discrete steps so the −/+
// control lands on clean, legible percentages instead of arbitrary fractions.
export const ZOOM_STEPS = [0.8, 0.9, 1, 1.1, 1.25, 1.5] as const;
const DEFAULT_ZOOM = 1;

function initialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  // Honor the OS preference on first run so the app arrives already in the
  // user's world rather than forcing a flash of the wrong appearance.
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function initialZoom(): number {
  if (typeof window === "undefined") return DEFAULT_ZOOM;
  const saved = Number(window.localStorage.getItem(ZOOM_KEY));
  return ZOOM_STEPS.includes(saved as (typeof ZOOM_STEPS)[number]) ? saved : DEFAULT_ZOOM;
}

// Owns the two chrome-level preferences — appearance and zoom — including their
// persistence and the animated theme swap. Kept out of App so the render tree
// stays about data, not settings plumbing.
export function usePreferences() {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [zoom, setZoom] = useState<number>(initialZoom);

  // Reflect the theme onto <html> so the .dark variant + color-scheme cover the
  // whole document (portals, scrollbars, form controls), not just the app subtree.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(ZOOM_KEY, String(zoom));
  }, [zoom]);

  // Switch appearance with an elegant, whole-screen cross-fade — like a light
  // dimming up or down, not a ripple. The View Transitions API captures the old
  // and new frames and dissolves between them (timing tuned in GlobalStyles).
  // flushSync applies the .dark swap synchronously so the API snapshots the new
  // appearance, not a stale frame. Falls back to an instant swap when the API is
  // missing or the user prefers reduced motion.
  const applyTheme = useCallback((next: Theme) => {
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    if (!doc.startViewTransition || prefersReduced) {
      setTheme(next);
      return;
    }
    // Suppress per-element colour transitions for the length of the dissolve so the
    // whole screen changes as one frame-set (no element switching ahead of others).
    const root = document.documentElement;
    root.classList.add("theme-swapping");
    const transition = doc.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });
    transition.finished.finally(() => root.classList.remove("theme-swapping"));
  }, []);

  const toggleTheme = useCallback(() => {
    applyTheme(theme === "dark" ? "light" : "dark");
  }, [theme, applyTheme]);

  const zoomIndex = ZOOM_STEPS.indexOf(zoom as (typeof ZOOM_STEPS)[number]);
  const zoomIn = useCallback(() => {
    setZoom(z => ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, ZOOM_STEPS.indexOf(z as (typeof ZOOM_STEPS)[number]) + 1)]);
  }, []);
  const zoomOut = useCallback(() => {
    setZoom(z => ZOOM_STEPS[Math.max(0, ZOOM_STEPS.indexOf(z as (typeof ZOOM_STEPS)[number]) - 1)]);
  }, []);
  const resetZoom = useCallback(() => setZoom(DEFAULT_ZOOM), []);

  return {
    theme,
    toggleTheme,
    applyTheme,
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
    canZoomIn: zoomIndex < ZOOM_STEPS.length - 1,
    canZoomOut: zoomIndex > 0,
  };
}
