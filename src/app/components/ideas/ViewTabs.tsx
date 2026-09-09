import type { ViewKey } from "../../types";
import { VIEWS } from "../../data/columns";

export function ViewTabs({
  pendingView,
  tabRefs,
  indicator,
  onSelect,
}: {
  // pendingView, not the committed view — the tab strip leads the table by one animation.
  pendingView: ViewKey;
  tabRefs: { current: (HTMLButtonElement | null)[] };
  indicator: { left: number; width: number };
  onSelect: (v: ViewKey) => void;
}) {
  // APG tabs pattern with automatic activation: arrow keys move focus AND switch view (these tabs
  // swap the grid the way tabs swap panels). Home/End jump to the ends. Focus follows selection so
  // roving tabindex stays correct.
  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    let next = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % VIEWS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + VIEWS.length) % VIEWS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = VIEWS.length - 1;
    else return;
    e.preventDefault();
    onSelect(VIEWS[next]);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="shrink-0">
      <div
        role="tablist"
        aria-label="Idea views"
        className="relative inline-flex items-center gap-0"
        style={{ borderBottom: "1px solid var(--hairline)" }}
      >
        {VIEWS.map((v, i) => {
          const selected = pendingView === v;
          return (
            <button
              key={v}
              ref={el => { tabRefs.current[i] = el; }}
              role="tab"
              aria-selected={selected}
              // Roving tabindex: only the active tab is in the tab order; arrows move within the set.
              tabIndex={selected ? 0 : -1}
              // onClick fires for both pointer and keyboard (Enter/Space), so the tab is operable
              // without a mouse; the ~1-frame pointer-lead is not worth the lost keyboard support.
              onClick={() => onSelect(v)}
              onKeyDown={e => onKeyDown(e, i)}
              className={`flex items-center gap-1.5 px-4 py-[9px] text-[13.5px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)] ${
                selected ? "font-semibold text-[color:var(--text-1)]" : "font-medium text-[color:var(--text-3)] hover:text-[color:var(--text-2)]"
              }`}
            >
              {v}
            </button>
          );
        })}
        <span
          aria-hidden
          className="absolute bottom-0 rounded-full"
          style={{
            left: indicator.left,
            width: indicator.width,
            height: 2,
            backgroundColor: "var(--accent-strong)",
            transform: "translateY(50%)",
            transition: "left 0.32s cubic-bezier(.16,1,.3,1), width 0.32s cubic-bezier(.16,1,.3,1)",
          }}
        />
      </div>
    </div>
  );
}
