import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { Toaster, toast } from "sonner";

import type { Idea, MoveDir, RankingConfig, SortDir, ViewKey } from "./types";
import { FUNDED_STATUS } from "./types";
import { VIEW_KEYS, viewColumns, columns as allColumns, isColReadOnly } from "./data/columns";
import { emptyDraft, initialIdeas } from "./data/ideas";
import { clamp, compareCells } from "./lib/format";
import { isLocked, LOCK_REASON } from "./lib/locking";
import { useDirtyRows } from "./hooks/useDirtyRows";
import { useViewSwap } from "./hooks/useViewSwap";

import { AppSidebar, type Page } from "./components/ideas/AppSidebar";
import { GlobalStyles } from "./components/ideas/GlobalStyles";
import { HelpPage } from "./components/ideas/HelpPage";
import { IdeaDetailPanel } from "./components/ideas/IdeaDetailPanel";
import { IdeaHistoryPanel } from "./components/ideas/IdeaHistoryPanel";
import { IdeasTable } from "./components/ideas/IdeasTable";
import { PageHeader } from "./components/ideas/PageHeader";
import { PortfolioPanel } from "./components/ideas/PortfolioPanel";
import { PrioritizeModal } from "./components/ideas/PrioritizeModal";
import { StatusBar } from "./components/ideas/StatusBar";
import { ViewTabs } from "./components/ideas/ViewTabs";
import { usePreferences } from "./hooks/usePreferences";

export default function App() {
  // Which top-level page the sidebar is showing. Ideas is the working surface and
  // the default; Home is intentionally a blank canvas for now; Help is the FAQ.
  const [page, setPage] = useState<Page>("ideas");
  const { theme, applyTheme, zoom, zoomIn, zoomOut, resetZoom, canZoomIn, canZoomOut } = usePreferences();

  const [portfolio, setPortfolio] = useState<string>("All");
  const [panelOpen, setPanelOpen] = useState(true);
  const [search, setSearch] = useState("");
  // Tables default-sort by TA Priority ascending so the highest-priority work leads every view.
  const [sortCol, setSortCol] = useState<string | null>("areaPrioritization");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [rows, setRows] = useState<Idea[]>(initialIdeas);

  // Prioritize flow: one modal walks persona → scope → reorder.
  const [prioritizeOpen, setPrioritizeOpen] = useState(false);
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
  const portfolioCol = allColumns.find(c => c.key === "portfolio")!;
  const baseCols = viewColumns(view);
  const cols = portfolio === "All"
    ? [baseCols[0], portfolioCol, ...baseCols.slice(1)]
    : baseCols;

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
    // A record's status drives which tab it belongs to: "Funded" status collects under the
    // Funded tab; everything else stays in the working Franchise / Evidence Function views.
    const isFunded = row.status === FUNDED_STATUS;
    const matchesView = view === "Funded" ? isFunded : !isFunded;
    // Search spans the whole record — finding a row by a value the current view hides is useful.
    const matchesSearch = !search || Object.values(row).some(v => typeof v === "string" && v.toLowerCase().includes(search.toLowerCase()));
    // Column filters only apply while their column is visible, so a filter set in one
    // view never silently hides rows in the other.
    const matchesFilters = cols.every(col => {
      const sel = colFilters[col.key];
      return !sel || sel.length === 0 || sel.includes(row[col.key]);
    });
    return matchesPortfolio && matchesView && matchesSearch && matchesFilters;
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

  const sorted = sortCol && sortDir
    ? [...filtered].sort((a, b) =>
        compareCells((a as any)[sortCol] as string, (b as any)[sortCol] as string, sortDir),
      )
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

  // Throttle the read-only toast the same way, and expose a per-column check for the key handler.
  const readOnlyToastAt = useRef(0);
  function notifyReadOnly() {
    const now = Date.now();
    if (now - readOnlyToastAt.current < 1500) return;
    readOnlyToastAt.current = now;
    toast("Managed by Franchise", {
      description: "Switch to the Franchise tab to edit this column.",
      icon: <Lock size={15} />,
    });
  }
  const isReadOnlyAt = (c: number) => isColReadOnly(view, cols[c].key);

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
    // Franchise-owned columns are read-only in the Evidence tab — intercept any edit intent.
    else if (isReadOnlyAt(c) && (e.key === "Enter" || e.key === "F2" || e.key === "Delete" || e.key === "Backspace" || (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey))) {
      e.preventDefault();
      notifyReadOnly();
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

  // Persist a new ordering: position becomes the 1..N number written to the persona's field.
  function commitRanking(config: RankingConfig, orderedUids: string[]) {
    const field = config.persona === "brand" ? "brandRanking" : "areaPrioritization";
    const rankByUid = new Map(orderedUids.map((uid, i) => [uid, String(i + 1)]));
    setRows(prev => prev.map(r => (rankByUid.has(r.uid) ? { ...r, [field]: rankByUid.get(r.uid)! } : r)));
    orderedUids.forEach(markDirty);
    setPrioritizeOpen(false);
    toast.success(
      config.persona === "brand" ? `Brand Ranking saved · ${config.scope}` : `TA Priority saved · ${config.scope}`,
      { description: `${orderedUids.length} records renumbered 1–${orderedUids.length}.` },
    );
  }

  // Flag / unflag a record as funded by writing its status — it hops between the Funded tab
  // and the working views. Un-funding returns it to "Proposed" so it re-enters the pipeline.
  function toggleFound(row: Idea) {
    const nowFunded = row.status !== FUNDED_STATUS;
    setRows(prev => prev.map(r => (r.uid === row.uid ? { ...r, status: nowFunded ? FUNDED_STATUS : "Proposed" } : r)));
    setActive(null);
    setIsEditing(false);
    toast(nowFunded ? `Marked ${row.uid} as funded` : `Removed ${row.uid} from funded`, {
      description: nowFunded
        ? "Moved to the Funded tab."
        : "Returned to Franchise / Evidence Function.",
    });
  }

  return (
    <div
      className="flex overflow-hidden"
      style={{
        fontFamily: '"Open Sans", system-ui, -apple-system, sans-serif',
        backgroundColor: "var(--app-bg)",
        // In-app zoom applied at the root so it scales every element — sidebar,
        // panel, header, grid. `zoom` reflows content at the chosen scale, but vw/vh
        // are zoom-independent, so a plain 100vw/100vh root would overflow. Sizing the
        // root to (100/zoom)vw × (100/zoom)vh makes the rendered size land back at
        // exactly 100vw × 100vh after zoom multiplies it.
        zoom,
        width: `${100 / zoom}vw`,
        height: `${100 / zoom}vh`,
      }}
    >
      <GlobalStyles />
      <Toaster position="bottom-right" richColors theme={theme} />

      <AppSidebar
        page={page}
        onNavigate={setPage}
        prefs={{
          theme,
          onSetTheme: applyTheme,
          zoom,
          onZoomIn: zoomIn,
          onZoomOut: zoomOut,
          onResetZoom: resetZoom,
          canZoomIn,
          canZoomOut,
        }}
      />

      {/* The portfolio panel is contextual to the Ideas surface only. */}
      {page === "ideas" && (
        <PortfolioPanel
          rows={rows}
          active={portfolio}
          open={panelOpen}
          onSelect={p => { setPortfolio(p); setActive(null); setIsEditing(false); }}
          onToggle={() => setPanelOpen(o => !o)}
        />
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {page === "ideas" && (
          <main className="flex-1 overflow-hidden flex flex-col px-8 pt-7 pb-4 gap-4">

            <PageHeader
              portfolio={portfolio}
              search={search}
              onSearchChange={setSearch}
              onRank={() => setPrioritizeOpen(true)}
              onExport={() => toast.success("Export started", { description: `${rows.length} ideas exported.` })}
            />

            <div className="flex-1 overflow-hidden flex flex-col gap-4">
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
                onReadOnlyCell={(r, c) => { setActive({ r, c }); notifyReadOnly(); }}
                onEditRow={(row, ri) => { setActive({ r: ri, c: 0 }); startEdit(row[cols[0].key]); }}
                onViewDetails={row => { setHistoryRow(null); setDetailRow(row); }}
                onViewHistory={row => { setDetailRow(null); setHistoryRow(row); }}
                onToggleFound={toggleFound}
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
            </div>

          </main>
        )}

        {page === "help" && <HelpPage />}

        {/* Home is intentionally left empty for now. */}
        {page === "home" && <main className="flex-1" />}
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

      <PrioritizeModal
        open={prioritizeOpen}
        rows={rows}
        currentPortfolio={portfolio}
        onClose={() => setPrioritizeOpen(false)}
        onCommit={commitRanking}
      />
    </div>
  );
}
