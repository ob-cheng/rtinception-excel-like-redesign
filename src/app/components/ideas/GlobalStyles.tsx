// Animations that can't be expressed as Tailwind utilities, plus the accessibility
// media-query overrides. Mounted once from App.
export function GlobalStyles() {
  return (
    <style>{`
      /* Materialize: blur + scale settle together so the surface reads as a material arriving. */
      @keyframes popIn {
        from { opacity: 0; transform: translateY(-4px) scale(0.97); filter: blur(2px); }
        to   { opacity: 1; transform: translateY(0) scale(1);    filter: blur(0); }
      }
      .pop-in { animation: popIn 0.16s cubic-bezier(0.16, 1, 0.3, 1); transform-origin: top right; }

      /* View swap: the incoming columns arrive from the side the tab moved toward, so the
         tab strip and the content agree about direction. --enter carries the sign.
         The UID column never gets this class — it's the spine the rows are identified by,
         and animating it would claim something changed that didn't. */
      @keyframes colEnter {
        from { opacity: 0; transform: translateX(var(--enter, 24px)); }
        to   { opacity: 1; transform: translateX(0); }
      }
      .col-enter { animation: colEnter 0.38s cubic-bezier(0.16, 1, 0.3, 1) backwards; }

      /* Prioritize modal step change — the shell resizes; content gently fades/slides in
         so switching persona → scope → reorder reads as one surface changing, not a flash. */
      @keyframes stepFade {
        from { opacity: 0; transform: translateY(4px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .step-fade { animation: stepFade 0.26s cubic-bezier(0.16, 1, 0.3, 1) both; }

      @keyframes tooltip-in {
        from { opacity: 0; transform: translateY(-3px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      /* Excel-style frozen columns. Sticky cells become their own paint layer, so the row's
         <tr> background no longer shows through them — each frozen cell paints an opaque
         background driven by per-row CSS variables, which keeps zebra striping, hover, and the
         active-cell tint intact while the other columns slide underneath. */
      /* No background transition on frozen cells: the row's hover color is painted on the <tr>,
         which repaints instantly (browsers don't animate a <tr> background), so the frozen cells
         must snap too — otherwise their per-cell transition lags the row by ~100ms on hover in/out.
         Same logic as the row, same timing. */
      td.frozen { position: sticky; z-index: 5; background: var(--freeze-bg, #fff); transition: none; }
      /* Solid twin of the translucent header tint so a frozen header cell is indistinguishable
         from the rest of the header row in BOTH themes (--surface-2 diverged in dark). */
      th.frozen { position: sticky; top: 0; z-index: 30; background: var(--header-solid); }
      /* Frozen-cell hover is driven by the SAME token the row hover uses (--row-hover), not a
         per-row --freeze-hover var — so a frozen column can never accidentally opt out of the
         hover wash (which is exactly what left the add-new row's frozen cells flat). */
      tr.row-tr:hover td.frozen { background: var(--row-hover); }
      td.frozen[data-active="true"] { background: var(--freeze-active, var(--freeze-bg, #fff)); }
      /* The pinned block casts a shadow like one floating panel, not a stack of cells. A per-cell
         box-shadow blurs vertically and rounds at each row edge, scalloping into a "curl"; instead
         each frozen-last cell paints a full-height gradient strip just past its right edge, so the
         strips tile seamlessly down the column into a single continuous panel edge. It only appears
         once the block is actually pinned (.freeze-on past the scroll threshold). */
      .freeze-on td.frozen-last::after,
      .freeze-on th.frozen-last::after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 100%;
        width: 16px;
        pointer-events: none;
        background: linear-gradient(to right, rgba(0,0,0,0.13), rgba(0,0,0,0.05) 42%, rgba(0,0,0,0));
      }

      /* Sidebar nav items — driven by tokens so the rail can be brand-navy in light
         and a neutral gray with an accent-tinted selection in dark. */
      .side-nav-item { color: var(--sidebar-fg); transition: color 0.15s, background-color 0.15s, transform 0.15s; }
      .side-nav-item:hover { color: var(--sidebar-fg-hover); background-color: var(--sidebar-hover-bg); }
      .side-nav-item.is-active { color: var(--sidebar-fg-active); background-color: var(--sidebar-active-bg); box-shadow: 0 1px 3px rgba(0,0,0,0.2); }

      /* Data rows draw their fill from the SAME token the frozen (pinned) cells use,
         so the pinned columns never read as a different shade than the rest of the row.
         Base + hover both live here (not inline) so the :hover rule can win — the per-row
         --row-bg custom property is what varies inline. */
      tr.row-tr { background-color: var(--row-bg); }
      tr.row-tr:hover { background-color: var(--row-hover); }

      /* Theme switch — an elegant whole-screen cross-fade (the whole surface dims up
         or down together), not a ripple. The View Transitions API captures the old and
         new frames and dissolves the ENTIRE screen at once. While it plays we suppress
         every element's own colour transition, so nothing tweens on its own timeline
         underneath the dissolve — that independent per-element tweening is what made
         parts of the UI appear to switch before others. */
      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation-duration: 0.42s;
        animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      }
      html.theme-swapping *,
      html.theme-swapping *::before,
      html.theme-swapping *::after {
        transition: none !important;
      }

      /* §14 Reduced motion — swap material/spring motion for a gentle cross-fade, drop transforms. */
      @media (prefers-reduced-motion: reduce) {
        @keyframes popIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .pop-in { animation: popIn 0.12s ease; }
        @keyframes colEnter {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .col-enter { animation: colEnter 0.14s ease backwards; }
        @keyframes stepFade { from { opacity: 0; } to { opacity: 1; } }
        .step-fade { animation: stepFade 0.12s ease both; }
        *, *::before, *::after {
          transition-property: opacity, color, background-color, border-color !important;
          transition-duration: 0.12s !important;
          animation-duration: 0.12s !important;
        }
      }

      /* §14 Reduced transparency — make blurred chrome solid. */
      @media (prefers-reduced-transparency: reduce) {
        .chrome-blur { backdrop-filter: none !important; background-color: rgb(243 244 246) !important; }
      }

      /* §14 Increased contrast — give floating surfaces a defined border. */
      @media (prefers-contrast: more) {
        .surface-pop { border-color: rgba(17, 24, 39, 0.55) !important; }
      }
    `}</style>
  );
}
