import type { Column, Idea, ViewKey } from "../types";

// CSV field escaping: wrap in quotes and double any embedded quotes (RFC 4180).
const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;

// Build a CSV string of the given rows in the given column order (header row + body).
export function buildCsv(rows: Idea[], cols: Column[]): string {
  const header = cols.map(c => esc(c.label)).join(",");
  const body = rows.map(row => cols.map(c => esc(row[c.key] ?? "")).join(",")).join("\n");
  return `${header}\n${body}`;
}

// Truthful export (§ Feedback): actually build and download a CSV of what's passed in — the
// filtered + sorted rows, in the current view's visible column order — rather than a toast that
// claims success without doing anything.
export function downloadCsv(rows: Idea[], cols: Column[], view: ViewKey): void {
  const csv = buildCsv(rows, cols);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ideas-${view.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
