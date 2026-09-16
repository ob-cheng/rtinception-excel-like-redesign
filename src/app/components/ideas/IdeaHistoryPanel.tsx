import { useEffect, useMemo, useState } from "react";
import { Clock, X } from "lucide-react";
import type { Idea } from "../../types";
import { generateHistory } from "../../data/history";

export function IdeaHistoryPanel({
  row: rowProp,
  onClose,
}: {
  row: Idea | null;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
  // Keep the last row mounted through the slide-OUT so the panel exits along its entry path (§7),
  // matching the detail panel. `shownRow` outlives `rowProp=null` until the 0.4s transform finishes.
  // The effects key off `rowProp` (real prop), never the displayed row, so the Escape listener is
  // torn down on close instead of leaking.
  const [shownRow, setShownRow] = useState<Idea | null>(rowProp);

  useEffect(() => {
    if (rowProp) {
      setShownRow(rowProp);
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    const t = setTimeout(() => setShownRow(null), 400);
    return () => clearTimeout(t);
  }, [rowProp]);

  useEffect(() => {
    if (!rowProp) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [rowProp, onClose]);

  // Rebuild the (mock) history only when the shown row changes, not on every panel re-render
  // (slide-in visibility flips, parent renders while the panel is open). Computed before any early
  // return so the hook order stays stable across renders (Rules of Hooks).
  const events = useMemo(() => (shownRow ? generateHistory(shownRow) : []), [shownRow]);

  if (!shownRow) return null;
  const row = shownRow;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Scrim — matches the detail panel: a light dim (no blur) so the grid stays legible behind
          this right-side inspector while still catching a click-away to dismiss (§ Depth). */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/10 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Panel — slides from right, matching the detail panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Activity for ${row.uid}`}
        className="absolute right-0 top-0 h-full w-[460px] max-w-full flex flex-col outline-none"
        style={{
          backgroundColor: "var(--surface-modal)",
          boxShadow: "-1px 0 0 var(--depth-edge), -24px 0 60px -20px rgba(15,23,42,0.28)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header */}
        <div className="shrink-0 px-7 pt-6 pb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[20px] leading-tight tracking-[-0.02em] text-gray-900 dark:text-gray-100">Activity</h2>
            <p className="text-[13px] text-gray-400 dark:text-gray-400 mt-1 truncate">
              <span className="font-mono text-[11px] text-gray-400 dark:text-gray-400">{row.uid}</span>
              <span className="mx-1.5 text-gray-200 dark:text-gray-600">·</span>
              {row.project}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 -mr-1 -mt-1 grid place-items-center w-8 h-8 rounded-full text-gray-400 dark:text-gray-400 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-gray-200 active:scale-95 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          >
            <X size={15} strokeWidth={2.25} />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-7 pb-8">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 dark:text-gray-400 pb-10">
              <Clock size={30} strokeWidth={1.2} className="text-gray-300 dark:text-gray-500" />
              <p className="text-[14px] text-gray-500 dark:text-gray-400">No activity yet</p>
              <p className="text-[13px]">Changes will appear here as the idea progresses.</p>
            </div>
          ) : (
            <ol className="relative">
              {events.map((ev, i) => {
                const last = i === events.length - 1;

                return (
                  <li key={ev.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* Rail + node */}
                    <div className="relative shrink-0 flex justify-center" style={{ width: 12 }}>
                      {!last && <span className="absolute top-3 bottom-[-24px] w-px" style={{ backgroundColor: "var(--hairline)" }} />}
                      <span
                        className="relative mt-1 rounded-full ring-4 ring-[color:var(--surface-modal)]"
                        style={{ width: 8, height: 8, backgroundColor: "var(--text-4)" }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 -mt-0.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-[14px] text-gray-900 dark:text-gray-100 leading-snug">{ev.action}</p>
                        <time className="shrink-0 text-[11.5px] tabular-nums" style={{ color: "var(--text-3)" }}>
                          {new Date(`${ev.date}T00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </time>
                      </div>
                      <p className="text-[12px] text-gray-400 dark:text-gray-400 mt-1">
                        {ev.actor}{ev.committee && <> · {ev.committee}</>} · {ev.time}
                      </p>
                      {ev.note && (
                        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{ev.note}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
