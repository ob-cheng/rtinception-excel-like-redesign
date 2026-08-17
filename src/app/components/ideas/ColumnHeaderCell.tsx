import { Check, Lock } from "lucide-react";
import type { Column, Idea, SortDir } from "../../types";
import { formatHeaderLabel } from "../../lib/format";
import { SortIcon } from "./SortIcon";

export function ColumnHeaderCell({
  col,
  selected,
  values,
  sortDir,
  filterOpen,
  swapClass,
  swapStyle,
  frozenLeft,
  frozenLast,
  readOnly,
  onSort,
  onToggleFilterMenu,
  onToggleValue,
  onClearFilter,
}: {
  col: Column;
  selected: string[];
  values: string[];
  sortDir: SortDir;
  filterOpen: boolean;
  swapClass: string;
  swapStyle?: React.CSSProperties;
  frozenLeft?: number;
  frozenLast?: boolean;
  readOnly?: boolean;
  onSort: () => void;
  onToggleFilterMenu: () => void;
  onToggleValue: (key: keyof Idea, value: string) => void;
  onClearFilter: () => void;
}) {
  const isFiltered = selected.length > 0;
  const label = formatHeaderLabel(col.label);
  const frozen = frozenLeft != null;
  const frozenClass = frozen ? (frozenLast ? " frozen frozen-last" : " frozen") : "";

  return (
    <th
      className={`${swapClass} text-left px-3 py-[4px] text-[10.5px] font-medium tracking-[0.01em] select-none border-r relative${frozenClass}`}
      style={{
        ...swapStyle,
        color: "var(--text-3)",
        borderColor: "var(--hairline)",
        width: col.width,
        minWidth: col.width,
        ...(frozen ? { position: "sticky", left: frozenLeft, zIndex: 30 } : {}),
      }}
    >
      <div className="flex items-center gap-0.5 w-full">
        {/* Label — click to sort */}
        <button
          onClick={onSort}
          title={col.label}
          className="flex-1 min-w-0 text-left hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-150 cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)]"
        >
          <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.35" }}>
            {label}
          </span>
        </button>
        {/* Read-only marker: this column is Franchise-owned and can't be edited from this tab. */}
        {readOnly && (
          <Lock
            size={9}
            strokeWidth={2.2}
            className="shrink-0"
            style={{ color: "var(--text-4)" }}
            aria-label="Read-only — managed by Franchise"
          />
        )}
        {/* Filter (top) + sort (bottom) icons stacked vertically */}
        <div className="flex flex-col items-center shrink-0 gap-[2px]">
          <button
            onClick={onToggleFilterMenu}
            title="Filter column"
            className={`p-[2px] rounded transition-all duration-100 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)] ${isFiltered ? "text-[color:var(--accent)]" : "text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
          >
            {/* SF Symbol-style: three horizontal lines decreasing in width */}
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-label="Filter">
              <line x1="1"   y1="1.25" x2="10"  y2="1.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="2.5" y1="4.5"  x2="8.5" y2="4.5"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="4"   y1="7.75" x2="7"   y2="7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={onSort}
            title="Sort"
            className={`p-[2px] rounded transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)] ${sortDir ? "text-[color:var(--accent)]" : "text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
          >
            <SortIcon dir={sortDir} />
          </button>
        </div>
      </div>

      {filterOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={onToggleFilterMenu} />
          <div className="pop-in surface-pop absolute right-0 top-full mt-1.5 z-40 w-56 rounded-[14px] py-1 normal-case tracking-normal font-normal"
            style={{
              backgroundColor: "var(--surface-raised)",
              backdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid var(--hairline)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-gray-100 dark:border-white/10">
              <span className="text-[11.5px] font-semibold text-gray-600 dark:text-gray-300">Filter by {label}</span>
              {isFiltered && (
                <button
                  onClick={onClearFilter}
                  className="text-[11.5px] font-medium text-[color:var(--accent)] hover:opacity-70 transition-opacity duration-100 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)]"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="max-h-52 overflow-auto py-1">
              {values.length === 0 && (
                <div className="px-3.5 py-2.5 text-[12px] text-gray-400 dark:text-gray-400">No values</div>
              )}
              {values.map(val => {
                const checked = selected.includes(val);
                return (
                  <button
                    key={val}
                    onClick={() => onToggleValue(col.key, val)}
                    className="flex items-center gap-2.5 w-full text-left px-3.5 py-[7px] text-[13px] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/5 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)]"
                  >
                    <span className={`flex items-center justify-center w-[15px] h-[15px] rounded-[4px] border transition-all duration-100 ${checked ? "text-white border-[color:var(--accent)]" : "border-gray-300 dark:border-white/20"}`}
                      style={checked ? { backgroundColor: "var(--accent)" } : {}}>
                      {checked && <Check size={9.5} strokeWidth={3} />}
                    </span>
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </th>
  );
}
