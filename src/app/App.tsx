import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Lock, CircleCheck, CircleAlert, Trash2, CircleMinus, Info,
  FilePlus2, Save, Copy, ListOrdered, FileDown, CircleDollarSign, Pencil,
} from "lucide-react";
import { Toaster, toast } from "sonner";

import type { Idea, MoveDir, RankingConfig, SortDir, ViewKey } from "./types";
import { FUNDED_STATUS } from "./types";
import { VIEW_KEYS, viewColumns, columns as allColumns, isColReadOnly } from "./data/columns";
import { initialIdeas } from "./data/ideas";
import { clamp, compareCells } from "./lib/format";
import { useDirtyRows } from "./hooks/useDirtyRows";
import { useViewSwap } from "./hooks/useViewSwap";

import { AppSidebar, type Page } from "./components/ideas/AppSidebar";
import { GlobalStyles } from "./components/ideas/GlobalStyles";
import { HelpPage } from "./components/ideas/HelpPage";
import { IdeaDetailPanel } from "./components/ideas/IdeaDetailPanel";
import { IdeaHistoryPanel } from "./components/ideas/IdeaHistoryPanel";
import { AddStudyButton } from "./components/ideas/AddStudyButton";
import { AddStudyModal } from "./components/ideas/AddStudyModal";
import { IdeasTable } from "./components/ideas/IdeasTable";
import { ColumnSettingsPopover } from "./components/ideas/ColumnSettingsPopover";
import { PageHeader } from "./components/ideas/PageHeader";
import { PortfolioPanel } from "./components/ideas/PortfolioPanel";
import { PrioritizeModal } from "./components/ideas/PrioritizeModal";
import { StatusBar } from "./components/ideas/StatusBar";
import { ViewTabs } from "./components/ideas/ViewTabs";
import { usePreferences } from "./hooks/usePreferences";
import { useColumnPrefs } from "./hooks/useColumnPrefs";

// Toast dwell times (ms), tuned to content + interactivity per notification best practice:
// a bare confirmation is brief; a notice with a description lingers; anything carrying an Undo
// gets a long window to find + press it; a validation error stays put well past a glance.
// Sonner additionally pauses whichever timer is running while the pointer is over the stack.
const TOAST_MS = { confirm: 3000, notice: 5000, action: 10000, error: 8000 } as const;

export default function App() {
  // Which top-level page the sidebar is showing. Ideas is the working surface and
  // the default; Home is intentionally a blank canvas for now; Help is the FAQ.
  const [page, setPage] = useState<Page>("ideas");
  const { theme, applyTheme, zoom, zoomIn, zoomOut, resetZoom, canZoomIn, canZoomOut } = usePreferences();
  // Per-view column customization (order + freeze + visibility), persisted like theme/zoom.
  const { prefs, setViewOrder, togglePin, toggleHidden, resetView, visibleKeys, frozenKeysFor } = useColumnPrefs();

  const [portfolio, setPortfolio] = useState<string>("All");
  const [panelOpen, setPanelOpen] = useState(true);
  const [search, setSearch] = useState("");
  // Tables default-sort by TA Priority ascending so the highest-priority work leads every view.
  const [sortCol, setSortCol] = useState<string | null>("areaPrioritization");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [rows, setRows] = useState<Idea[]>(initialIdeas);

  // Prioritize flow: one modal walks persona → scope → reorder.
  const [prioritizeOpen, setPrioritizeOpen] = useState(false);
  // Add-study card: the conventional "create record" form. New ideas are created only here — the
  // grid itself is edit-only (no inline draft row / inline add).
  const [addOpen, setAddOpen] = useState(false);
  // The record being edited in the (shared) record modal, or null. The same modal serves Add
  // (addOpen) and Edit (editRow); they're never both set.
  const [editRow, setEditRow] = useState<Idea | null>(null);

  // Per-column value filters (Excel-style). Empty array / missing key = no filter on that column.
  const [colFilters, setColFilters] = useState<Partial<Record<keyof Idea, string[]>>>({});
  const [openFilter, setOpenFilter] = useState<keyof Idea | null>(null);

  // Active-cell cursor + edit state (r indexes into the sorted rows)
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
      const matchesSearch = !needle || Object.values(row).some(v => typeof v === "string" && v.toLowerCase().includes(needle));
      // Column filters only apply while their column is visible, so a filter set in one
      // view never silently hides rows in the other.
      const matchesFilters = cols.every(col => {
        const sel = colFilters[col.key];
        return !sel || sel.length === 0 || sel.includes(row[col.key]);
      });
      return matchesPortfolio && matchesView && matchesSearch && matchesFilters;
    });
  }, [rows, portfolio, view, search, cols, colFilters]);

  // Distinct column values (for the filter dropdowns) are cached per `rows` and computed lazily on
  // first access per key, so the header no longer rebuilds a Set + sort for every column each render.
  const distinctCache = useMemo(() => new Map<keyof Idea, string[]>(), [rows]);
  const distinctValues = useCallback((key: keyof Idea) => {
    const hit = distinctCache.get(key);
    if (hit) return hit;
    const vals = Array.from(new Set(rows.map(r => r[key]).filter(v => v !== ""))).sort((a, b) => a.localeCompare(b));
    distinctCache.set(key, vals);
    return vals;
  }, [rows, distinctCache]);

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
  }, [active?.r]);

  // Keep keyboard focus on the grid whenever a cell is selected but not being edited.
  useEffect(() => {
    if (active && !isEditing) gridRef.current?.focus();
  }, [active, isEditing]);

  // Emit an undoable toast: centralizes the long dwell time and the one-tap Undo across every
  // mutation (inline edit / add / save / duplicate / delete / rank / fund) so they stay identical.
  const reversibleToast = useCallback(
    (message: string, opts: { description?: string; success?: boolean; icon?: React.ReactNode; undo: () => void }) => {
      const cfg = {
        description: opts.description,
        duration: TOAST_MS.action,
        icon: opts.icon,
        action: { label: "Undo", onClick: () => opts.undo() },
      };
      if (opts.success) toast.success(message, cfg);
      else toast(message, cfg);
    },
    [],
  );

  // Inline commit only edits existing rows — new records are created exclusively through the
  // Add-study card (addStudy). There is no draft row to append. Any real value change is a data
  // mutation, so — like every other mutation — it surfaces a one-tap Undo (§16 Forgiveness) that
  // restores the prior cell value. A no-op commit (value unchanged) stays silent to avoid noise.
  const commitValue = useCallback((r: number, c: number, val: string) => {
    const col = cols[c];
    const key = col.key;
    const target = sorted[r];
    if (target) {
      if (key === "uid") {
        const trimmedUid = val.trim();
        if (trimmedUid !== target.uid && rowsRef.current.some(r => r.uid === trimmedUid)) {
          toast.error(`UID ${trimmedUid} already exists`, { description: "Choose a unique UID.", duration: TOAST_MS.error });
          return;
        }
      }
      const prevVal = target[key] ?? "";
      if (prevVal === val) return; // nothing changed — no write, no toast
      const targetUid = target.uid;
      setRows(prev => prev.map(row => (row.uid === targetUid ? { ...row, [key]: val } : row)));
      markDirty(targetUid);
      // A UID rename changes the row's identity, so the row to undo is keyed by the new UID.
      const uidAfter = key === "uid" ? val.trim() : targetUid;
      reversibleToast(`Updated ${key === "uid" ? val.trim() : targetUid}`, {
        icon: <Pencil size={16} strokeWidth={2} />,
        description: prevVal === "" ? `${col.label} set.` : val === "" ? `${col.label} cleared.` : `${col.label} changed.`,
        undo: () => {
          setRows(prev => prev.map(row => (row.uid === uidAfter ? { ...row, [key]: prevVal } : row)));
          markDirty(key === "uid" ? prevVal : targetUid);
        },
      });
    }
  }, [cols, sorted, rowsRef, markDirty, reversibleToast]);

  // Commit a record from the Add-study card. Same append path as the inline draft commit
  // (setRows → toast → markDirty), with the same UID-uniqueness guard as a safety net; the card
  // already blocks save on empty/duplicate UID, but rows can change while it's open.
  function addStudy(next: Idea) {
    const trimmedUid = next.uid.trim();
    if (!trimmedUid) return;
    if (rowsRef.current.some(r => r.uid === trimmedUid)) {
      toast.error(`UID ${trimmedUid} already exists`, { description: "Choose a unique UID.", duration: TOAST_MS.error });
      return;
    }
    const record = { ...next, uid: trimmedUid };
    setRows(prev => [...prev, record]);
    markDirty(trimmedUid); // new rows persist through the same dirty-row flush strategy
    // Creating a record is a data mutation like any other — one-tap Undo removes the new row (§16).
    reversibleToast(`Added idea ${trimmedUid}`, {
      success: true,
      icon: <FilePlus2 size={16} strokeWidth={2} />,
      undo: () => setRows(prev => prev.filter(r => r.uid !== trimmedUid)),
    });
    setAddOpen(false);
  }

  // Save edits from the record modal back onto the existing row. Mirrors the inline commit's
  // rename support (App's commitValue): a UID change is allowed as long as the new UID is free.
  function saveStudy(next: Idea) {
    if (!editRow) return;
    const prevRecord = editRow; // full pre-edit snapshot, for Undo
    const prevUid = editRow.uid;
    const trimmedUid = next.uid.trim();
    if (!trimmedUid) return;
    if (trimmedUid !== prevUid && rowsRef.current.some(r => r.uid === trimmedUid)) {
      toast.error(`UID ${trimmedUid} already exists`, { description: "Choose a unique UID.", duration: TOAST_MS.error });
      return;
    }
    const record = { ...next, uid: trimmedUid };
    setRows(prev => prev.map(r => (r.uid === prevUid ? record : r)));
    markDirty(trimmedUid);
    // Editing a record is a data mutation — one-tap Undo restores the pre-edit snapshot (§16).
    reversibleToast(`Saved idea ${trimmedUid}`, {
      success: true,
      icon: <Save size={16} strokeWidth={2} />,
      undo: () => setRows(prev => prev.map(r => (r.uid === trimmedUid ? prevRecord : r))),
    });
    setEditRow(null);
  }

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

  // The add/edit card's UID-uniqueness lookup, built only while the card is open.
  const addStudyOpen = addOpen || editRow !== null;
  const addStudyUids = useMemo(
    () => (addStudyOpen ? new Set(rows.map(r => r.uid)) : new Set<string>()),
    [addStudyOpen, rows],
  );

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
    else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); commitValue(r, c, ""); }
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { startEdit(e.key); }
  }

  const handleCommit = useCallback((r: number, c: number, val: string, moveDir: MoveDir) => {
    commitValue(r, c, val);
    setIsEditing(false);
    if (moveDir === "down") setActive({ r: clamp(r + 1, 0, totalRows - 1), c });
    else if (moveDir === "right") setActive({ r, c: clamp(c + 1, 0, cols.length - 1) });
  }, [commitValue, totalRows, cols.length]);

  function duplicateRow(row: Idea) {
    let newUid = `${row.uid}-copy`;
    let n = 2;
    while (rows.some(r => r.uid === newUid)) newUid = `${row.uid}-copy${n++}`;
    setRows(prev => [...prev, { ...row, uid: newUid }]);
    // Forgiveness (§16): every mutation offers a one-tap reversal, matching deleteRow.
    reversibleToast(`Duplicated ${row.uid}`, {
      success: true,
      icon: <Copy size={16} strokeWidth={2} />,
      description: `Created ${newUid}.`,
      undo: () => setRows(prev => prev.filter(r => r.uid !== newUid)),
    });
  }

  function deleteRow(row: Idea) {
    // Capture the row's position so Undo can splice it back exactly where it was, not at the end.
    const restoreIndex = rows.findIndex(r => r.uid === row.uid);
    setRows(prev => prev.filter(r => r.uid !== row.uid));
    reversibleToast(`Deleted ${row.uid}`, {
      description: "Row removed from the list.",
      icon: <Trash2 size={16} strokeWidth={2} />,
      undo: () =>
        setRows(prev => {
          if (prev.some(r => r.uid === row.uid)) return prev; // already restored / re-created
          const at = restoreIndex < 0 ? prev.length : Math.min(restoreIndex, prev.length);
          const next = [...prev];
          next.splice(at, 0, row);
          return next;
        }),
    });
  }

  // Persist a new ordering: position becomes the 1..N number written to the persona's field.
  function commitRanking(config: RankingConfig, orderedUids: string[]) {
    const field = config.persona === "brand" ? "brandRanking" : "areaPrioritization";
    const rankByUid = new Map(orderedUids.map((uid, i) => [uid, String(i + 1)]));
    // Snapshot the prior values so a renumber this large is reversible (§16) — overwriting
    // dozens of ranks with no way back is exactly the kind of irreversible act to guard.
    const prevByUid = new Map(
      rows.filter(r => rankByUid.has(r.uid)).map(r => [r.uid, r[field]]),
    );
    setRows(prev => prev.map(r => (rankByUid.has(r.uid) ? { ...r, [field]: rankByUid.get(r.uid)! } : r)));
    orderedUids.forEach(markDirty);
    setPrioritizeOpen(false);
    reversibleToast(
      config.persona === "brand" ? `Brand Ranking saved · ${config.scope}` : `TA Priority saved · ${config.scope}`,
      {
        success: true,
        icon: <ListOrdered size={16} strokeWidth={2} />,
        description: `${orderedUids.length} records renumbered 1–${orderedUids.length}.`,
        undo: () =>
          setRows(prev => prev.map(r => (prevByUid.has(r.uid) ? { ...r, [field]: prevByUid.get(r.uid)! } : r))),
      },
    );
  }

  // Flag / unflag a record as funded by writing its status — it hops between the Funded tab
  // and the working views. Un-funding returns it to "Proposed" so it re-enters the pipeline.
  function toggleFound(row: Idea) {
    const nowFunded = row.status !== FUNDED_STATUS;
    const prevStatus = row.status;
    setRows(prev => prev.map(r => (r.uid === row.uid ? { ...r, status: nowFunded ? FUNDED_STATUS : "Proposed" } : r)));
    setActive(null);
    setIsEditing(false);
    // A status flip moves the row between tabs — reversible in one tap (§16).
    reversibleToast(nowFunded ? `Marked ${row.uid} as funded` : `Removed ${row.uid} from funded`, {
      description: nowFunded
        ? "Moved to the Funded tab."
        : "Returned to Franchise / Evidence Function.",
      icon: nowFunded ? <CircleDollarSign size={16} strokeWidth={2} /> : <CircleMinus size={16} strokeWidth={2} />,
      undo: () => setRows(prev => prev.map(r => (r.uid === row.uid ? { ...r, status: prevStatus } : r))),
    });
  }

  // Truthful export (§ Feedback): actually build and download a CSV of what's on screen — the
  // filtered + sorted rows, in the current view's visible column order — rather than a toast that
  // claims success without doing anything. The count in the toast is the real row count written.
  function exportCsv() {
    if (sorted.length === 0) {
      toast("Nothing to export", { description: "No rows match the current filters.", icon: <Info size={16} strokeWidth={2} />, duration: TOAST_MS.notice });
      return;
    }
    const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = cols.map(c => esc(c.label)).join(",");
    const body = sorted.map(row => cols.map(c => esc(row[c.key] ?? "")).join(",")).join("\n");
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ideas-${view.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Export complete", { icon: <FileDown size={16} strokeWidth={2} />, description: `${sorted.length} ideas saved as CSV.`, duration: TOAST_MS.notice });
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
      {/* Neutral glass toasts (styled in GlobalStyles) — richColors is deliberately off so a
          notification reads as the same floating material as the app's menus, not a candy box.
          Sonner's built-in status glyphs are filled; we swap in hollow lucide outline icons so a
          success/error toast speaks the exact same icon language as the rest of the app (e.g. the
          Lock on the "Managed by Franchise" notice). Durations are per-toast (TOAST_MS); closeButton
          gives manual dismissal (revealed on hover/focus) and Sonner pauses the timer on hover. */}
      <Toaster
        position="bottom-right"
        theme={theme}
        gap={10}
        offset={18}
        closeButton
        icons={{
          success: <CircleCheck size={16} strokeWidth={2} />,
          error: <CircleAlert size={16} strokeWidth={2} />,
        }}
        toastOptions={{ className: "app-toast" }}
      />

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
              onExport={exportCsv}
              columnsControl={
                <ColumnSettingsPopover
                  view={view}
                  order={prefs[view].order}
                  frozen={prefs[view].frozen}
                  hidden={prefs[view].hidden}
                  // Reordering, pinning, and hiding all change what each column index points at
                  // (hiding removes a column from the rendered set), so clear the index-based
                  // cursor to keep it from landing on the wrong column.
                  onReorder={o => { setViewOrder(view, o); setActive(null); setIsEditing(false); }}
                  onTogglePin={k => { togglePin(view, k); setActive(null); setIsEditing(false); }}
                  onToggleHidden={k => {
                    toggleHidden(view, k);
                    setActive(null);
                    setIsEditing(false);
                    // A sort on a column that's being hidden would leave an invisible sort — clear it.
                    if (sortCol === k) { setSortCol(null); setSortDir(null); }
                  }}
                  onReset={() => { resetView(view); setActive(null); setIsEditing(false); }}
                />
              }
            />

            <div className="relative flex-1 overflow-hidden flex flex-col gap-4">
              {/* Create-record affordance, pinned to the table's top-right (below the header's
                  Export). Hidden on the read-only Funded records view. */}
              {view !== "Funded" && (
                <div className="absolute top-0 right-0 z-20">
                  <AddStudyButton onClick={() => setAddOpen(true)} />
                </div>
              )}
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
                frozenKeys={frozenCols}
                rows={sorted}
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
                onToggleFilterMenu={onToggleFilterMenu}
                onToggleFilterValue={toggleFilterValue}
                onClearFilter={onClearFilter}
                onSelectCell={onSelectCell}
                onStartEditCell={onStartEditCell}
                onCommitCell={handleCommit}
                onCancelEdit={onCancelEdit}
                onReadOnlyCell={onReadOnlyCell}
                onEditRow={row => { setAddOpen(false); setEditRow(row); }}
                onViewDetails={row => { setHistoryRow(null); setDetailRow(row); }}
                onViewHistory={row => { setDetailRow(null); setHistoryRow(row); }}
                onToggleFound={toggleFound}
                onDuplicateRow={duplicateRow}
                onDeleteRow={deleteRow}
                hasActiveFilters={activeFilterCount > 0 || search.trim().length > 0}
                onClearFilters={() => { setColFilters({}); setSearch(""); setActive(null); setIsEditing(false); }}
              />

              <StatusBar
                shown={sorted.length}
                total={rows.length}
                filtersActive={activeFilterCount}
                isNarrowed={portfolio !== "All" || !!search || activeFilterCount > 0}
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
        onEdit={r => { setDetailRow(null); setAddOpen(false); setEditRow(r); }}
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

      <AddStudyModal
        open={addOpen || editRow !== null}
        mode={editRow ? "edit" : "create"}
        initial={editRow}
        view={view}
        // Same visible columns, order, and read-only ownership the grid renders — the card
        // mirrors the table rather than defining its own field set, for both Add and Edit.
        columns={baseCols}
        // Only build the UID lookup while the card is actually open — no per-render Set churn at rest.
        existingUids={addStudyUids}
        onClose={() => { setAddOpen(false); setEditRow(null); }}
        onSubmit={editRow ? saveStudy : addStudy}
      />
    </div>
  );
}
