import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

// One themed dropdown for the whole app — used by the Add/Edit study card (variant "field") and by
// the grid's inline cell editor (variant "cell"). It exists because a native <select>'s option popup
// can't be themed, which made values illegible in dark mode. The list is a position:fixed panel
// portalled to <body>, so neither the modal's transformed/overflow-hidden shell nor the grid's
// scroll container can clip it; it anchors to the trigger (spatial origin) and flips upward when
// there's no room below. Full keyboard support: ↑/↓/Home/End/Enter/Space/Esc/Tab.
export function SelectField({
  id,
  value,
  options,
  onChange,
  triggerRef,
  variant = "field",
  autoOpen = false,
  onRequestClose,
}: {
  id?: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  triggerRef?: (el: HTMLButtonElement | null) => void;
  // "field": rounded pill matching the modal's inputs. "cell": fills a grid cell (square, inset ring).
  variant?: "field" | "cell";
  // Open the list and focus the trigger on mount — used when the grid enters edit mode on this cell.
  autoOpen?: boolean;
  // Called when the list closes WITHOUT a selection (outside press, Tab, Escape). The grid uses this
  // to leave edit mode; the modal leaves it undefined so the trigger simply stays put.
  onRequestClose?: () => void;
}) {
  // "" is the cleared/placeholder row, shown as "—", always first.
  const items = ["", ...options];
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; top: number; width: number; flip: boolean } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const isCell = variant === "cell";

  const label = value === "" ? "—" : value;

  // Position the fixed panel against the trigger; flip up when the list would overflow the viewport.
  function place() {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const estimated = Math.min(items.length * 34 + 8, 260);
    const spaceBelow = window.innerHeight - r.bottom;
    const flip = spaceBelow < estimated + 12 && r.top > spaceBelow;
    setPos({ left: r.left, top: flip ? r.top : r.bottom, width: Math.max(r.width, 176), flip });
  }

  function openList() {
    const idx = Math.max(0, items.indexOf(value));
    setActive(idx);
    setOpen(true);
  }

  // Grid inline edit: open immediately and take focus so the keyboard drives it right away.
  useEffect(() => {
    if (!autoOpen) return;
    openList();
    const r = requestAnimationFrame(() => btnRef.current?.focus());
    return () => cancelAnimationFrame(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    // Reposition on scroll/resize, but coalesce to one rAF so we never force a synchronous layout
    // on every scroll event (which would jank the un-virtualized grid while a cell is being edited).
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        place();
      });
    };
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on any outside pointer press — a non-committal close, so let the host react (grid exits edit).
  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
      onRequestClose?.();
    }
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the active option scrolled into view as the highlight moves.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function commit(idx: number) {
    onChange(items[idx]);
    setOpen(false);
    btnRef.current?.focus();
  }

  function dismiss() {
    setOpen(false);
    onRequestClose?.();
    btnRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        openList();
      } else if (e.key === "Escape") {
        e.stopPropagation();
        onRequestClose?.();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive(a => Math.min(items.length - 1, a + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive(a => Math.max(0, a - 1));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(items.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(active);
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation(); // don't let a host Escape handler (e.g. the modal) also fire
        dismiss();
        break;
      case "Tab":
        dismiss();
        break;
    }
  }

  const triggerClass = isCell
    ? "w-full h-full pl-3 pr-2 flex items-center justify-between gap-2 text-[13px] text-left outline-none"
    : "w-full h-[36px] pl-3 pr-2.5 flex items-center justify-between gap-2 rounded-[12px] text-[13px] text-left focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-ring)] transition-shadow duration-100";

  const triggerStyle: React.CSSProperties = isCell
    ? {
        backgroundColor: "var(--surface)",
        color: value === "" ? "var(--text-4)" : "var(--text-1)",
        boxShadow: "0 0 0 2px var(--cell-ring) inset",
      }
    : {
        backgroundColor: "var(--fill-subtle)",
        color: value === "" ? "var(--text-4)" : "var(--text-1)",
        border: "1px solid var(--hairline)",
      };

  return (
    <>
      <button
        id={id}
        ref={el => {
          btnRef.current = el;
          triggerRef?.(el);
        }}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? dismiss() : openList())}
        onKeyDown={onKeyDown}
        className={triggerClass}
        style={triggerStyle}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          size={15}
          strokeWidth={2}
          className="shrink-0 transition-transform duration-200"
          style={{ color: "var(--text-3)", transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && pos && createPortal(
        <ul
          ref={listRef}
          role="listbox"
          className="fixed z-[9999] py-1 rounded-[14px] overflow-y-auto max-h-[260px] animate-[selectPop_0.14s_cubic-bezier(0.16,1,0.3,1)]"
          style={{
            left: pos.left,
            top: pos.flip ? undefined : pos.top + 6,
            bottom: pos.flip ? window.innerHeight - pos.top + 6 : undefined,
            width: pos.width,
            transformOrigin: pos.flip ? "bottom center" : "top center",
            backgroundColor: "var(--surface-modal)",
            border: "1px solid var(--hairline)",
            boxShadow: "0 18px 44px -12px rgba(15,23,42,0.36), 0 0 0 1px var(--hairline)",
          }}
        >
          {items.map((opt, idx) => {
            const selected = opt === value;
            const isActive = idx === active;
            return (
              <li
                key={opt || "__empty"}
                role="option"
                aria-selected={selected}
                data-idx={idx}
                onMouseEnter={() => setActive(idx)}
                onClick={() => commit(idx)}
                className="mx-1 px-2.5 h-[30px] flex items-center justify-between gap-2 rounded-[9px] text-[13px] cursor-pointer"
                style={{
                  color: opt === "" ? "var(--text-3)" : "var(--text-1)",
                  backgroundColor: isActive ? "var(--fill-subtle)" : "transparent",
                }}
              >
                <span className="truncate">{opt === "" ? "—" : opt}</span>
                {selected && <Check size={14} strokeWidth={2.5} className="shrink-0" style={{ color: "var(--accent)" }} />}
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </>
  );
}
