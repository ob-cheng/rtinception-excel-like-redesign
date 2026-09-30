import { useEffect } from "react";

// Focus plumbing for non-modal popovers (§A.4): on open, move focus to the first control inside so
// keyboard users land in the popover; on close (unmount), return focus to whatever opened it.
// No Tab trap and no inert background — a popover is light-dismiss, not a modal.
export function usePopoverFocus(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const restoreTo = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const first = el?.querySelector<HTMLElement>(
      '[aria-checked="true"], a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    (first ?? el)?.focus();
    return () => {
      // Only restore if focus is still inside (or was lost) — don't steal it from a newly opened modal.
      const active = document.activeElement;
      if (!active || active === document.body || el?.contains(active)) restoreTo?.focus?.();
    };
  }, [ref]);
}
