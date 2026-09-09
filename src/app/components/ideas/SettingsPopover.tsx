import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import type { Theme } from "../../hooks/usePreferences";
import { ZoomControl } from "./ZoomControl";

// A small settings surface anchored to the sidebar gear: appearance + zoom.
// Kept to the two live-preference controls — no identity block, no buried menu —
// so the popover is exactly the settings the gear promises (Simplicity, §16).
export function SettingsPopover({
  theme,
  onSetTheme,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  canZoomIn,
  canZoomOut,
  onClose,
}: {
  theme: Theme;
  onSetTheme: (t: Theme) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onClose: () => void;
}) {
  // Play the dematerialize before the parent unmounts us, so the popover exits along the same
  // pop path it entered (§7). requestClose flips to pop-out; animationend calls the real onClose.
  const [closing, setClosing] = useState(false);
  const requestClose = useCallback(() => setClosing(true), []);

  // Esc closes — never trap the user (Wayfinding, §16).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") requestClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  // Fallback: unmount even if pop-out animationend never fires (animations disabled).
  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(onClose, 220);
    return () => window.clearTimeout(t);
  }, [closing, onClose]);

  return (
    <>
      {/* Click-away scrim (invisible) */}
      <div className="fixed inset-0 z-40" onPointerDown={requestClose} />

      <div
        role="dialog"
        aria-label="Settings"
        onAnimationEnd={() => { if (closing) onClose(); }}
        className={`${closing ? "pop-out" : "pop-in"} absolute z-50 w-max min-w-[210px] rounded-[16px] p-1.5`}
        style={{
          bottom: 0,
          left: "calc(100% + 12px)",
          transformOrigin: "bottom left",
          backgroundColor: "var(--surface-raised)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid var(--hairline)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.12)",
        }}
      >
        {/* Appearance + zoom read as two calm settings rows — label left, control
            right — the same iOS-Settings pattern the detail panel uses. No nested
            container; the popover itself is surface enough (Simplicity, §16). */}
        <div className="flex items-center justify-between gap-4 px-2.5 py-2">
          <span className="text-[13px]" style={{ color: "var(--text-2)" }}>Theme</span>
          {/* Segmented Light / Dark: both options are visible and the active one is
              marked, so the control shows current state and maps directly to what it
              changes — no toggle-model to infer (Craft + mapping, §16). Shape and
              height mirror the zoom pill for a consistent settings row. */}
          <div
            role="radiogroup"
            aria-label="Theme"
            className="relative flex items-center h-[34px] p-[3px] rounded-full shrink-0"
            style={{
              backgroundColor: "var(--control-track)",
              border: "1px solid var(--hairline)",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            {/* The thumb is one continuous element that slides between segments, so the
                selection reads as a single object moving — critically damped, no bounce,
                since nothing here carries momentum (§4). */}
            <div
              aria-hidden
              className="appearance-thumb absolute top-[3px] bottom-[3px] rounded-full"
              style={{
                left: 3,
                width: "calc((100% - 6px) / 2)",
                transform: theme === "dark" ? "translateX(100%)" : "translateX(0)",
                backgroundColor: "var(--surface-raised)",
                boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                // Appearance changes run through the whole-screen View Transition (usePreferences),
                // which would otherwise fold the thumb's move into the root cross-fade. Naming it
                // lifts it out as its own element so the API morphs its position — a real slide —
                // during the theme dissolve. The plain CSS transition above stays the fallback for
                // the no-VT / reduced-motion path (where applyTheme swaps instantly).
                viewTransitionName: "appearance-thumb",
              }}
            />
            {([
              { value: "light", label: "Light", icon: Sun },
              { value: "dark", label: "Dark", icon: Moon },
            ] as const).map(({ value, label, icon: Icon }) => {
              const selected = theme === value;
              return (
                <button
                  key={value}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onSetTheme(value)}
                  className="relative z-10 flex items-center justify-center gap-1.5 h-full flex-1 px-2.5 rounded-full text-[12px] font-medium transition-colors duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)]"
                  // Named so the label rides in the top layer ABOVE the sliding thumb during the
                  // theme View Transition — otherwise the lifted thumb paints over it and the text
                  // is unreadable mid-slide. The label doesn't move; it just cross-fades its color.
                  style={{ color: selected ? "var(--text-1)" : "var(--text-3)", viewTransitionName: `appearance-seg-${value}` }}
                >
                  <Icon size={14} strokeWidth={2} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-2.5 py-2">
          <span className="text-[13px]" style={{ color: "var(--text-2)" }}>Zoom</span>
          <ZoomControl
            zoom={zoom}
            onIn={onZoomIn}
            onOut={onZoomOut}
            onReset={onResetZoom}
            canZoomIn={canZoomIn}
            canZoomOut={canZoomOut}
          />
        </div>
      </div>
    </>
  );
}
