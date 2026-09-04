import { useLayoutEffect, useState } from "react";
import type { CellIndicator, Column, Idea, MoveDir, SortDir, ViewKey } from "../../types";
import { isColReadOnly } from "../../data/columns";
import { comparatorOptionsFor } from "../../data/ideas";
import { GridCell } from "./GridCell";
import { RowMenu } from "./RowMenu";
import { RowContextMenu } from "./RowContextMenu";
import type { RowMenuActions } from "./RowMenuItems";
import { ColumnHeaderCell } from "./ColumnHeaderCell";

// Row-dependent dropdown choices. Comparator's valid values depend on the row's product; every
// other column just uses its static `col.options`, so this returns undefined and GridCell falls back.
function cellOptions(col: Column, row: Idea): string[] | undefined {
  if (col.key === "comparator") return comparatorOptionsFor(row.project);
  return undefined;
}

type SwapProps = { swapClass: string; swapStyle?: React.CSSProperties };

// Shared stable identity for "no filter on this column", so a memoized ColumnHeaderCell isn't
// forced to re-render by a fresh `[]` allocated on every parent render.
const NO_FILTER: string[] = [];

export type IdeasTableProps = {
  gridRef: { current: HTMLDivElement | null };
  view: ViewKey;
  dir: number;
  cols: Column[];
  // Resolved frozen set (the user's freeze line applied to this view). Passed in rather than
  // read from the static per-view defaults so column customization flows through unchanged.
  frozenKeys: (keyof Idea)[];
  rows: Idea[];
  active: { r: number; c: number } | null;
  isEditing: boolean;
  seed: string;
  dirtySet: Set<string>;
  savingSet: Set<string>;
  sortCol: string | null;
  sortDir: SortDir;
  colFilters: Partial<Record<keyof Idea, string[]>>;
  openFilter: keyof Idea | null;
  distinctValues: (key: keyof Idea) => string[];
  swapProps: (ci: number) => SwapProps;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSort: (key: string) => void;
  onToggleFilterMenu: (key: keyof Idea) => void;
  onToggleFilterValue: (key: keyof Idea, value: string) => void;
  onClearFilter: (key: keyof Idea) => void;
  onSelectCell: (r: number, c: number) => void;
  onStartEditCell: (r: number, c: number, value: string) => void;
  onCommitCell: (r: number, c: number, value: string, move: MoveDir) => void;
  onCancelEdit: () => void;
  onReadOnlyCell: (r: number, c: number) => void;
  onEditRow: (row: Idea, ri: number) => void;
  onViewDetails: (row: Idea) => void;
  onViewHistory: (row: Idea) => void;
  onToggleFound: (row: Idea) => void;
  onDuplicateRow: (row: Idea) => void;
  onDeleteRow: (row: Idea) => void;
  // Empty-state wayfinding: whether a filter/search is what's hiding rows, and how to clear it.
  hasActiveFilters: boolean;
  onClearFilters: () => void;
};

export function IdeasTable(p: IdeasTableProps) {
  // Right-click context menu: one instance for the whole table, positioned at the cursor. Opened by
  // onContextMenu on each record row.
  const [ctxMenu, setCtxMenu] = useState<{ row: Idea; ri: number; x: number; y: number } | null>(null);
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
  const frozenLeftByIndex = new Map<number, number>();
  let widthAcc = 0;
  let blockStart = 0;
  let blockStarted = false;
  let lastFrozenIndex = -1;
  let frozenAcc = 0;
  // The resolved frozen set for this view (the user's per-column pins, or the view default). An
  // empty set makes freezing a no-op.
  const frozen = p.frozenKeys;
  p.cols.forEach((col, ci) => {
    if (frozen.includes(col.key)) {
      if (!blockStarted) { blockStart = widthAcc; blockStarted = true; }
      frozenLeftByIndex.set(ci, frozenAcc);
      frozenAcc += col.width ?? 0;
      lastFrozenIndex = ci;
    }
    widthAcc += col.width ?? 0;
  });
  // Exact table width = sum of declared column widths + the 64px action column. A definite pixel
  // width guarantees table-layout:fixed honors each column exactly (see the table style note).
  const tableWidth = widthAcc + 64;

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
      tabIndex={0}
      onKeyDown={p.onKeyDown}
      onScroll={onScroll}
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
            <tr className="chrome-blur sticky top-0 z-20" style={{ backgroundColor: "var(--header-surface)", backdropFilter: "blur(22px) saturate(180%)", WebkitBackdropFilter: "blur(22px) saturate(180%)", boxShadow: "0 6px 10px -8px var(--freeze-shadow)" }}>
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
                    readOnly={isColReadOnly(p.view, col.key)}
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
            {p.rows.map((row, ri) => {
              // One tone drives both the row and its pinned (frozen) cells, so the
              // brand-ranking / TA-priority / pathway columns can never read as a
              // different shade than the rest of the row. --row-bg feeds the row fill
              // (base + hover live in GlobalStyles' .row-tr rules); --freeze-* feed the
              // opaque backgrounds the sticky cells paint over the sliding columns.
              const rowTone = ri % 2 === 1 ? "var(--zebra)" : "var(--surface)";
              const freezeVars = {
                "--row-bg": rowTone,
                "--freeze-bg": rowTone,
                "--freeze-active": "var(--cell-active)",
              } as React.CSSProperties;
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
                    setCtxMenu({ row, ri, x: e.clientX, y: e.clientY });
                  }}
                >
                  {p.cols.map((col, ci) => {
                    const isSaving = p.savingSet.has(row.uid);
                    const isDirty = p.dirtySet.has(row.uid);
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
                        readOnly={isColReadOnly(p.view, col.key)}
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
        {p.rows.length === 0 && (
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
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}
