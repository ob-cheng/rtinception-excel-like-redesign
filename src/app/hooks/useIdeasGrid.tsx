import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";

import type { Column, Idea, MoveDir, SortDir, ViewKey } from "../types";
import { FUNDED_STATUS } from "../types";
import { VIEW_KEYS, viewColumns, columns as allColumns, isColReadOnly } from "../data/columns";
import { clamp, compareCells } from "../lib/format";
import { TOAST_MS } from "../lib/toast";
import { useViewSwap } from "./useViewSwap";

// A row's searchable text, lowercased and cached by row identity. Search runs over every row on
// each keystroke; without this cache each pass rebuilt `Object.values(row)` (a fresh array per row)
// and re-lowercased every field every time. Rows are immutable — a mutation produces a new object —
// so a WeakMap keyed on the row keeps blobs correct (a changed row misses the cache and rebuilds)
// while letting stale entries be garbage-collected.
const rowSearchTextCache = new WeakMap<Idea, string>();
function rowSearchText(row: Idea): string {
  let blob = rowSearchTextCache.get(row);
  if (blob === undefined) {
    blob = Object.values(row).filter(v => typeof v === "string").join("\n").toLowerCase();
    rowSearchTextCache.set(row, blob);
  }
  return blob;
}

// Inputs the grid layer needs from the store / column-prefs to derive its view and to persist
// edits — kept to the minimum so the grid stays decoupled from record-mutation internals.
type GridDeps = {
  rows: Idea[];
  commitCell: (target: Idea, col: Column, val: string) => void;
  dirtyRows: React.MutableRefObject<Set<string>>;
  flushDirty: (uids?: string[]) => void;
  visibleKeys: (view: ViewKey) => (keyof Idea)[];
  frozenKeysFor: (view: ViewKey) => (keyof Idea)[];
};

// ── The grid interaction layer: view/tab, portfolio, search, sort, per-column filters, the
// active-cell cursor, keyboard navigation, and bulk selection. It derives the visible column set
// and the filtered + sorted rows from the store's raw rows, and owns all the "keep the cursor and
// selection honest" cleanup that a spreadsheet grid needs. It performs no record mutations itself —
// it resolves a cell to its row/column and delegates the write to the store's commitCell.
export function useIdeasGrid({ rows, commitCell, dirtyRows, flushDirty, visibleKeys, frozenKeysFor }: GridDeps) {
  const [portfolio, setPortfolio] = useState<string>("All");
  const [panelOpen, setPanelOpen] = useState(true);
  const [search, setSearch] = useState("");
  // Tables default-sort by TA Priority ascending so the highest-priority work leads every view.
  const [sortCol, setSortCol] = useState<string | null>("areaPrioritization");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Per-column value filters (Excel-style). Empty array / missing key = no filter on that column.
  const [colFilters, setColFilters] = useState<Partial<Record<keyof Idea, string[]>>>({});
  const [openFilter, setOpenFilter] = useState<keyof Idea | null>(null);

  // Active-cell cursor + edit state (r indexes into the sorted rows).
  const [active, setActive] = useState<{ r: number; c: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [seed, setSeed] = useState("");

  // Bulk selection: a set of row UIDs (never indices — indices shift with sort/filter, like
  // everywhere else that mutates by uid). Drives the checkbox column and the floating bulk bar.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const clearSelection = useCallback(() => setSelected(new Set()), []);

  // Clearing the cursor + edit state is a recurring "keep it honest" cleanup: reordering, hiding,
  // switching portfolio/tab, and status flips all invalidate an index-based cursor.
  const resetCursor = useCallback(() => { setActive(null); setIsEditing(false); }, []);

  const gridRef = useRef<HTMLDivElement>(null);

  const { view, pendingView, dir, tabRefs, tabIndicator, swapProps, switchView } = useViewSwap(
    "Franchise",
    () => {
      // Persist anything pending before the grid re-keys under a new column set.
      if (dirtyRows.current.size > 0) flushDirty();
      setIsEditing(false);
      setActive(null);
      setOpenFilter(null);
      // A new view shows a different slice of rows — a selection carried over could edit rows the
      // user can no longer see. Clear it so bulk actions only ever apply to what's on screen.
      setSelected(new Set());
    },
    next => {
      // Column indices change with the view — a sort on a now-hidden column would be invisible.
      if (sortCol && !VIEW_KEYS[next].includes(sortCol as keyof Idea)) {
        setSortCol(null);
        setSortDir(null);
      }
      if (gridRef.current) gridRef.current.scrollLeft = 0;
    },
  );

  // Columns currently on screen. Everything index-based — the cursor, keyboard nav,
  // commits — is relative to this list, not the full schema. Portfolio isn't part of the view
  // schema; it's injected at index 1 (right after the UID spine) only in the "All portfolios"
  // view, where it disambiguates rows. In a single-portfolio tab it's redundant, so it's hidden.
  const portfolioCol = allColumns.find(c => c.key === "portfolio")!;
  const baseCols = useMemo(() => viewColumns(view, visibleKeys(view)), [view, visibleKeys]);
  const cols = useMemo(
    () => (portfolio === "All"
      ? [baseCols[0], portfolioCol, ...baseCols.slice(1)]
      : baseCols),
    [portfolio, baseCols, portfolioCol],
  );
  // The set of frozen columns for the current view (the user's per-column pins). Passed to the
  // grid so its sticky geometry follows customization; the injected portfolio column is never
  // frozen, so it scrolls like any other unfrozen column.
  const frozenCols = useMemo(() => frozenKeysFor(view), [view, frozenKeysFor]);

  const handleSort = useCallback((key: string) => {
    if (sortCol === key) {
      setSortDir(d => d === "asc" ? "desc" : d === "desc" ? null : "asc");
      if (sortDir === "desc") setSortCol(null);
    } else {
      setSortCol(key);
      setSortDir("asc");
    }
  }, [sortCol, sortDir]);

  // Drop any active sort outright (used when the sorted column is being hidden — an invisible sort
  // is confusing). Distinct from handleSort, which cycles asc → desc → none on a header click.
  const clearSort = useCallback(() => { setSortCol(null); setSortDir(null); }, []);

  // Filter → sort recompute only when their inputs change — not on every cursor move, keystroke, or
  // hover. Without these memos the whole O(rows) pass (plus a full copy + sort) ran on every render.
  const filtered = useMemo(() => {
    const needle = search.toLowerCase(); // hoisted: lowercased once, not per field per row
    return rows.filter(row => {
      const matchesPortfolio = portfolio === "All" || row.portfolio === portfolio;
      // A record's status drives which tab it belongs to: "Funded" status collects under the
      // Funded tab; everything else stays in the working Franchise / Evidence Function views.
      const isFunded = row.status === FUNDED_STATUS;
      const matchesView = view === "Funded" ? isFunded : !isFunded;
      // Search spans the whole record — finding a row by a value the current view hides is useful.
      const matchesSearch = !needle || rowSearchText(row).includes(needle);
      // Column filters only apply while their column is visible, so a filter set in one
      // view never silently hides rows in the other.
      const matchesFilters = cols.every(col => {
        const sel = colFilters[col.key];
        return !sel || sel.length === 0 || sel.includes(row[col.key]);
      });
      return matchesPortfolio && matchesView && matchesSearch && matchesFilters;
    });
  }, [rows, portfolio, view, search, cols, colFilters]);

  // Rows scoped to what the user is actually viewing — portfolio, tab, and search — but WITHOUT the
  // per-column value filters applied. The filter dropdown draws its options from these so it always
  // reflects the current table data (not the whole dataset), while still offering every value the
  // user could toggle even after some are already selected (Excel-style).
  const filterScopedRows = useMemo(() => {
    const needle = search.toLowerCase();
    return rows.filter(row => {
      const matchesPortfolio = portfolio === "All" || row.portfolio === portfolio;
      const isFunded = row.status === FUNDED_STATUS;
      const matchesView = view === "Funded" ? isFunded : !isFunded;
      const matchesSearch = !needle || Object.values(row).some(v => typeof v === "string" && v.toLowerCase().includes(needle));
      return matchesPortfolio && matchesView && matchesSearch;
    });
  }, [rows, portfolio, view, search]);

  // Distinct column values (for the filter dropdowns) are cached per scoped-row set and computed
  // lazily on first access per key, so the header no longer rebuilds a Set + sort for every column
  // each render.
  const distinctCache = useMemo(() => new Map<keyof Idea, string[]>(), [filterScopedRows]);
  const distinctValues = useCallback((key: keyof Idea) => {
    const hit = distinctCache.get(key);
    if (hit) return hit;
    const vals = Array.from(new Set(filterScopedRows.map(r => r[key]).filter(v => v !== ""))).sort((a, b) => a.localeCompare(b));
    distinctCache.set(key, vals);
    return vals;
  }, [filterScopedRows, distinctCache]);

  const toggleFilterValue = useCallback((key: keyof Idea, value: string) => {
    setColFilters(prev => {
      const cur = prev[key] ?? [];
      const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value];
      return { ...prev, [key]: next };
    });
  }, []);

  const activeFilterCount = useMemo(
    () => cols.filter(c => (colFilters[c.key]?.length ?? 0) > 0).length,
    [cols, colFilters],
  );

  const sorted = useMemo(
    () => (sortCol && sortDir
      ? [...filtered].sort((a, b) =>
          compareCells((a as any)[sortCol] as string, (b as any)[sortCol] as string, sortDir),
        )
      : filtered),
    [filtered, sortCol, sortDir],
  );

  const totalRows = sorted.length;

  // sortedRef lets the row-leave effect resolve UIDs without capturing a stale closure.
  const sortedRef = useRef(sorted);
  sortedRef.current = sorted; // update synchronously every render — no effect needed

  // Keep the selection honest: prune any selected uid that the current search / column filters have
  // hidden, so the bulk bar's count and the select-all state only ever reflect visible rows — and a
  // bulk action can never silently mutate a row that's off-screen. (Sort doesn't change membership,
  // so keying on `filtered` is enough; view/portfolio changes clear selection outright elsewhere.)
  useEffect(() => {
    setSelected(prev => {
      if (prev.size === 0) return prev;
      const visible = new Set(filtered.map(r => r.uid));
      let changed = false;
      const next = new Set<string>();
      prev.forEach(uid => { if (visible.has(uid)) next.add(uid); else changed = true; });
      return changed ? next : prev;
    });
  }, [filtered]);

  // Track previous active UID (not index) so flush survives tab/sort/filter changes.
  const prevActiveUid = useRef<string | null>(null);
  useEffect(() => {
    const curUid =
      active !== null
        ? sortedRef.current[active.r]?.uid ?? null
        : null;
    const prevUid = prevActiveUid.current;
    if (prevUid !== curUid) {
      prevActiveUid.current = curUid;
      if (prevUid && dirtyRows.current.has(prevUid)) flushDirty([prevUid]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.r]);

  // Keep keyboard focus on the grid whenever a cell is selected but not being edited.
  useEffect(() => {
    if (active && !isEditing) gridRef.current?.focus();
  }, [active, isEditing]);

  function move(dr: number, dc: number) {
    setActive(a => {
      const base = a ?? { r: 0, c: 0 };
      return { r: clamp(base.r + dr, 0, totalRows - 1), c: clamp(base.c + dc, 0, cols.length - 1) };
    });
    setIsEditing(false);
  }

  const startEdit = useCallback((withSeed: string) => {
    setSeed(withSeed);
    setIsEditing(true);
  }, []);

  function currentValue(r: number, c: number) {
    const key = cols[c].key;
    return sorted[r]?.[key] ?? "";
  }

  // Throttle the read-only toast so hammering keys / repeated clicks don't stack notifications,
  // and expose a per-column check for the key handler.
  const readOnlyToastAt = useRef(0);
  const notifyReadOnly = useCallback(() => {
    const now = Date.now();
    if (now - readOnlyToastAt.current < 1500) return;
    readOnlyToastAt.current = now;
    toast("Managed by Franchise", {
      description: "Switch to the Franchise tab to edit this column.",
      icon: <Lock size={15} />,
      duration: TOAST_MS.notice,
    });
  }, []);
  const isReadOnlyAt = (c: number) => isColReadOnly(view, cols[c].key);

  // Stable cell handlers passed down to the memoized GridCells, so an arrow-key move re-renders only
  // the cells whose active/editing flags actually change — not all ~1,000+ cells.
  const onSelectCell = useCallback((r: number, c: number) => { setActive({ r, c }); setIsEditing(false); }, []);
  const onStartEditCell = useCallback((r: number, c: number, value: string) => { setActive({ r, c }); startEdit(value); }, [startEdit]);
  const onCancelEdit = useCallback(() => setIsEditing(false), []);
  const onReadOnlyCell = useCallback((r: number, c: number) => { setActive({ r, c }); notifyReadOnly(); }, [notifyReadOnly]);
  const onToggleFilterMenu = useCallback((key: keyof Idea) => setOpenFilter(o => (o === key ? null : key)), []);
  const onClearFilter = useCallback((key: keyof Idea) => setColFilters(prev => ({ ...prev, [key]: [] })), []);

  function onGridKeyDown(e: React.KeyboardEvent) {
    if (isEditing || !active) return;
    const { r, c } = active;
    if (e.key === "ArrowUp") { e.preventDefault(); move(-1, 0); }
    else if (e.key === "ArrowDown") { e.preventDefault(); move(1, 0); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); move(0, -1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); move(0, 1); }
    else if (e.key === "Tab") {
      e.preventDefault();
      if (c < cols.length - 1) move(0, 1);
      else setActive({ r: clamp(r + 1, 0, totalRows - 1), c: 0 });
    }
    // Franchise-owned columns are read-only in the Evidence tab — intercept any edit intent.
    else if (isReadOnlyAt(c) && (e.key === "Enter" || e.key === "F2" || e.key === "Delete" || e.key === "Backspace" || (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey))) {
      e.preventDefault();
      notifyReadOnly();
    }
    else if (e.key === "Enter" || e.key === "F2") { e.preventDefault(); startEdit(currentValue(r, c)); }
    else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); const t = sorted[r]; if (t) commitCell(t, cols[c], ""); }
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { startEdit(e.key); }
  }

  const handleCommit = useCallback((r: number, c: number, val: string, moveDir: MoveDir) => {
    const target = sortedRef.current[r];
    if (target) commitCell(target, cols[c], val);
    setIsEditing(false);
    if (moveDir === "down") setActive({ r: clamp(r + 1, 0, totalRows - 1), c });
    else if (moveDir === "right") setActive({ r, c: clamp(c + 1, 0, cols.length - 1) });
  }, [commitCell, cols, totalRows]);

  // ── Bulk selection ────────────────────────────────────────────────────────────
  const toggleRowSelected = useCallback((uid: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  }, []);

  // Select-all operates on the CURRENTLY VISIBLE rows (filtered + sorted), matching the Excel-style
  // "all" the user can actually see: if every visible row is already selected, toggle clears.
  const allSelected = sorted.length > 0 && sorted.every(r => selected.has(r.uid));
  const someSelected = selected.size > 0 && !allSelected;
  const toggleSelectAll = useCallback(() => {
    setSelected(prev => {
      const visible = sortedRef.current;
      const everySelected = visible.length > 0 && visible.every(r => prev.has(r.uid));
      return everySelected ? new Set() : new Set(visible.map(r => r.uid));
    });
  }, []);

  // Dropdown fields that can be bulk-edited in the current view: static-option columns that are
  // editable here. Comparator is excluded — its options depend on each row's product (see
  // IdeasTable's cellOptions), so one value can't apply across a mixed selection.
  const editableDropdownCols = useMemo(
    () => cols.filter(c => c.options && c.key !== "comparator" && !isColReadOnly(view, c.key)),
    [cols, view],
  );

  return {
    // view / tabs
    view, pendingView, dir, tabRefs, tabIndicator, swapProps, switchView,
    // layout refs + column geometry
    gridRef, cols, baseCols, frozenCols,
    // portfolio + panel + search
    portfolio, setPortfolio, panelOpen, setPanelOpen, search, setSearch,
    // sort + filters
    sortCol, sortDir, handleSort, clearSort, colFilters, setColFilters, openFilter,
    distinctValues, toggleFilterValue, onToggleFilterMenu, onClearFilter,
    activeFilterCount,
    // derived rows
    filtered, sorted,
    // cursor + editing
    active, isEditing, seed, resetCursor,
    onGridKeyDown, handleCommit, onSelectCell, onStartEditCell, onCancelEdit, onReadOnlyCell,
    // selection
    selected, allSelected, someSelected, clearSelection,
    toggleRowSelected, toggleSelectAll, editableDropdownCols,
  };
}
