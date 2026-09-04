import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ViewKey } from "../types";
import { VIEWS } from "../data/columns";

const SWAP_MS = 140;

// Owns everything about switching column sets: which view is committed, which one the
// tab strip is already showing, the direction of travel, and the per-column enter/leave
// styles. `pendingView` updates on click so the tabs and underline move in the same frame
// as the request — the table catches up when the leave animation finishes.
export function useViewSwap(initial: ViewKey, onSwapStart: (next: ViewKey) => void, onSwapEnd: (next: ViewKey) => void) {
  const [view, setView] = useState<ViewKey>(initial);
  const [pendingView, setPendingView] = useState<ViewKey>(initial);
  // "out" = current columns leaving. dir is +1 when moving to a tab on the right.
  const [swapping, setSwapping] = useState(false);
  const [dir, setDir] = useState(1);

  // Tab underline slides between tabs, so we measure the active button's box.
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });

  // Measure the indicator as a derived consequence of pendingView, in a LAYOUT effect that runs
  // AFTER the commit that flips the active tab to font-semibold. Measuring in the click handler
  // (as we used to) reads the tab at its old font-medium width — narrower — and never corrects
  // itself, so the underline lands short and any later layout shift (web fonts loading, the
  // Columns/Export buttons appearing on non-Funded views, a resize) left it stale until the next
  // click. Keying off pendingView guarantees a re-measure on every tab change, at the final weight.
  useLayoutEffect(() => {
    const el = tabRefs.current[VIEWS.indexOf(pendingView)];
    if (el) setTabIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [pendingView]);

  // Re-measure on resize: the tab strip's geometry (and thus the indicator) shifts with the
  // viewport, and nothing else would trigger a fresh measurement at rest.
  useEffect(() => {
    function remeasure() {
      const el = tabRefs.current[VIEWS.indexOf(pendingView)];
      if (el) setTabIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
    window.addEventListener("resize", remeasure);
    return () => window.removeEventListener("resize", remeasure);
  }, [pendingView]);

  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (swapTimer.current) clearTimeout(swapTimer.current); }, []);

  // Only the columns right of UID take part in the swap. UID is the spine: same column,
  // same place, in both views — moving it would imply the rows themselves changed.
  function swapProps(ci: number): { swapClass: string; swapStyle?: React.CSSProperties } {
    if (ci === 0) return { swapClass: "" };
    if (swapping) {
      return {
        swapClass: "",
        swapStyle: {
          transform: `translateX(${-dir * 20}px)`,
          opacity: 0,
          // Leaving is brisk and linear-ish; arriving is the slow settle. Asymmetry reads as intent.
          transition: "transform 0.16s cubic-bezier(0.4, 0, 1, 1), opacity 0.14s ease",
        },
      };
    }
    return { swapClass: "col-enter" };
  }

  function switchView(next: ViewKey) {
    // Guard against re-selecting the tab we're already heading to (pendingView, not the
    // committed view) — but never drop a click during a swap. A tab tapped mid-swap
    // retargets the in-flight transition instead of being ignored (Interruptibility §3).
    if (next === pendingView) return;
    onSwapStart(next);
    // Direction is measured from the tab currently shown (pendingView), so a rapid A→B→C
    // sequence still travels the correct way on each leg.
    setDir(VIEWS.indexOf(next) > VIEWS.indexOf(pendingView) ? 1 : -1);
    // The indicator follows pendingView via a layout effect that measures the target button AFTER
    // it re-renders bold — so we just move pendingView here and let that effect do the measuring
    // at the correct final geometry (measuring now would capture the old, narrower medium weight).
    setPendingView(next);
    setSwapping(true);
    // Clear any in-flight timer and restart toward the new target — the swap re-targets
    // from wherever it currently is rather than finishing the old leg first.
    if (swapTimer.current) clearTimeout(swapTimer.current);
    swapTimer.current = setTimeout(() => {
      setView(next);
      setSwapping(false);
      onSwapEnd(next);
    }, SWAP_MS);
  }

  return { view, pendingView, dir, swapping, tabRefs, tabIndicator, swapProps, switchView };
}
