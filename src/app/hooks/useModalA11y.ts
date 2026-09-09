import { useEffect } from "react";

// Modal accessibility plumbing shared by every dialog (§A.4 Trap and Restore Focus):
//   • Trap Tab within the dialog so focus can't wander to the background.
//   • Mark the rest of the app `inert` while open, so pointer + screen-reader users can't reach it.
//   • Restore focus to whatever was focused before the dialog opened, on close.
// `overlayRef` points at the modal's outermost node (the full-screen overlay). Its siblings are the
// app chrome (sidebar, main, other panels) — inerting them isolates the dialog without a portal.
export function useModalA11y(
  open: boolean,
  overlayRef: React.RefObject<HTMLElement>,
  dialogRef: React.RefObject<HTMLElement>,
) {
  useEffect(() => {
    if (!open) return;
    const overlay = overlayRef.current;
    const restoreTo = document.activeElement as HTMLElement | null;

    // Inert every sibling of the overlay (the background chrome) for the dialog's lifetime.
    const siblings: HTMLElement[] = [];
    if (overlay?.parentElement) {
      for (const el of Array.from(overlay.parentElement.children)) {
        if (el !== overlay && el instanceof HTMLElement) {
          el.setAttribute("inert", "");
          el.setAttribute("aria-hidden", "true");
          siblings.push(el);
        }
      }
    }

    // Trap Tab within the dialog.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey && (activeEl === first || !dialog.contains(activeEl))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      for (const el of siblings) {
        el.removeAttribute("inert");
        el.removeAttribute("aria-hidden");
      }
      // Return focus to the trigger once the dialog is gone.
      restoreTo?.focus?.();
    };
  }, [open, overlayRef, dialogRef]);
}
