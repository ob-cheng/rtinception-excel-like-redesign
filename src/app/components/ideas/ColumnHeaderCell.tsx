import { Check } from "lucide-react";
import type { Column, Idea, SortDir } from "../../types";
import { NAVY } from "../../lib/theme";
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
  onSort: () => void;
  onToggleFilterMenu: () => void;
  onToggleValue: (key: keyof Idea, value: string) => void;
  onClearFilter: () => void;
}) {
  const isFiltered = selected.length > 0;
  const label = formatHeaderLabel(col.label);

  return (
    <th
      className={`${swapClass} text-left px-3 py-[4px] text-[10.5px] font-medium tracking-[0.01em] select-none border-r relative`}
      style={{ ...swapStyle, color: "#8e8e93", borderColor: "rgba(0,0,0,0.06)", width: col.width, minWidth: col.width }}
    >
      <div className="flex items-center gap-0.5 w-full">
        {/* Label — click to sort */}
        <button
          onClick={onSort}
          title={col.label}
          className={`flex-1 min-w-0 text-left hover:text-gray-700 transition-colors duration-150 cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30 ${sortDir ? "text-[#0d2d6b]" : ""}`}
        >
          <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.35" }}>
            {label}
          </span>
        </button>
        {/* Filter (top) + sort (bottom) icons stacked vertically */}
        <div className="flex flex-col items-center shrink-0 gap-[2px]">
          <button
            onClick={onToggleFilterMenu}
            title="Filter column"
            className={`p-[2px] rounded transition-all duration-100 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30 ${isFiltered ? "text-[#0d2d6b]" : "text-gray-400 hover:text-gray-600"}`}
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
            className={`p-[2px] rounded transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30 ${sortDir ? "text-[#0d2d6b]" : "text-gray-400 hover:text-gray-600"}`}
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
              backgroundColor: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid rgba(0,0,0,0.1)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-gray-100">
              <span className="text-[11.5px] font-semibold text-gray-600">Filter by {label}</span>
              {isFiltered && (
                <button
                  onClick={onClearFilter}
                  className="text-[11.5px] font-medium text-[#0d2d6b] hover:opacity-70 transition-opacity duration-100 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="max-h-52 overflow-auto py-1">
              {values.length === 0 && (
                <div className="px-3.5 py-2.5 text-[12px] text-gray-400">No values</div>
              )}
              {values.map(val => {
                const checked = selected.includes(val);
                return (
                  <button
                    key={val}
                    onClick={() => onToggleValue(col.key, val)}
                    className="flex items-center gap-2.5 w-full text-left px-3.5 py-[7px] text-[13px] text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0d2d6b]/30"
                  >
                    <span className={`flex items-center justify-center w-[15px] h-[15px] rounded-[4px] border transition-all duration-100 ${checked ? "text-white border-[#0d2d6b]" : "border-gray-300"}`}
                      style={checked ? { backgroundColor: NAVY } : {}}>
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
