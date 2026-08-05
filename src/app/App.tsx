import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { Toaster, toast } from "sonner";

import type { Idea, MoveDir, SortDir, ViewKey } from "./types";
import { VIEW_KEYS, viewColumns } from "./data/columns";
import { emptyDraft, initialIdeas } from "./data/ideas";
import { clamp } from "./lib/format";
import { isLocked, LOCK_REASON } from "./lib/locking";
import { useDirtyRows } from "./hooks/useDirtyRows";
import { useViewSwap } from "./hooks/useViewSwap";

import { AppSidebar } from "./components/ideas/AppSidebar";
import { GlobalStyles } from "./components/ideas/GlobalStyles";
import { IdeaDetailPanel } from "./components/ideas/IdeaDetailPanel";
import { IdeaHistoryPanel } from "./components/ideas/IdeaHistoryPanel";
import { IdeasTable } from "./components/ideas/IdeasTable";
import { PageHeader } from "./components/ideas/PageHeader";
import { PortfolioPanel } from "./components/ideas/PortfolioPanel";
import { StatusBar } from "./components/ideas/StatusBar";
import { ViewTabs } from "./components/ideas/ViewTabs";

export default function App() {
  const [portfolio, setPortfolio] = useState<string>("All");
  const [panelOpen, setPanelOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [rows, setRows] = useState<Idea[]>(initialIdeas);
  const [draft, setDraft] = useState<Idea>(emptyDraft);

  // Per-column value filters (Excel-style). Empty array / missing key = no filter on that column.
  const [colFilters, setColFilters] = useState<Partial<Record<keyof Idea, string[]>>>({});
  const [openFilter, setOpenFilter] = useState<keyof Idea | null>(null);

  // Active-cell cursor + edit state (r spans sorted rows; the last index is the draft row)
  const [active, setActive] = useState<{ r: number; c: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [seed, setSeed] = useState("");
  const [detailRow, setDetailRow] = useState<Idea | null>(null);
  const [historyRow, setHistoryRow] = useState<Idea | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const { dirtySet, savingSet, dirtyRows, markDirty, flushDirty, rowsRef } = useDirtyRows(rows);

  const { view, pendingView, dir, tabRefs, tabIndicator, swapProps, switchView } = useViewSwap(
    "Franchise",
    () => {
      // Persist anything pending before the grid re-keys under a new column set.
      if (dirtyRows.current.size > 0) flushDirty();
      setIsEditing(false);
      setActive(null);
      setOpenFilter(null);
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
  // commits — is relative to this list, not the full schema.
  const cols = viewColumns(view);

  function handleSort(key: string) {
    if (sortCol === key) {
      setSortDir(d => d === "asc" ? "desc" : d === "desc" ? null : "asc");
      if (sortDir === "desc") setSortCol(null);
    } else {
      setSortCol(key);
      setSortDir("asc");
    }
  }

  const filtered = rows.filter(row => {
    const matchesPortfolio = portfolio === "All" || row.portfolio === portfolio;
    // Search spans the whole record — finding a row by a value the current view hides is useful.
    const matchesSearch = !search || Object.values(row).some(v => v.toLowerCase().includes(search.toLowerCase()));
    // Column filters only apply while their column is visible, so a filter set in one
    // view never silently hides rows in the other.
    const matchesFilters = cols.every(col => {
      const sel = colFilters[col.key];
      return !sel || sel.length === 0 || sel.includes(row[col.key]);
    });
    return matchesPortfolio && matchesSearch && matchesFilters;
  });

  const distinctValues = (key: keyof Idea) =>
    Array.from(new Set(rows.map(r => r[key]).filter(v => v !== ""))).sort((a, b) => a.localeCompare(b));

  function toggleFilterValue(key: keyof Idea, value: string) {
    setColFilters(prev => {
      const cur = prev[key] ?? [];
      const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value];
      return { ...prev, [key]: next };
    });
  }

  const activeFilterCount = cols.filter(c => (colFilters[c.key]?.length ?? 0) > 0).length;

  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const av = (a as any)[sortCol] as string;
        const bv = (b as any)[sortCol] as string;
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      })
    : filtered;

  const draftIndex = sorted.length;
  const totalRows = sorted.length + 1;

  // sortedRef lets the row-leave effect resolve UIDs without capturing a stale closure.
  const sortedRef = useRef(sorted);
  sortedRef.current = sorted; // update synchronously every render — no effect needed

  // Track previous active UID (not index) so flush survives tab/sort/filter changes.
  const prevActiveUid = useRef<string | null>(null);
  useEffect(() => {
    const curUid =
      active !== null && active.r !== draftIndex
        ? sortedRef.current[active.r]?.uid ?? null
        : null;
    const prevUid = prevActiveUid.current;
    if (prevUid !== curUid) {
      prevActiveUid.current = curUid;
      if (prevUid && dirtyRows.current.has(prevUid)) flushDirty([prevUid]);
    }
  }, [active?.r]);

  // Keep keyboard focus on the grid whenever a cell is selected but not being edited.
  useEffect(() => {
    if (active && !isEditing) gridRef.current?.focus();
  }, [active, isEditing]);

  function commitValue(r: number, c: number, val: string) {
    const key = cols[c].key;
    if (r === draftIndex) {
      const next = { ...draft, [key]: val };
      const trimmedUid = next.uid.trim();
      if (trimmedUid) {
        if (rowsRef.current.some(r => r.uid === trimmedUid)) {
          toast.error(`UID ${trimmedUid} already exists`, { description: "Choose a unique UID." });
          setDraft(next);
          return;
        }
        setRows(prev => [...prev, next]);
        setDraft(emptyDraft);
        toast.success(`Added idea ${next.uid}`);
        markDirty(next.uid); // new rows persist through the same dirty-row flush strategy
      } else {
        setDraft(next);
      }
    } else {
      const target = sorted[r];
      if (target && !isLocked(target)) {
        if (key === "uid") {
          const trimmedUid = val.trim();
          if (trimmedUid !== target.uid && rowsRef.current.some(r => r.uid === trimmedUid)) {
            toast.error(`UID ${trimmedUid} already exists`, { description: "Choose a unique UID." });
            return;
          }
        }
        setRows(prev => prev.map(row => (row.uid === target.uid ? { ...row, [key]: val } : row)));
        markDirty(target.uid);
      }
    }
  }

  function move(dr: number, dc: number) {
    setActive(a => {
      const base = a ?? { r: 0, c: 0 };
      return { r: clamp(base.r + dr, 0, totalRows - 1), c: clamp(base.c + dc, 0, cols.length - 1) };
    });
    setIsEditing(false);
  }

  function startEdit(withSeed: string) {
    setSeed(withSeed);
    setIsEditing(true);
  }

  function currentValue(r: number, c: number) {
    const key = cols[c].key;
    return r === draftIndex ? draft[key] : (sorted[r]?.[key] ?? "");
  }

  // A grid position is locked when it sits on a locked record. The draft row is never locked.
  function isLockedAt(r: number) {
    return r !== draftIndex && !!sorted[r] && isLocked(sorted[r]);
  }

  // Throttle the lock toast so hammering keys / repeated clicks don't stack notifications.
  const lockToastAt = useRef(0);
  function notifyLocked() {
    const now = Date.now();
    if (now - lockToastAt.current < 1500) return;
    lockToastAt.current = now;
    toast("This idea is locked", { description: LOCK_REASON, icon: <Lock size={15} /> });
  }

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
    // Any key that would enter edit / clear a locked row is intercepted with an explanation.
    else if (isLockedAt(r) && (e.key === "Enter" || e.key === "F2" || e.key === "Delete" || e.key === "Backspace" || (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey))) {
      e.preventDefault();
      notifyLocked();
    }
    else if (e.key === "Enter" || e.key === "F2") { e.preventDefault(); startEdit(currentValue(r, c)); }
    else if ((e.key === "Delete" || e.key === "Backspace") && r !== draftIndex) { e.preventDefault(); commitValue(r, c, ""); }
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { startEdit(e.key); }
  }

  function handleCommit(r: number, c: number, val: string, moveDir: MoveDir) {
    commitValue(r, c, val);
    setIsEditing(false);
    if (moveDir === "down") setActive({ r: clamp(r + 1, 0, totalRows - 1), c });
    else if (moveDir === "right") setActive({ r, c: clamp(c + 1, 0, cols.length - 1) });
  }

  function duplicateRow(row: Idea) {
    let newUid = `${row.uid}-copy`;
    let n = 2;
    while (rows.some(r => r.uid === newUid)) newUid = `${row.uid}-copy${n++}`;
    setRows(prev => [...prev, { ...row, uid: newUid }]);
    toast.success(`Duplicated ${row.uid}`);
  }

  function deleteRow(row: Idea) {
    setRows(prev => prev.filter(r => r.uid !== row.uid));
    toast(`Deleted ${row.uid}`, { description: "Row removed from the list." });
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ fontFamily: '"Open Sans", system-ui, -apple-system, sans-serif', backgroundColor: "#f5f5f7" }}>
      <GlobalStyles />
      <Toaster position="bottom-right" richColors />

      <AppSidebar />

      <PortfolioPanel
        rows={rows}
        active={portfolio}
        open={panelOpen}
        onSelect={p => { setPortfolio(p); setActive(null); setIsEditing(false); }}
        onToggle={() => setPanelOpen(o => !o)}
      />

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden flex flex-col px-8 pt-7 pb-4 gap-4">

          <PageHeader
            portfolio={portfolio}
            search={search}
            onSearchChange={setSearch}
            onExport={() => toast.success("Export started", { description: `${rows.length} ideas exported.` })}
          />

          <ViewTabs
            pendingView={pendingView}
            tabRefs={tabRefs}
            indicator={tabIndicator}
            onSelect={(v: ViewKey) => switchView(v)}
          />

          <IdeasTable
            gridRef={gridRef}
            view={view}
            dir={dir}
            cols={cols}
            rows={sorted}
            draft={draft}
            draftIndex={draftIndex}
            active={active}
            isEditing={isEditing}
            seed={seed}
            dirtySet={dirtySet}
            savingSet={savingSet}
            sortCol={sortCol}
            sortDir={sortDir}
            colFilters={colFilters}
            openFilter={openFilter}
            distinctValues={distinctValues}
            swapProps={swapProps}
            onKeyDown={onGridKeyDown}
            onSort={handleSort}
            onToggleFilterMenu={key => setOpenFilter(o => (o === key ? null : key))}
            onToggleFilterValue={toggleFilterValue}
            onClearFilter={key => setColFilters(prev => ({ ...prev, [key]: [] }))}
            onSelectCell={(r, c) => { setActive({ r, c }); setIsEditing(false); }}
            onStartEditCell={(r, c, value) => { setActive({ r, c }); startEdit(value); }}
            onCommitCell={handleCommit}
            onCancelEdit={() => setIsEditing(false)}
            onLockedCell={(r, c) => { setActive({ r, c }); notifyLocked(); }}
            onEditRow={(row, ri) => { setActive({ r: ri, c: 0 }); startEdit(row[cols[0].key]); }}
            onViewDetails={row => { setHistoryRow(null); setDetailRow(row); }}
            onViewHistory={row => { setDetailRow(null); setHistoryRow(row); }}
            onDuplicateRow={duplicateRow}
            onDeleteRow={deleteRow}
          />

          <StatusBar
            shown={sorted.length}
            total={rows.length}
            filtersActive={activeFilterCount}
            isNarrowed={portfolio !== "All" || !!search || activeFilterCount > 0}
            onAddRow={() => { setActive({ r: draftIndex, c: 0 }); startEdit(""); }}
          />

        </main>
      </div>

      <IdeaDetailPanel
        row={detailRow}
        onClose={() => setDetailRow(null)}
        onEdit={r => { setActive({ r: 0, c: 0 }); startEdit(r[cols[0].key]); }}
      />
      <IdeaHistoryPanel
        row={historyRow}
        onClose={() => setHistoryRow(null)}
      />
    </div>
  );
}
