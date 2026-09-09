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

      /* Dematerialize: the exact reverse of popIn, so the surface leaves the way it arrived
         (enter and exit share one path). Held on the last frame with 'forwards'. */
      @keyframes popOut {
        from { opacity: 1; transform: translateY(0) scale(1);       filter: blur(0); }
        to   { opacity: 0; transform: translateY(-4px) scale(0.97); filter: blur(2px); }
      }
      .pop-out { animation: popOut 0.13s cubic-bezier(0.3, 0, 0.8, 0.15) forwards; transform-origin: top right; pointer-events: none; }

      /* Slim, muted scrollbars for the grid — the browser default draws a chunky opaque thumb that
         reads as an odd gray band under the floating chrome (e.g. behind the bulk-action bar). This
         uses the app's own hairline/text tokens so the scrollbar is the same quiet material as the
         rest of the surface, in both themes. */
      /* One scrollbar look everywhere — grid, sidebar, panels, modals, popovers, dropdown lists.
         Applied globally (not per-class) so every scroll area reads as the same quiet material:
         a slim, muted thumb built from the app's own text token, reachable at rest and deepening
         slightly on direct hover, over a transparent track. Holds in both themes. */
      * { scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--text-3) 40%, transparent) transparent; }
      *::-webkit-scrollbar { width: 10px; height: 10px; }
      *::-webkit-scrollbar-track { background: transparent; }
      *::-webkit-scrollbar-thumb {
        background-color: color-mix(in srgb, var(--text-3) 40%, transparent);
        border-radius: 999px;
        border: 3px solid transparent;
        background-clip: content-box;
        transition: background-color 0.2s ease;
      }
      *::-webkit-scrollbar-thumb:hover {
        background-color: color-mix(in srgb, var(--text-3) 65%, transparent);
      }
      *::-webkit-scrollbar-corner { background: transparent; }

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

      /* Segmented Appearance thumb — one object sliding between Light/Dark. Critically
         damped (no overshoot); nothing here carries momentum (§4). */
      .appearance-thumb { transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1); }

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
      /* The frozen block's right edge: a crisp hairline at rest (so the grid looks normal), but
         once the block pins the divider gives way to a soft scroll-shadow gradient — depth, not a
         doubled line. The border lives here (not inline on the cell) so the .freeze-on state can
         fade it to transparent; the two transition together for a clean handoff. */
      td.frozen-last { border-right: 1px solid var(--hairline-soft); transition: border-color 0.18s ease; }
      th.frozen-last { border-right: 1px solid var(--hairline); transition: border-color 0.18s ease; }
      .freeze-on td.frozen-last,
      .freeze-on th.frozen-last { border-right-color: transparent; }
      /* The pinned block casts a shadow like one floating panel, not a stack of cells. A per-cell
         box-shadow blurs vertically and rounds at each row edge, scalloping into a "curl"; instead
         each frozen-last cell paints a full-height gradient strip just past its right edge, so the
         strips tile seamlessly down the column into a single continuous panel edge. The strip is
         always present but transparent, and fades in only once the block is actually pinned
         (.freeze-on past the scroll threshold) — so the divider→shadow handoff is smooth. */
      td.frozen-last::after,
      th.frozen-last::after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 100%;
        width: 22px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.18s ease;
        /* Give the strip its own compositor layer so its opacity animates on the compositor.
           Without this, the header's frozen-last cell is sticky on BOTH axes (top:0 + left),
           so the browser promotes it to a cached tile and never re-rasterizes this pseudo when
           .freeze-on is removed on scroll-back — leaving a stale shadow on the header only,
           while the body cells (sticky on one axis) repaint fine. translateZ(0) + will-change
           move the fade onto the compositor, which invalidates correctly in both directions. */
        transform: translateZ(0);
        will-change: opacity;
        background: linear-gradient(to right, var(--freeze-shadow), color-mix(in srgb, var(--freeze-shadow) 50%, transparent) 38%, color-mix(in srgb, var(--freeze-shadow) 16%, transparent) 72%, transparent);
      }
      .freeze-on td.frozen-last::after,
      .freeze-on th.frozen-last::after { opacity: 1; }

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
      /* The Appearance thumb opts out of the root cross-fade (view-transition-name in
         SettingsPopover) so the API animates it as its own element — a genuine slide
         between Light/Dark, critically damped to match the CSS fallback (§4). */
      ::view-transition-group(appearance-thumb),
      ::view-transition-group(appearance-seg-light),
      ::view-transition-group(appearance-seg-dark) {
        animation-duration: 0.32s;
        animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
      }
      /* Labels sit above the thumb (later in DOM → painted on top), so they stay legible
         while the thumb slides under them — the segmented control animates as one unit. */
      ::view-transition-group(appearance-seg-light),
      ::view-transition-group(appearance-seg-dark) { z-index: 1; }

      /* §14 Reduced motion — swap material/spring motion for a gentle cross-fade, drop transforms. */
      @media (prefers-reduced-motion: reduce) {
        @keyframes popIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .pop-in { animation: popIn 0.12s ease; }
        @keyframes popOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        .pop-out { animation: popOut 0.1s ease forwards; }
        @keyframes colEnter {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .col-enter { animation: colEnter 0.14s ease backwards; }
        @keyframes stepFade { from { opacity: 0; } to { opacity: 1; } }
        .step-fade { animation: stepFade 0.12s ease both; }
        @keyframes tooltip-in { from { opacity: 0; } to { opacity: 1; } }
        /* Collapse the appearance slide to an instant swap (§14). */
        .appearance-thumb { transition: none !important; }
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

      /* ── Notification toasts (Sonner, stripped to the app's language) ────────────
         Gmail's undo toast is the reference for a reversible action: plain text, one plain
         button, nothing decorative. So this is a quiet sheet of the app's own glass
         (--surface-raised, §12) — no icon tiles, no tinted panels, no invented colors.
         • Status reads from a small PLAIN glyph (no box), colored from tokens only:
           error = --destructive, success = a measured emerald; default/info stays neutral.
         • The action is LITERALLY the app's secondary pill button (see PageHeader's
           "Prioritize"): --surface fill, --hairline border, lifts to --surface-2 on hover,
           scales on press (§1) — so a toast button is the same object as a header button.
         • Hierarchy is weight + size + tracking (§15); the sheet materializes on enter (§12). */
      [data-sonner-toaster] {
        --width: 356px;
        --toast-ok: #157f56;              /* measured emerald — not candy */
        font-family: "Open Sans", system-ui, -apple-system, sans-serif;
      }
      .dark [data-sonner-toaster],
      [data-sonner-toaster].dark { --toast-ok: #4ccb92; }  /* lifted so it reads on near-black */

      [data-sonner-toast].app-toast {
        display: flex;
        align-items: center;
        gap: 11px;
        width: var(--width);
        padding: 13px 14px;
        /* Identical floating recipe to the row menus (RowMenu / RowContextMenu) so a toast reads
           as the same glass surface: same radius, blur, hairline, and lifted shadow. */
        border-radius: 16px;
        background: var(--surface-raised);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid var(--hairline);
        box-shadow: 0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06);
        color: var(--text-1);
      }

      /* Status glyph — plain, no container. Sonner puts its check/error svg in [data-icon]. */
      [data-sonner-toast].app-toast [data-icon] {
        flex: 0 0 auto;
        width: 16px;
        height: 16px;
        margin: 0;
        color: var(--text-3);             /* neutral by default (e.g. the Lock notice) */
      }
      [data-sonner-toast].app-toast [data-icon] > svg { width: 16px; height: 16px; }
      [data-sonner-toast].app-toast[data-type="success"] [data-icon] { color: var(--toast-ok); }
      [data-sonner-toast].app-toast[data-type="error"]   [data-icon] { color: var(--destructive); }

      /* Content column grows; hierarchy is weight + size + tracking, not saturation (§15). */
      [data-sonner-toast].app-toast [data-content] { flex: 1 1 auto; min-width: 0; }
      [data-sonner-toast].app-toast [data-title] {
        font-size: 13px;
        font-weight: 600;
        line-height: 1.35;
        letter-spacing: -0.008em;
        color: var(--text-1);
      }
      [data-sonner-toast].app-toast [data-description] {
        font-size: 12.5px;
        font-weight: 400;
        line-height: 1.45;
        letter-spacing: 0;
        color: var(--text-3);
        margin-top: 2px;
      }

      /* Action ("Undo") — the app's secondary pill, copied from PageHeader's Prioritize
         button so it reads as the same component: surface fill, hairline, lift on hover,
         scale on press (§1). No accent tint, no invented style. */
      [data-sonner-toast].app-toast [data-button] {
        flex: 0 0 auto;
        height: 30px;
        padding: 0 14px;
        border-radius: 9999px;
        font-size: 13px;
        font-weight: 500;
        letter-spacing: -0.003em;
        color: var(--text-2);
        background: var(--surface);
        border: 1px solid var(--hairline);
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        transition: background-color 0.12s ease, box-shadow 0.12s ease, transform 0.1s ease-out;
      }
      [data-sonner-toast].app-toast [data-button]:hover {
        background: var(--surface-2);
        box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      }
      [data-sonner-toast].app-toast [data-button]:active { transform: scale(0.97); }

      /* Manual dismissal, kept quiet: the close control is invisible until the pointer is over
         the toast (or it receives keyboard focus), so it satisfies WCAG 2.2.1 without cluttering
         the resting state. Swipe-to-dismiss and Esc remain available on top of it. */
      [data-sonner-toast].app-toast [data-close-button] {
        opacity: 0;
        color: var(--text-3);
        background: var(--surface-raised);
        border: 1px solid var(--hairline);
        transition: opacity 0.15s ease, color 0.15s ease, background-color 0.15s ease;
      }
      [data-sonner-toast].app-toast:hover [data-close-button],
      [data-sonner-toast].app-toast [data-close-button]:focus-visible { opacity: 1; }
      [data-sonner-toast].app-toast [data-close-button]:hover {
        color: var(--text-1);
        background: var(--fill-subtle);
      }

      /* Materialize: layer a blur-settle onto Sonner's own (interruptible, swipeable) enter
         so the sheet reads as glass arriving — matching popIn, not a plain slide (§12).
         Sonner keeps owning transform/opacity/height; we only add filter. */
      [data-sonner-toast].app-toast {
        transition: transform 0.4s, opacity 0.4s, filter 0.4s, height 0.4s, box-shadow 0.2s;
      }
      [data-sonner-toast].app-toast[data-mounted="false"] { filter: blur(3px); }
      [data-sonner-toast].app-toast[data-removed="true"]   { filter: blur(3px); }

      @media (prefers-reduced-motion: reduce) {
        [data-sonner-toast].app-toast { filter: none !important; transition: opacity 0.14s ease; }
      }
      @media (prefers-reduced-transparency: reduce) {
        [data-sonner-toast].app-toast {
          background: var(--surface-modal) !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
      }
      @media (prefers-contrast: more) {
        [data-sonner-toast].app-toast { border-color: color-mix(in srgb, var(--text-1) 45%, transparent) !important; }
      }
    `}</style>
  );
}
