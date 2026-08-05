import { useEffect, useRef, useState } from "react";
import { Lock, PenLine, Sparkles, X } from "lucide-react";
import type { Idea } from "../../types";
import { NAVY } from "../../lib/theme";
import { isLocked, LOCK_REASON } from "../../lib/locking";

export function IdeaDetailPanel({
  row,
  onClose,
  onEdit,
}: {
  row: Idea | null;
  onClose: () => void;
  onEdit: (row: Idea) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Animate in on mount, out before unmount
  useEffect(() => {
    if (row) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [row]);

  // Escape to dismiss + focus trap
  useEffect(() => {
    if (!row) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // Move focus into panel
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [row, onClose]);

  if (!row) return null;

  const locked = isLocked(row);

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
    { label: "Created by",    value: "Sahil Kapoor" },
    { label: "Created",       value: "Mar 12, 2024" },
    { label: "Last modified", value: "Jun 3, 2025" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Scrim */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Panel — slides from right */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Idea details — ${row.uid}`}
        className="absolute right-0 top-0 h-full w-[460px] max-w-full bg-white flex flex-col outline-none"
        style={{
          boxShadow: "-1px 0 0 rgba(0,0,0,0.04), -24px 0 60px -20px rgba(15,23,42,0.28)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header — content-first: the project is the real title, the UID is metadata. */}
        <div className="shrink-0 px-7 pt-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="font-mono text-[11px] tracking-[0.02em] text-gray-400">{row.uid}</span>
                {locked && (
                  <>
                    <span className="text-gray-200">·</span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                      <Lock size={11} strokeWidth={2} /> Locked
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-[26px] leading-[1.15] tracking-[-0.02em] text-gray-900 truncate">
                {row.project || "Untitled idea"}
              </h2>
              <p className="text-[13px] text-gray-400 mt-1.5">{row.franchise} · {row.area}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 -mr-1 -mt-1 grid place-items-center w-8 h-8 rounded-full text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-700 active:scale-95 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
            >
              <X size={15} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-7 pb-8">

          {/* Hero — the aspirational claim leads, set large and confident. */}
          <div className="rounded-2xl px-5 py-5" style={{ backgroundColor: `${NAVY}07` }}>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles size={13} strokeWidth={2} style={{ color: NAVY }} />
              <p className="text-[11px] font-medium tracking-[0.01em]" style={{ color: NAVY }}>Potential claims</p>
            </div>
            <p className="text-[19px] leading-[1.45] tracking-[-0.01em] text-gray-900">
              {row.potentialClaims || <span className="text-gray-300">No claims defined yet.</span>}
            </p>
          </div>

          {/* Specification — quiet label/value rows on hairlines. */}
          <div className="mt-7">
            <p className="text-[12px] font-medium text-gray-400 mb-1">Specification</p>
            <dl>
              {spec.map((f, i) => (
                <div
                  key={f.label}
                  className={`flex items-baseline justify-between gap-6 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
                >
                  <dt className="text-[13px] text-gray-500 shrink-0">{f.label}</dt>
                  <dd className="text-[13px] text-gray-900 text-right">
                    {f.value || <span className="text-gray-300">—</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Study design & endpoints */}
          <div className="mt-7">
            <p className="text-[12px] font-medium text-gray-400 mb-1">Study Design &amp; Endpoints</p>
            <dl>
              {endpoints.map((f, i) => (
                <div
                  key={f.label}
                  className={`flex items-baseline justify-between gap-6 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
                >
                  <dt className="text-[13px] text-gray-500 shrink-0">{f.label}</dt>
                  <dd className="text-[13px] text-gray-900 text-right">
                    {f.value || <span className="text-gray-300">—</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Financials */}
          <div className="mt-7">
            <p className="text-[12px] font-medium text-gray-400 mb-1">Financials</p>
            <dl>
              {financials.map((f, i) => (
                <div
                  key={f.label}
                  className={`flex items-baseline justify-between gap-6 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
                >
                  <dt className="text-[13px] text-gray-500 shrink-0">{f.label}</dt>
                  <dd className="text-[13px] text-gray-900 text-right font-mono tabular-nums">
                    {f.value || <span className="text-gray-300 font-sans">—</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Comments */}
          {row.comments && (
            <div className="mt-7">
              <p className="text-[12px] font-medium text-gray-400 mb-1">Comments</p>
              <p className="text-[13px] text-gray-700 leading-relaxed">{row.comments}</p>
            </div>
          )}

          {/* Governance */}
          <div className="mt-7">
            <p className="text-[12px] font-medium text-gray-400 mb-1">Governance</p>
            <dl>
              {governance.map((f, i) => (
                <div
                  key={f.label}
                  className={`flex items-baseline justify-between gap-6 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
                >
                  <dt className="text-[13px] text-gray-500 shrink-0">{f.label}</dt>
                  <dd className="text-[13px] text-gray-900 text-right">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Footer — one clear action, or a calm lock explanation. */}
        <div className="shrink-0 px-7 py-4 border-t border-gray-100 bg-white/80 backdrop-blur">
          {locked ? (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-gray-50 rounded-2xl text-[13px] text-gray-500 leading-relaxed">
              <Lock size={14} strokeWidth={2} className="text-gray-400 mt-px shrink-0" />
              {LOCK_REASON}
            </div>
          ) : (
            <button
              onClick={() => { onEdit(row); onClose(); }}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-full text-white text-[14px] font-medium active:scale-[0.99] transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0d2d6b]/50"
              style={{ backgroundColor: NAVY }}
            >
              <PenLine size={15} strokeWidth={2} />
              Edit idea
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
