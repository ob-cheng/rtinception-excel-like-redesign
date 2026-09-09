import type { ReactNode } from "react";
import { ArrowUpDown, Search, Upload } from "lucide-react";

export function PageHeader({
  portfolio,
  search,
  onSearchChange,
  onRank,
  onExport,
  columnsControl,
}: {
  portfolio: string;
  search: string;
  onSearchChange: (v: string) => void;
  onRank: () => void;
  onExport: () => void;
  // Self-contained "Customize columns" trigger + popover, owned by App (which holds the
  // column prefs) and slotted into the action cluster so layout stays here.
  columnsControl?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 shrink-0">
      <div>
        <h2 className="text-[24px] font-semibold tracking-[-0.022em] leading-tight" style={{ color: "var(--text-1)" }}>Ideas List</h2>
        <p className="text-[13px] mt-0.5 font-normal" style={{ color: "var(--text-3)" }}>
          {portfolio === "All" ? "All portfolios" : portfolio}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-3)" }} />
          <input
            type="search"
            aria-label="Search ideas"
            placeholder="Search…"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-[30px] pr-4 h-[34px] w-52 rounded-full text-base sm:text-[13px] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-ring)] transition-all duration-150"
            style={{
              backgroundColor: "var(--fill-subtle)",
              border: "none",
              color: "var(--text-1)",
            }}
          />
        </div>
        {columnsControl}
        {/* Prioritize — opens the persona-scoped drag-to-prioritize flow. Shares the secondary
            "lift on hover" treatment with the Columns trigger so the cluster reads as one set. */}
        <button
          onClick={onRank}
          className="flex items-center justify-center gap-1.5 h-[34px] px-4 min-w-[112px] rounded-full text-[13px] font-medium active:scale-[0.97] transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)]"
          style={{
            backgroundColor: "var(--surface)",
            color: "var(--text-2)",
            border: "1px solid var(--hairline)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = "var(--surface-2)";
            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = "var(--surface)";
            e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
          }}
        >
          <ArrowUpDown size={12} strokeWidth={2.2} />
          Prioritize
        </button>
        {/* Export — brand-navy action, stays navy in both themes. Hover brightens the fill and
            deepens the shadow so the primary lifts on hover in step with the secondary buttons. */}
        <button
          onClick={onExport}
          className="flex items-center justify-center gap-1.5 h-[34px] px-4 min-w-[112px] rounded-full text-[13px] font-medium active:scale-[0.97] transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)]"
          style={{
            backgroundColor: "var(--accent-strong)",
            color: "var(--on-accent)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.28), 0 1px 0 rgba(255,255,255,0.10) inset",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = "color-mix(in srgb, #ffffff 10%, var(--accent-strong))";
            e.currentTarget.style.boxShadow = "0 3px 8px rgba(0,0,0,0.34), 0 1px 0 rgba(255,255,255,0.12) inset";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = "var(--accent-strong)";
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.28), 0 1px 0 rgba(255,255,255,0.10) inset";
          }}
        >
          <Upload size={12} strokeWidth={2.2} />
          Export
        </button>
      </div>
    </div>
  );
}
