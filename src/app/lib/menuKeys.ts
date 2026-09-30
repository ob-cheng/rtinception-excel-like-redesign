// Arrow-key navigation for role="menu" panels (ARIA APG menu pattern, §A.3): ↑/↓ move between items
// (wrapping), Home/End jump to the ends. Tab and Escape keep their existing per-menu handling.
// Attach as `onKeyDown` on the element with role="menu".
export function handleMenuKeys(e: React.KeyboardEvent<HTMLElement>) {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
  const items = Array.from(
    e.currentTarget.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"]):not([disabled])'),
  );
  if (items.length === 0) return;
  e.preventDefault();
  e.stopPropagation(); // don't let the grid underneath also move its active cell
  const i = items.indexOf(document.activeElement as HTMLElement);
  const next =
    e.key === "Home" ? 0
    : e.key === "End" ? items.length - 1
    : e.key === "ArrowDown" ? (i + 1) % items.length
    : (i <= 0 ? items.length - 1 : i - 1);
  items[next].focus();
}
