import { Plus } from "lucide-react";
import { NAVY } from "../../lib/theme";

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
    <div className="flex items-center justify-between text-[12px] px-0.5 shrink-0" style={{ color: "#8e8e93" }}>
      <div className="flex items-center gap-4">
        <button
          onClick={onAddRow}
          className="flex items-center gap-1.5 font-semibold transition-all duration-100 hover:opacity-70 active:scale-95 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30"
          style={{ color: NAVY }}
        >
          <Plus size={12} strokeWidth={2.5} />
          Add row
        </button>
        <span className="text-gray-400/80">
          {shown} {shown === 1 ? "idea" : "ideas"}
          {isNarrowed && ` — filtered from ${total}`}
          {filtersActive > 0 && ` · ${filtersActive} ${filtersActive === 1 ? "filter" : "filters"} active`}
        </span>
      </div>
      <span className="text-gray-400 text-[11.5px]">Double-click or type to edit · Tab / Enter to move · Del to clear</span>
    </div>
  );
}
