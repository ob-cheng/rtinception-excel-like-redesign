import { useState } from "react";
import { FileText, HelpCircle, Home, Settings } from "lucide-react";
import { currentUser } from "../../lib/theme";
import type { Theme } from "../../hooks/usePreferences";
import { SettingsPopover } from "./SettingsPopover";

export type Page = "home" | "ideas" | "help";

export type SidebarPrefs = {
  theme: Theme;
  onSetTheme: (t: Theme) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
};

const NAV_ITEMS: { icon: React.ReactNode; label: string; page: Page }[] = [
  { icon: <Home size={19} strokeWidth={1.7} />, label: "Home", page: "home" },
  { icon: <FileText size={19} strokeWidth={1.7} />, label: "Ideas", page: "ideas" },
  { icon: <HelpCircle size={19} strokeWidth={1.7} />, label: "Help", page: "help" },
];

export function AppSidebar({
  page,
  onNavigate,
  prefs,
}: {
  page: Page;
  onNavigate: (p: Page) => void;
  prefs: SidebarPrefs;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <aside
      className="flex flex-col items-center pt-5 pb-5 shrink-0"
      style={{
        width: 84,
        background: "linear-gradient(180deg, var(--sidebar-top) 0%, var(--sidebar-bottom) 100%)",
        boxShadow: "1px 0 0 var(--sidebar-border)",
      }}
    >
      {/* Logo mark */}
      <div
        className="flex items-center justify-center rounded-[16px] text-white font-bold select-none mb-7"
        style={{
          width: 44, height: 44,
          background: "var(--sidebar-logo-bg)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 8px rgba(0,0,0,0.18)",
          fontSize: 11.5,
          letterSpacing: "0.05em",
        }}
      >
        Alcon
      </div>

      {/* Nav */}
      <nav className="flex flex-col items-center gap-1 w-full px-2.5">
        {NAV_ITEMS.map(item => {
          const active = item.page === page;
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.page)}
              aria-current={active ? "page" : undefined}
              className={`side-nav-item flex flex-col items-center gap-1.5 w-full py-3 rounded-[14px] active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${active ? "is-active" : ""}`}
            >
              {item.icon}
              <span className="text-[9.5px] font-medium tracking-[0.02em]">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User identity stays in the sidebar as a calm display element (not a
          control). The gear below it is the conventional, discoverable entry to
          appearance + zoom, and anchors the popover (relative wrapper). */}
      <div className="flex-1" />
      <div className="flex flex-col items-center gap-1.5">
        <div
          className="flex items-center justify-center rounded-full text-white font-semibold select-none"
          style={{
            width: 34, height: 34,
            background: "var(--sidebar-avatar-bg)",
            fontSize: 13,
            letterSpacing: "-0.01em",
            boxShadow: "0 0 0 2px var(--sidebar-avatar-ring)",
          }}
        >
          {currentUser.name.charAt(0)}
        </div>
        <span className="text-[9.5px] font-medium tracking-[0.01em]" style={{ color: "var(--sidebar-fg-hover)" }}>{currentUser.name}</span>
      </div>

      <div className="relative flex flex-col items-center w-full px-2.5 mt-2">
        <button
          onClick={() => setSettingsOpen(o => !o)}
          aria-haspopup="dialog"
          aria-expanded={settingsOpen}
          aria-label="Settings"
          title="Settings"
          className={`side-nav-item flex flex-col items-center gap-1.5 w-full py-3 rounded-[14px] active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${settingsOpen ? "is-active" : ""}`}
        >
          <Settings size={19} strokeWidth={1.7} />
          <span className="text-[9.5px] font-medium tracking-[0.02em]">Settings</span>
        </button>

        {settingsOpen && (
          <SettingsPopover
            theme={prefs.theme}
            onSetTheme={prefs.onSetTheme}
            zoom={prefs.zoom}
            onZoomIn={prefs.onZoomIn}
            onZoomOut={prefs.onZoomOut}
            onResetZoom={prefs.onResetZoom}
            canZoomIn={prefs.canZoomIn}
            canZoomOut={prefs.canZoomOut}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </div>
    </aside>
  );
}
