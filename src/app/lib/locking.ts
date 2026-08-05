import type { Idea } from "../types";

// Row locking is currently disabled, but the UI paths for it (read-only cells, menu
// items, the lock toast) are all wired through here so turning it back on is one edit.
export const isLocked = (_row: Idea) => false;
export const LOCK_REASON = "";
