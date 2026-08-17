import { useLayoutEffect } from "react";
import type { CellIndicator, Column, Idea, MoveDir, SortDir, ViewKey } from "../../types";
import { frozenKeys, isColReadOnly } from "../../data/columns";
import { isLocked } from "../../lib/locking";
import { GridCell } from "./GridCell";
import { RowMenu } from "./RowMenu";
import { ColumnHeaderCell } from "./ColumnHeaderCell";

type SwapProps = { swapClass: string; swapStyle?: React.CSSProperties };

export type IdeasTableProps = {
  gridRef: { current: HTMLDivElement | null };
  view: ViewKey;
  dir: number;
  cols: Column[];
  rows: Idea[];
  draft: Idea;
  draftIndex: number;
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
  onLockedCell: (r: number, c: number) => void;
  onReadOnlyCell: (r: number, c: number) => void;
  onEditRow: (row: Idea, ri: number) => void;
  onViewDetails: (row: Idea) => void;
  onViewHistory: (row: Idea) => void;
  onToggleFound: (row: Idea) => void;
  onDuplicateRow: (row: Idea) => void;
  onDeleteRow: (row: Idea) => void;
};

export function IdeasTable(p: IdeasTableProps) {
  // Frozen-column geometry for the current view: each frozen column's cumulative left offset
  // (measured only across the frozen block, since the columns before it scroll away), plus the
  // distance the table must scroll before the block starts to pin.
  const frozenLeftByIndex = new Map<number, number>();
  let widthAcc = 0;
  let blockStart = 0;
  let blockStarted = false;
  let lastFrozenIndex = -1;
  let frozenAcc = 0;
  // Each view declares its own contiguous frozen block (Franchise/Funded pin the ranking columns,
  // Evidence pins the Franchise-owned framing). An empty set makes freezing a no-op for that view.
  const frozen = frozenKeys(p.view);
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
  }, [p.cols, blockStart, blockStarted, p.view]);

  return (
    <div
      ref={p.gridRef}
      tabIndex={0}
      onKeyDown={p.onKeyDown}
      onScroll={onScroll}
      className="flex-1 overflow-auto rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)] transition-shadow"
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
            <tr className="chrome-blur sticky top-0 z-20 backdrop-blur-sm" style={{ backgroundColor: "var(--header-surface)", boxShadow: "0 1px 0 rgba(0,0,0,0.07)" }}>
              {p.cols.map((col, ci) => {
                const sw = p.swapProps(ci);
                return (
                  <ColumnHeaderCell
                    key={col.key}
                    col={col}
                    selected={p.colFilters[col.key] ?? []}
                    values={p.distinctValues(col.key)}
                    sortDir={p.sortCol === col.key ? p.sortDir : null}
                    filterOpen={p.openFilter === col.key}
                    swapClass={sw.swapClass}
                    swapStyle={sw.swapStyle}
                    frozenLeft={frozenLeftByIndex.get(ci)}
                    frozenLast={ci === lastFrozenIndex}
                    readOnly={isColReadOnly(p.view, col.key)}
                    onSort={() => p.onSort(col.key)}
                    onToggleFilterMenu={() => p.onToggleFilterMenu(col.key)}
                    onToggleValue={p.onToggleFilterValue}
                    onClearFilter={() => p.onClearFilter(col.key)}
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
              const rowLocked = isLocked(row);
              // One tone drives both the row and its pinned (frozen) cells, so the
              // brand-ranking / TA-priority / pathway columns can never read as a
              // different shade than the rest of the row. --row-bg feeds the row fill
              // (base + hover live in GlobalStyles' .row-tr rules); --freeze-* feed the
              // opaque backgrounds the sticky cells paint over the sliding columns.
              const rowTone = rowLocked ? "var(--surface-2)" : ri % 2 === 1 ? "var(--zebra)" : "var(--surface)";
              const freezeVars = {
                "--row-bg": rowTone,
                "--freeze-bg": rowTone,
                "--freeze-active": "var(--cell-active)",
              } as React.CSSProperties;
              return (
                <tr
                  key={`${row.uid}-${ri}`}
                  // No color transition on the row: its hover is painted on the <tr> (non-frozen
                  // cells) while frozen cells paint their own opaque bg, and those two can't stay
                  // in sync through a transition — so both snap instantly, as one row. `group` stays
                  // for the RowMenu reveal.
                  className="row-tr group"
                  style={{ borderBottom: "1px solid var(--hairline-soft)", ...freezeVars }}
                >
                  {p.cols.map((col, ci) => {
                    const isSaving = p.savingSet.has(row.uid);
                    const isDirty = p.dirtySet.has(row.uid);
                    // Only the UID column carries the row's save state — one dot per row, not per cell.
                    const indicator: CellIndicator = ci === 0
                      ? isSaving ? "saving" : isDirty ? "dirty" : null
                      : null;
                    return (
                      <GridCell
                        key={col.key}
                        col={col}
                        value={row[col.key]}
                        locked={rowLocked}
                        {...p.swapProps(ci)}
                        frozenLeft={frozenLeftByIndex.get(ci)}
                        frozenLast={ci === lastFrozenIndex}
                        readOnly={isColReadOnly(p.view, col.key)}
                        active={p.active?.r === ri && p.active?.c === ci}
                        editing={p.isEditing && p.active?.r === ri && p.active?.c === ci}
                        seed={p.seed}
                        indicator={indicator}
                        onSelect={() => p.onSelectCell(ri, ci)}
                        onStartEdit={() => p.onStartEditCell(ri, ci, row[col.key])}
                        onCommit={(v, move) => p.onCommitCell(ri, ci, v, move)}
                        onCancel={p.onCancelEdit}
                        onLocked={() => p.onLockedCell(ri, ci)}
                        onReadOnly={() => p.onReadOnlyCell(ri, ci)}
                      />
                    );
                  })}
                  <td className="px-2 py-[10px] whitespace-nowrap" style={{ borderBottom: "1px solid var(--hairline-soft)" }}>
                    <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                      <RowMenu
                        row={row}
                        locked={rowLocked}
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

            {/* Draft / add row */}
            <tr
              className="row-tr"
              style={{
                borderBottom: "1px solid var(--hairline-soft)",
                ...({ "--row-bg": "var(--surface)", "--freeze-bg": "var(--surface)", "--freeze-active": "var(--cell-active)" } as React.CSSProperties),
              }}
            >
              {p.cols.map((col, ci) => (
                <GridCell
                  key={col.key}
                  col={col}
                  value={p.draft[col.key]}
                  {...p.swapProps(ci)}
                  frozenLeft={frozenLeftByIndex.get(ci)}
                  frozenLast={ci === lastFrozenIndex}
                  readOnly={isColReadOnly(p.view, col.key)}
                  placeholder={ci === 0 ? "+ Add new idea…" : ""}
                  active={p.active?.r === p.draftIndex && p.active?.c === ci}
                  editing={p.isEditing && p.active?.r === p.draftIndex && p.active?.c === ci}
                  seed={p.seed}
                  onSelect={() => p.onSelectCell(p.draftIndex, ci)}
                  onStartEdit={() => p.onStartEditCell(p.draftIndex, ci, p.draft[col.key])}
                  onCommit={(v, move) => p.onCommitCell(p.draftIndex, ci, v, move)}
                  onCancel={p.onCancelEdit}
                />
              ))}
              <td />
              <td aria-hidden />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
