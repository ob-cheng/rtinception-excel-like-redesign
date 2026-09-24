import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { SortDir } from "../../types";

// Sort-direction affordance for column headers. Uses lucide glyphs (like the rest of the app):
// a solid up/down arrow for the active direction, and a dimmed up/down arrow pair for the
// unsorted resting state.
export function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === "asc") {
    return <ArrowUp size={13} strokeWidth={2} aria-label="Sorted ascending" />;
  }
  if (dir === "desc") {
    return <ArrowDown size={13} strokeWidth={2} aria-label="Sorted descending" />;
  }
  return <ArrowUpDown size={13} strokeWidth={2} aria-label="Sort" style={{ opacity: 0.35 }} />;
}
