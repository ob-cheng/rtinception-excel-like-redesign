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
