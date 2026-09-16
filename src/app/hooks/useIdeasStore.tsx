import { useCallback, useEffect, useState } from "react";
import {
  Trash2, CircleMinus, FilePlus2, Save, Copy, ListOrdered, CircleDollarSign, Pencil,
} from "lucide-react";
import { toast } from "sonner";

import type { Column, Idea, RankingConfig } from "../types";
import { FUNDED_STATUS } from "../types";
import { columns as allColumns } from "../data/columns";
import { initialIdeas } from "../data/ideas";
import { useDirtyRows } from "./useDirtyRows";
import { TOAST_MS, ideasLabel, reversibleToast } from "../lib/toast";

// ── The record store: the single owner of `rows` and every record mutation. ──────────────
// This is the app's data/service layer, deliberately kept free of grid concerns (cursor,
// selection, modals): every mutation is addressed by uid/row rather than by cell index, and
// none of them touch view state. Callers (the grid layer / App) resolve index→row and perform
// any cursor/selection/modal cleanup at the call site. Each mutation surfaces the same one-tap
// Undo (§16 Forgiveness) via reversibleToast so they stay behaviourally identical.
export function useIdeasStore() {
  const [rows, setRows] = useState<Idea[]>(initialIdeas);
  const { dirtySet, savingSet, dirtyRows, markDirty, flushDirty, rowsRef } = useDirtyRows(rows);

  // First-paint loading gate. The records are available synchronously here, but the real
  // deployment fetches them from the backend and the grid sits empty for ~2–3s while that
  // resolves. We reproduce that wait with a fixed timer so the table shows its skeleton
  // (rather than snapping in instantly) and the loading experience matches production. Purely
  // a UI simulation — no data actually depends on it.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(t);
  }, []);

  // Inline commit onto an existing row. Any real value change is a data mutation, so — like every
  // other mutation — it surfaces a one-tap Undo that restores the prior cell value. A no-op commit
  // (value unchanged) stays silent to avoid noise. A UID rename is allowed as long as it's free.
  const commitCell = useCallback((target: Idea, col: Column, val: string) => {
    const key = col.key;
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
  }, [rowsRef, markDirty]);

  // Commit a record from the Add-study card. Same append path as the inline commit
  // (setRows → toast → markDirty), with the same UID-uniqueness guard as a safety net; the card
  // already blocks save on empty/duplicate UID, but rows can change while it's open. Returns true
  // when the record was added, so the caller can close the card only on success.
  const addStudy = useCallback((next: Idea): boolean => {
    const trimmedUid = next.uid.trim();
    if (!trimmedUid) return false;
    if (rowsRef.current.some(r => r.uid === trimmedUid)) {
      toast.error(`UID ${trimmedUid} already exists`, { description: "Choose a unique UID.", duration: TOAST_MS.error });
      return false;
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
    return true;
  }, [rowsRef, markDirty]);

  // Save edits from the record modal back onto the existing row. Mirrors commitCell's rename
  // support: a UID change is allowed as long as the new UID is free. Returns true on success.
  const saveStudy = useCallback((editRow: Idea, next: Idea): boolean => {
    const prevRecord = editRow; // full pre-edit snapshot, for Undo
    const prevUid = editRow.uid;
    const trimmedUid = next.uid.trim();
    if (!trimmedUid) return false;
    if (trimmedUid !== prevUid && rowsRef.current.some(r => r.uid === trimmedUid)) {
      toast.error(`UID ${trimmedUid} already exists`, { description: "Choose a unique UID.", duration: TOAST_MS.error });
      return false;
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
    return true;
  }, [rowsRef, markDirty]);

  const duplicateRow = useCallback((row: Idea) => {
    let newUid = `${row.uid}-copy`;
    let n = 2;
    while (rowsRef.current.some(r => r.uid === newUid)) newUid = `${row.uid}-copy${n++}`;
    setRows(prev => [...prev, { ...row, uid: newUid }]);
    // Forgiveness (§16): every mutation offers a one-tap reversal, matching deleteRow.
    reversibleToast(`Duplicated ${row.uid}`, {
      success: true,
      icon: <Copy size={16} strokeWidth={2} />,
      description: `Created ${newUid}.`,
      undo: () => setRows(prev => prev.filter(r => r.uid !== newUid)),
    });
  }, [rowsRef]);

  const deleteRow = useCallback((row: Idea) => {
    // Capture the row's position so Undo can splice it back exactly where it was, not at the end.
    const restoreIndex = rowsRef.current.findIndex(r => r.uid === row.uid);
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
  }, [rowsRef]);

  // Persist a new ordering: position becomes the 1..N number written to the persona's field.
  const commitRanking = useCallback((config: RankingConfig, orderedUids: string[]) => {
    const field = config.persona === "brand" ? "brandRanking" : "areaPrioritization";
    const rankByUid = new Map(orderedUids.map((uid, i) => [uid, String(i + 1)]));
    // Snapshot the prior values so a renumber this large is reversible (§16) — overwriting
    // dozens of ranks with no way back is exactly the kind of irreversible act to guard.
    const prevByUid = new Map(
      rowsRef.current.filter(r => rankByUid.has(r.uid)).map(r => [r.uid, r[field]]),
    );
    setRows(prev => prev.map(r => (rankByUid.has(r.uid) ? { ...r, [field]: rankByUid.get(r.uid)! } : r)));
    orderedUids.forEach(markDirty);
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
  }, [rowsRef, markDirty]);

  // Flag / unflag a record as funded by writing its status — it hops between the Funded tab
  // and the working views. Un-funding returns it to "Proposed" so it re-enters the pipeline.
  const toggleFound = useCallback((row: Idea) => {
    const nowFunded = row.status !== FUNDED_STATUS;
    const prevStatus = row.status;
    setRows(prev => prev.map(r => (r.uid === row.uid ? { ...r, status: nowFunded ? FUNDED_STATUS : "Proposed" } : r)));
    // A status flip moves the row between tabs — reversible in one tap (§16).
    reversibleToast(nowFunded ? `Marked ${row.uid} as funded` : `Removed ${row.uid} from funded`, {
      description: nowFunded
        ? "Moved to the Funded tab."
        : "Returned to Franchise / Evidence Function.",
      icon: nowFunded ? <CircleDollarSign size={16} strokeWidth={2} /> : <CircleMinus size={16} strokeWidth={2} />,
      undo: () => setRows(prev => prev.map(r => (r.uid === row.uid ? { ...r, status: prevStatus } : r))),
    });
  }, []);

  // Flag every given record as funded (or, when `unfund`, return them to the pipeline) in one write.
  // Snapshots each prior status so the whole batch reverts in one tap (§16), mirroring toggleFound.
  const bulkFund = useCallback((uids: string[], unfund: boolean) => {
    if (uids.length === 0) return;
    const sel = new Set(uids);
    const prevByUid = new Map(rowsRef.current.filter(r => sel.has(r.uid)).map(r => [r.uid, r.status]));
    setRows(prev => prev.map(r => (sel.has(r.uid) ? { ...r, status: unfund ? "Proposed" : FUNDED_STATUS } : r)));
    uids.forEach(markDirty);
    reversibleToast(
      unfund ? `Removed ${ideasLabel(uids.length)} from funded` : `Marked ${ideasLabel(uids.length)} as funded`,
      {
        success: !unfund,
        icon: unfund ? <CircleMinus size={16} strokeWidth={2} /> : <CircleDollarSign size={16} strokeWidth={2} />,
        description: unfund ? "Returned to Franchise / Evidence Function." : "Moved to the Funded tab.",
        undo: () => setRows(prev => prev.map(r => (prevByUid.has(r.uid) ? { ...r, status: prevByUid.get(r.uid)! } : r))),
      },
    );
  }, [rowsRef, markDirty]);

  // Duplicate every given record in one write. Each copy gets a free `-copy` UID, mirroring
  // duplicateRow. The whole batch reverts in one tap (§16) by removing the freshly-created copies.
  const bulkDuplicate = useCallback((uids: string[]) => {
    if (uids.length === 0) return;
    const sel = new Set(uids);
    const source = rowsRef.current.filter(r => sel.has(r.uid));
    if (source.length === 0) return;
    // Track UIDs as we mint them so copies within the same batch stay unique against each other too.
    const taken = new Set(rowsRef.current.map(r => r.uid));
    const copies = source.map(row => {
      let newUid = `${row.uid}-copy`;
      let n = 2;
      while (taken.has(newUid)) newUid = `${row.uid}-copy${n++}`;
      taken.add(newUid);
      return { ...row, uid: newUid };
    });
    const newUids = new Set(copies.map(c => c.uid));
    setRows(prev => [...prev, ...copies]);
    copies.forEach(c => markDirty(c.uid));
    reversibleToast(`Duplicated ${ideasLabel(uids.length)}`, {
      success: true,
      icon: <Copy size={16} strokeWidth={2} />,
      description: `Created ${ideasLabel(copies.length)}.`,
      undo: () => setRows(prev => prev.filter(r => !newUids.has(r.uid))),
    });
  }, [rowsRef, markDirty]);

  // Delete every given record in one write. Snapshots each removed row with its original index so
  // Undo restores the whole batch to its exact prior positions (§16), mirroring deleteRow.
  const bulkDelete = useCallback((uids: string[]) => {
    if (uids.length === 0) return;
    const sel = new Set(uids);
    // Capture {row, index} for each removed record, in ascending index order, for exact restore.
    const removed = rowsRef.current
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => sel.has(row.uid));
    if (removed.length === 0) return;
    setRows(prev => prev.filter(r => !sel.has(r.uid)));
    reversibleToast(`Deleted ${ideasLabel(removed.length)}`, {
      description: `${removed.length === 1 ? "Row" : "Rows"} removed from the list.`,
      icon: <Trash2 size={16} strokeWidth={2} />,
      undo: () =>
        setRows(prev => {
          const next = [...prev];
          // Re-insert in ascending index order so earlier splices don't shift later targets.
          for (const { row, index } of removed) {
            if (next.some(r => r.uid === row.uid)) continue; // already restored / re-created
            next.splice(Math.min(index, next.length), 0, row);
          }
          return next;
        }),
    });
  }, [rowsRef]);

  // Set one dropdown field to one value across every given record. Snapshots each row's prior
  // value so a mixed-selection batch reverts correctly in one tap (§16), like commitRanking.
  const bulkSetField = useCallback((uids: string[], key: keyof Idea, val: string) => {
    if (uids.length === 0) return;
    const sel = new Set(uids);
    const col = allColumns.find(c => c.key === key);
    const label = col?.label ?? key;
    const prevByUid = new Map(rowsRef.current.filter(r => sel.has(r.uid)).map(r => [r.uid, r[key] ?? ""]));
    setRows(prev => prev.map(r => (sel.has(r.uid) ? { ...r, [key]: val } : r)));
    uids.forEach(markDirty);
    reversibleToast(`Set ${label} for ${ideasLabel(uids.length)}`, {
      success: true,
      icon: <Pencil size={16} strokeWidth={2} />,
      description: `${label} set to “${val}”.`,
      undo: () => setRows(prev => prev.map(r => (prevByUid.has(r.uid) ? { ...r, [key]: prevByUid.get(r.uid)! } : r))),
    });
  }, [rowsRef, markDirty]);

  return {
    rows,
    loading,
    dirtySet, savingSet, dirtyRows, markDirty, flushDirty, rowsRef,
    commitCell, addStudy, saveStudy, duplicateRow, deleteRow, commitRanking, toggleFound, bulkFund, bulkSetField, bulkDuplicate, bulkDelete,
  };
}
