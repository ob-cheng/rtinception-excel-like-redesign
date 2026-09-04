import { memo, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDown as Caret, Loader2 } from "lucide-react";
import type { CellIndicator, Column, MoveDir } from "../../types";

const CELL_H = 54; // px — 2 lines × (13px × 1.375 lh) + 9px × 2 padding

function TooltipCard({ text, anchor }: { text: string; anchor: DOMRect }) {
  const viewportW = window.innerWidth;
  const cardW = 280;
  const gap = 6;

  let top = anchor.bottom + gap;
  if (top + 120 > window.innerHeight) top = anchor.top - gap - 8;

  let left = anchor.left;
  if (left + cardW > viewportW - 8) left = viewportW - cardW - 8;
  if (left < 8) left = 8;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top,
        left,
        width: cardW,
        zIndex: 9999,
        backgroundColor: "var(--surface-raised)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        border: "1px solid var(--hairline)",
        borderRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)",
        padding: "10px 13px",
        fontSize: 12.5,
        lineHeight: 1.5,
        color: "var(--text-1)",
        pointerEvents: "none",
        animation: "tooltip-in 120ms cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      {text}
    </div>,
    document.body,
  );
}

const clampStyle: React.CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  lineHeight: "1.375",
};

// Memoized so a state change in App (cursor move, edit toggle) only re-renders the one or two
// cells whose props actually change, not the whole grid. This requires the per-cell handlers to be
// stable: instead of receiving freshly-allocated closures from the parent every render, the cell
// takes its own row/column indices (ri/ci) plus App's stable multi-arg callbacks and binds them
// internally with useCallback.
export const GridCell = memo(function GridCell({
  col,
  value,
  options,
  ri,
  ci,
  active,
  editing,
  seed,
  placeholder,
  indicator,
  swapClass = "",
  swapStyle,
  frozenLeft,
  frozenLast,
  readOnly,
  onSelectCell,
  onStartEditCell,
  onCommitCell,
  onCancelEdit,
  onReadOnlyCell,
}: {
  col: Column;
  value: string;
  // Row-dependent choices that override the column's static `options` (e.g. Comparator, whose valid
  // values depend on the row's product). Falls back to `col.options` when not supplied.
  options?: string[];
  ri: number;
  ci: number;
  active: boolean;
  editing: boolean;
  seed: string;
  placeholder?: string;
  indicator?: CellIndicator;
  swapClass?: string;
  swapStyle?: React.CSSProperties;
  frozenLeft?: number;
  frozenLast?: boolean;
  readOnly?: boolean;
  onSelectCell: (r: number, c: number) => void;
  onStartEditCell: (r: number, c: number, value: string) => void;
  onCommitCell: (r: number, c: number, v: string, move: MoveDir) => void;
  onCancelEdit: () => void;
  onReadOnlyCell?: (r: number, c: number) => void;
}) {
  // Bind this cell's coordinates to App's stable callbacks. These identities are steady across the
  // frequent active/editing/seed changes, so React.memo can skip re-rendering untouched cells.
  const onSelect = useCallback(() => onSelectCell(ri, ci), [onSelectCell, ri, ci]);
  const onStartEdit = useCallback(() => onStartEditCell(ri, ci, value), [onStartEditCell, ri, ci, value]);
  const onCommit = useCallback((v: string, move: MoveDir) => onCommitCell(ri, ci, v, move), [onCommitCell, ri, ci]);
  const onCancel = onCancelEdit;
  const onReadOnly = useCallback(() => onReadOnlyCell?.(ri, ci), [onReadOnlyCell, ri, ci]);
  const isFirst = col.key === "uid";
  // Numeric / currency columns right-align and use tabular figures so digits line up column-to-column.
  const alignRight = col.align === "right";
  // Effective choices for this cell: row-dependent override if given, else the column's static set.
  const opts = options ?? col.options;
  // Frozen (sticky) column plumbing — shared across the edit + display cells so a frozen column
  // stays pinned even while a cell in it is being edited.
  const frozen = frozenLeft != null;
  const frozenStyle: React.CSSProperties = frozen ? { position: "sticky", left: frozenLeft, zIndex: 5 } : {};
  const frozenClass = frozen ? (frozenLast ? " frozen frozen-last" : " frozen") : "";
  // The frozen block's right edge is governed by CSS (see GlobalStyles): a crisp hairline at rest,
  // but once the block pins it fades to the soft scroll-shadow gradient. So the frozen-last cell
  // must NOT paint its own inline right border — inline would beat the `.freeze-on` override.
  const rightBorder = frozenLast ? undefined : "1px solid var(--hairline-soft)";
  const contentRef = useRef<HTMLSpanElement>(null);
  const [tooltipAnchor, setTooltipAnchor] = useState<DOMRect | null>(null);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLTableCellElement>) => {
    if (!col.tooltip || !value) return;
    const el = contentRef.current;
    // Only show if text is actually clamped (overflows the 2-line box)
    if (el && el.scrollHeight > el.clientHeight + 1) {
      setTooltipAnchor(e.currentTarget.getBoundingClientRect());
    }
  }, [col.tooltip, value]);

  const handleMouseLeave = useCallback(() => setTooltipAnchor(null), []);

  // Read-only columns (Franchise-owned context shown in Evidence) never enter edit mode.
  if (editing && !readOnly) {
    if (opts) {
      return (
        <td className={`p-0${frozenClass}`} style={{ height: CELL_H, borderRight: rightBorder, borderBottom: "1px solid var(--hairline-soft)", ...frozenStyle }}>
          <select
            autoFocus
            defaultValue={value}
            onChange={e => onCommit(e.target.value, null)}
            onBlur={e => onCommit(e.target.value, null)}
            onKeyDown={e => {
              if (e.key === "Escape") { e.preventDefault(); onCancel(); }
            }}
            className="w-full h-full px-3 py-[9px] text-[13px] outline-none"
            style={{ backgroundColor: "var(--surface)", color: "var(--text-1)", boxShadow: "0 0 0 2px var(--cell-ring) inset" }}
          >
            <option value="">—</option>
            {opts.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </td>
      );
    }
    return (
      <td className={`p-0${frozenClass}`} style={{ height: CELL_H, borderRight: rightBorder, borderBottom: "1px solid var(--hairline-soft)", ...frozenStyle }}>
        <input
          autoFocus
          key={seed}
          defaultValue={seed}
          onFocus={e => e.target.select()}
          onBlur={e => onCommit(e.target.value, null)}
          onKeyDown={e => {
            const el = e.target as HTMLInputElement;
            if (e.key === "Enter") { e.preventDefault(); onCommit(el.value, "down"); }
            else if (e.key === "Tab") { e.preventDefault(); onCommit(el.value, "right"); }
            else if (e.key === "Escape") { e.preventDefault(); onCancel(); }
          }}
          className={`w-full h-full px-3 py-[9px] text-[13px] outline-none ${alignRight ? "text-right tabular-nums" : ""}`}
          style={{ backgroundColor: "var(--surface)", color: "var(--text-1)", boxShadow: "0 0 0 2px var(--accent) inset" }}
        />
      </td>
    );
  }

  // Read-only cells read as a distinct, muted material: legible but clearly secondary, so the
  // Franchise-owned band is obvious at a glance without shouting.
  const textColor = readOnly ? "var(--text-3)" : isFirst ? "var(--text-1)" : "var(--text-2)";

  return (
    <>
      <td
        onClick={onSelect}
        onDoubleClick={readOnly ? onReadOnly : onStartEdit}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={readOnly ? "Managed by Franchise — edit from the Franchise tab" : undefined}
        data-active={active ? "true" : undefined}
        style={{
          ...swapStyle,
          ...frozenStyle,
          height: CELL_H,
          borderRight: rightBorder,
          // Row separators live on the cells (not <tr>) because separated borders ignore tr borders.
          borderBottom: "1px solid var(--hairline-soft)",
          boxShadow: active ? "0 0 0 2px var(--cell-ring) inset" : undefined,
          // Frozen cells take their opaque background from the CSS variables on <tr> (so the
          // other columns slide underneath); non-frozen cells keep the inline active tint.
          backgroundColor: frozen
            ? undefined
            : active
              ? "var(--cell-active)"
              : readOnly ? "var(--readonly-fill)" : undefined,
          // A frozen read-only column can't use the inline fill above (its opaque base comes from
          // CSS so the scrolling columns don't bleed through). Layer the same translucent read-only
          // tint as a gradient image *over* that base, so a frozen read-only band looks identical to
          // a non-frozen one — and rides the row's hover/zebra automatically, since only the base
          // colour underneath changes.
          backgroundImage:
            frozen && readOnly && !active
              ? "linear-gradient(var(--readonly-fill), var(--readonly-fill))"
              : undefined,
        }}
        className={`${swapClass} px-3 py-[9px] select-none text-[13px] transition-colors duration-100 ${
          readOnly ? "cursor-not-allowed" : "cursor-cell"
        } ${isFirst ? "font-medium" : ""}${frozenClass}`}
      >
        <span
          ref={col.tooltip ? contentRef : undefined}
          style={{
            ...clampStyle,
            color: textColor,
            ...(alignRight ? { textAlign: "right", fontVariantNumeric: "tabular-nums" } : {}),
          }}
        >
          {value !== "" ? value : (
            <span style={{ color: "var(--text-4)" }}>{placeholder}</span>
          )}
          {!readOnly && opts && active && <Caret size={10} strokeWidth={2} style={{ color: "var(--text-4)", display: "inline", marginLeft: 2 }} />}
          {indicator === "saving" && (
            <Loader2 size={10} className="animate-spin inline ml-1" style={{ color: "#f59e0b" }} />
          )}
          {indicator === "dirty" && (
            <span className="w-1.5 h-1.5 rounded-full inline-block ml-1" style={{ backgroundColor: "#f59e0b" }} title="Unsaved changes" />
          )}
          {indicator === "error" && (
            <span className="w-1.5 h-1.5 rounded-full inline-block ml-1" style={{ backgroundColor: "#ef4444" }} title="Save failed" />
          )}
        </span>
      </td>
      {tooltipAnchor && <TooltipCard text={value} anchor={tooltipAnchor} />}
    </>
  );
});
