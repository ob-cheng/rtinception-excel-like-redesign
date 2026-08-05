import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Idea } from "../types";

// --- Dirty-row save strategy ---
// Changes accumulate locally; API calls only fire on row-leave or 3s idle.
// This keeps the gateway quiet even during rapid Tab/Enter navigation.
//
// The sets live in refs so that commit handlers can read and mutate them without
// re-running on every keystroke; mirrored React state exists only for rendering
// the per-row indicators.
export function useDirtyRows(rows: Idea[]) {
  const [dirtySet, setDirtySet] = useState<Set<string>>(new Set());
  const [savingSet, setSavingSet] = useState<Set<string>>(new Set());

  const dirtyRows = useRef<Set<string>>(new Set());
  const savingRows = useRef<Set<string>>(new Set());
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // rowsRef keeps flush logic in sync with latest rows state without stale closures
  const rowsRef = useRef(rows);
  useEffect(() => { rowsRef.current = rows; }, [rows]);

  const syncDirtyState = useCallback(() => setDirtySet(new Set(dirtyRows.current)), []);
  const syncSavingState = useCallback(() => setSavingSet(new Set(savingRows.current)), []);

  const flushDirty = useCallback(async (uids?: string[]) => {
    // A flush is happening now — cancel any pending idle timer so it doesn't
    // fire a redundant empty flush a moment later.
    if (idleTimer.current) { clearTimeout(idleTimer.current); idleTimer.current = null; }
    const toSave = uids ?? Array.from(dirtyRows.current);
    for (const uid of toSave) {
      if (savingRows.current.has(uid)) continue;
      savingRows.current.add(uid);
      dirtyRows.current.delete(uid);
      syncDirtyState();
      syncSavingState();
      const row = rowsRef.current.find(r => r.uid === uid);
      if (!row) { savingRows.current.delete(uid); syncSavingState(); continue; }
      try {
        // Simulated API call — replace with real fetch/axios call
        await new Promise<void>((res, rej) =>
          setTimeout(() => (Math.random() > 0.15 ? res() : rej(new Error("Network error"))), 600)
        );
      } catch {
        dirtyRows.current.add(uid);
        toast.error(`Failed to save ${uid}`, { description: "Will retry on next change." });
        syncDirtyState();
      } finally {
        savingRows.current.delete(uid);
        syncSavingState();
      }
    }
  }, [syncDirtyState, syncSavingState]);

  const markDirty = useCallback((uid: string) => {
    dirtyRows.current.add(uid);
    syncDirtyState();
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => flushDirty(), 3000);
  }, [flushDirty, syncDirtyState]);

  // Flush on tab/window blur so no data is lost on tab switch or close
  useEffect(() => {
    function handleBlur() { if (dirtyRows.current.size > 0) flushDirty(); }
    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBlur);
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", handleBlur);
    };
  }, [flushDirty]);

  return { dirtySet, savingSet, dirtyRows, markDirty, flushDirty, rowsRef };
}
