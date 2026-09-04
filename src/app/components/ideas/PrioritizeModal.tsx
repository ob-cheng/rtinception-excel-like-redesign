import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, Briefcase, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, GripVertical, Layers, X } from "lucide-react";
import type { Idea, RankingConfig, RankPersona } from "../../types";
import { compareCells } from "../../lib/format";
import { PORTFOLIO_ABBR } from "../../data/portfolios";

type Step = "persona" | "scope" | "reorder";

// One surface, three steps. The shell stays mounted across persona → scope → reorder and
// animates its width/height so the card appears to grow and shrink rather than flash away
// and reappear. Only the inner content swaps (with a gentle fade), never the container.
export function PrioritizeModal({
  open,
  rows,
  currentPortfolio,
  onClose,
  onCommit,
}: {
  open: boolean;
  rows: Idea[];
  currentPortfolio: string;
  onClose: () => void;
  onCommit: (config: RankingConfig, orderedUids: string[]) => void;
}) {
  const [visible, setVisible] = useState(false);
  // Stay mounted through the close so the entrance transition can play in reverse (§7 — exit
  // mirrors enter) instead of the card blinking out of existence.
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("persona");
  const [persona, setPersona] = useState<RankPersona | null>(null);
  const [scope, setScope] = useState<string | null>(null);
  const [order, setOrder] = useState<Idea[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Reset to the first step every time the modal is (re)opened.
  useEffect(() => {
    if (open) {
      setMounted(true);
      setStep("persona");
      setPersona(null);
      setScope(null);
      setOrder([]);
      setActiveId(null);
    } else {
      // Play the exit, then unmount once it has settled.
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 380);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Reveal only after the mounted-but-invisible frame has painted, so the entrance actually
  // transitions from scale(0.96)/opacity 0. Driving setVisible in the effect above would batch
  // with setMounted and mount the card already visible — no animation.
  useEffect(() => {
    if (!open || !mounted) return;
    const r = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(r);
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const products = useMemo(() => {
    const inScope = currentPortfolio === "All" ? rows : rows.filter(r => r.portfolio === currentPortfolio);
    const byProject = new Map<string, { count: number; portfolio: string }>();
    for (const r of inScope) {
      if (!r.project) continue;
      const cur = byProject.get(r.project);
      if (cur) cur.count += 1;
      else byProject.set(r.project, { count: 1, portfolio: r.portfolio });
    }
    return Array.from(byProject.entries())
      .map(([name, meta]) => ({ name, ...meta }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, currentPortfolio]);

  const portfolios = useMemo(() => {
    const byPortfolio = new Map<string, number>();
    for (const r of rows) {
      if (!r.portfolio) continue;
      byPortfolio.set(r.portfolio, (byPortfolio.get(r.portfolio) ?? 0) + 1);
    }
    const entries = currentPortfolio === "All"
      ? Array.from(byPortfolio.entries())
      : Array.from(byPortfolio.entries()).filter(([name]) => name === currentPortfolio);
    return entries.map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, currentPortfolio]);

  // How many records each product has — the denominator in "Brand #N of M" on the cards.
  const projectCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) if (r.project) m.set(r.project, (m.get(r.project) ?? 0) + 1);
    return m;
  }, [rows]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Small movement required before drag activates — lets button clicks inside the card work.
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── Size animation ────────────────────────────────────────────────────────
  const shellRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // FLIP for button-driven reorders: capture card rects before the order changes, then animate
  // each card from its old position to its new one. Drag already animates via dnd-kit, so we
  // only arm this when a chevron nudge fires (shouldFlip), never after a drop.
  const listRef = useRef<HTMLUListElement>(null);
  const prevRects = useRef<Map<string, DOMRect>>(new Map());
  const shouldFlip = useRef(false);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Target width per step. Reorder is roomier; persona/scope stay compact. All in px so the
  // width transition interpolates smoothly (min()/calc() targets don't animate reliably).
  const targetWidth = step === "reorder" ? Math.min(720, vw - 48) : Math.min(520, vw - 48);

  // Measure the natural content height and mirror it onto the shell so height animates too.
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el || !open) return;
    const measure = () => setSize({ w: targetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, targetWidth, order.length]);

  // Enable the size transition only after the first measurement so opening doesn't animate from 0.
  useEffect(() => {
    if (open && size && !ready) requestAnimationFrame(() => setReady(true));
    if (!open) setReady(false);
  }, [open, size, ready]);

  // Run the FLIP right after the DOM reflects the new order. Read each card's live position,
  // invert it back to where it was, then spring it home — so a chevron click glides exactly
  // like a drag instead of snapping.
  useLayoutEffect(() => {
    if (!shouldFlip.current) return;
    shouldFlip.current = false;
    const ul = listRef.current;
    if (!ul) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    ul.querySelectorAll<HTMLElement>("[data-uid]").forEach((el) => {
      const uid = el.dataset.uid;
      const prev = uid ? prevRects.current.get(uid) : undefined;
      if (!prev) return;
      const next = el.getBoundingClientRect();
      const dy = prev.top - next.top;
      if (!dy) return;
      el.animate(
        [{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }],
        { duration: 420, easing: "cubic-bezier(0.16,1,0.3,1)" },
      );
    });
  }, [order]);

  if (!mounted) return null;

  const options = persona === "brand" ? products : portfolios;
  const fieldLabel = persona === "brand" ? "Brand Ranking" : "TA Priority";
  const showBrand = persona === "portfolio";
  const activeRow = activeId ? (order.find(r => r.uid === activeId) ?? null) : null;
  const activeIndex = activeId ? order.findIndex(r => r.uid === activeId) : -1;

  function scopeRows(p: RankPersona, s: string): Idea[] {
    const inScope = p === "brand" ? (r: Idea) => r.project === s : (r: Idea) => r.portfolio === s;
    const field = p === "brand" ? "brandRanking" : "areaPrioritization";
    return rows.filter(inScope).sort((a, b) => compareCells(a[field], b[field], "asc"));
  }

  function pickPersona(p: RankPersona) {
    setPersona(p);
    setStep("scope");
  }

  function pickScope(s: string) {
    setScope(s);
    if (persona) setOrder(scopeRows(persona, s));
    setStep("reorder");
  }

  function goBack() {
    if (step === "reorder") setStep("scope");
    else if (step === "scope") { setPersona(null); setStep("persona"); }
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) {
      setOrder(prev => {
        const from = prev.findIndex(r => r.uid === active.id);
        const to = prev.findIndex(r => r.uid === over.id);
        return arrayMove(prev, from, to);
      });
    }
    setActiveId(null);
  }

  function nudge(from: number, dir: number) {
    const to = from + dir;
    if (to < 0 || to >= order.length) return;
    // Snapshot positions before the reorder, then arm the FLIP so the swap animates.
    const rects = new Map<string, DOMRect>();
    listRef.current?.querySelectorAll<HTMLElement>("[data-uid]").forEach((el) => {
      if (el.dataset.uid) rects.set(el.dataset.uid, el.getBoundingClientRect());
    });
    prevRects.current = rects;
    shouldFlip.current = true;
    setOrder(prev => arrayMove(prev, from, to));
  }

  const header = step === "persona"
    ? { title: "Prioritize records", sub: "What's your role?" }
    : step === "scope"
      ? persona === "brand"
        ? { title: "Choose a product", sub: "Tap to begin prioritizing this product's records." }
        : { title: "Choose a portfolio", sub: "Tap to begin prioritizing this portfolio." }
      : { title: scope ?? "", sub: "Drag cards to reorder · top card is highest priority" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop — separate layer so the shell itself has no backdrop-filter. That matters:
          filter/backdrop-filter on an ancestor would re-anchor the drag overlay's fixed
          positioning and make the dragged card jump. */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      <div
        ref={shellRef}
        role="dialog"
        aria-modal="true"
        aria-label="Prioritize records"
        className="relative flex flex-col rounded-[20px] overflow-hidden"
        style={{
          backgroundColor: "var(--surface-modal)",
          width: size ? size.w : targetWidth,
          height: size ? size.h : "auto",
          maxHeight: "90vh",
          boxShadow: "0 32px 80px -16px rgba(15,23,42,0.42), 0 0 0 1px var(--hairline)",
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1) translateY(0)" : "scale(0.96) translateY(12px)",
          transition: ready
            ? "width 0.4s cubic-bezier(0.16,1,0.3,1), height 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.26s ease, transform 0.36s cubic-bezier(0.16,1,0.3,1)"
            : "opacity 0.26s ease, transform 0.36s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Measured content — its natural height drives the shell height. */}
        <div ref={contentRef} className="flex flex-col" style={{ maxHeight: "90vh" }}>
          {/* Header */}
          <div
            className="shrink-0 flex items-start justify-between gap-4 px-6 pt-5 pb-4"
            style={{ borderBottom: "1px solid var(--hairline)" }}
          >
            <div className="min-w-0">
              {step === "reorder" && (
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-flex items-center h-[20px] px-2 rounded-full text-[11px] font-medium text-white tracking-wide"
                    style={{ backgroundColor: "var(--accent-strong)" }}
                  >
                    {persona === "brand" ? "Brand Director" : "Therapeutic Area VP"}
                  </span>
                  <span className="text-[12px]" style={{ color: "var(--text-3)" }}>Setting {fieldLabel}</span>
                </div>
              )}
              <h2 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em] truncate">{header.title}</h2>
              <p className="text-[13px] mt-0.5" style={{ color: "var(--text-3)" }}>{header.sub}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 -mr-1 grid place-items-center w-8 h-8 rounded-full text-gray-400 dark:text-gray-400 bg-gray-100/70 dark:bg-white/[0.06] hover:bg-gray-200/70 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-200 active:scale-95 transition-all duration-100"
            >
              <X size={15} strokeWidth={2.25} />
            </button>
          </div>

          {/* Body — keyed by step so each entrance fades/slides in gently. */}
          <div key={step} className="step-fade flex-1 min-h-0 flex flex-col">
            {step === "persona" && (
              <div className="px-6 py-6 grid grid-cols-2 gap-3">
                <PersonaCard
                  icon={<Eye size={20} strokeWidth={1.9} />}
                  title="Brand Director"
                  subtitle="Prioritize one product's records"
                  onClick={() => pickPersona("brand")}
                />
                <PersonaCard
                  icon={<Briefcase size={20} strokeWidth={1.9} />}
                  title="Therapeutic Area VP"
                  subtitle="Prioritize a whole portfolio"
                  onClick={() => pickPersona("portfolio")}
                />
              </div>
            )}

            {step === "scope" && (
              <div className="overflow-y-auto px-3 py-3" style={{ maxHeight: "calc(90vh - 200px)" }}>
                {options.length === 0 ? (
                  <p className="px-3 py-8 text-center text-[13px] text-gray-400 dark:text-gray-400">No records available to prioritize.</p>
                ) : (
                  <ul className="flex flex-col">
                    {options.map(opt => (
                      <li key={opt.name}>
                        <button
                          onClick={() => pickScope(opt.name)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:bg-black/[0.07] dark:active:bg-white/10 transition-colors duration-100"
                        >
                          <span className="shrink-0 grid place-items-center w-9 h-9 rounded-[12px] text-white" style={{ backgroundColor: "var(--accent-strong)" }}>
                            {persona === "brand"
                              ? <Eye size={16} strokeWidth={2} />
                              : <span className="text-[11px] font-semibold tracking-wide">{PORTFOLIO_ABBR[opt.name] ?? <Layers size={16} />}</span>}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14px] text-gray-900 dark:text-gray-100 truncate">{opt.name}</span>
                            <span className="block text-[12px]" style={{ color: "var(--text-3)" }}>
                              {opt.count} record{opt.count === 1 ? "" : "s"}
                              {persona === "brand" && currentPortfolio === "All" && "portfolio" in opt
                                ? ` · ${(opt as { portfolio: string }).portfolio}`
                                : ""}
                            </span>
                          </span>
                          <ChevronRight size={16} className="shrink-0 text-gray-300 dark:text-gray-500" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {step === "reorder" && (
              <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: "calc(90vh - 220px)" }}>
                {order.length === 0 ? (
                  <p className="py-12 text-center text-[13px] text-gray-400 dark:text-gray-400">No records to prioritize.</p>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={order.map(r => r.uid)} strategy={verticalListSortingStrategy}>
                      <ul ref={listRef} className="flex flex-col gap-2">
                        {order.map((row, index) => (
                          <SortableCard
                            key={row.uid}
                            row={row}
                            index={index}
                            total={order.length}
                            showBrand={showBrand}
                            brandTotal={projectCounts.get(row.project)}
                            brandColor={brandHue(row.project)}
                            onNudge={dir => nudge(index, dir)}
                          />
                        ))}
                      </ul>
                    </SortableContext>

                    {/* Portal the overlay to <body> so it escapes this shell. The shell uses a
                        transform for its entrance/resize, which would otherwise re-anchor the
                        overlay's fixed positioning and offset the dragged card. */}
                    {createPortal(
                      <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.16,1,0.3,1)" }}>
                        {activeRow ? (
                          <PriorityCard
                            row={activeRow}
                            index={activeIndex}
                            total={order.length}
                            showBrand={showBrand}
                            brandTotal={projectCounts.get(activeRow.project)}
                            brandColor={brandHue(activeRow.project)}
                            isOverlay
                          />
                        ) : null}
                      </DragOverlay>,
                      document.body,
                    )}
                  </DndContext>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="shrink-0 flex items-center justify-between gap-3 px-6 py-4"
            style={{ borderTop: "1px solid var(--hairline)" }}
          >
            {step === "persona" ? (
              <span />
            ) : (
              <button
                onClick={goBack}
                className="inline-flex items-center gap-1 text-[13px] text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-100"
              >
                <ChevronLeft size={15} /> Back
              </button>
            )}

            {step === "reorder" ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="h-[36px] px-5 rounded-full text-[13px] font-medium text-gray-600 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-[0.98] transition-all duration-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => persona && scope && onCommit({ persona, scope }, order.map(r => r.uid))}
                  disabled={order.length === 0}
                  className="h-[36px] px-6 rounded-full text-white text-[13px] font-medium active:scale-[0.99] transition-all duration-100 disabled:opacity-40"
                  style={{ backgroundColor: "var(--accent-strong)" }}
                >
                  Save priorities
                </button>
              </div>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonaCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-3 p-4 rounded-[16px] text-left bg-white/70 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-[#1f1f21] active:scale-[0.98] transition-all duration-100"
      style={{ border: "1px solid var(--hairline)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
    >
      <span className="grid place-items-center w-11 h-11 rounded-[12px]" style={{ backgroundColor: "color-mix(in srgb, var(--accent) 16%, transparent)", color: "var(--accent)" }}>
        {icon}
      </span>
      <span>
        <span className="block text-[15px] font-medium text-gray-900 dark:text-gray-100">{title}</span>
        <span className="block text-[12px] mt-0.5" style={{ color: "var(--text-3)" }}>{subtitle}</span>
      </span>
    </button>
  );
}

// setNodeRef + attributes + listeners all on the same <li> so the whole card is the drag
// target and the overlay's origin matches exactly where the drag started.
function SortableCard({
  row,
  index,
  total,
  showBrand,
  brandTotal,
  brandColor,
  onNudge,
}: {
  row: Idea;
  index: number;
  total: number;
  showBrand: boolean;
  brandTotal?: number;
  brandColor?: string;
  onNudge: (dir: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.uid });

  return (
    <li
      ref={setNodeRef}
      data-uid={row.uid}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? "transform 240ms cubic-bezier(0.16,1,0.3,1)",
        opacity: isDragging ? 0 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
        listStyle: "none",
        outline: "none",
      }}
    >
      <PriorityCard row={row} index={index} total={total} showBrand={showBrand} brandTotal={brandTotal} brandColor={brandColor} onNudge={onNudge} />
    </li>
  );
}

// The rank badge encodes priority as a continuous quantity, not a single highlighted "1".
// Intensity ramps from full navy at the top of the stack to a faint tint at the bottom, so a
// glance tells you roughly where a card sits. The top three also carry a subtle emphasis ring.
function rankVisual(index: number, total: number) {
  const t = total <= 1 ? 0 : index / (total - 1); // 0 = top priority, 1 = bottom
  const alpha = 1 - t * 0.7; // 1.0 → 0.30 — keep a readable floor so the fill never washes out
  // Ramp the accent token itself (via color-mix) so the badge stays the right blue in
  // both themes — a fixed navy would sink into the dark surface at low alpha.
  const pct = (alpha * 100).toFixed(1);
  return {
    backgroundColor: `color-mix(in srgb, var(--accent-strong) ${pct}%, transparent)`,
    // The number is legible at every rank: white sits on the strong fills, and once the
    // fill fades past the midpoint the digit switches to the max-contrast text token
    // (near-white in dark, near-black in light) so it never disappears into a faint wash.
    color: alpha > 0.5 ? "var(--on-accent)" : "var(--text-1)",
    boxShadow: "0 0 0 1px color-mix(in srgb, var(--accent-strong) 22%, transparent)",
  };
}

// A stable, low-saturation hue per brand so records from the same product are groupable even
// when a Portfolio Director has interleaved several brands into one list.
function brandHue(name: string): string {
  if (!name) return "#c7c7cc";
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h}, 52%, 52%)`;
}

// Shared card between list and DragOverlay. Layout order: ATP → Claims → Metrics.
function PriorityCard({
  row,
  index,
  total,
  showBrand,
  brandTotal,
  brandColor,
  isOverlay,
  onNudge,
}: {
  row: Idea;
  index: number;
  total: number;
  showBrand: boolean;
  brandTotal?: number;
  brandColor?: string;
  isOverlay?: boolean;
  onNudge?: (dir: number) => void;
}) {
  // The brand's own verdict on this record — the expert signal the portfolio ranker weighs.
  const brandRankNum = parseInt(row.brandRanking, 10);
  const hasBrandRank = Number.isFinite(brandRankNum);
  return (
    <div
      className="relative flex items-center gap-3 px-4 py-3 rounded-[12px] bg-white dark:bg-[#1f1f21] select-none"
      style={{
        border: isOverlay ? "1px solid rgba(13,45,107,0.15)" : "1px solid var(--hairline)",
        boxShadow: isOverlay
          ? "0 24px 60px -12px rgba(15,23,42,0.45), 0 2px 8px rgba(0,0,0,0.1)"
          : "0 1px 3px rgba(0,0,0,0.05)",
        transform: isOverlay ? "scale(1.02)" : undefined,
        cursor: isOverlay ? "grabbing" : undefined,
      }}
    >
      <div className="shrink-0 flex flex-col items-center gap-1.5">
        <span
          className="grid place-items-center w-7 h-7 rounded-full text-[12px] font-semibold tabular-nums transition-colors duration-300"
          style={rankVisual(index, total)}
        >
          {index + 1}
        </span>
        <GripVertical size={13} strokeWidth={1.6} style={{ color: "var(--text-4)" }} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          {row.atpProduct ? (
            <span className="text-[11px] font-medium tracking-wide truncate" style={{ color: "var(--text-3)" }}>
              ATP: {row.atpProduct}
            </span>
          ) : null}
          {row.pathway ? (
            <span className="shrink-0 text-[11px] font-medium tracking-wide truncate" style={{ color: "var(--text-3)" }}>
              Pathway: {row.pathway}
            </span>
          ) : null}
          {/* Brand verdict tag. Deliberately calm and neutral: the navy heat badge on the left
              owns the priority you're *setting*; this tag reports the brand's *own* ranking. The
              brand color is the only accent — it ties the tag to the card's edge rail — and the
              rank reads as plain, legible type rather than a second heat scale competing with the
              first. Craft + Simplicity: two ranking systems, two clearly different visual voices. */}
          {showBrand && row.project ? (
            <span
              className="shrink-0 inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-[3px] rounded-full"
              style={{ background: "var(--fill-subtle)" }}
              title={hasBrandRank ? `${row.project} ranks this #${brandRankNum}${brandTotal ? ` of ${brandTotal}` : ""}` : row.project}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: brandColor ?? brandHue(row.project) }} />
              <span className="text-[11.5px] font-medium tracking-[-0.01em] text-gray-700 dark:text-gray-200 truncate max-w-[150px]">
                {row.project}
              </span>
              {hasBrandRank ? (
                <span
                  className="shrink-0 inline-flex items-baseline gap-[3px] pl-1.5 ml-0.5"
                  style={{ borderLeft: "1px solid var(--hairline)" }}
                >
                  <span className="text-[10px]" style={{ color: "var(--text-3)" }}>brand</span>
                  <span className="text-[11.5px] font-semibold tabular-nums text-gray-800 dark:text-gray-100">#{brandRankNum}</span>
                  {brandTotal && brandTotal > 0 ? (
                    <span className="text-[10px] tabular-nums" style={{ color: "var(--text-4)" }}>/ {brandTotal}</span>
                  ) : null}
                </span>
              ) : null}
            </span>
          ) : null}
        </div>

        <p
          className="text-[13.5px] leading-[1.42] text-gray-800 dark:text-gray-100 mb-1.5"
          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          title={row.potentialClaims}
        >
          {row.potentialClaims || <span className="italic" style={{ color: "var(--text-4)" }}>No claims defined</span>}
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <Metric label="POS" value={row.pos} />
          <Metric label="Total Budget" value={row.totalCost} />
          <Metric label="2027" value={row.total2027Cost} />
        </div>
      </div>

      {!isOverlay && onNudge && (
        <div className="shrink-0 flex flex-col gap-0.5" onPointerDown={e => e.stopPropagation()}>
          <button
            onClick={() => onNudge(-1)}
            disabled={index === 0}
            aria-label="Move up"
            className="grid place-items-center w-7 h-7 rounded-[8px] text-gray-400 dark:text-gray-400 hover:bg-black/[0.06] dark:hover:bg-white/[0.06] hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-20 disabled:hover:bg-transparent active:scale-90 transition-all duration-100"
          >
            <ChevronUp size={14} strokeWidth={2.2} />
          </button>
          <button
            onClick={() => onNudge(1)}
            disabled={index === total - 1}
            aria-label="Move down"
            className="grid place-items-center w-7 h-7 rounded-[8px] text-gray-400 dark:text-gray-400 hover:bg-black/[0.06] dark:hover:bg-white/[0.06] hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-20 disabled:hover:bg-transparent active:scale-90 transition-all duration-100"
          >
            <ChevronDown size={14} strokeWidth={2.2} />
          </button>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-4)" }}>{label}</span>
      <span className="text-[12px] font-medium text-gray-700 dark:text-gray-200 tabular-nums">{value || "—"}</span>
    </span>
  );
}
