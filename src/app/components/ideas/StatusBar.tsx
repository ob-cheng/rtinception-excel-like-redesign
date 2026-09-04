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
      <span className="text-gray-400/80 dark:text-gray-400">
        {shown} {shown === 1 ? "idea" : "ideas"}
        {isNarrowed && ` — filtered from ${total}`}
        {filtersActive > 0 && ` · ${filtersActive} ${filtersActive === 1 ? "filter" : "filters"} active`}
      </span>
      <span className="text-gray-400 dark:text-gray-400 text-[11.5px]">Double-click or type to edit existing · Tab / Enter to move · Del to clear</span>
    </div>
  );
}
