import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Idea } from "../../types";
import { RowMenuItems, type RowMenuActions } from "./RowMenuItems";
import { BulkMenuItems, type BulkMenuData } from "./BulkMenuItems";

// The right-click twin of RowMenu: the SAME action list (RowMenuItems), but the glass panel is
// pinned at the cursor instead of anchored to a kebab. It portals to <body> with position:fixed so
// it escapes the grid's overflow-auto clipping and the sticky/frozen stacking contexts — an
// in-tree absolute menu would be clipped by the scroll container. Positioning mirrors GridCell's
// TooltipCard: place at the cursor, then measure and flip when it would spill past a viewport edge.

const MENU_W = 208; // px — matches w-52 (13rem); used as a pre-measure fallback
const MARGIN = 8;

export function RowContextMenu({
  row,
  x,
  y,
  actions,
  bulk,
  onClose,
}: {
  row: Idea;
  x: number;
  y: number;
  actions: RowMenuActions;
  // When set, more than one selected row was right-clicked: show the bulk action list instead of
  // the single-row one. `actions`/`row` are ignored in that case.
  bulk?: BulkMenuData;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Play the dematerialize (pop-out) before the parent unmounts us, so exit mirrors enter (§7).
  // `onClose` is the real removal; `requestClose` starts the exit and defers it to animation end.
  const [closing, setClosing] = useState(false);
  const requestClose = useCallback(() => setClosing(true), []);

  // Start at the cursor with the fallback width; corrected in useLayoutEffect once the real size
  // is known, before paint — so there's no visible jump.
  const [pos, setPos] = useState<{ left: number; top: number; origin: string }>(() => {
    const spillRight = x + MENU_W > window.innerWidth - MARGIN;
    return {
      left: spillRight ? Math.max(MARGIN, x - MENU_W) : x,
      top: y,
      origin: spillRight ? "top right" : "top left",
    };
  });

  // Measure-then-flip: use the real rendered size to clamp/flip against both edges. Re-runs whenever
  // the panel's size changes, not just at open — the bulk "Edit field" step swaps the short root list
  // for a ~300px value list, and without re-placing, that taller panel would spill off (and vanish
  // below) the bottom edge when opened low on screen. A ResizeObserver catches every content swap.
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const place = () => {
      const w = el.offsetWidth || MENU_W;
      const h = el.offsetHeight;
      const spillRight = x + w > window.innerWidth - MARGIN;
      const spillBottom = y + h > window.innerHeight - MARGIN;
      const left = spillRight ? Math.max(MARGIN, x - w) : x;
      const top = spillBottom ? Math.max(MARGIN, y - h) : Math.max(MARGIN, y);
      const origin = `${spillBottom ? "bottom" : "top"} ${spillRight ? "right" : "left"}`;
      setPos({ left, top, origin });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, [x, y]);

  // Dismiss on Escape, viewport change, and scroll. The grid's inner overflow-auto scroll does not
  // bubble, so the scroll listener is registered in the capture phase to catch it too.
  useLayoutEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") requestClose(); };
    // Scroll dismisses the menu — but NOT when the scroll happens inside the panel itself (the bulk
    // "Edit field" values list has its own overflow-y-auto). Only outside scrolls (the grid, page)
    // should close it, so it stays put while the user scrolls a long value list.
    const onScroll = (e: Event) => {
      const el = panelRef.current;
      if (el && e.target instanceof Node && el.contains(e.target)) return;
      requestClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", requestClose);
    window.addEventListener("blur", requestClose);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", requestClose);
      window.removeEventListener("blur", requestClose);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [requestClose]);

  // Once the exit is requested, unmount when the pop-out animation ends — with a timeout fallback
  // in case animationend never fires (e.g. animations disabled at the OS/browser level).
  useLayoutEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(onClose, 220);
    return () => window.clearTimeout(t);
  }, [closing, onClose]);

  // Focus the first enabled item once mounted, so keyboard users can arrow/act immediately.
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])');
    first?.focus();
  }, []);

  return createPortal(
    <>
      {/* Click-catcher: a left-click or another right-click anywhere dismisses the menu. */}
      <div
        className="fixed inset-0 z-40"
        onMouseDown={requestClose}
        onContextMenu={e => { e.preventDefault(); requestClose(); }}
      />
      <div
        ref={panelRef}
        role="menu"
        onAnimationEnd={() => { if (closing) onClose(); }}
        className={`${closing ? "pop-out" : "pop-in"} surface-pop fixed z-50 w-52 rounded-[16px] py-1.5 overflow-hidden`}
        style={{
          left: pos.left,
          top: pos.top,
          transformOrigin: pos.origin,
          backgroundColor: "var(--surface-raised)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid var(--hairline)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {bulk
          ? <BulkMenuItems data={bulk} onAfterAction={requestClose} />
          : <RowMenuItems row={row} actions={actions} onAfterAction={requestClose} />}
      </div>
    </>,
    document.body,
  );
}
