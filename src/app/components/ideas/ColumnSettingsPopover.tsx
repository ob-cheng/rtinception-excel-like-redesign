import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Columns3, ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, Lock, RotateCcw, Snowflake } from "lucide-react";
import { toast } from "sonner";
import type { Idea, ViewKey } from "../../types";
import { columns as allColumns } from "../../data/columns";

const LABELS = new Map(allColumns.map(c => [c.key, c.label]));

// "Customize columns" — a self-contained header control (trigger + glass popover). It edits the
// current view only. Three independent jobs, one calm surface: drag to reorder, pin to freeze,
// and toggle visibility. Freeze and visibility are per-column (by identity) and orthogonal to
// order — toggling never moves a column, so columns can be interleaved freely and each keeps its
// state wherever it's dragged. Hiding a column removes it from the grid and disables its freeze
// pin (a hidden column can't be frozen). UID is the fixed spine, outside the list — always shown.
export function ColumnSettingsPopover({
  view,
  order,
  frozen,
  hidden,
  onReorder,
  onTogglePin,
  onToggleHidden,
  onReset,
}: {
  view: ViewKey;
  order: (keyof Idea)[];
  frozen: (keyof Idea)[];
  hidden: (keyof Idea)[];
  onReorder: (order: (keyof Idea)[]) => void;
  onTogglePin: (key: keyof Idea) => void;
  onToggleHidden: (key: keyof Idea) => void;
  onReset: () => void;
}) {
  const frozenSet = new Set(frozen);
  const hiddenSet = new Set(hidden);
  const [open, setOpen] = useState(false);
  // Play the pop-out before unmounting, so the popover exits along its entry path (§7 / parity
  // with the kebab menu). requestClose flips to pop-out; animationend does the real unmount.
  const [closing, setClosing] = useState(false);
  const requestClose = useCallback(() => setClosing(true), []);
  const finishClose = useCallback(() => { setOpen(false); setClosing(false); }, []);

  useEffect(() => {
    if (!open || closing) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") requestClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closing, requestClose]);

  // Fallback: unmount even if pop-out animationend never fires (animations disabled).
  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(finishClose, 220);
    return () => window.clearTimeout(t);
  }, [closing, finishClose]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = order.indexOf(active.id as keyof Idea);
    const to = order.indexOf(over.id as keyof Idea);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(order, from, to));
  }

  function nudge(index: number, dir: -1 | 1) {
    const to = index + dir;
    if (to < 0 || to >= order.length) return;
    onReorder(arrayMove(order, index, to));
  }

  function handleReset() {
    onReset();
    toast(`Columns reset · ${view}`, { description: "Order, frozen, and hidden columns restored to default." });
  }

  return (
    <div className="relative">
      {/* Trigger — mirrors the Prioritize button so the cluster reads as one set of controls. */}
      <button
        onPointerDown={() => {
          if (open && !closing) requestClose();
          else { setClosing(false); setOpen(true); }
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex items-center justify-center gap-1.5 h-[34px] px-4 min-w-[112px] rounded-full text-[13px] font-medium active:scale-[0.97] transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)]"
        style={{
          backgroundColor: open ? "var(--surface-2)" : "var(--surface)",
          color: "var(--text-2)",
          border: "1px solid var(--hairline)",
          boxShadow: open ? "0 2px 6px rgba(0,0,0,0.08)" : "0 1px 2px rgba(0,0,0,0.04)",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = "var(--surface-2)";
          e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
        }}
        onMouseLeave={e => {
          // Keep the lifted look while the popover is open; otherwise return to rest.
          e.currentTarget.style.backgroundColor = open ? "var(--surface-2)" : "var(--surface)";
          e.currentTarget.style.boxShadow = open ? "0 2px 6px rgba(0,0,0,0.08)" : "0 1px 2px rgba(0,0,0,0.04)";
        }}
      >
        <Columns3 size={13} strokeWidth={2.1} />
        Columns
      </button>

      {open && (
        <>
          {/* Invisible click-away scrim. */}
          <div className="fixed inset-0 z-40" onPointerDown={requestClose} />

          <div
            role="dialog"
            aria-label={`Customize columns · ${view}`}
            onAnimationEnd={() => { if (closing) finishClose(); }}
            className={`${closing ? "pop-out" : "pop-in"} absolute right-0 top-full mt-1.5 z-50 w-[320px] rounded-[16px] p-2`}
            style={{
              transformOrigin: "top right",
              backgroundColor: "var(--surface-raised)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid var(--hairline)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-2 pt-1 pb-2.5">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>Columns</p>
                <p className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>Drag to reorder · pin to freeze · hide to remove</p>
              </div>
              <button
                onClick={handleReset}
                className="shrink-0 inline-flex items-center gap-1 h-[26px] px-2 rounded-[8px] text-[12px] active:scale-[0.96] transition-all duration-100"
                style={{ color: "var(--text-2)" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--fill-subtle)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <RotateCcw size={12} strokeWidth={2.1} />
                Reset
              </button>
            </div>

            <div className="h-px mx-1 mb-1.5" style={{ backgroundColor: "var(--hairline-soft)" }} />

            <div className="max-h-[min(60vh,440px)] overflow-y-auto px-0.5 pb-0.5">
              {/* UID spine — always first, never reorderable, never freezes. */}
              <div
                className="flex items-center gap-2.5 px-2.5 h-[40px] rounded-[12px] mb-1"
                style={{ backgroundColor: "var(--fill-subtle)" }}
              >
                <Lock size={12} strokeWidth={2} style={{ color: "var(--text-4)" }} />
                <span className="flex-1 text-[13px]" style={{ color: "var(--text-3)" }}>UID</span>
                <span className="text-[10px] tracking-wide uppercase" style={{ color: "var(--text-4)" }}>Fixed</span>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={order as string[]} strategy={verticalListSortingStrategy}>
                  <ul className="flex flex-col gap-1">
                    {order.map((key, i) => (
                      <SortableColumnRow
                        key={key}
                        id={key as string}
                        label={LABELS.get(key) ?? String(key)}
                        frozen={frozenSet.has(key)}
                        hidden={hiddenSet.has(key)}
                        canUp={i > 0}
                        canDown={i < order.length - 1}
                        onUp={() => nudge(i, -1)}
                        onDown={() => nudge(i, 1)}
                        onTogglePin={() => onTogglePin(key)}
                        onToggleHidden={() => onToggleHidden(key)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// A draggable column row. Left: freeze pin (primary, always visible) + grip. Then label.
// Right: up/down reorder nudges (revealed on hover). Frozen rows carry a soft tint + a filled
// snowflake so each stays individually legible.
function SortableColumnRow({
  id,
  label,
  frozen,
  hidden,
  canUp,
  canDown,
  onUp,
  onDown,
  onTogglePin,
  onToggleHidden,
}: {
  id: string;
  label: string;
  frozen: boolean;
  hidden: boolean;
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
  onTogglePin: () => void;
  onToggleHidden: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? "transform 220ms cubic-bezier(0.16,1,0.3,1)",
        opacity: isDragging ? 0.6 : 1,
        touchAction: "none",
        listStyle: "none",
        // Hidden wins over frozen visually (a hidden column can't be frozen), so no tint when hidden.
        backgroundColor: !hidden && frozen ? "color-mix(in srgb, var(--accent) 7%, transparent)" : "transparent",
      }}
      className="group relative flex items-center gap-1 pl-1.5 pr-1.5 h-[40px] rounded-[12px]"
    >
      {/* Freeze pin — disabled while hidden, since an off-screen column can't be frozen. */}
      <button
        onClick={onTogglePin}
        disabled={hidden}
        aria-label={frozen ? `Unfreeze ${label}` : `Freeze ${label}`}
        aria-pressed={frozen}
        title={hidden ? "Show the column to freeze it" : frozen ? "Frozen — click to unfreeze" : "Freeze this column"}
        className="grid place-items-center w-7 h-7 rounded-[8px] shrink-0 active:scale-90 transition-all duration-100 disabled:opacity-30 disabled:pointer-events-none"
        style={{ color: frozen ? "var(--accent)" : "var(--text-4)" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--fill-subtle)")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <Snowflake size={14} strokeWidth={frozen ? 2.4 : 1.9} fill={frozen ? "currentColor" : "none"} />
      </button>

      <button
        {...attributes}
        {...listeners}
        aria-label={`Drag ${label}`}
        className="grid place-items-center w-6 h-7 rounded-[8px] shrink-0 cursor-grab active:cursor-grabbing"
        style={{ color: "var(--text-4)", touchAction: "none" }}
      >
        <GripVertical size={14} strokeWidth={1.8} />
      </button>

      <span
        className="flex-1 min-w-0 truncate text-[13px] transition-opacity duration-100"
        style={{ color: "var(--text-1)", opacity: hidden ? 0.4 : 1 }}
      >
        {label}
      </span>

      {/* Visibility toggle — always visible (primary control alongside freeze). */}
      <button
        onClick={onToggleHidden}
        aria-label={hidden ? `Show ${label}` : `Hide ${label}`}
        aria-pressed={hidden}
        title={hidden ? "Hidden — click to show" : "Hide this column"}
        className="grid place-items-center w-7 h-7 rounded-[8px] shrink-0 active:scale-90 transition-all duration-100"
        style={{ color: hidden ? "var(--accent)" : "var(--text-4)" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--fill-subtle)")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        {hidden ? <EyeOff size={14} strokeWidth={2.1} /> : <Eye size={14} strokeWidth={1.9} />}
      </button>

      <span className="inline-flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
        <button
          onClick={onUp}
          disabled={!canUp}
          aria-label={`Move ${label} up`}
          className="grid place-items-center w-6 h-7 rounded-[8px] disabled:opacity-20 active:scale-90 transition-all duration-100"
          style={{ color: "var(--text-3)" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--fill-subtle)")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <ChevronUp size={13} strokeWidth={2.2} />
        </button>
        <button
          onClick={onDown}
          disabled={!canDown}
          aria-label={`Move ${label} down`}
          className="grid place-items-center w-6 h-7 rounded-[8px] disabled:opacity-20 active:scale-90 transition-all duration-100"
          style={{ color: "var(--text-3)" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--fill-subtle)")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <ChevronDown size={13} strokeWidth={2.2} />
        </button>
      </span>
    </li>
  );
}
