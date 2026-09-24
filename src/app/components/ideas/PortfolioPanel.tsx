import { useMemo } from "react";
import { Layers, ChevronLeft as PanelCollapse, Pin, PinOff } from "lucide-react";
import type { Idea } from "../../types";
import { PORTFOLIOS, PORTFOLIO_ABBR } from "../../data/portfolios";

// Hoisted out of PortfolioPanel: defined inside the component body it was a fresh component *type*
// on every render, forcing React to unmount/remount the whole portfolio list each time the panel
// re-rendered. As a module-level component it keeps its identity, so the list reconciles normally.
function PortfolioRow({
  label,
  pKey,
  isActive,
  count,
  open,
  onSelect,
}: {
  label: string;
  pKey: string;
  isActive: boolean;
  count: number;
  open: boolean;
  onSelect: (p: string) => void;
}) {
  return (
      <button
        onClick={() => onSelect(pKey)}
        title={label}
        className={`relative w-full flex items-center gap-2 rounded-full text-left transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)] ${
          isActive
            ? "shadow-[0_1px_3px_rgba(0,0,0,0.22)]"
            : "text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-gray-100 hover:shadow-[0_1px_3px_rgba(0,0,0,0.07)]"
        }`}
        style={{
          minHeight: 34,
          padding: open ? "7px 12px" : "6px 0",
          backgroundColor: isActive ? "var(--accent-strong)" : undefined,
          color: isActive ? "var(--on-accent)" : undefined,
          justifyContent: open ? undefined : "center",
        }}
      >
        {open ? (
          <>
            <span className={`pf-label-in text-[13px] leading-snug flex-1 min-w-0 truncate ${isActive ? "font-medium" : ""}`}>
              {label}
            </span>
            <span
              className={`pf-label-in shrink-0 text-[11px] tabular-nums rounded-full px-[7px] py-px font-semibold ${
                isActive
                  ? "bg-white/20 text-white"
                  : count > 0
                    ? "bg-gray-200/80 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                    : "text-gray-300 dark:text-gray-500"
              }`}
            >
              {count > 0 ? count : "—"}
            </span>
          </>
        ) : (
          <span
            className={`pf-abbr-in text-[9px] font-bold tracking-[0.04em] ${
              isActive ? "text-white" : "text-gray-400 dark:text-gray-400"
            }`}
          >
            {PORTFOLIO_ABBR[pKey] ?? pKey.slice(0, 3).toUpperCase()}
          </span>
        )}
      </button>
  );
}

export function PortfolioPanel({
  rows,
  active,
  open,
  pinned,
  onSelect,
  onToggle,
  onTogglePin,
}: {
  rows: Idea[];
  active: string;
  open: boolean;
  pinned: boolean;
  onSelect: (p: string) => void;
  onToggle: () => void;
  onTogglePin: () => void;
}) {
  // Counts depend only on rows, so recompute the Map only when rows change rather than on every
  // panel re-render (open/collapse, active-portfolio change).
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    m.set("All", rows.length);
    for (const p of PORTFOLIOS) m.set(p, 0);
    for (const row of rows) {
      if (row.portfolio) m.set(row.portfolio, (m.get(row.portfolio) ?? 0) + 1);
    }
    return m;
  }, [rows]);

  return (
    <div
      className="relative shrink-0 flex flex-col overflow-hidden"
      style={{
        width: open ? 234 : 54,
        transition: "width 0.3s cubic-bezier(0.16,1,0.3,1)",
        backgroundColor: "var(--surface-2)",
        boxShadow: "1px 0 0 var(--depth-edge)",
      }}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center" style={{ height: 56 }}>
        {open ? (
          <div className="flex items-center justify-between w-full px-5 pr-3">
            <div className="pf-label-in flex items-center gap-2 select-none">
              <Layers size={12} strokeWidth={2.2} className="text-gray-400 dark:text-gray-400 shrink-0" />
              <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-400 tracking-[0.06em] uppercase">
                Portfolio
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={onTogglePin}
                title={pinned ? "Unpin — panel will auto-collapse" : "Pin panel open"}
                aria-pressed={pinned}
                className={`p-1.5 rounded-full active:scale-95 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)] ${
                  pinned
                    ? "text-[color:var(--accent-strong)] bg-[color:var(--accent-strong)]/[0.12] hover:bg-[color:var(--accent-strong)]/[0.18]"
                    : "text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
                }`}
              >
                {pinned ? <Pin size={13} strokeWidth={2} className="pf-pin-pop fill-current" /> : <PinOff size={13} strokeWidth={2} className="pf-pin-pop" />}
              </button>
              <button
                onClick={onToggle}
                title="Collapse"
                className="p-1.5 rounded-full text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] active:scale-95 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)]"
              >
                <PanelCollapse size={13} strokeWidth={2} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onToggle}
            title="Expand portfolio panel"
            className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)]"
          >
            <Layers size={15} strokeWidth={1.9} />
          </button>
        )}
      </div>

      {/* List */}
      {/* An 8px gutter gives the capsules room to breathe off the panel edges, while the row
          content (8px gutter + 12px capsule inset = 20px) still shares one left edge with the
          "Portfolio" header icon (px-5 = 20px) — Craft: a single, deliberate left line. */}
      <div className="flex-1 overflow-y-auto" style={{ padding: open ? "2px 8px 14px" : "0 8px 14px" }}>
        {/* All portfolios */}
        <PortfolioRow
          label="All portfolios"
          pKey="All"
          isActive={active === "All"}
          count={counts.get("All") ?? 0}
          open={open}
          onSelect={onSelect}
        />

        {/* Divider */}
        <div className="my-2" style={{ borderTop: "1px solid var(--hairline)" }} />

        {/* Individual portfolios */}
        <div className="flex flex-col gap-[3px]">
          {PORTFOLIOS.map(p => (
            <PortfolioRow
              key={p}
              label={p}
              pKey={p}
              isActive={active === p}
              count={counts.get(p) ?? 0}
              open={open}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
