import { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Info, Lock } from "lucide-react";
import type { Column, Idea, SortDir } from "../../types";
import { formatHeaderLabel } from "../../lib/format";
import { SortIcon } from "./SortIcon";

// Plain-language column guidance (Column.note), shown as a glass card anchored to the header info
// icon. Mirrors the cell TooltipCard styling so notes and value tooltips read as one family.
function NoteCard({ text, anchor }: { text: string; anchor: DOMRect }) {
  const cardW = 260;
  const gap = 6;
  let top = anchor.bottom + gap;
  let left = anchor.left - cardW / 2 + anchor.width / 2;
  if (left + cardW > window.innerWidth - 8) left = window.innerWidth - cardW - 8;
  if (left < 8) left = 8;
  return createPortal(
    <div
      style={{
        position: "fixed", top, left, width: cardW, zIndex: 9999,
        backgroundColor: "var(--surface-raised)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        border: "1px solid var(--hairline)", borderRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)",
        padding: "10px 13px", fontSize: 12.5, lineHeight: 1.5, color: "var(--text-1)",
        pointerEvents: "none", textTransform: "none", letterSpacing: "normal", fontWeight: 400,
        animation: "tooltip-in 120ms cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      {text}
    </div>,
    document.body,
  );
}

// Memoized: header callbacks are key-based and stable, so a header cell only re-renders when its
// own filter/sort/geometry props change, not on every grid state change.
export const ColumnHeaderCell = memo(function ColumnHeaderCell({
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
  onSort: onSortKey,
  onToggleFilterMenu: onToggleFilterMenuKey,
  onToggleValue,
  onClearFilter: onClearFilterKey,
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
  onSort: (key: string) => void;
  onToggleFilterMenu: (key: keyof Idea) => void;
  onToggleValue: (key: keyof Idea, value: string) => void;
  onClearFilter: (key: keyof Idea) => void;
}) {
  const onSort = useCallback(() => onSortKey(col.key), [onSortKey, col.key]);
  const onToggleFilterMenu = useCallback(() => onToggleFilterMenuKey(col.key), [onToggleFilterMenuKey, col.key]);
  const onClearFilter = useCallback(() => onClearFilterKey(col.key), [onClearFilterKey, col.key]);
  const isFiltered = selected.length > 0;
  const [noteAnchor, setNoteAnchor] = useState<DOMRect | null>(null);
  // Filter button anchor — the menu is portaled to <body> with fixed positioning so it escapes the
  // table's scroll/overflow clipping instead of being cut off at the table box edge.
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const [filterAnchor, setFilterAnchor] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!filterOpen) { setFilterAnchor(null); return; }
    const update = () => { if (filterBtnRef.current) setFilterAnchor(filterBtnRef.current.getBoundingClientRect()); };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [filterOpen]);
  // Play the pop-out before the parent closes the menu (§7 / parity with the kebab + column popover).
  // requestCloseFilter flips to pop-out; animationend calls the real toggle to unmount it.
  const [filterClosing, setFilterClosing] = useState(false);
  const requestCloseFilter = useCallback(() => setFilterClosing(true), []);
  useEffect(() => { if (!filterOpen) setFilterClosing(false); }, [filterOpen]);
  // Fallback for when animationend never fires (animations disabled).
  useEffect(() => {
    if (!filterClosing) return;
    const t = window.setTimeout(() => { onToggleFilterMenu(); }, 220);
    return () => window.clearTimeout(t);
  }, [filterClosing, onToggleFilterMenu]);
  const label = formatHeaderLabel(col.label);
  const frozen = frozenLeft != null;
  const frozenClass = frozen ? (frozenLast ? " frozen frozen-last" : " frozen") : "";

  return (
    <th
      className={`${swapClass} text-left px-3 py-[4px] text-[10.5px] font-medium tracking-[0.01em] select-none relative${frozenLast ? "" : " border-r"}${frozenClass}`}
      style={{
        ...swapStyle,
        color: "var(--text-3)",
        // Frozen-last header border lives in CSS (see GlobalStyles) so it can fade to the scroll
        // shadow when pinned; inline color would override that. Every other header keeps its inline
        // right hairline — the SOFT token, matching the body cells so the vertical column seam reads
        // as one continuous rule across the header/body boundary (--hairline stays for structure).
        borderColor: frozenLast ? undefined : "var(--hairline-soft)",
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
          className={`flex-1 min-w-0 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-150 cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)] ${col.align === "right" ? "text-right" : "text-left"}`}
        >
          <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.35" }}>
            {label}
          </span>
        </button>
        {/* Note affordance: hover the info icon to read plain-language guidance for this column. */}
        {col.note && (
          <button
            type="button"
            aria-label={`About ${col.label}`}
            className="shrink-0 p-[1px] rounded-full text-gray-400 dark:text-gray-400 hover:text-[color:var(--accent)] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)]"
            onMouseEnter={e => setNoteAnchor(e.currentTarget.getBoundingClientRect())}
            onMouseLeave={() => setNoteAnchor(null)}
            onFocus={e => setNoteAnchor(e.currentTarget.getBoundingClientRect())}
            onBlur={() => setNoteAnchor(null)}
            onClick={e => e.stopPropagation()}
          >
            <Info size={11} strokeWidth={2.2} />
          </button>
        )}
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
            ref={filterBtnRef}
            onPointerDown={() => { if (filterOpen && !filterClosing) requestCloseFilter(); else onToggleFilterMenu(); }}
            // Keyboard activation: pointerdown never fires from Enter/Space, so open/close the filter
            // menu here too. Keyboard use doesn't hit the pointerdown dismiss-scrim, so no double-fire.
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (filterOpen && !filterClosing) requestCloseFilter(); else onToggleFilterMenu();
              }
            }}
            aria-haspopup="menu"
            aria-expanded={filterOpen}
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

      {col.note && noteAnchor && <NoteCard text={col.note} anchor={noteAnchor} />}

      {filterOpen && filterAnchor && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onPointerDown={requestCloseFilter} />
          <div role="menu" aria-label={`Filter by ${label}`} onAnimationEnd={() => { if (filterClosing) onToggleFilterMenu(); }} className={`${filterClosing ? "pop-out" : "pop-in"} surface-pop fixed z-[9999] w-56 rounded-[16px] py-1 normal-case tracking-normal font-normal`}
            style={{
              top: filterAnchor.bottom + 6,
              left: Math.max(8, Math.min(filterAnchor.right - 224, window.innerWidth - 224 - 8)),
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
                    role="menuitemcheckbox"
                    aria-checked={checked}
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
        </>,
        document.body,
      )}
    </th>
  );
});
