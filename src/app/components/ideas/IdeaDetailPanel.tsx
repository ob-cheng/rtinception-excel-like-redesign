import { useEffect, useRef, useState } from "react";
import { PenLine, Sparkles, X } from "lucide-react";
import type { Idea } from "../../types";

export function IdeaDetailPanel({
  row: rowProp,
  onClose,
  onEdit,
}: {
  row: Idea | null;
  onClose: () => void;
  onEdit: (row: Idea) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  // Keep the last row mounted through the slide-OUT so the panel exits along the same path
  // it entered (§7). `rowProp` drives intent; `shownRow` keeps content on screen until the exit
  // transition (0.4s, matching the transform below) finishes, then we unmount. The effects below
  // MUST key off `rowProp` (the real prop), never the displayed row — otherwise the close render
  // wouldn't tear down the Escape listener and it would leak.
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

  // Escape to dismiss + focus trap. Keyed to `rowProp` so closing (rowProp → null) re-runs this
  // effect and its cleanup removes the global listener; keying it to the displayed row would strand
  // the listener because the displayed row lingers through the exit animation.
  useEffect(() => {
    if (!rowProp) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // Move focus into panel
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [rowProp, onClose]);

  if (!shownRow) return null;
  // The row rendered below is the persisted one (survives the exit); intent lives in `rowProp`.
  const row = shownRow;

  // The specification reads like a calm, iOS-Settings-style list — label left, value right,
  // separated by hairlines. No colored chips, no all-caps eyebrow on every field.
  const spec: { label: string; value: string }[] = [
    { label: "Portfolio",                    value: row.portfolio },
    { label: "Franchise",                    value: row.franchise },
    { label: "Therapeutic Area",             value: row.area },
    { label: "Brand Ranking",                value: row.brandRanking },
    { label: "TA Prioritization",            value: row.areaPrioritization },
    { label: "Research Pathway",             value: row.pathway },
    { label: "RTI Year",                     value: row.rtiYear },
    { label: "ATP or Key Product",           value: row.atpProduct },
    { label: "Product or Project",           value: row.project },
    { label: "Strategic Imperatives",        value: row.strategicImperatives },
    { label: "Research Questions / Details", value: row.researchQuestions },
  ];

  const endpoints: { label: string; value: string }[] = [
    { label: "Primary Endpoint",   value: row.primaryEndpoint },
    { label: "Secondary Endpoint", value: row.secondaryEndpoint },
    { label: "Other Endpoints",    value: row.otherEndpoints },
    { label: "Study Design",       value: row.studyDesign },
    { label: "Statistics",         value: row.proposedStatistics },
    { label: "Sample Size",        value: row.sampleSize },
    { label: "POS",                value: row.pos },
    { label: "Region / Country",   value: row.region },
    { label: "Start Date",         value: row.startDate },
    { label: "End Date (CSR)",     value: row.endDate },
    { label: "Regional Feedback",  value: row.regionalFeedback },
  ];

  const financials: { label: string; value: string }[] = [
    { label: "Total Estimated Budget",  value: row.totalCost },
    { label: "Estimated 2027 Spend",    value: row.total2027Cost },
    { label: "Total Indirect ($)",      value: row.totalIndirect },
    { label: "Total Direct ($)",        value: row.totalDirect },
    { label: "2027 Indirect ($)",       value: row.total2027Indirect },
    { label: "2027 Direct ($)",         value: row.total2027Direct },
  ];

  const governance: { label: string; value: string }[] = [
    { label: "Created by",    value: "Tianen" },
    { label: "Created",       value: "Mar 12, 2024" },
    { label: "Last modified", value: "Jun 3, 2025" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Scrim — a right-side inspector, not a blocking task: a light dim (no blur) keeps the grid
          legible behind so the panel reads as flowing alongside the content it describes (§ Depth),
          while still catching a click-away to dismiss. */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/10 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Panel — slides from right */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Idea details — ${row.uid}`}
        className="absolute right-0 top-0 h-full w-[460px] max-w-full flex flex-col outline-none"
        style={{
          backgroundColor: "var(--surface-modal)",
          boxShadow: "-1px 0 0 var(--depth-edge), -24px 0 60px -20px rgba(15,23,42,0.28)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header — content-first: the project is the real title, the UID is metadata. */}
        <div className="shrink-0 px-7 pt-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="font-mono text-[11px] tracking-[0.02em] text-gray-400 dark:text-gray-400">{row.uid}</span>
              </div>
              <h2 className="text-[26px] leading-[1.15] tracking-[-0.02em] text-gray-900 dark:text-gray-100 truncate">
                {row.project || "Untitled idea"}
              </h2>
              <p className="text-[13px] text-gray-400 dark:text-gray-400 mt-1.5">{row.franchise} · {row.area}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 -mr-1 -mt-1 grid place-items-center w-8 h-8 rounded-full text-gray-400 dark:text-gray-400 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-gray-200 active:scale-95 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
            >
              <X size={15} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-7 pb-8">

          {/* Hero — the aspirational claim leads, set large and confident. */}
          <div className="rounded-[16px] px-5 py-5" style={{ backgroundColor: "var(--fill-subtle)" }}>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles size={13} strokeWidth={2} style={{ color: "var(--accent)" }} />
              <p className="text-[11px] font-medium tracking-[0.01em]" style={{ color: "var(--accent)" }}>Potential claims</p>
            </div>
            <p className="text-[19px] leading-[1.45] tracking-[-0.01em] text-gray-900 dark:text-gray-100">
              {row.potentialClaims || <span className="text-gray-300 dark:text-gray-500">No claims defined yet.</span>}
            </p>
          </div>

          {/* Specification — quiet label/value rows on hairlines. */}
          <div className="mt-7">
            <p className="text-[12px] font-medium text-gray-400 dark:text-gray-400 mb-1">Specification</p>
            <dl>
              {spec.map((f, i) => (
                <div
                  key={f.label}
                  className={`flex items-baseline justify-between gap-6 py-3 ${i > 0 ? "border-t border-gray-100 dark:border-white/10" : ""}`}
                >
                  <dt className="text-[13px] text-gray-500 dark:text-gray-400 shrink-0">{f.label}</dt>
                  <dd className="text-[13px] text-gray-900 dark:text-gray-100 text-right">
                    {f.value || <span className="text-gray-300 dark:text-gray-500">—</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Study design & endpoints */}
          <div className="mt-7">
            <p className="text-[12px] font-medium text-gray-400 dark:text-gray-400 mb-1">Study Design &amp; Endpoints</p>
            <dl>
              {endpoints.map((f, i) => (
                <div
                  key={f.label}
                  className={`flex items-baseline justify-between gap-6 py-3 ${i > 0 ? "border-t border-gray-100 dark:border-white/10" : ""}`}
                >
                  <dt className="text-[13px] text-gray-500 dark:text-gray-400 shrink-0">{f.label}</dt>
                  <dd className="text-[13px] text-gray-900 dark:text-gray-100 text-right">
                    {f.value || <span className="text-gray-300 dark:text-gray-500">—</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Financials */}
          <div className="mt-7">
            <p className="text-[12px] font-medium text-gray-400 dark:text-gray-400 mb-1">Financials</p>
            <dl>
              {financials.map((f, i) => (
                <div
                  key={f.label}
                  className={`flex items-baseline justify-between gap-6 py-3 ${i > 0 ? "border-t border-gray-100 dark:border-white/10" : ""}`}
                >
                  <dt className="text-[13px] text-gray-500 dark:text-gray-400 shrink-0">{f.label}</dt>
                  <dd className="text-[13px] text-gray-900 dark:text-gray-100 text-right font-mono tabular-nums">
                    {f.value || <span className="text-gray-300 dark:text-gray-500 font-sans">—</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Comments */}
          {row.comments && (
            <div className="mt-7">
              <p className="text-[12px] font-medium text-gray-400 dark:text-gray-400 mb-1">Comments</p>
              <p className="text-[13px] text-gray-700 dark:text-gray-200 leading-relaxed">{row.comments}</p>
            </div>
          )}

          {/* Governance */}
          <div className="mt-7">
            <p className="text-[12px] font-medium text-gray-400 dark:text-gray-400 mb-1">Governance</p>
            <dl>
              {governance.map((f, i) => (
                <div
                  key={f.label}
                  className={`flex items-baseline justify-between gap-6 py-3 ${i > 0 ? "border-t border-gray-100 dark:border-white/10" : ""}`}
                >
                  <dt className="text-[13px] text-gray-500 dark:text-gray-400 shrink-0">{f.label}</dt>
                  <dd className="text-[13px] text-gray-900 dark:text-gray-100 text-right">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Footer — one clear action. */}
        <div className="shrink-0 px-7 py-4 border-t border-gray-100 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] backdrop-blur">
          <button
            onClick={() => { onEdit(row); onClose(); }}
            className="flex items-center justify-center gap-2 w-full h-11 rounded-full text-[14px] font-medium active:scale-[0.99] transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--accent-ring)]"
            style={{ backgroundColor: "var(--accent-strong)", color: "var(--on-accent)" }}
          >
            <PenLine size={15} strokeWidth={2} />
            Edit idea
          </button>
        </div>
      </div>
    </div>
  );
}
