import type { CellIndicator, Column, Idea, MoveDir, SortDir, ViewKey } from "../../types";
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
  onEditRow: (row: Idea, ri: number) => void;
  onViewDetails: (row: Idea) => void;
  onViewHistory: (row: Idea) => void;
  onDuplicateRow: (row: Idea) => void;
  onDeleteRow: (row: Idea) => void;
};

export function IdeasTable(p: IdeasTableProps) {
  return (
    <div
      ref={p.gridRef}
      tabIndex={0}
      onKeyDown={p.onKeyDown}
      className="flex-1 overflow-auto bg-white rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/20 transition-shadow"
      style={{
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {/* Re-keying on the view restarts the enter animation; --enter carries its direction. */}
      <div key={p.view} style={{ "--enter": `${p.dir * 28}px` } as React.CSSProperties}>
        <table className="text-[13px] border-collapse" style={{ tableLayout: "fixed", width: "max-content", minWidth: "100%" }}>
          <thead>
            <tr className="chrome-blur sticky top-0 z-20 backdrop-blur-sm" style={{ backgroundColor: "rgba(249,249,251,0.92)", boxShadow: "0 1px 0 rgba(0,0,0,0.07)" }}>
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
                    onSort={() => p.onSort(col.key)}
                    onToggleFilterMenu={() => p.onToggleFilterMenu(col.key)}
                    onToggleValue={p.onToggleFilterValue}
                    onClearFilter={() => p.onClearFilter(col.key)}
                  />
                );
              })}
              <th className="w-[64px]" style={{ borderColor: "rgba(0,0,0,0.06)" }} />
            </tr>
          </thead>
          <tbody>
            {p.rows.map((row, ri) => {
              const rowLocked = isLocked(row);
              return (
                <tr
                  key={`${row.uid}-${ri}`}
                  className={`group transition-colors duration-100 ${
                    rowLocked ? "bg-[#fafafa]" : ri % 2 === 1 ? "bg-[#fafafa]/60" : "bg-white"
                  } ${rowLocked ? "hover:bg-gray-100/50" : "hover:bg-[#eef2fa]"}`}
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
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
                        active={p.active?.r === ri && p.active?.c === ci}
                        editing={p.isEditing && p.active?.r === ri && p.active?.c === ci}
                        seed={p.seed}
                        indicator={indicator}
                        onSelect={() => p.onSelectCell(ri, ci)}
                        onStartEdit={() => p.onStartEditCell(ri, ci, row[col.key])}
                        onCommit={(v, move) => p.onCommitCell(ri, ci, v, move)}
                        onCancel={p.onCancelEdit}
                        onLocked={() => p.onLockedCell(ri, ci)}
                      />
                    );
                  })}
                  <td className="px-2 py-[10px] whitespace-nowrap">
                    <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                      <RowMenu
                        row={row}
                        locked={rowLocked}
                        onEdit={r => p.onEditRow(r, ri)}
                        onViewDetails={p.onViewDetails}
                        onViewHistory={p.onViewHistory}
                        onDuplicate={p.onDuplicateRow}
                        onDelete={p.onDeleteRow}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Draft / add row */}
            <tr className="bg-white" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              {p.cols.map((col, ci) => (
                <GridCell
                  key={col.key}
                  col={col}
                  value={p.draft[col.key]}
                  {...p.swapProps(ci)}
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
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
