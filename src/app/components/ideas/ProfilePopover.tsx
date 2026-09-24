import { useCallback, useEffect, useState } from "react";
import { Briefcase, Eye, FileText, Layers, Moon, RotateCcw, Sun } from "lucide-react";
import type { Profile } from "../../hooks/useProfile";
import type { Theme } from "../../hooks/usePreferences";
import { currentUser } from "../../lib/theme";
import { PORTFOLIO_ABBR } from "../../data/portfolios";

// Anchored to the sidebar avatar (same pop-in/out + click-away as SettingsPopover). A read-only
// summary of the setup captured by the interview — persona, default portfolio, focus tab, and
// appearance — plus a "Redo setup" action that reopens it. The gear's SettingsPopover stays the
// live theme/zoom control; this popover is identity + defaults + redo.
export function ProfilePopover({
  profile,
  theme,
  zoom,
  onRedo,
  onClose,
}: {
  profile: Profile;
  theme: Theme;
  zoom: number;
  onRedo: () => void;
  onClose: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const requestClose = useCallback(() => setClosing(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") requestClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(onClose, 220);
    return () => window.clearTimeout(t);
  }, [closing, onClose]);

  const personaLabel = profile.persona === "brand" ? "Brand Director" : profile.persona === "portfolio" ? "Therapeutic Area VP" : "Not set";
  const portfolioLabel = profile.portfolio === "All" ? "All portfolios" : profile.portfolio ?? "Not set";
  const focusLabel = profile.focusView ?? "Not set";
  const zoomPct = `${Math.round(zoom * 100)}%`;

  return (
    <>
      <div className="fixed inset-0 z-40" onPointerDown={requestClose} />

      <div
        role="dialog"
        aria-label="Your profile"
        onAnimationEnd={() => { if (closing) onClose(); }}
        className={`${closing ? "pop-out" : "pop-in"} absolute z-50 w-[268px] rounded-[16px] p-1.5`}
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
        {/* Identity header */}
        <div className="flex items-center gap-3 px-2.5 py-2.5">
          <span
            className="grid place-items-center rounded-full text-white font-semibold shrink-0"
            style={{ width: 38, height: 38, background: "var(--sidebar-avatar-bg)", fontSize: 15 }}
          >
            {currentUser.name.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 truncate">{currentUser.name}</p>
            <p className="text-[12px] truncate" style={{ color: "var(--text-3)" }}>{personaLabel}</p>
          </div>
        </div>

        <div className="mx-2.5 my-1 h-px" style={{ backgroundColor: "var(--hairline)" }} />

        {/* Setup summary */}
        <div className="flex flex-col gap-0.5 px-1 py-1">
          <SummaryRow
            icon={<Layers size={15} strokeWidth={1.9} />}
            label="Portfolio"
            value={profile.portfolio && profile.portfolio !== "All" ? `${PORTFOLIO_ABBR[profile.portfolio] ?? ""} · ${portfolioLabel}` : portfolioLabel}
          />
          <SummaryRow
            icon={profile.focusView === "Evidence Function" ? <Eye size={15} strokeWidth={1.9} /> : <FileText size={15} strokeWidth={1.9} />}
            label="Focus tab"
            value={focusLabel}
          />
          <SummaryRow
            icon={profile.persona === "portfolio" ? <Briefcase size={15} strokeWidth={1.9} /> : <Eye size={15} strokeWidth={1.9} />}
            label="Role"
            value={personaLabel}
          />
          <SummaryRow
            icon={theme === "dark" ? <Moon size={15} strokeWidth={1.9} /> : <Sun size={15} strokeWidth={1.9} />}
            label="Appearance"
            value={`${theme === "dark" ? "Dark" : "Light"} · ${zoomPct}`}
          />
        </div>

        <div className="mx-2.5 my-1 h-px" style={{ backgroundColor: "var(--hairline)" }} />

        <button
          onClick={() => { onClose(); onRedo(); }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-[12px] text-left text-[13px] font-medium text-gray-800 dark:text-gray-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-[0.99] transition-all duration-100"
        >
          <RotateCcw size={15} strokeWidth={2} style={{ color: "var(--accent)" }} />
          Redo setup
        </button>
      </div>
    </>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-1.5">
      <span className="shrink-0" style={{ color: "var(--text-3)" }}>{icon}</span>
      <span className="text-[12px] shrink-0" style={{ color: "var(--text-3)" }}>{label}</span>
      <span className="min-w-0 flex-1 text-right text-[12.5px] font-medium text-gray-800 dark:text-gray-100 truncate">{value}</span>
    </div>
  );
}
