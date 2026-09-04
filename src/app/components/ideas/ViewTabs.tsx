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
  return (
    <div className="shrink-0">
      <div className="relative inline-flex items-center gap-0" style={{ borderBottom: "1px solid var(--hairline)" }}>
        {VIEWS.map((v, i) => (
          <button
            key={v}
            ref={el => { tabRefs.current[i] = el; }}
            onPointerDown={() => onSelect(v)}
            className={`flex items-center gap-1.5 px-4 py-[9px] text-[13.5px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)] ${
              pendingView === v ? "font-semibold text-[color:var(--text-1)]" : "font-medium text-[color:var(--text-3)] hover:text-[color:var(--text-2)]"
            }`}
          >
            {v}
          </button>
        ))}
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
