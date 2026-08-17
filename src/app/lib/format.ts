// Column labels are authored in caps in the schema, but rendered in title case so the
// header band stays quiet next to the data. Domain abbreviations must survive that pass.
const ABBREVIATIONS = new Set(["UID", "TA", "RTI", "ATP", "POS", "IIT", "AIT", "CSR", "ID"]);

export function formatHeaderLabel(label: string): string {
  return label
    .split(" ")
    .map(w => (ABBREVIATIONS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// Compare two cell strings for sorting. When both parse cleanly as numbers (e.g. rankings,
// TA priority, sample sizes) compare numerically so "2" sorts before "10"; otherwise fall
// back to locale-aware string comparison. Empty values always sink to the bottom regardless
// of direction, so unranked rows don't jump to the top of an ascending sort.
export function compareCells(a: string, b: string, dir: "asc" | "desc"): number {
  const aEmpty = a.trim() === "";
  const bEmpty = b.trim() === "";
  if (aEmpty || bEmpty) {
    if (aEmpty && bEmpty) return 0;
    return aEmpty ? 1 : -1; // empties last, both directions
  }
  const an = Number(a);
  const bn = Number(b);
  const bothNumeric = !Number.isNaN(an) && !Number.isNaN(bn);
  const cmp = bothNumeric ? an - bn : a.localeCompare(b);
  return dir === "asc" ? cmp : -cmp;
}
