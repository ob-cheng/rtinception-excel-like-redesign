import { useEffect, useRef, useState } from "react";
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

  // Measure on mount so the indicator starts in the right place.
  useEffect(() => {
    const el = tabRefs.current[VIEWS.indexOf(view)];
    if (el) setTabIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, []);

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
    if (next === view || swapping) return;
    onSwapStart(next);
    setDir(VIEWS.indexOf(next) > VIEWS.indexOf(view) ? 1 : -1);
    // Update tab UI immediately — measure the target button now, before any state flush.
    const el = tabRefs.current[VIEWS.indexOf(next)];
    if (el) setTabIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    setPendingView(next);
    setSwapping(true);
    swapTimer.current = setTimeout(() => {
      setView(next);
      setSwapping(false);
      onSwapEnd(next);
    }, SWAP_MS);
  }

  return { view, pendingView, dir, swapping, tabRefs, tabIndicator, swapProps, switchView };
}
