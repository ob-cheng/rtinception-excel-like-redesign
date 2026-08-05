import type { HistoryEvent, Idea } from "../types";

// Deterministic pseudo-history derived from the UID, so a row always shows the same
// timeline across reloads without needing a backend.
const ACTORS = ["Dr. Sarah M.", "James L.", "Priya N.", "Tom R.", "Lisa C.", "Marcus W."];
const COMMITTEES = ["Clinical Review", "Scientific Committee", "Portfolio Board", "Budget Panel"];

export function generateHistory(row: Idea): HistoryEvent[] {
  const seed = row.uid.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const pick = <T,>(arr: T[], offset = 0) => arr[(seed + offset) % arr.length];

  const baseYear = 2024;
  const baseMonth = ((seed % 10) + 1);

  const fmt = (offset: number) => {
    const month = String(Math.min(baseMonth + offset, 12)).padStart(2, "0");
    const day = String(((seed * (offset + 1)) % 25) + 1).padStart(2, "0");
    const hour = String(((seed + offset * 3) % 10) + 8).padStart(2, "0");
    const min = String((seed * (offset + 2)) % 60).padStart(2, "0");
    return { date: `${baseYear}-${month}-${day}`, time: `${hour}:${min}` };
  };

  const events: HistoryEvent[] = [
    {
      id: `${row.uid}-create`,
      ...fmt(0),
      action: "Idea created",
      actor: pick(ACTORS, 0),
      note: `Initial draft submitted for ${row.project}. Research pathway: ${row.pathway}.`,
    },
    {
      id: `${row.uid}-edit1`,
      ...fmt(1),
      action: "Potential claims updated",
      actor: pick(ACTORS, 1),
      note: `"${row.potentialClaims.slice(0, 60)}${row.potentialClaims.length > 60 ? "…" : ""}"`,
    },
    {
      id: `${row.uid}-edit2`,
      ...fmt(2),
      action: "Research questions revised",
      actor: pick(ACTORS, 2),
      committee: pick(COMMITTEES, 0),
    },
    {
      id: `${row.uid}-edit3`,
      ...fmt(3),
      action: "Study design confirmed",
      actor: pick(ACTORS, 3),
      note: `Design set to ${row.studyDesign || "TBD"}.`,
    },
  ];

  return events.reverse();
}
