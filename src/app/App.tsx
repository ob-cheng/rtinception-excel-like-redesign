import { useState, useRef, useEffect } from "react";
import { Home, FileText, HelpCircle, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Plus, Upload, Copy, Trash2, ChevronDown as Caret, Filter, Check, MoreHorizontal, Pencil, Eye, Clock, Loader2, Lock, X, ArrowRight, PenLine, Sparkles } from "lucide-react";
import { Toaster, toast } from "sonner";

// Signed-in user — in a real app this is resolved from the user ID the app reads at startup.
// Role is derived from that identity, not entered by hand.
const currentUser = { id: "sahil.k", name: "Sahil", role: "Researcher" };

const NAVY = "#0d2d6b";
const NAVY_DARK = "#0a2458";

type Idea = {
  uid: string;
  franchise: string;
  area: string;
  pathway: string;
  brand: string;
  type: string;
  project: string;
  claim: string;
  status: string;
};

const initialIdeas: Idea[] = [
  { uid: "CE128",  franchise: "Surgical",     area: "CRCX",     pathway: "IIT",          brand: "BSS",        type: "ATP - R&D",      project: "BSS Plus",             claim: "Superior corneal clarity post-op",            status: "Approved"   },
  { uid: "CE127",  franchise: "Surgical",     area: "CRCX",     pathway: "Test created", brand: "BSS",        type: "Contact Lens",   project: "BSS Plus",             claim: "Extended wear comfort up to 30 days",         status: "Approved"   },
  { uid: "CE125",  franchise: "Surgical",     area: "CRCX",     pathway: "IIT",          brand: "INTREPID",   type: "ATP - R&D",      project: "INTREPID Hybrid Tip",  claim: "Fastest aspiration rate in its class",        status: "Approved"   },
  { uid: "RXG005", franchise: "Surgical",     area: "CRCX",     pathway: "AIT",          brand: "Centurion",  type: "Tier 2 / 3 R&D", project: "Centurion Silver",     claim: "Reduce surge by 40% vs. predicate",           status: "Approved"   },
  { uid: "RXG006", franchise: "Surgical",     area: "CRCX",     pathway: "IIT",          brand: "Centurion",  type: "ATP - R&D",      project: "Centurion Silver",     claim: "Best-in-class IOP stability during phaco",    status: "Approved"   },
  { uid: "CE123",  franchise: "Surgical",     area: "CRCX",     pathway: "AIT",          brand: "OVD",        type: "Tier 2 / 3 R&D", project: "OVDs",                 claim: "Maintains anterior chamber depth throughout",  status: "Harmonized" },
  { uid: "VCR041", franchise: "Vision Care",  area: "Dry Eye",  pathway: "Sponsored",    brand: "Systane",    type: "Clinical",       project: "Systane Ultra UD",     claim: "24-hour dry eye symptom relief, single dose",  status: "Submitted"  },
  { uid: "VCR039", franchise: "Vision Care",  area: "Dry Eye",  pathway: "IIT",          brand: "Systane",    type: "Contact Lens",   project: "Systane Hydration",    claim: "90% patient satisfaction at 6 months",        status: "Draft"      },
  { uid: "VCR044", franchise: "Vision Care",  area: "Glaucoma", pathway: "AIT",          brand: "Travatan",   type: "ATP - R&D",      project: "Travatan Z Next Gen",  claim: "Non-inferior IOP lowering with fewer drops",  status: "Approved"   },
  { uid: "PHR012", franchise: "Pharmaceutical",area: "Retina",  pathway: "Sponsored",    brand: "VEGF-Trap",  type: "Clinical",       project: "Aflibercept Extended", claim: "Vision gain ≥15 ETDRS letters at 52 weeks",   status: "Approved"   },
  { uid: "PHR015", franchise: "Pharmaceutical",area: "Retina",  pathway: "IIT",          brand: "VEGF-Trap",  type: "ATP - R&D",      project: "Aflibercept HD",       claim: "Reduce injection burden to q16w",              status: "Submitted"  },
  { uid: "PHR018", franchise: "Pharmaceutical",area: "Glaucoma",pathway: "AIT",          brand: "Simbrinza",  type: "Tier 2 / 3 R&D", project: "Simbrinza BID",        claim: "IOP reduction ≥30% from baseline at 12M",     status: "Draft"      },
  { uid: "CE119",  franchise: "Surgical",     area: "Cataract", pathway: "IIT",          brand: "AcrySof",    type: "ATP - R&D",      project: "AcrySof IQ Vivity+",   claim: "Full range of vision without dysphotopsia",   status: "Harmonized" },
  { uid: "CE121",  franchise: "Surgical",     area: "Cataract", pathway: "Sponsored",    brand: "AcrySof",    type: "Clinical",       project: "AcrySof IQ PanOptix",  claim: "Spectacle independence in 85% of patients",   status: "Approved"   },
  { uid: "VCR051", franchise: "Vision Care",  area: "Dry Eye",  pathway: "Sponsored",    brand: "Pataday",    type: "Clinical",       project: "Pataday Once Daily",   claim: "Symptom-free days ≥5 of 7 at peak season",    status: "Approved"   },
  { uid: "RXG009", franchise: "Surgical",     area: "CRCX",     pathway: "IIT",          brand: "Centurion",  type: "ATP - R&D",      project: "Centurion Active Sentry", claim: "Zero-surge phacoemulsification",               status: "Draft"      },
  { uid: "PHR022", franchise: "Pharmaceutical",area: "Retina",  pathway: "Sponsored",    brand: "Ozurdex",    type: "Clinical",       project: "Ozurdex PRN Protocol", claim: "Anatomic resolution at 6M with PRN dosing",   status: "Submitted"  },
  { uid: "CE131",  franchise: "Surgical",     area: "CRCX",     pathway: "AIT",          brand: "MIVS",       type: "Tier 2 / 3 R&D", project: "MIVS 27g Plus",        claim: "Lowest incidence of post-op hypotony",        status: "Harmonized" },
];

const emptyDraft: Idea = { uid: "", franchise: "", area: "", pathway: "", brand: "", type: "", project: "", claim: "", status: "" };

const isLocked = (_row: Idea) => false;
const LOCK_REASON = "";

type SortDir = "asc" | "desc" | null;

type Column = { key: keyof Idea; label: string; options?: string[] };

const columns: Column[] = [
  { key: "uid",      label: "UID" },
  { key: "franchise",label: "FRANCHISE",                options: ["Surgical", "Vision Care", "Pharmaceutical"] },
  { key: "area",     label: "THERAPEUTIC AREA",         options: ["CRCX", "Retina", "Glaucoma", "Cataract", "Dry Eye"] },
  { key: "pathway",  label: "RESEARCH PATHWAY",         options: ["IIT", "AIT", "Test created", "Sponsored"] },
  { key: "brand",    label: "PRODUCT FAMILY (BRAND)" },
  { key: "type",     label: "PRODUCT TYPE",             options: ["ATP - R&D", "Tier 2 / 3 R&D", "Contact Lens", "Clinical"] },
  { key: "project",  label: "PRODUCT / PROJECT" },
  { key: "claim",    label: "TARGET ASPIRATIONAL CLAIM" },
  { key: "status",   label: "STATUS",                   options: ["Draft", "Submitted", "Approved", "Harmonized"] },
];

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

type MoveDir = "down" | "right" | null;

function GridCell({
  col,
  value,
  active,
  editing,
  seed,
  placeholder,
  indicator,
  locked,
  onSelect,
  onStartEdit,
  onCommit,
  onCancel,
  onLocked,
}: {
  col: Column;
  value: string;
  active: boolean;
  editing: boolean;
  seed: string;
  placeholder?: string;
  indicator?: "dirty" | "saving" | "error" | null;
  locked?: boolean;
  onSelect: () => void;
  onStartEdit: () => void;
  onCommit: (v: string, move: MoveDir) => void;
  onCancel: () => void;
  onLocked?: () => void;
}) {
  const isFirst = col.key === "uid";

  if (editing) {
    if (col.options) {
      return (
        <td className="p-0 border-r border-gray-100/80">
          <select
            autoFocus
            defaultValue={value}
            onChange={e => onCommit(e.target.value, null)}
            onBlur={e => onCommit(e.target.value, null)}
            onKeyDown={e => {
              if (e.key === "Escape") { e.preventDefault(); onCancel(); }
            }}
            className="w-full px-4 py-[11px] text-[13px] bg-white outline-none ring-2 ring-inset ring-[#0d2d6b]"
          >
            <option value="">—</option>
            {col.options.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </td>
      );
    }
    return (
      <td className="p-0 border-r border-gray-100/80">
        <input
          autoFocus
          key={seed}
          defaultValue={seed}
          onFocus={e => e.target.select()}
          onBlur={e => onCommit(e.target.value, null)}
          onKeyDown={e => {
            const el = e.target as HTMLInputElement;
            if (e.key === "Enter") { e.preventDefault(); onCommit(el.value, "down"); }
            else if (e.key === "Tab") { e.preventDefault(); onCommit(el.value, "right"); }
            else if (e.key === "Escape") { e.preventDefault(); onCancel(); }
          }}
          className="w-full px-4 py-[11px] text-[13px] bg-white outline-none ring-2 ring-inset ring-[#0d2d6b]"
        />
      </td>
    );
  }

  const statusColors: Record<string, string> = {
    Draft:      "bg-gray-100 text-gray-500",
    Submitted:  "bg-blue-50 text-blue-600",
    Approved:   "bg-green-50 text-green-700",
    Harmonized: "bg-amber-50 text-amber-700",
  };

  const isStatus = col.key === "status";

  return (
    <td
      onClick={onSelect}
      onDoubleClick={locked ? onLocked : onStartEdit}
      title={locked ? LOCK_REASON : undefined}
      className={`px-4 py-[11px] select-none whitespace-nowrap border-r border-gray-100/80 text-[13px] leading-snug transition-colors duration-100 ${
        locked ? "cursor-not-allowed" : "cursor-cell"
      } ${
        isFirst ? (locked ? "text-gray-500 font-medium" : "text-gray-800 font-medium") : locked ? "text-gray-400" : "text-gray-600"
      } ${
        active
          ? locked
            ? "ring-2 ring-inset ring-gray-300 bg-gray-400/[0.06]"
            : "ring-2 ring-inset ring-[#0d2d6b] bg-[#0d2d6b]/[0.04]"
          : ""
      }`}
    >
      <span className="inline-flex items-center gap-1.5">
        {isFirst && locked && (
          <Lock size={11} className="text-gray-400 shrink-0" strokeWidth={2} />
        )}
        {isStatus && value ? (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-medium ${statusColors[value] ?? "bg-gray-100 text-gray-500"}`}>
            {value}
          </span>
        ) : value !== "" ? value : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        {!locked && col.options && active && !isStatus && <Caret size={11} className="text-gray-400" />}
        {!locked && isStatus && active && <Caret size={11} className="text-gray-400" />}
        {indicator === "saving" && (
          <Loader2 size={10} className="animate-spin text-amber-400 shrink-0" />
        )}
        {indicator === "dirty" && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />
        )}
        {indicator === "error" && (
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" title="Save failed" />
        )}
      </span>
    </td>
  );
}

function RowMenu({
  row,
  locked,
  onEdit,
  onViewDetails,
  onViewHistory,
  onDuplicate,
  onDelete,
}: {
  row: Idea;
  locked?: boolean;
  onEdit: (row: Idea) => void;
  onViewDetails: (row: Idea) => void;
  onViewHistory: (row: Idea) => void;
  onDuplicate: (row: Idea) => void;
  onDelete: (row: Idea) => void;
}) {
  const [open, setOpen] = useState(false);

  function item(icon: React.ReactNode, label: string, action: () => void, danger = false, disabled = false) {
    if (disabled) {
      return (
        <div
          title={LOCK_REASON}
          className="flex items-center gap-2.5 w-full text-left px-3.5 py-[7px] text-[13px] rounded-lg mx-1 my-px text-gray-300 cursor-not-allowed"
          style={{ width: "calc(100% - 8px)" }}
        >
          <span className="text-gray-300">{icon}</span>
          {label}
        </div>
      );
    }
    return (
      <button
        onClick={() => { action(); setOpen(false); }}
        className={`flex items-center gap-2.5 w-full text-left px-3.5 py-[7px] text-[13px] transition-colors duration-100 rounded-lg mx-1 my-px active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0d2d6b]/30 ${
          danger
            ? "text-red-500 hover:bg-red-50 active:bg-red-100/70"
            : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
        }`}
        style={{ width: "calc(100% - 8px)" }}
      >
        <span className={danger ? "text-red-400" : "text-gray-400"}>{icon}</span>
        {label}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-95 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="pop-in surface-pop absolute right-0 top-full mt-1.5 z-50 w-52 bg-white border border-gray-200/80 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] py-1.5 overflow-hidden">
            {locked && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 mb-1 border-b border-gray-100 text-[11.5px] text-gray-400">
                <Lock size={11} strokeWidth={2} />
                Locked — read only
              </div>
            )}
            {item(<Pencil size={13} />, "Edit idea", () => onEdit(row), false, locked)}
            {item(<Eye size={13} />, "View idea details", () => onViewDetails(row))}
            {item(<Clock size={13} />, "View idea history", () => onViewHistory(row))}
            <div className="border-t border-gray-100 my-1" />
            {item(<Copy size={13} />, "Duplicate", () => onDuplicate(row), false, locked)}
            {item(<Trash2 size={13} />, "Delete", () => onDelete(row), true, locked)}
          </div>
        </>
      )}
    </div>
  );
}

// ─── History data generator ───────────────────────────────────────────────────

type HistoryEvent = {
  id: string;
  date: string;
  time: string;
  action: string;
  actor: string;
  committee?: string;
  note?: string;
  statusTo?: string;
};

const ACTORS = ["Dr. Sarah M.", "James L.", "Priya N.", "Tom R.", "Lisa C.", "Marcus W."];
const COMMITTEES = ["Clinical Review", "Scientific Committee", "Portfolio Board", "Budget Panel"];

function generateHistory(row: Idea): HistoryEvent[] {
  // Seed using UID chars for determinism
  const seed = row.uid.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const pick = <T,>(arr: T[], offset = 0) => arr[(seed + offset) % arr.length];

  const statusChain: string[] = [];
  const map: Record<string, string[]> = {
    Draft:      ["Draft"],
    Submitted:  ["Draft", "Submitted"],
    Approved:   ["Draft", "Submitted", "Approved"],
    Harmonized: ["Draft", "Submitted", "Approved", "Harmonized"],
  };
  (map[row.status] ?? ["Draft"]).forEach(s => statusChain.push(s));

  const baseYear = 2024;
  const baseMonth = ((seed % 10) + 1);

  const events: HistoryEvent[] = [];

  statusChain.forEach((status, i) => {
    const month = String(Math.min(baseMonth + i, 12)).padStart(2, "0");
    const day = String(((seed * (i + 1)) % 25) + 1).padStart(2, "0");
    const hour = String(((seed + i * 3) % 10) + 8).padStart(2, "0");
    const min = String((seed * (i + 2)) % 60).padStart(2, "0");
    const date = `${baseYear}-${month}-${day}`;
    const time = `${hour}:${min}`;

    if (i === 0) {
      events.push({
        id: `${row.uid}-create`,
        date, time,
        action: "Idea created",
        actor: pick(ACTORS, 0),
        note: `Initial draft submitted for ${row.project}. Research pathway: ${row.pathway}.`,
        statusTo: "Draft",
      });
      // Add a field edit event
      events.push({
        id: `${row.uid}-edit1`,
        date: `${baseYear}-${month}-${String(Math.min(parseInt(day) + 2, 28)).padStart(2, "0")}`,
        time: `${String(((seed + 7) % 10) + 9).padStart(2, "0")}:${String((seed * 3) % 60).padStart(2, "0")}`,
        action: "Target claim updated",
        actor: pick(ACTORS, 1),
        note: `"${row.claim.slice(0, 60)}${row.claim.length > 60 ? "…" : ""}"`,
      });
    } else {
      events.push({
        id: `${row.uid}-status-${i}`,
        date, time,
        action: `Status changed to ${status}`,
        actor: pick(ACTORS, i + 2),
        committee: pick(COMMITTEES, i),
        statusTo: status,
      });
    }
  });

  // Most recent first
  return events.reverse();
}

// ─── Shared status system ──────────────────────────────────────────────────────
// One source of truth for status color so pills, dots, and timelines stay in sync.
type StatusMeta = { dot: string; text: string; soft: string };
const STATUS_META: Record<string, StatusMeta> = {
  Draft:      { dot: "#9ca3af", text: "#4b5563", soft: "#f4f4f5" },
  Submitted:  { dot: "#3b82f6", text: "#1d4ed8", soft: "#eff6ff" },
  Approved:   { dot: "#10b981", text: "#047857", soft: "#ecfdf5" },
  Harmonized: { dot: "#f59e0b", text: "#b45309", soft: "#fffbeb" },
};
const statusMeta = (s: string): StatusMeta => STATUS_META[s] ?? { dot: "#9ca3af", text: "#4b5563", soft: "#f4f4f5" };

function StatusPill({ status, size = "md" }: { status: string; size?: "sm" | "md" }) {
  const m = statusMeta(status);
  const pad = size === "sm" ? "px-2 py-[3px] text-[11px] gap-1.5" : "px-2.5 py-1 text-[12px] gap-2";
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${pad}`}
      style={{ backgroundColor: m.soft, color: m.text }}
    >
      <span className="rounded-full" style={{ width: 6, height: 6, backgroundColor: m.dot }} />
      {status}
    </span>
  );
}

// ─── Idea Detail Panel ─────────────────────────────────────────────────────────

function IdeaDetailPanel({
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
    { label: "Franchise",         value: row.franchise },
    { label: "Therapeutic area",  value: row.area },
    { label: "Research pathway",  value: row.pathway },
    { label: "Product family",    value: row.brand },
    { label: "Product type",      value: row.type },
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
                <span className="text-gray-200">·</span>
                <StatusPill status={row.status} size="sm" />
                {locked && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                    <Lock size={11} strokeWidth={2} /> Locked
                  </span>
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
              <p className="text-[11px] font-medium tracking-[0.01em]" style={{ color: NAVY }}>Target aspirational claim</p>
            </div>
            <p className="text-[19px] leading-[1.45] tracking-[-0.01em] text-gray-900">
              {row.claim || <span className="text-gray-300">No claim defined yet.</span>}
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
                  <dt className="text-[13.5px] text-gray-500 shrink-0">{f.label}</dt>
                  <dd className="text-[13.5px] text-gray-900 text-right">
                    {f.value || <span className="text-gray-300">—</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Governance — same rhythm, kept subordinate. */}
          <div className="mt-7">
            <p className="text-[12px] font-medium text-gray-400 mb-1">Governance</p>
            <dl>
              {governance.map((f, i) => (
                <div
                  key={f.label}
                  className={`flex items-baseline justify-between gap-6 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
                >
                  <dt className="text-[13.5px] text-gray-500 shrink-0">{f.label}</dt>
                  <dd className="text-[13.5px] text-gray-900 text-right">{f.value}</dd>
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

// ─── Idea History Panel ────────────────────────────────────────────────────────

function IdeaHistoryPanel({
  row,
  onClose,
}: {
  row: Idea | null;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (row) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [row]);

  useEffect(() => {
    if (!row) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [row, onClose]);

  if (!row) return null;

  const events = generateHistory(row);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Scrim */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Panel — slides from right, matching the detail panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Activity for ${row.uid}`}
        className="absolute right-0 top-0 h-full w-[460px] max-w-full bg-white flex flex-col outline-none"
        style={{
          boxShadow: "-1px 0 0 rgba(0,0,0,0.04), -24px 0 60px -20px rgba(15,23,42,0.28)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header */}
        <div className="shrink-0 px-7 pt-6 pb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[20px] leading-tight tracking-[-0.02em] text-gray-900">Activity</h2>
            <p className="text-[13px] text-gray-400 mt-1 truncate">
              <span className="font-mono text-[11px] text-gray-400">{row.uid}</span>
              <span className="mx-1.5 text-gray-200">·</span>
              {row.project}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 grid place-items-center w-8 h-8 rounded-full text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-700 active:scale-95 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          >
            <X size={15} strokeWidth={2.25} />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-7 pb-8">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 pb-10">
              <Clock size={30} strokeWidth={1.2} className="text-gray-300" />
              <p className="text-[14px] text-gray-500">No activity yet</p>
              <p className="text-[13px]">Changes will appear here as the idea progresses.</p>
            </div>
          ) : (
            <ol className="relative">
              {events.map((ev, i) => {
                const isStatus = !!ev.statusTo;
                const m = statusMeta(ev.statusTo ?? "");
                const dotColor = isStatus ? m.dot : "#d1d5db";
                const last = i === events.length - 1;

                return (
                  <li key={ev.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* Rail + node */}
                    <div className="relative shrink-0 flex justify-center" style={{ width: 12 }}>
                      {!last && <span className="absolute top-3 bottom-[-24px] w-px bg-gray-150" style={{ backgroundColor: "#eceef1" }} />}
                      <span
                        className="relative mt-1 rounded-full ring-4 ring-white"
                        style={{ width: isStatus ? 11 : 8, height: isStatus ? 11 : 8, backgroundColor: dotColor }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 -mt-0.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-[14px] text-gray-900 leading-snug">{ev.action}</p>
                        <time className="shrink-0 text-[11.5px] text-gray-350 tabular-nums" style={{ color: "#aab0ba" }}>
                          {new Date(`${ev.date}T00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </time>
                      </div>
                      <p className="text-[12.5px] text-gray-400 mt-1">
                        {ev.actor}{ev.committee && <> · {ev.committee}</>} · {ev.time}
                      </p>
                      {ev.statusTo && (
                        <div className="mt-2">
                          <StatusPill status={ev.statusTo} size="sm" />
                        </div>
                      )}
                      {ev.note && (
                        <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">{ev.note}</p>
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

function SortIcon({ dir }: { dir: SortDir }) {
  return (
    <span className="inline-flex flex-col ml-1 gap-[1px] opacity-40">
      <ChevronUp size={8} strokeWidth={2.5} className={dir === "asc" ? "opacity-100 text-[#0d2d6b]" : ""} />
      <ChevronDown size={8} strokeWidth={2.5} className={dir === "desc" ? "opacity-100 text-[#0d2d6b]" : ""} />
    </span>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [rows, setRows] = useState<Idea[]>(initialIdeas);
  const [draft, setDraft] = useState<Idea>(emptyDraft);

  // Per-column value filters (Excel-style). Empty array / missing key = no filter on that column.
  const [colFilters, setColFilters] = useState<Partial<Record<keyof Idea, string[]>>>({});
  const [openFilter, setOpenFilter] = useState<keyof Idea | null>(null);

  // Active-cell cursor + edit state (r spans sorted rows; the last index is the draft row)
  const [active, setActive] = useState<{ r: number; c: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [seed, setSeed] = useState("");
  const [detailRow, setDetailRow] = useState<Idea | null>(null);
  const [historyRow, setHistoryRow] = useState<Idea | null>(null);
  const [dirtySet, setDirtySet] = useState<Set<string>>(new Set());
  const [savingSet, setSavingSet] = useState<Set<string>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);
  const dirtyRows = useRef<Set<string>>(new Set());
  const savingRows = useRef<Set<string>>(new Set());
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // rowsRef keeps flush logic in sync with latest rows state without stale closures
  const rowsRef = useRef(rows);
  useEffect(() => { rowsRef.current = rows; }, [rows]);

  const statusLabels = ["All", "Draft", "Submitted", "Approved", "Harmonized"] as const;
  type TabLabel = typeof statusLabels[number];
  const tabs = statusLabels.map(label => ({
    label,
    count: label === "All" ? rows.length : rows.filter(r => r.status === label).length,
  }));

  function handleSort(key: string) {
    if (sortCol === key) {
      setSortDir(d => d === "asc" ? "desc" : d === "desc" ? null : "asc");
      if (sortDir === "desc") setSortCol(null);
    } else {
      setSortCol(key);
      setSortDir("asc");
    }
  }

  // --- Dirty-row save strategy ---
  // Changes accumulate locally; API calls only fire on row-leave or 3s idle.
  // This keeps the gateway quiet even during rapid Tab/Enter navigation.

  function syncDirtyState() {
    setDirtySet(new Set(dirtyRows.current));
  }

  function syncSavingState() {
    setSavingSet(new Set(savingRows.current));
  }

  async function flushDirty(uids?: string[]) {
    // A flush is happening now — cancel any pending idle timer so it doesn't
    // fire a redundant empty flush a moment later.
    if (idleTimer.current) { clearTimeout(idleTimer.current); idleTimer.current = null; }
    const toSave = uids ?? Array.from(dirtyRows.current);
    for (const uid of toSave) {
      if (savingRows.current.has(uid)) continue;
      savingRows.current.add(uid);
      dirtyRows.current.delete(uid);
      syncDirtyState();
      syncSavingState();
      const row = rowsRef.current.find(r => r.uid === uid);
      if (!row) { savingRows.current.delete(uid); syncSavingState(); continue; }
      try {
        // Simulated API call — replace with real fetch/axios call
        await new Promise<void>((res, rej) =>
          setTimeout(() => (Math.random() > 0.15 ? res() : rej(new Error("Network error"))), 600)
        );
      } catch {
        dirtyRows.current.add(uid);
        toast.error(`Failed to save ${uid}`, { description: "Will retry on next change." });
        syncDirtyState();
      } finally {
        savingRows.current.delete(uid);
        syncSavingState();
      }
    }
  }

  function markDirty(uid: string) {
    dirtyRows.current.add(uid);
    syncDirtyState();
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => flushDirty(), 3000);
  }

  // Flush on tab/window blur so no data is lost on tab switch or close
  useEffect(() => {
    function handleBlur() { if (dirtyRows.current.size > 0) flushDirty(); }
    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBlur);
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", handleBlur);
    };
  }, []);

  const filtered = rows.filter(row => {
    const matchesTab = activeTab === "All" || row.status === activeTab;
    const matchesSearch = !search || Object.values(row).some(v => v.toLowerCase().includes(search.toLowerCase()));
    const matchesFilters = columns.every(col => {
      const sel = colFilters[col.key];
      return !sel || sel.length === 0 || sel.includes(row[col.key]);
    });
    return matchesTab && matchesSearch && matchesFilters;
  });

  const distinctValues = (key: keyof Idea) =>
    Array.from(new Set(rows.map(r => r[key]).filter(v => v !== ""))).sort((a, b) => a.localeCompare(b));

  function toggleFilterValue(key: keyof Idea, value: string) {
    setColFilters(prev => {
      const cur = prev[key] ?? [];
      const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value];
      return { ...prev, [key]: next };
    });
  }

  const activeFilterCount = columns.filter(c => (colFilters[c.key]?.length ?? 0) > 0).length;

  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const av = (a as any)[sortCol] as string;
        const bv = (b as any)[sortCol] as string;
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      })
    : filtered;

  const draftIndex = sorted.length;
  const totalRows = sorted.length + 1;

  // sortedRef lets the row-leave effect resolve UIDs without capturing a stale closure.
  const sortedRef = useRef(sorted);
  sortedRef.current = sorted; // update synchronously every render — no effect needed

  // Track previous active UID (not index) so flush survives tab/sort/filter changes.
  const prevActiveUid = useRef<string | null>(null);
  useEffect(() => {
    const curUid =
      active !== null && active.r !== draftIndex
        ? sortedRef.current[active.r]?.uid ?? null
        : null;
    const prevUid = prevActiveUid.current;
    if (prevUid !== curUid) {
      prevActiveUid.current = curUid;
      if (prevUid && dirtyRows.current.has(prevUid)) flushDirty([prevUid]);
    }
  }, [active?.r]);

  // Keep keyboard focus on the grid whenever a cell is selected but not being edited.
  useEffect(() => {
    if (active && !isEditing) gridRef.current?.focus();
  }, [active, isEditing]);

  function commitValue(r: number, c: number, val: string) {
    const key = columns[c].key;
    if (r === draftIndex) {
      const next = { ...draft, [key]: val };
      const trimmedUid = next.uid.trim();
      if (trimmedUid) {
        if (rowsRef.current.some(r => r.uid === trimmedUid)) {
          toast.error(`UID ${trimmedUid} already exists`, { description: "Choose a unique UID." });
          setDraft(next);
          return;
        }
        setRows(prev => [...prev, next]);
        setDraft(emptyDraft);
        toast.success(`Added idea ${next.uid}`);
        markDirty(next.uid); // new rows persist through the same dirty-row flush strategy
      } else {
        setDraft(next);
      }
    } else {
      const target = sorted[r];
      if (target && !isLocked(target)) {
        if (key === "uid") {
          const trimmedUid = val.trim();
          if (trimmedUid !== target.uid && rowsRef.current.some(r => r.uid === trimmedUid)) {
            toast.error(`UID ${trimmedUid} already exists`, { description: "Choose a unique UID." });
            return;
          }
        }
        setRows(prev => prev.map(row => (row.uid === target.uid ? { ...row, [key]: val } : row)));
        markDirty(target.uid);
      }
    }
  }

  function move(dr: number, dc: number) {
    setActive(a => {
      const base = a ?? { r: 0, c: 0 };
      return { r: clamp(base.r + dr, 0, totalRows - 1), c: clamp(base.c + dc, 0, columns.length - 1) };
    });
    setIsEditing(false);
  }

  function startEdit(withSeed: string) {
    setSeed(withSeed);
    setIsEditing(true);
  }

  function currentValue(r: number, c: number) {
    const key = columns[c].key;
    return r === draftIndex ? draft[key] : (sorted[r]?.[key] ?? "");
  }

  // A grid position is locked when it sits on a locked (Funded) record. The draft row is never locked.
  function isLockedAt(r: number) {
    return r !== draftIndex && !!sorted[r] && isLocked(sorted[r]);
  }

  // Throttle the lock toast so hammering keys / repeated clicks don't stack notifications.
  const lockToastAt = useRef(0);
  function notifyLocked() {
    const now = Date.now();
    if (now - lockToastAt.current < 1500) return;
    lockToastAt.current = now;
    toast("This idea is locked", { description: LOCK_REASON, icon: <Lock size={15} /> });
  }

  function onGridKeyDown(e: React.KeyboardEvent) {
    if (isEditing || !active) return;
    const { r, c } = active;
    if (e.key === "ArrowUp") { e.preventDefault(); move(-1, 0); }
    else if (e.key === "ArrowDown") { e.preventDefault(); move(1, 0); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); move(0, -1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); move(0, 1); }
    else if (e.key === "Tab") {
      e.preventDefault();
      if (c < columns.length - 1) move(0, 1);
      else setActive({ r: clamp(r + 1, 0, totalRows - 1), c: 0 });
    }
    // Any key that would enter edit / clear a locked row is intercepted with an explanation.
    else if (isLockedAt(r) && (e.key === "Enter" || e.key === "F2" || e.key === "Delete" || e.key === "Backspace" || (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey))) {
      e.preventDefault();
      notifyLocked();
    }
    else if (e.key === "Enter" || e.key === "F2") { e.preventDefault(); startEdit(currentValue(r, c)); }
    else if ((e.key === "Delete" || e.key === "Backspace") && r !== draftIndex) { e.preventDefault(); commitValue(r, c, ""); }
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { startEdit(e.key); }
  }

  function handleCommit(r: number, c: number, val: string, dir: MoveDir) {
    commitValue(r, c, val);
    setIsEditing(false);
    if (dir === "down") setActive({ r: clamp(r + 1, 0, totalRows - 1), c });
    else if (dir === "right") setActive({ r, c: clamp(c + 1, 0, columns.length - 1) });
  }

  function duplicateRow(row: Idea) {
    let newUid = `${row.uid}-copy`;
    let n = 2;
    while (rows.some(r => r.uid === newUid)) newUid = `${row.uid}-copy${n++}`;
    setRows(prev => [...prev, { ...row, uid: newUid }]);
    toast.success(`Duplicated ${row.uid}`);
  }

  function deleteRow(row: Idea) {
    setRows(prev => prev.filter(r => r.uid !== row.uid));
    toast(`Deleted ${row.uid}`, { description: "Row removed from the list." });
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f5f5f7]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        /* Materialize: blur + scale settle together so the surface reads as a material arriving. */
        @keyframes popIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.97); filter: blur(2px); }
          to   { opacity: 1; transform: translateY(0) scale(1);    filter: blur(0); }
        }
        .pop-in { animation: popIn 0.16s cubic-bezier(0.16, 1, 0.3, 1); transform-origin: top right; }

        /* §14 Reduced motion — swap material/spring motion for a gentle cross-fade, drop transforms. */
        @media (prefers-reduced-motion: reduce) {
          @keyframes popIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .pop-in { animation: popIn 0.12s ease; }
          *, *::before, *::after {
            transition-property: opacity, color, background-color, border-color !important;
            transition-duration: 0.12s !important;
            animation-duration: 0.12s !important;
          }
        }

        /* §14 Reduced transparency — make blurred chrome solid. */
        @media (prefers-reduced-transparency: reduce) {
          .chrome-blur { backdrop-filter: none !important; background-color: rgb(243 244 246) !important; }
        }

        /* §14 Increased contrast — give floating surfaces a defined border. */
        @media (prefers-contrast: more) {
          .surface-pop { border-color: rgba(17, 24, 39, 0.55) !important; }
        }
      `}</style>
      <Toaster position="bottom-right" richColors />

      {/* Sidebar */}
      <aside
        className="flex flex-col items-center pt-6 pb-6 shrink-0"
        style={{ width: 88, backgroundColor: NAVY }}
      >
        {/* Logo mark */}
        <div
          className="flex items-center justify-center rounded-2xl text-white font-semibold select-none mb-8"
          style={{ width: 48, height: 48, backgroundColor: "rgba(255,255,255,0.12)", fontSize: 12, letterSpacing: "0.04em" }}
        >
          Alcon
        </div>

        {/* Nav */}
        <nav className="flex flex-col items-center gap-0.5 w-full px-2">
          <button
            className="flex flex-col items-center gap-[5px] w-full py-2.5 rounded-xl text-white active:scale-[0.96] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            style={{ backgroundColor: "rgba(255,255,255,0.14)" }}
          >
            <Home size={20} strokeWidth={1.6} />
            <span className="text-[10.5px] font-medium tracking-[0.01em]">Home</span>
          </button>

          <button className="flex flex-col items-center gap-[5px] w-full py-2.5 rounded-xl text-white/55 hover:text-white hover:bg-white/[0.07] active:scale-[0.96] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
            <FileText size={20} strokeWidth={1.6} />
            <span className="text-[10.5px] tracking-[0.01em]">My Ideas</span>
          </button>

          <button className="flex flex-col items-center gap-[5px] w-full py-2.5 rounded-xl text-white/55 hover:text-white hover:bg-white/[0.07] active:scale-[0.96] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
            <HelpCircle size={20} strokeWidth={1.6} />
            <span className="text-[10.5px] tracking-[0.01em]">Help</span>
          </button>
        </nav>

        {/* User identity */}
        <div className="flex-1" />
        <div className="flex flex-col items-center gap-1.5">
          <div
            className="flex items-center justify-center rounded-full text-white text-[13px] font-semibold select-none"
            style={{ width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <span className="text-[10.5px] font-medium text-white/80">{currentUser.name}</span>
          <span className="text-[9.5px] text-white/40 tracking-[0.02em]">{currentUser.role}</span>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden flex flex-col px-9 pt-8 pb-5 gap-5">

          {/* Page header */}
          <div className="flex items-center justify-between gap-4 shrink-0">
            <div>
              <h2 className="text-[22px] font-semibold text-gray-900 tracking-[-0.015em] leading-tight">Ideas List</h2>
              <p className="text-[13px] text-gray-400 mt-0.5 font-normal">Your latest research proposals and ideas</p>
            </div>
            <div className="flex items-center gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search size={13.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search ideas…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 pr-3.5 h-9 w-56 border border-gray-200 rounded-lg text-[13px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d2d6b]/25 focus:border-[#0d2d6b]/40 transition-shadow"
                />
              </div>
              {/* Export */}
              <button
                onClick={() => toast.success("Export started", { description: `${rows.length} ideas exported.` })}
                className="flex items-center gap-1.5 h-9 px-4 border rounded-lg text-[13px] font-medium bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-gray-50/80 active:scale-[0.98] transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30"
                style={{ borderColor: "rgba(13,45,107,0.3)", color: NAVY }}
              >
                <Upload size={13} strokeWidth={2} />
                Export
              </button>
            </div>
          </div>

          {/* Tabs + pagination row */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center border-b border-gray-200 gap-0">
              {tabs.map(tab => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(tab.label as string)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border-b-[1.5px] -mb-px transition-colors duration-150 rounded-t-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30 ${
                    activeTab === tab.label
                      ? "border-[#0d2d6b] text-[#0d2d6b]"
                      : "border-transparent text-gray-400 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-[11px] px-[6px] py-px rounded-full font-semibold tabular-nums transition-colors duration-150 ${
                      activeTab === tab.label
                        ? "bg-[#0d2d6b] text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 text-[12.5px] text-gray-400">
              <button className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 active:scale-90 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30" disabled>
                <ChevronLeft size={14} />
              </button>
              <span className="px-1">Page 1 of 3</span>
              <button className="p-1 rounded hover:bg-gray-100 active:scale-90 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div
            ref={gridRef}
            tabIndex={0}
            onKeyDown={onGridKeyDown}
            className="flex-1 overflow-auto bg-white rounded-2xl border border-gray-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/20 transition-shadow"
          >
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="chrome-blur bg-gray-50/80 sticky top-0 z-20 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05),0_4px_6px_-4px_rgba(0,0,0,0.06)]">
                  {columns.map(col => {
                    const selected = colFilters[col.key] ?? [];
                    const isFiltered = selected.length > 0;
                    return (
                      <th
                        key={col.key}
                        className="text-left px-4 py-[11px] text-[10.5px] font-semibold text-gray-400 tracking-[0.07em] uppercase select-none whitespace-nowrap border-r border-gray-100/80 relative"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <button
                            onClick={() => handleSort(col.key)}
                            className={`flex items-center hover:text-gray-700 transition-colors duration-150 cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30 ${sortCol === col.key ? "text-[#0d2d6b]" : ""}`}
                          >
                            {col.label}
                            <SortIcon dir={sortCol === col.key ? sortDir : null} />
                          </button>
                          <button
                            onClick={() => setOpenFilter(o => (o === col.key ? null : col.key))}
                            title="Filter column"
                            className={`p-[3px] rounded-md transition-all duration-100 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30 ${isFiltered ? "text-[#0d2d6b] bg-[#0d2d6b]/8" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                          >
                            <Filter size={12} fill={isFiltered ? "currentColor" : "none"} />
                          </button>
                        </div>

                        {openFilter === col.key && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setOpenFilter(null)} />
                            <div className="pop-in surface-pop absolute right-0 top-full mt-1.5 z-40 w-56 bg-white border border-gray-200/80 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] py-1 normal-case tracking-normal font-normal">
                              <div className="flex items-center justify-between px-3.5 py-2 border-b border-gray-100">
                                <span className="text-[11.5px] font-semibold text-gray-600">Filter by {col.label.toLowerCase()}</span>
                                {isFiltered && (
                                  <button
                                    onClick={() => setColFilters(prev => ({ ...prev, [col.key]: [] }))}
                                    className="text-[11.5px] font-medium text-[#0d2d6b] hover:opacity-70 transition-opacity duration-100 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                              <div className="max-h-52 overflow-auto py-1">
                                {distinctValues(col.key).length === 0 && (
                                  <div className="px-3.5 py-2.5 text-[12px] text-gray-400">No values</div>
                                )}
                                {distinctValues(col.key).map(val => {
                                  const checked = selected.includes(val);
                                  return (
                                    <button
                                      key={val}
                                      onClick={() => toggleFilterValue(col.key, val)}
                                      className="flex items-center gap-2.5 w-full text-left px-3.5 py-[7px] text-[13px] text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0d2d6b]/30"
                                    >
                                      <span className={`flex items-center justify-center w-[15px] h-[15px] rounded-[4px] border transition-all duration-100 ${checked ? "text-white border-[#0d2d6b]" : "border-gray-300"}`}
                                        style={checked ? { backgroundColor: NAVY } : {}}>
                                        {checked && <Check size={9.5} strokeWidth={3} />}
                                      </span>
                                      {val}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </th>
                    );
                  })}
                  <th className="w-[72px] border-gray-100/80" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, ri) => {
                  const rowLocked = isLocked(row);
                  return (
                  <tr
                    key={`${row.uid}-${ri}`}
                    className={`group border-b border-gray-100/80 transition-colors duration-100 ${
                      rowLocked ? "bg-gray-50/60" : ri % 2 === 1 ? "bg-gray-50/30" : ""
                    } ${rowLocked ? "hover:bg-gray-50/80" : "hover:bg-[#0d2d6b]/[0.025]"}`}
                  >
                    {columns.map((col, ci) => {
                      const isSaving = savingSet.has(row.uid);
                      const isDirty = dirtySet.has(row.uid);
                      const indicator = ci === 0
                        ? isSaving ? "saving" : isDirty ? "dirty" : null
                        : null;
                      return (
                        <GridCell
                          key={col.key}
                          col={col}
                          value={row[col.key]}
                          locked={rowLocked}
                          active={active?.r === ri && active?.c === ci}
                          editing={isEditing && active?.r === ri && active?.c === ci}
                          seed={seed}
                          indicator={indicator}
                          onSelect={() => { setActive({ r: ri, c: ci }); setIsEditing(false); }}
                          onStartEdit={() => { setActive({ r: ri, c: ci }); startEdit(row[col.key]); }}
                          onCommit={(v, dir) => handleCommit(ri, ci, v, dir)}
                          onCancel={() => setIsEditing(false)}
                          onLocked={() => { setActive({ r: ri, c: ci }); notifyLocked(); }}
                        />
                      );
                    })}
                    <td className="px-2.5 py-[11px] whitespace-nowrap">
                      <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                        <RowMenu
                          row={row}
                          locked={rowLocked}
                          onEdit={r => { setActive({ r: ri, c: 0 }); startEdit(r[columns[0].key]); }}
                          onViewDetails={r => { setHistoryRow(null); setDetailRow(r); }}
                          onViewHistory={r => { setDetailRow(null); setHistoryRow(r); }}
                          onDuplicate={duplicateRow}
                          onDelete={deleteRow}
                        />
                      </div>
                    </td>
                  </tr>
                  );
                })}

                {/* Draft / add row */}
                <tr className="border-b border-gray-100/80 bg-[#0d2d6b]/[0.018]">
                  {columns.map((col, ci) => (
                    <GridCell
                      key={col.key}
                      col={col}
                      value={draft[col.key]}
                      placeholder={ci === 0 ? "+ Add new idea…" : ""}
                      active={active?.r === draftIndex && active?.c === ci}
                      editing={isEditing && active?.r === draftIndex && active?.c === ci}
                      seed={seed}
                      onSelect={() => { setActive({ r: draftIndex, c: ci }); setIsEditing(false); }}
                      onStartEdit={() => { setActive({ r: draftIndex, c: ci }); startEdit(draft[col.key]); }}
                      onCommit={(v, dir) => handleCommit(draftIndex, ci, v, dir)}
                      onCancel={() => setIsEditing(false)}
                    />
                  ))}
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer status bar */}
          <div className="flex items-center justify-between text-[12px] text-gray-400 px-0.5 shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setActive({ r: draftIndex, c: 0 }); startEdit(""); }}
                className="flex items-center gap-1.5 font-medium transition-all duration-100 hover:opacity-70 active:scale-95 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30"
                style={{ color: NAVY }}
              >
                <Plus size={13} strokeWidth={2.5} />
                Add row
              </button>
              <span className="text-gray-400/80">
                {sorted.length} {sorted.length === 1 ? "idea" : "ideas"}
                {(search || activeFilterCount > 0) && ` — filtered from ${rows.length}`}
                {activeFilterCount > 0 && ` · ${activeFilterCount} ${activeFilterCount === 1 ? "filter" : "filters"} active`}
              </span>
            </div>
            <span className="text-gray-400 text-[11.5px]">Double-click or type to edit · Tab / Enter to move · Del to clear</span>
          </div>

        </main>
      </div>

      <IdeaDetailPanel
        row={detailRow}
        onClose={() => setDetailRow(null)}
        onEdit={r => { setActive({ r: 0, c: 0 }); startEdit(r[columns[0].key]); }}
      />
      <IdeaHistoryPanel
        row={historyRow}
        onClose={() => setHistoryRow(null)}
      />
    </div>
  );
}
