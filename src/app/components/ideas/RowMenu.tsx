import { useCallback, useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { Idea } from "../../types";
import { RowMenuItems } from "./RowMenuItems";

export function RowMenu({
  row,
  onEdit,
  onViewDetails,
  onViewHistory,
  onToggleFound,
  onDuplicate,
  onDelete,
}: {
  row: Idea;
  onEdit: (row: Idea) => void;
  onViewDetails: (row: Idea) => void;
  onViewHistory: (row: Idea) => void;
  onToggleFound: (row: Idea) => void;
  onDuplicate: (row: Idea) => void;
  onDelete: (row: Idea) => void;
}) {
  const [open, setOpen] = useState(false);
  // Play the dematerialize before unmounting the panel, so the kebab menu exits the way it
  // entered — the same pop path the right-click menu uses (§7 / Familiarity).
  const [closing, setClosing] = useState(false);
  const requestClose = useCallback(() => setClosing(true), []);
  const finishClose = useCallback(() => { setOpen(false); setClosing(false); }, []);

  // Fallback: unmount even if the pop-out animationend never fires (animations disabled).
  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(finishClose, 220);
    return () => window.clearTimeout(t);
  }, [closing, finishClose]);

  // Behavioral parity with the right-click twin (Familiarity §16): Escape closes, and the
  // first item takes focus on open so keyboard users can act immediately.
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || closing) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") requestClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closing, requestClose]);

  return (
    <div className="relative">
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Row actions"
        onPointerDown={e => {
          e.stopPropagation();
          if (open && !closing) requestClose();
          else { setClosing(false); setOpen(true); }
        }}
        // Keyboard activation: pointerdown never fires from Enter/Space, so wire the same toggle
        // here. Keyboard use never triggers the pointerdown dismiss-scrim, so there's no double-fire.
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (open && !closing) requestClose();
            else { setClosing(false); setOpen(true); }
          }
        }}
        className="p-1.5 rounded-[8px] active:scale-95 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)]"
        style={{ color: "var(--text-3)" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--hairline)")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}
      >
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onPointerDown={requestClose} />
          <div
            ref={menuRef}
            role="menu"
            onAnimationEnd={() => { if (closing) finishClose(); }}
            className={`${closing ? "pop-out" : "pop-in"} surface-pop absolute right-0 top-full mt-1.5 z-50 w-52 rounded-[16px] py-1.5 overflow-hidden`}
            style={{
              backgroundColor: "var(--surface-raised)",
              backdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid var(--hairline)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <RowMenuItems
              row={row}
              actions={{ onEdit, onViewDetails, onViewHistory, onToggleFound, onDuplicate, onDelete }}
              onAfterAction={requestClose}
            />
          </div>
        </>
      )}
    </div>
  );
}
