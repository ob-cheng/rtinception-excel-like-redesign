import { useMemo, useState } from "react";
import { CircleCheck, CircleAlert, Info, FileDown } from "lucide-react";
import { Toaster, toast } from "sonner";

import type { Idea, ViewKey } from "./types";
import { downloadCsv } from "./lib/csv";
import { TOAST_MS } from "./lib/toast";
import { useIdeasStore } from "./hooks/useIdeasStore";
import { useIdeasGrid } from "./hooks/useIdeasGrid";
import { usePreferences } from "./hooks/usePreferences";
import { useColumnPrefs } from "./hooks/useColumnPrefs";
import { IdeasTableProvider, type IdeasTableContextValue } from "./context/IdeasTableContext";

import { AppSidebar, type Page } from "./components/ideas/AppSidebar";
import { GlobalStyles } from "./components/ideas/GlobalStyles";
import { HelpPage } from "./components/ideas/HelpPage";
import { IdeaDetailPanel } from "./components/ideas/IdeaDetailPanel";
import { IdeaHistoryPanel } from "./components/ideas/IdeaHistoryPanel";
import { AddStudyButton } from "./components/ideas/AddStudyButton";
import { AddStudyModal } from "./components/ideas/AddStudyModal";
import { IdeasTable } from "./components/ideas/IdeasTable";
import { BulkActionBar } from "./components/ideas/BulkActionBar";
import { ColumnSettingsPopover } from "./components/ideas/ColumnSettingsPopover";
import { PageHeader } from "./components/ideas/PageHeader";
import { PortfolioPanel } from "./components/ideas/PortfolioPanel";
import { PrioritizeModal } from "./components/ideas/PrioritizeModal";
import { StatusBar } from "./components/ideas/StatusBar";
import { ViewTabs } from "./components/ideas/ViewTabs";

// App is a thin composition root: it wires together the three domains — record data
// (useIdeasStore), grid interaction (useIdeasGrid), and user preferences (usePreferences /
// useColumnPrefs) — owns only top-level page routing and overlay (modal/panel) state, and lays
// out the chrome. All record mutations live in the store; all cursor/selection/filter/sort logic
// lives in the grid hook; the table subtree reads its data through IdeasTableContext.
export default function App() {
  // Which top-level page the sidebar is showing. Ideas is the working surface and
  // the default; Home is intentionally a blank canvas for now; Help is the FAQ.
  const [page, setPage] = useState<Page>("ideas");

  const { theme, applyTheme, zoom, zoomIn, zoomOut, resetZoom, canZoomIn, canZoomOut } = usePreferences();
  // Per-view column customization (order + freeze + visibility), persisted like theme/zoom.
  const { prefs, setViewOrder, togglePin, toggleHidden, resetView, visibleKeys, frozenKeysFor } = useColumnPrefs();

  // Data/service layer — the single owner of rows and every record mutation.
  const store = useIdeasStore();
  // Grid interaction layer — cursor, selection, filters, sort, keyboard nav, and derivations.
  const grid = useIdeasGrid({
    rows: store.rows,
    commitCell: store.commitCell,
    dirtyRows: store.dirtyRows,
    flushDirty: store.flushDirty,
    visibleKeys,
    frozenKeysFor,
  });

  // ── Overlay (modal / panel) state — genuinely App-level, since these float above every page. ──
  const [prioritizeOpen, setPrioritizeOpen] = useState(false);
  // Add-study card: the conventional "create record" form. New ideas are created only here — the
  // grid itself is edit-only (no inline draft row / inline add).
  const [addOpen, setAddOpen] = useState(false);
  // The record being edited in the (shared) record modal, or null. The same modal serves Add
  // (addOpen) and Edit (editRow); they're never both set.
  const [editRow, setEditRow] = useState<Idea | null>(null);
  const [detailRow, setDetailRow] = useState<Idea | null>(null);
  const [historyRow, setHistoryRow] = useState<Idea | null>(null);

  // The add/edit card's UID-uniqueness lookup, built only while the card is open.
  const addStudyOpen = addOpen || editRow !== null;
  const addStudyUids = useMemo(
    () => (addStudyOpen ? new Set(store.rows.map(r => r.uid)) : new Set<string>()),
    [addStudyOpen, store.rows],
  );

  // Truthful CSV export of what's on screen — the filtered + sorted rows, in the current view's
  // visible column order. The count in the toast is the real row count written.
  function exportCsv() {
    if (grid.sorted.length === 0) {
      toast("Nothing to export", { description: "No rows match the current filters.", icon: <Info size={16} strokeWidth={2} />, duration: TOAST_MS.notice });
      return;
    }
    downloadCsv(grid.sorted, grid.cols, grid.view);
    toast.success("Export complete", { icon: <FileDown size={16} strokeWidth={2} />, description: `${grid.sorted.length} ideas saved as CSV.`, duration: TOAST_MS.notice });
  }

  // Bulk actions over the current selection. Defined once and shared by BOTH bulk surfaces — the
  // floating BulkActionBar and the right-click menu (via the table context) — so they can't drift.
  // Each does the store write, then the grid's selection/cursor cleanup.
  const bulkFund = () => {
    store.bulkFund(Array.from(grid.selected), grid.view === "Funded");
    grid.clearSelection();
    grid.resetCursor();
  };
  const bulkSetField = (key: keyof Idea, val: string) => {
    store.bulkSetField(Array.from(grid.selected), key, val);
    grid.clearSelection();
    grid.resetCursor();
  };
  const bulkDuplicate = () => {
    store.bulkDuplicate(Array.from(grid.selected));
    grid.clearSelection();
    grid.resetCursor();
  };
  const bulkDelete = () => {
    store.bulkDelete(Array.from(grid.selected));
    grid.clearSelection();
    grid.resetCursor();
  };

  // Assemble the table subtree's context once. This replaces the ~40 props that used to be drilled
  // into IdeasTable: grid state + store mutations + the overlay openers, wired together here.
  const tableCtx: IdeasTableContextValue = {
    gridRef: grid.gridRef,
    view: grid.view,
    dir: grid.dir,
    cols: grid.cols,
    frozenKeys: grid.frozenCols,
    rows: grid.sorted,
    loading: store.loading,
    active: grid.active,
    isEditing: grid.isEditing,
    seed: grid.seed,
    dirtySet: store.dirtySet,
    savingSet: store.savingSet,
    selected: grid.selected,
    allSelected: grid.allSelected,
    someSelected: grid.someSelected,
    onToggleRowSelected: grid.toggleRowSelected,
    onToggleSelectAll: grid.toggleSelectAll,
    sortCol: grid.sortCol,
    sortDir: grid.sortDir,
    colFilters: grid.colFilters,
    openFilter: grid.openFilter,
    distinctValues: grid.distinctValues,
    swapProps: grid.swapProps,
    onKeyDown: grid.onGridKeyDown,
    onSort: grid.handleSort,
    onToggleFilterMenu: grid.onToggleFilterMenu,
    onToggleFilterValue: grid.toggleFilterValue,
    onClearFilter: grid.onClearFilter,
    onSelectCell: grid.onSelectCell,
    onStartEditCell: grid.onStartEditCell,
    onCommitCell: grid.handleCommit,
    onCancelEdit: grid.onCancelEdit,
    onReadOnlyCell: grid.onReadOnlyCell,
    onEditRow: row => { setAddOpen(false); setEditRow(row); },
    onViewDetails: row => { setHistoryRow(null); setDetailRow(row); },
    onViewHistory: row => { setDetailRow(null); setHistoryRow(row); },
    // Record mutations that also touch the cursor/selection are composed here: store write first,
    // then the grid's "keep it honest" cleanup — logic stays in the store, cleanup in the grid.
    onToggleFound: row => { store.toggleFound(row); grid.resetCursor(); },
    onDuplicateRow: store.duplicateRow,
    onDeleteRow: store.deleteRow,
    editableDropdownCols: grid.editableDropdownCols,
    onBulkFund: bulkFund,
    onBulkSetField: bulkSetField,
    onBulkDuplicate: bulkDuplicate,
    onBulkDelete: bulkDelete,
    hasActiveFilters: grid.activeFilterCount > 0 || grid.search.trim().length > 0,
    onClearFilters: () => { grid.setColFilters({}); grid.setSearch(""); grid.resetCursor(); },
  };

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
          rows={store.rows}
          active={grid.portfolio}
          open={grid.panelOpen}
          onSelect={p => { grid.setPortfolio(p); grid.resetCursor(); grid.clearSelection(); }}
          onToggle={() => grid.setPanelOpen(o => !o)}
        />
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {page === "ideas" && (
          <main className="flex-1 overflow-hidden flex flex-col px-8 pt-7 pb-4 gap-4">

            <PageHeader
              portfolio={grid.portfolio}
              search={grid.search}
              onSearchChange={grid.setSearch}
              onRank={() => setPrioritizeOpen(true)}
              onExport={exportCsv}
              columnsControl={
                <ColumnSettingsPopover
                  view={grid.view}
                  order={prefs[grid.view].order}
                  frozen={prefs[grid.view].frozen}
                  hidden={prefs[grid.view].hidden}
                  // Reordering, pinning, and hiding all change what each column index points at
                  // (hiding removes a column from the rendered set), so clear the index-based
                  // cursor to keep it from landing on the wrong column.
                  onReorder={o => { setViewOrder(grid.view, o); grid.resetCursor(); }}
                  onTogglePin={k => { togglePin(grid.view, k); grid.resetCursor(); }}
                  onToggleHidden={k => {
                    toggleHidden(grid.view, k);
                    grid.resetCursor();
                    // A sort on a column that's being hidden would leave an invisible sort — clear it.
                    if (grid.sortCol === k) grid.clearSort();
                  }}
                  onReset={() => { resetView(grid.view); grid.resetCursor(); }}
                />
              }
            />

            <div className="relative flex-1 overflow-hidden flex flex-col gap-4">
              {/* Create-record affordance, pinned to the table's top-right (below the header's
                  Export). Hidden on the read-only Funded records view. */}
              {grid.view !== "Funded" && (
                <div className="absolute top-0 right-0 z-20">
                  <AddStudyButton onClick={() => setAddOpen(true)} />
                </div>
              )}
              <ViewTabs
                pendingView={grid.pendingView}
                tabRefs={grid.tabRefs}
                indicator={grid.tabIndicator}
                onSelect={(v: ViewKey) => grid.switchView(v)}
              />

              <IdeasTableProvider value={tableCtx}>
                <IdeasTable />
              </IdeasTableProvider>

              <StatusBar
                shown={grid.sorted.length}
                total={store.rows.length}
                filtersActive={grid.activeFilterCount}
                isNarrowed={grid.portfolio !== "All" || !!grid.search || grid.activeFilterCount > 0}
              />

              {/* Floating bulk-action bar — appears only while rows are selected, over the grid. */}
              <BulkActionBar
                count={grid.selected.size}
                view={grid.view}
                editableDropdownCols={grid.editableDropdownCols}
                onClear={grid.clearSelection}
                onBulkFund={bulkFund}
                onBulkSetField={bulkSetField}
                onBulkDuplicate={bulkDuplicate}
                onBulkDelete={bulkDelete}
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
        rows={store.rows}
        currentPortfolio={grid.portfolio}
        onClose={() => setPrioritizeOpen(false)}
        onCommit={(config, orderedUids) => { store.commitRanking(config, orderedUids); setPrioritizeOpen(false); }}
      />

      <AddStudyModal
        open={addOpen || editRow !== null}
        mode={editRow ? "edit" : "create"}
        initial={editRow}
        view={grid.view}
        // Same visible columns, order, and read-only ownership the grid renders — the card
        // mirrors the table rather than defining its own field set, for both Add and Edit.
        columns={grid.baseCols}
        // Only build the UID lookup while the card is actually open — no per-render Set churn at rest.
        existingUids={addStudyUids}
        onClose={() => { setAddOpen(false); setEditRow(null); }}
        onSubmit={editRow
          ? next => { if (store.saveStudy(editRow, next)) setEditRow(null); }
          : next => { if (store.addStudy(next)) setAddOpen(false); }}
      />
    </div>
  );
}
