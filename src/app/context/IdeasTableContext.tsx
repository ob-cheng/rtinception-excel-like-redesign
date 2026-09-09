import { createContext, useContext } from "react";
import type { Column, Idea, MoveDir, SortDir, ViewKey } from "../types";

type SwapProps = { swapClass: string; swapStyle?: React.CSSProperties };

// The full contract the table subtree needs. Assembled once by App from the grid layer + store +
// modal/panel openers and provided via context, so IdeasTable and its descendants no longer receive
// (and re-drill) ~40 individual props. The shape is unchanged from the old prop list — only the
// delivery mechanism moved from prop-drilling to context.
export type IdeasTableContextValue = {
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
  // Bulk selection (by uid). allSelected/someSelected drive the header checkbox's checked +
  // indeterminate states; the per-row checkbox reads membership from `selected`.
  selected: Set<string>;
  allSelected: boolean;
  someSelected: boolean;
  onToggleRowSelected: (uid: string) => void;
  onToggleSelectAll: () => void;
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
  // Bulk actions over the current selection — the same operations the floating BulkActionBar hosts,
  // surfaced in the right-click menu when more than one selected row is right-clicked. Each closes
  // over `selected`, so callers don't pass uids. `editableDropdownCols` drives the "Edit field" list.
  editableDropdownCols: Column[];
  onBulkFund: () => void;
  onBulkSetField: (key: keyof Idea, value: string) => void;
  onBulkDuplicate: () => void;
  onBulkDelete: () => void;
  // Empty-state wayfinding: whether a filter/search is what's hiding rows, and how to clear it.
  hasActiveFilters: boolean;
  onClearFilters: () => void;
};

const IdeasTableContext = createContext<IdeasTableContextValue | null>(null);

export const IdeasTableProvider = IdeasTableContext.Provider;

// Consume the table context. Throws if used outside a provider so a wiring mistake fails loudly
// rather than rendering an empty grid.
export function useIdeasTable(): IdeasTableContextValue {
  const ctx = useContext(IdeasTableContext);
  if (!ctx) throw new Error("useIdeasTable must be used within an IdeasTableProvider");
  return ctx;
}
