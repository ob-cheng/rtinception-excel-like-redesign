import { useState, useEffect } from "react";
import { Layers, ChevronLeft as PanelCollapse } from "lucide-react";
import type { Idea } from "../../types";
import { NAVY } from "../../lib/theme";
import { PORTFOLIOS, PORTFOLIO_ABBR } from "../../data/portfolios";

export function PortfolioPanel({
  rows,
  active,
  open,
  onSelect,
  onToggle,
}: {
  rows: Idea[];
  active: string;
  open: boolean;
  onSelect: (p: string) => void;
  onToggle: () => void;
}) {
  const [hint, setHint] = useState(false);
  useEffect(() => {
    setHint(false);
    if (!open) return;
    const t = setTimeout(() => setHint(true), 10_000);
    return () => clearTimeout(t);
  }, [open, active]);

  const counts = new Map<string, number>();
  counts.set("All", rows.length);
  for (const p of PORTFOLIOS) counts.set(p, 0);
  for (const row of rows) {
    if (row.portfolio) counts.set(row.portfolio, (counts.get(row.portfolio) ?? 0) + 1);
  }

  function PortfolioRow({ label, pKey }: { label: string; pKey: string }) {
    const isActive = active === pKey;
    const count = counts.get(pKey) ?? 0;
    return (
      <button
        onClick={() => onSelect(pKey)}
        title={label}
        className={`relative w-full flex items-center gap-2 rounded-[9px] text-left transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30 ${
          isActive
            ? "text-white shadow-[0_1px_3px_rgba(13,45,107,0.25)]"
            : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-[0_1px_3px_rgba(0,0,0,0.07)]"
        }`}
        style={{
          minHeight: 33,
          padding: open ? "6px 10px" : "6px 0",
          backgroundColor: isActive ? NAVY : undefined,
          justifyContent: open ? undefined : "center",
        }}
      >
        {open ? (
          <>
            <span className={`text-[12.5px] leading-snug flex-1 min-w-0 truncate ${isActive ? "font-medium" : ""}`}>
              {label}
            </span>
            <span
              className={`shrink-0 text-[10.5px] tabular-nums rounded-full px-[6px] py-px font-semibold ${
                isActive
                  ? "bg-white/20 text-white"
                  : count > 0
                    ? "bg-gray-200/80 text-gray-500"
                    : "text-gray-300"
              }`}
            >
              {count > 0 ? count : "—"}
            </span>
          </>
        ) : (
          <span
            className={`text-[9px] font-bold tracking-[0.04em] ${
              isActive ? "text-white" : "text-gray-400"
            }`}
          >
            {PORTFOLIO_ABBR[pKey] ?? pKey.slice(0, 3).toUpperCase()}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className="relative shrink-0 flex flex-col overflow-hidden"
      style={{
        width: open ? 220 : 54,
        transition: "width 0.3s cubic-bezier(0.16,1,0.3,1)",
        backgroundColor: "#f4f4f6",
        boxShadow: "1px 0 0 rgba(0,0,0,0.07)",
      }}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center" style={{ height: 56 }}>
        {open ? (
          <div className="flex items-center justify-between w-full px-3 pr-2">
            <div className="flex items-center gap-2 select-none">
              <Layers size={12} strokeWidth={2.2} className="text-gray-400 shrink-0" />
              <span className="text-[11px] font-semibold text-gray-400 tracking-[0.06em] uppercase">
                Portfolio
              </span>
            </div>
            <button
              onClick={onToggle}
              onMouseEnter={() => setHint(false)}
              title="Collapse"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-black/[0.05] active:scale-95 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30"
              style={hint ? { animation: "panel-hint-breathe 2.6s ease-in-out infinite" } : undefined}
            >
              <PanelCollapse size={13} strokeWidth={2} />
            </button>
          </div>
        ) : (
          <button
            onClick={onToggle}
            title="Expand portfolio panel"
            className="w-full h-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0d2d6b]/30"
          >
            <Layers size={15} strokeWidth={1.9} />
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-3" style={{ padding: open ? "0 8px 12px" : "0 6px 12px" }}>
        {/* All portfolios */}
        <PortfolioRow label="All portfolios" pKey="All" />

        {/* Divider */}
        <div className="my-2" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }} />

        {/* Individual portfolios */}
        <div className="flex flex-col gap-[2px]">
          {PORTFOLIOS.map(p => (
            <PortfolioRow key={p} label={p} pKey={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
