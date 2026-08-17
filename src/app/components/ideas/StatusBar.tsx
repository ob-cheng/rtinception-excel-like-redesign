import { Plus } from "lucide-react";

export function StatusBar({
  shown,
  total,
  filtersActive,
  isNarrowed,
  onAddRow,
}: {
  shown: number;
  total: number;
  filtersActive: number;
  isNarrowed: boolean;
  onAddRow: () => void;
}) {
  return (
    <div className="flex items-center justify-between text-[12px] px-0.5 shrink-0" style={{ color: "var(--text-3)" }}>
      <div className="flex items-center gap-4">
        <button
          onClick={onAddRow}
          className="flex items-center gap-1.5 font-semibold transition-all duration-100 hover:opacity-70 active:scale-95 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)]"
          style={{ color: "var(--accent)" }}
        >
          <Plus size={12} strokeWidth={2.5} />
          Add row
        </button>
        <span className="text-gray-400/80 dark:text-gray-400">
          {shown} {shown === 1 ? "idea" : "ideas"}
          {isNarrowed && ` — filtered from ${total}`}
          {filtersActive > 0 && ` · ${filtersActive} ${filtersActive === 1 ? "filter" : "filters"} active`}
        </span>
      </div>
      <span className="text-gray-400 dark:text-gray-400 text-[11.5px]">Double-click or type to edit · Tab / Enter to move · Del to clear</span>
    </div>
  );
}
