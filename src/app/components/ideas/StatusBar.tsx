export function StatusBar({
  shown,
  total,
  filtersActive,
  isNarrowed,
}: {
  shown: number;
  total: number;
  filtersActive: number;
  isNarrowed: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-[12px] px-0.5 shrink-0" style={{ color: "var(--text-3)" }}>
      <span className="tabular-nums text-[color:var(--text-3)]">
        {shown} {shown === 1 ? "idea" : "ideas"}
        {isNarrowed && ` — filtered from ${total}`}
        {filtersActive > 0 && ` · ${filtersActive} ${filtersActive === 1 ? "filter" : "filters"} active`}
      </span>
      <span className="text-[color:var(--text-3)] text-[12px]">Double-click or start typing to edit a cell · Tab or Enter to move · Delete to clear</span>
    </div>
  );
}
