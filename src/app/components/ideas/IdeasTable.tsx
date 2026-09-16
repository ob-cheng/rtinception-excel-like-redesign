import { memo, useCallback, useLayoutEffect, useMemo, useState } from "react";
import { Check, Minus } from "lucide-react";
import type { CellIndicator, Column, Idea } from "../../types";
import { isColReadOnly } from "../../data/columns";
import { comparatorOptionsFor } from "../../data/ideas";
import { GridCell } from "./GridCell";
import { RowMenu } from "./RowMenu";
import { RowContextMenu } from "./RowContextMenu";
import type { RowMenuActions } from "./RowMenuItems";
import { ColumnHeaderCell } from "./ColumnHeaderCell";
import { useIdeasTable } from "../../context/IdeasTableContext";

// Row-dependent dropdown choices. Comparator's valid values depend on the row's product; every
// other column just uses its static `col.options`, so this returns undefined and GridCell falls back.
function cellOptions(col: Column, row: Idea): string[] | undefined {
  if (col.key === "comparator") return comparatorOptionsFor(row.project);
  return undefined;
}

// Shared stable identity for "no filter on this column", so a memoized ColumnHeaderCell isn't
// forced to re-render by a fresh `[]` allocated on every parent render.
const NO_FILTER: string[] = [];

// Fixed width of the leading checkbox column (px). Always pinned to the left edge; frozen data
// columns stack after it.
const SELECT_W = 44;

// The selection control — a styled square (not a native checkbox) so it can carry the app's accent
// fill and its own check/dash glyphs in both themes. `indeterminate` is header-only (some-but-not-all
// visible rows selected). Kept as one component so the header and row cells can never diverge.
const SelectCheckbox = memo(function SelectCheckbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
}) {
  const on = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      onClick={e => { e.stopPropagation(); onChange(); }}
      onMouseDown={e => e.stopPropagation()}
      className="grid place-items-center w-[17px] h-[17px] rounded-[5px] transition-all duration-100 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent-ring)]"
      style={{
        backgroundColor: on ? "var(--accent-strong)" : "transparent",
        border: on ? "1px solid var(--accent-strong)" : "1.5px solid var(--check-border, var(--hairline-strong, var(--hairline)))",
        color: "var(--on-accent)",
      }}
    >
      {indeterminate
        ? <Minus size={12} strokeWidth={3} />
        : checked ? <Check size={12} strokeWidth={3} /> : null}
    </button>
  );
});

// Per-row selection checkbox. Binds the row's uid to the stable grid toggle so its onChange keeps a
// steady identity across renders — that plus memo lets a row's checkbox skip re-rendering unless its
// own checked state changes, instead of re-rendering on every table state change via a fresh arrow.
const RowSelectCheckbox = memo(function RowSelectCheckbox({
  uid,
  checked,
  onToggle,
}: {
  uid: string;
  checked: boolean;
  onToggle: (uid: string) => void;
}) {
  const handleChange = useCallback(() => onToggle(uid), [uid, onToggle]);
  return <SelectCheckbox checked={checked} onChange={handleChange} label={`Select ${uid}`} />;
});

export function IdeasTable() {
  // Everything the table renders now arrives through context (assembled once by App), rather than
  // as ~40 individually-drilled props. `p` keeps the original accessor shape so the body is
  // unchanged below.
  const p = useIdeasTable();
  // Right-click context menu: one instance for the whole table, positioned at the cursor. Opened by
  // onContextMenu on each record row.
  const [ctxMenu, setCtxMenu] = useState<{ row: Idea; ri: number; x: number; y: number; bulk: boolean } | null>(null);
  // The action list is identical to the kebab's — same handlers, same `ri` re-add on Edit — so the
  // two menus can never behave differently.
  const rowActions = (ri: number): RowMenuActions => ({
    onEdit: r => p.onEditRow(r, ri),
    onViewDetails: p.onViewDetails,
    onViewHistory: p.onViewHistory,
    onToggleFound: p.onToggleFound,
    onDuplicate: p.onDuplicateRow,
    onDelete: p.onDeleteRow,
  });

  // Frozen-column geometry for the current view. Frozen columns are pinned by identity and need
  // not be adjacent: each one sticks at the left edge stacked by the cumulative width of the
  // frozen columns before it (`frozenAcc`), so any unfrozen columns interleaved among them simply
  // scroll underneath. `blockStart` is the distance the table must scroll before the first frozen
  // column reaches the edge and the group starts to pin; `lastFrozenIndex` is the rightmost
  // frozen column, which carries the right-edge shadow.
  // This geometry depends only on the column set and the frozen set, so memoize it: without this it
  // (and a fresh Map) was rebuilt on every render — every cursor move and keystroke — even though
  // nothing here changes between those renders.
  const { frozenLeftByIndex, tableWidth, blockStart, blockStarted, lastFrozenIndex } = useMemo(() => {
    const leftByIndex = new Map<number, number>();
    let widthAcc = 0;
    let start = 0;
    let started = false;
    let lastIndex = -1;
    // Frozen data columns stack to the RIGHT of the always-pinned checkbox column, so their sticky
    // left offsets start at its width rather than 0.
    let frozenAcc = SELECT_W;
    // The resolved frozen set for this view (the user's per-column pins, or the view default). An
    // empty set makes freezing a no-op.
    const frozen = p.frozenKeys;
    p.cols.forEach((col, ci) => {
      if (frozen.includes(col.key)) {
        if (!started) { start = widthAcc; started = true; }
        leftByIndex.set(ci, frozenAcc);
        frozenAcc += col.width ?? 0;
        lastIndex = ci;
      }
      widthAcc += col.width ?? 0;
    });
    // Exact table width = leading checkbox column + sum of declared column widths + the 64px action
    // column. A definite pixel width guarantees table-layout:fixed honors each column exactly.
    return {
      frozenLeftByIndex: leftByIndex,
      tableWidth: SELECT_W + widthAcc + 64,
      blockStart: start,
      blockStarted: started,
      lastFrozenIndex: lastIndex,
    };
  }, [p.cols, p.frozenKeys]);

  // Read-only status is a function of the view and the column only — not the row — so compute it
  // once per column here instead of re-deriving it for every cell (rows×cols) in the render below.
  const readOnlyByCol = useMemo(
    () => p.cols.map(col => isColReadOnly(p.view, col.key)),
    [p.cols, p.view],
  );

  // The right-edge shadow (and the "stuck" feel) only turns on once we've scrolled far enough
  // that the block is actually holding position — before that it scrolls like any other column.
  const syncFreezeShadow = (el: HTMLDivElement) => {
    el.classList.toggle("freeze-on", blockStarted && el.scrollLeft > blockStart - 1);
  };
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => syncFreezeShadow(e.currentTarget);

  // Keep the shadow in sync with the *content*, not just scroll events. Switching tab/portfolio
  // or editing columns can reset scrollLeft to 0 (or change blockStart) without firing a scroll,
  // which otherwise leaves a stale `freeze-on` shadow showing at rest. Re-evaluate on every
  // geometry change from the container's real scroll position.
  useLayoutEffect(() => {
    const el = p.gridRef.current;
    if (el) syncFreezeShadow(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.cols, p.frozenKeys, blockStart, blockStarted, p.view]);

  return (
    <div
      ref={p.gridRef}
      // While the skeleton is showing, the grid is inert: not focusable, no keyboard nav, and
      // pointer events are off across the whole surface so header sort/filter/select-all can't be
      // clicked on placeholder data. `aria-busy` announces the loading state to assistive tech.
      tabIndex={p.loading ? -1 : 0}
      onKeyDown={p.loading ? undefined : p.onKeyDown}
      onScroll={onScroll}
      aria-busy={p.loading || undefined}
      className="flex-1 overflow-auto rounded-[16px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)] transition-shadow"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--hairline)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Re-keying on the view restarts the enter animation; --enter carries its direction. */}
      <div key={p.view} style={{ "--enter": `${p.dir * 28}px` } as React.CSSProperties}>
        {/* border-collapse must be `separate`: sticky (frozen) cells don't paint their own
            background or borders reliably under `collapse`, which lets the scrolling columns
            bleed through. `separate` + zero spacing keeps the same look with solid frozen cells. */}
        {/* width MUST be a definite value, not `max-content`: table-layout:fixed only engages
            reliably with a definite width. Under `max-content` the browser sizes the table (and its
            columns) from actual cell content — effectively auto layout — so the declared column
            widths drift per portfolio as the row content changes. Setting width to the exact sum of
            the column widths makes the fixed algorithm honor each column precisely; minWidth:100%
            stretches the table to fill a wider container, with the trailing auto spacer absorbing
            the surplus so real columns never grow. When columns exceed the container it scrolls. */}
        <table className="text-[13px]" style={{ tableLayout: "fixed", width: tableWidth, minWidth: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            {/* The header is the largest translucent surface in the grid, so it reads as the
                thickest material (§12): a deep blur, and instead of a hard 1px rule its lower
                edge is a soft scroll shadow that fades content under floating chrome. */}
            <tr className="chrome-blur sticky top-0 z-20" style={{ backgroundColor: "var(--header-surface)", backdropFilter: "blur(22px) saturate(180%)", WebkitBackdropFilter: "blur(22px) saturate(180%)", boxShadow: "0 6px 10px -8px var(--freeze-shadow)", pointerEvents: p.loading ? "none" : undefined }}>
              {/* Select-all: pinned at the very left edge, above the frozen data columns. */}
              <th className="frozen" style={{ left: 0, width: SELECT_W, minWidth: SELECT_W }}>
                <div className="grid place-items-center h-full">
                  <SelectCheckbox
                    checked={p.allSelected}
                    indeterminate={p.someSelected}
                    onChange={p.onToggleSelectAll}
                    label={p.allSelected ? "Deselect all rows" : "Select all rows"}
                  />
                </div>
              </th>
              {p.cols.map((col, ci) => {
                const sw = p.swapProps(ci);
                return (
                  <ColumnHeaderCell
                    key={col.key}
                    col={col}
                    selected={p.colFilters[col.key] ?? NO_FILTER}
                    values={p.distinctValues(col.key)}
                    sortDir={p.sortCol === col.key ? p.sortDir : null}
                    filterOpen={p.openFilter === col.key}
                    swapClass={sw.swapClass}
                    swapStyle={sw.swapStyle}
                    frozenLeft={frozenLeftByIndex.get(ci)}
                    frozenLast={ci === lastFrozenIndex}
                    readOnly={readOnlyByCol[ci]}
                    onSort={p.onSort}
                    onToggleFilterMenu={p.onToggleFilterMenu}
                    onToggleValue={p.onToggleFilterValue}
                    onClearFilter={p.onClearFilter}
                  />
                );
              })}
              <th className="w-[64px]" style={{ borderColor: "var(--hairline)" }} />
              {/* Flexible spacer: under table-layout:fixed this auto-width column absorbs all the
                  slack when the columns don't fill the container, so every declared-width column
                  keeps its exact width regardless of container width or scrollbar presence. */}
              <th aria-hidden style={{ width: "auto" }} />
            </tr>
          </thead>
          <tbody>
            {/* First-load skeleton — the real header and column widths stay, but each row is a
                set of shimmering placeholder bars. This keeps the grid's shape visible during the
                ~3s data wait so the surface reads as "loading" rather than "empty", and the layout
                never jumps when real rows replace it. Bar widths and the shimmer's per-row delay
                are derived from the row/column index so they're stable across renders (no flicker)
                yet varied enough to look like real, uneven content. */}
            {p.loading && Array.from({ length: 12 }).map((_, ri) => (
              <tr key={`sk-${ri}`} style={{ borderBottom: "1px solid var(--hairline-soft)" }}>
                <td
                  className="frozen"
                  style={{ left: 0, width: SELECT_W, minWidth: SELECT_W, height: 54, backgroundColor: "var(--surface)", borderBottom: "1px solid var(--hairline-soft)" }}
                >
                  <div className="grid place-items-center h-full">
                    <div className="skeleton-bar" style={{ width: 15, height: 15, borderRadius: 4, ["--sk-delay" as string]: `${(ri % 6) * 0.09}s` }} />
                  </div>
                </td>
                {p.cols.map((col, ci) => {
                  // 48–86% of the cell, deterministic per (row, col) so the bars don't reshuffle.
                  const pct = 48 + ((ri * 7 + ci * 13) % 39);
                  return (
                    <td key={col.key} className="px-3" style={{ height: 54, borderBottom: "1px solid var(--hairline-soft)" }}>
                      <div
                        className="skeleton-bar"
                        style={{ width: `${pct}%`, height: 11, ["--sk-delay" as string]: `${((ri + ci) % 6) * 0.09}s` }}
                      />
                    </td>
                  );
                })}
                <td className="w-[64px]" style={{ height: 54, borderBottom: "1px solid var(--hairline-soft)" }} />
                <td aria-hidden style={{ borderBottom: "1px solid var(--hairline-soft)" }} />
              </tr>
            ))}
            {!p.loading && p.rows.map((row, ri) => {
              // One tone drives both the row and its pinned (frozen) cells, so the
              // brand-ranking / TA-priority / pathway columns can never read as a
              // different shade than the rest of the row. --row-bg feeds the row fill
              // (base + hover live in GlobalStyles' .row-tr rules); --freeze-* feed the
              // opaque backgrounds the sticky cells paint over the sliding columns.
              const isSelected = p.selected.has(row.uid);
              // A selected row carries one OPAQUE band across both its scrolling and pinned cells, so
              // the whole row (checkbox + frozen + normal columns) reads as a single selected block —
              // and, crucially, the pinned cells stay solid so columns sliding under them never show
              // through (the translucent --cell-active tint used to bleed here). For selected rows we
              // also point --row-hover at the selected-hover token so the existing hover rules
              // (tr:hover and tr:hover td.frozen both read --row-hover) tint the selection on hover
              // rather than washing it away with the neutral hover.
              const baseTone = ri % 2 === 1 ? "var(--zebra)" : "var(--surface)";
              const rowTone = isSelected ? "var(--row-selected)" : baseTone;
              const freezeVars = (isSelected
                ? {
                    "--row-bg": "var(--row-selected)",
                    "--freeze-bg": "var(--row-selected)",
                    "--row-hover": "var(--row-selected-hover)",
                    "--freeze-active": "var(--row-selected-hover)",
                  }
                : {
                    "--row-bg": rowTone,
                    "--freeze-bg": rowTone,
                    "--freeze-active": "var(--cell-active)",
                  }) as React.CSSProperties;
              // Save state is per-row, not per-cell — read it once here rather than in the cols loop.
              const isSaving = p.savingSet.has(row.uid);
              const isDirty = p.dirtySet.has(row.uid);
              return (
                <tr
                  key={row.uid}
                  // No color transition on the row: its hover is painted on the <tr> (non-frozen
                  // cells) while frozen cells paint their own opaque bg, and those two can't stay
                  // in sync through a transition — so both snap instantly, as one row. `group` stays
                  // for the RowMenu reveal.
                  className="row-tr group"
                  style={{ borderBottom: "1px solid var(--hairline-soft)", ...freezeVars }}
                  // Right-click anywhere on the row opens the same actions at the cursor, so users
                  // don't have to scroll right to the kebab. A mid-edit cell commits via its blur.
                  onContextMenu={e => {
                    e.preventDefault();
                    // Right-clicking one of several selected rows opens the BULK action list over the
                    // whole selection; otherwise it's the ordinary single-row menu for this row.
                    const bulk = p.selected.size > 1 && p.selected.has(row.uid);
                    setCtxMenu({ row, ri, x: e.clientX, y: e.clientY, bulk });
                  }}
                >
                  {/* Row selector — pinned at the left edge, ahead of any frozen data columns. */}
                  <td className="frozen" style={{ left: 0, width: SELECT_W, minWidth: SELECT_W, borderBottom: "1px solid var(--hairline-soft)" }}>
                    <div className="grid place-items-center h-full">
                      <RowSelectCheckbox
                        uid={row.uid}
                        checked={isSelected}
                        onToggle={p.onToggleRowSelected}
                      />
                    </div>
                  </td>
                  {p.cols.map((col, ci) => {
                    // Only the UID column carries the row's save state — one dot per row, not per cell.
                    const indicator: CellIndicator = ci === 0
                      ? isSaving ? "saving" : isDirty ? "dirty" : null
                      : null;
                    const sw = p.swapProps(ci);
                    return (
                      <GridCell
                        key={col.key}
                        col={col}
                        value={row[col.key]}
                        options={cellOptions(col, row)}
                        swapClass={sw.swapClass}
                        swapStyle={sw.swapStyle}
                        frozenLeft={frozenLeftByIndex.get(ci)}
                        frozenLast={ci === lastFrozenIndex}
                        readOnly={readOnlyByCol[ci]}
                        ri={ri}
                        ci={ci}
                        active={p.active?.r === ri && p.active?.c === ci}
                        editing={p.isEditing && p.active?.r === ri && p.active?.c === ci}
                        seed={p.seed}
                        indicator={indicator}
                        onSelectCell={p.onSelectCell}
                        onStartEditCell={p.onStartEditCell}
                        onCommitCell={p.onCommitCell}
                        onCancelEdit={p.onCancelEdit}
                        onReadOnlyCell={p.onReadOnlyCell}
                      />
                    );
                  })}
                  <td className="px-2 py-[10px] whitespace-nowrap" style={{ borderBottom: "1px solid var(--hairline-soft)" }}>
                    <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                      <RowMenu
                        row={row}
                        onEdit={r => p.onEditRow(r, ri)}
                        onViewDetails={p.onViewDetails}
                        onViewHistory={p.onViewHistory}
                        onToggleFound={p.onToggleFound}
                        onDuplicate={p.onDuplicateRow}
                        onDelete={p.onDeleteRow}
                      />
                    </div>
                  </td>
                  <td aria-hidden style={{ borderBottom: "1px solid var(--hairline-soft)" }} />
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty state — never a blank grid. Tell the user why it's empty and offer the exit
            (Wayfinding + Forgiveness §16): if filters/search are hiding everything, one tap clears
            them; otherwise it's genuinely an empty view. */}
        {!p.loading && p.rows.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
            <p className="text-[15px]" style={{ color: "var(--text-2)" }}>
              {p.hasActiveFilters ? "No ideas match your filters" : "No ideas here yet"}
            </p>
            <p className="text-[13px] max-w-[320px]" style={{ color: "var(--text-3)" }}>
              {p.hasActiveFilters
                ? "Try broadening or clearing the active filters and search to see more records."
                : "Records added to this view will appear here."}
            </p>
            {p.hasActiveFilters && (
              <button
                onClick={p.onClearFilters}
                className="mt-1 h-[34px] px-5 rounded-full text-[13px] font-medium active:scale-[0.98] transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--accent-ring)]"
                style={{ backgroundColor: "var(--accent-strong)", color: "var(--on-accent)" }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {ctxMenu && (
        <RowContextMenu
          row={ctxMenu.row}
          x={ctxMenu.x}
          y={ctxMenu.y}
          actions={rowActions(ctxMenu.ri)}
          bulk={ctxMenu.bulk ? {
            count: p.selected.size,
            view: p.view,
            editableDropdownCols: p.editableDropdownCols,
            onBulkFund: p.onBulkFund,
            onBulkSetField: p.onBulkSetField,
            onBulkDuplicate: p.onBulkDuplicate,
            onBulkDelete: p.onBulkDelete,
          } : undefined}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}
