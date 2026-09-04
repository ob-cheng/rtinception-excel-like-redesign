import { useCallback, useEffect, useState } from "react";
import type { Idea, ViewKey } from "../types";
import { VIEWS, VIEW_KEYS, defaultColumnOrder, frozenKeys, defaultHiddenKeys } from "../data/columns";

// Per-view column customization, persisted across sessions exactly like theme/zoom
// (see usePreferences.ts): one `alcon.`-namespaced key, a lazy validated initializer,
// and a single effect that writes on change. Column prefs re-derive against the live
// schema so a stored order can never resurrect a removed column or miss a newly added one.
//
// v3: freezing is tracked by COLUMN IDENTITY (a set of keys), fully independent of position and
// of order. A frozen column stays frozen wherever it's moved, and freezing/unfreezing never
// reorders anything — so the user can freely interleave frozen and unfrozen columns (e.g. drop
// an unfrozen column between two frozen ones). The sticky geometry in IdeasTable stacks the
// frozen columns at the left edge by cumulative frozen width, so they need not be contiguous;
// unfrozen columns simply scroll underneath. Portfolio is NOT part of the view schema — it's
// injected by App only in the "All portfolios" view — so it never appears here.
// v6: added per-view column visibility (a `hidden` set) alongside order + frozen.
const COLUMNS_KEY = "alcon.columns.v10";

// A view's saved order (UID excluded — it's the always-first fixed spine) plus the set of frozen
// column keys and the set of hidden column keys. `frozen`/`hidden` are stored in display order
// purely for stable serialization; all three are otherwise independent — order is what you drag,
// frozen is what you pin, hidden is what you've toggled off.
// `fp` is a fingerprint of the view's schema (its canonical column composition) at the time the
// order was saved. When the schema changes — a column added, removed, or repositioned in the
// source — the fingerprint no longer matches and the saved *order* is rebuilt from the schema's
// canonical positions (frozen/hidden choices are preserved). This is what guarantees a newly added
// column lands where the schema puts it instead of wherever a stale saved order left it.
export type ViewColumnPref = { order: (keyof Idea)[]; frozen: (keyof Idea)[]; hidden: (keyof Idea)[]; fp: string };
export type ColumnPrefs = Record<ViewKey, ViewColumnPref>;

// The schema fingerprint: the canonical order of a view's columns. Any add/remove/reposition in
// columns.ts changes this string, which is exactly when a saved order should be considered stale.
const schemaFP = (view: ViewKey): string => defaultColumnOrder(view).join(",");

// Pair a new order with frozen + hidden sets, keeping both stored in display order and pruned to
// keys that still exist in `order`. No reordering happens here. One rule couples the two sets: a
// hidden column can't be frozen (freezing an off-screen column is meaningless), so hidden wins.
function reconcile(view: ViewKey, order: (keyof Idea)[], frozen: Set<keyof Idea>, hidden: Set<keyof Idea>): ViewColumnPref {
  return {
    order,
    frozen: order.filter(k => frozen.has(k) && !hidden.has(k)),
    hidden: order.filter(k => hidden.has(k)),
    fp: schemaFP(view),
  };
}

function defaultPref(view: ViewKey): ViewColumnPref {
  return reconcile(view, defaultColumnOrder(view), new Set(frozenKeys(view)), new Set(defaultHiddenKeys(view)));
}

function defaultPrefs(): ColumnPrefs {
  return Object.fromEntries(VIEWS.map(v => [v, defaultPref(v)])) as ColumnPrefs;
}

// Reconcile one view's stored value against the current schema: keep the saved order but drop
// keys that no longer exist, append any schema keys the save is missing (in their default
// position), keep only frozen keys that still exist, then re-enforce contiguity. Unusable → defaults.
function sanitizeView(view: ViewKey, raw: unknown): ViewColumnPref {
  const valid = new Set(VIEW_KEYS[view].filter(k => k !== "uid"));
  const seen = new Set<keyof Idea>();
  let order: (keyof Idea)[] = [];

  // If the schema composition changed since this order was saved (fingerprint mismatch, or a save
  // predating fingerprints), the saved order is stale — a column may have been added, removed, or
  // repositioned in columns.ts. Rebuild the order from the schema's canonical positions so new
  // columns land where they belong. Freeze/hide sets below are still honored (they're key-based).
  const savedFP = (raw as { fp?: unknown } | null)?.fp;
  const rawOrder = (raw as { order?: unknown } | null)?.order;
  if (savedFP === schemaFP(view) && Array.isArray(rawOrder)) {
    for (const k of rawOrder) {
      if (valid.has(k as keyof Idea) && !seen.has(k as keyof Idea)) {
        order.push(k as keyof Idea);
        seen.add(k as keyof Idea);
      }
    }
    // Safety net: append any valid key the save somehow missed (shouldn't happen when fp matches).
    for (const k of defaultColumnOrder(view)) {
      if (!seen.has(k)) { order.push(k); seen.add(k); }
    }
  } else {
    // Stale or unfingerprinted save → canonical schema order.
    order = defaultColumnOrder(view);
    for (const k of order) seen.add(k);
  }

  const rawFrozen = (raw as { frozen?: unknown } | null)?.frozen;
  const frozen = new Set<keyof Idea>();
  if (Array.isArray(rawFrozen)) {
    for (const k of rawFrozen) {
      if (valid.has(k as keyof Idea)) frozen.add(k as keyof Idea);
    }
  } else {
    // No usable frozen set stored → fall back to the view's built-in frozen columns.
    for (const k of frozenKeys(view)) frozen.add(k);
  }

  // Hidden defaults to empty (all columns visible) when missing or unusable.
  const rawHidden = (raw as { hidden?: unknown } | null)?.hidden;
  const hidden = new Set<keyof Idea>();
  if (Array.isArray(rawHidden)) {
    for (const k of rawHidden) {
      if (valid.has(k as keyof Idea)) hidden.add(k as keyof Idea);
    }
  }

  return reconcile(view, order, frozen, hidden);
}

function initialColumnPrefs(): ColumnPrefs {
  if (typeof window === "undefined") return defaultPrefs();
  try {
    const saved = window.localStorage.getItem(COLUMNS_KEY);
    if (!saved) return defaultPrefs();
    const parsed = JSON.parse(saved) as Record<string, unknown>;
    return Object.fromEntries(
      VIEWS.map(v => [v, sanitizeView(v, parsed?.[v])]),
    ) as ColumnPrefs;
  } catch {
    return defaultPrefs();
  }
}

export function useColumnPrefs() {
  const [prefs, setPrefs] = useState<ColumnPrefs>(initialColumnPrefs);

  // Debounce persistence: a drag-reorder or rapid pin/hide toggling fires many prefs updates in
  // quick succession. Coalesce them into one JSON.stringify + synchronous write after activity
  // settles, instead of stringifying the full prefs object on every intermediate change.
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        window.localStorage.setItem(COLUMNS_KEY, JSON.stringify(prefs));
      } catch {
        // Storage full or unavailable (private mode) — the in-memory prefs still work.
      }
    }, 250);
    return () => clearTimeout(id);
  }, [prefs]);

  const setViewOrder = useCallback((view: ViewKey, order: (keyof Idea)[]) => {
    setPrefs(p => ({ ...p, [view]: reconcile(view, order, new Set(p[view].frozen), new Set(p[view].hidden)) }));
  }, []);

  // Toggle the freeze pin on a column by key, so the frozen state travels with the column
  // through reorders. Purely a set membership flip — it never moves a column, so frozen and
  // unfrozen columns can be interleaved in any order.
  const togglePin = useCallback((view: ViewKey, key: keyof Idea) => {
    setPrefs(p => {
      const cur = p[view];
      if (!cur.order.includes(key)) return p;
      const frozen = new Set(cur.frozen);
      if (frozen.has(key)) frozen.delete(key); else frozen.add(key);
      return { ...p, [view]: reconcile(view, cur.order, frozen, new Set(cur.hidden)) };
    });
  }, []);

  // Toggle a column's visibility by key. Hiding a frozen column also unpins it (reconcile's
  // "hidden wins" rule), so bringing it back returns it unfrozen — a clean, predictable state.
  const toggleHidden = useCallback((view: ViewKey, key: keyof Idea) => {
    setPrefs(p => {
      const cur = p[view];
      if (!cur.order.includes(key)) return p;
      const hidden = new Set(cur.hidden);
      if (hidden.has(key)) hidden.delete(key); else hidden.add(key);
      return { ...p, [view]: reconcile(view, cur.order, new Set(cur.frozen), hidden) };
    });
  }, []);

  const resetView = useCallback((view: ViewKey) => {
    setPrefs(p => ({ ...p, [view]: defaultPref(view) }));
  }, []);

  // Resolved selectors used by the render pipeline. `visibleKeys` prepends the UID spine (always
  // shown) and drops hidden columns — it's exactly what the grid renders. `frozenKeysFor` is the
  // set of pinned columns, in display order (not necessarily adjacent); hidden columns are never
  // in it, so it stays consistent with what's on screen.
  const visibleKeys = useCallback(
    (view: ViewKey): (keyof Idea)[] => {
      const { order, hidden } = prefs[view];
      const h = new Set(hidden);
      return ["uid", ...order.filter(k => !h.has(k))];
    },
    [prefs],
  );
  const frozenKeysFor = useCallback(
    (view: ViewKey): (keyof Idea)[] => prefs[view].frozen,
    [prefs],
  );

  return { prefs, setViewOrder, togglePin, toggleHidden, resetView, visibleKeys, frozenKeysFor };
}
