import { Minus, Plus } from "lucide-react";

// A compact segmented −/percentage/+ control. The percentage doubles as a reset
// button (click to return to 100%), so the common path is one click and the
// affordance stays a single tidy pill.
export function ZoomControl({
  zoom,
  onIn,
  onOut,
  onReset,
  canZoomIn,
  canZoomOut,
}: {
  zoom: number;
  onIn: () => void;
  onOut: () => void;
  onReset: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
}) {
  return (
    <div
      className="flex items-center h-[34px] rounded-[10px] overflow-hidden"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--hairline)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <button
        onClick={onOut}
        disabled={!canZoomOut}
        title="Zoom out"
        aria-label="Zoom out"
        className="flex items-center justify-center h-full w-[30px] transition-colors duration-100 disabled:opacity-30 hover:bg-black/[0.04] dark:hover:bg-white/5 active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)]"
        style={{ color: "var(--text-2)" }}
      >
        <Minus size={13} strokeWidth={2.4} />
      </button>
      <button
        onClick={onReset}
        title="Reset to 100%"
        aria-label="Reset zoom to 100%"
        className="h-full px-1 min-w-[46px] text-[12px] font-medium tabular-nums transition-colors duration-100 hover:bg-black/[0.04] dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)]"
        style={{
          color: "var(--text-2)",
          borderLeft: "1px solid var(--hairline)",
          borderRight: "1px solid var(--hairline)",
        }}
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        onClick={onIn}
        disabled={!canZoomIn}
        title="Zoom in"
        aria-label="Zoom in"
        className="flex items-center justify-center h-full w-[30px] transition-colors duration-100 disabled:opacity-30 hover:bg-black/[0.04] dark:hover:bg-white/5 active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)]"
        style={{ color: "var(--text-2)" }}
      >
        <Plus size={13} strokeWidth={2.4} />
      </button>
    </div>
  );
}
