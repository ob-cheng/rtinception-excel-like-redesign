import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import type { Theme } from "../../hooks/usePreferences";
import { currentUser } from "../../lib/theme";
import { ZoomControl } from "./ZoomControl";

// A small settings surface anchored to the profile picture: appearance + zoom.
// Kept to the two live-preference controls — no gear, no buried menu — so the
// common path is one click on the avatar (Simplicity, §16).
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
        {/* Identity */}
        <div className="flex items-center gap-3 px-2.5 py-2.5">
          <div
            className="flex items-center justify-center rounded-full text-white font-semibold select-none shrink-0"
            style={{
              width: 38, height: 38,
              background: "linear-gradient(180deg, var(--avatar-top) 0%, var(--avatar-bottom) 100%)",
              fontSize: 15,
              letterSpacing: "-0.01em",
            }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-1)" }}>{currentUser.name}</p>
            <p className="text-[12px] truncate" style={{ color: "var(--text-3)" }}>{currentUser.role}</p>
          </div>
        </div>

        <div className="h-px mx-2 mt-1 mb-0.5" style={{ backgroundColor: "var(--hairline-soft)" }} />

        {/* Appearance + zoom read as two calm settings rows — label left, control
            right — the same iOS-Settings pattern the detail panel uses. No nested
            container; the popover itself is surface enough (Simplicity, §16). */}
        <div className="flex items-center justify-between gap-4 px-2.5 py-2">
          <span className="text-[13px]" style={{ color: "var(--text-2)" }}>Appearance</span>
          <button
            onClick={() => onSetTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "Switch to light appearance" : "Switch to dark appearance"}
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
            className="flex items-center justify-center h-[30px] w-[30px] rounded-[8px] shrink-0 transition-all duration-100 active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)]"
            style={{ color: "var(--text-2)" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--fill-subtle)")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            {theme === "dark"
              ? <Sun size={16} strokeWidth={2} />
              : <Moon size={16} strokeWidth={2} />}
          </button>
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
