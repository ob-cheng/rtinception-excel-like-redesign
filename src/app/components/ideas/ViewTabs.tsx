import type { ViewKey } from "../../types";
import { VIEW_KEYS, VIEWS } from "../../data/columns";
import { NAVY } from "../../lib/theme";

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
      <div className="relative inline-flex items-center gap-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        {VIEWS.map((v, i) => (
          <button
            key={v}
            ref={el => { tabRefs.current[i] = el; }}
            onClick={() => onSelect(v)}
            className={`flex items-center gap-1.5 px-4 py-[9px] text-[13.5px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30 ${
              pendingView === v ? "font-semibold text-[#0d2d6b]" : "font-medium text-[#8e8e93] hover:text-gray-700"
            }`}
          >
            {v}
            <span
              className={`text-[10.5px] px-[6px] py-px rounded-full font-semibold tabular-nums transition-all duration-150 ${
                pendingView === v ? "text-white" : "bg-gray-100/80 text-gray-400"
              }`}
              style={pendingView === v ? { backgroundColor: NAVY } : {}}
            >
              {VIEW_KEYS[v].length}
            </span>
          </button>
        ))}
        <span
          aria-hidden
          className="absolute bottom-0 rounded-full"
          style={{
            left: indicator.left,
            width: indicator.width,
            height: 2,
            backgroundColor: NAVY,
            transform: "translateY(50%)",
            transition: "left 0.32s cubic-bezier(.16,1,.3,1), width 0.32s cubic-bezier(.16,1,.3,1)",
          }}
        />
      </div>
    </div>
  );
}
