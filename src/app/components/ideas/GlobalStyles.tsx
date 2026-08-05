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

      /* Portfolio panel collapse hint — breathes background + color after 10s idle */
      @keyframes panel-hint-breathe {
        0%, 100% { background-color: transparent;          color: #9ca3af; box-shadow: none; }
        50%       { background-color: rgba(13,45,107,0.10); color: #0d2d6b; box-shadow: 0 0 0 3px rgba(13,45,107,0.10); }
      }

      @keyframes tooltip-in {
        from { opacity: 0; transform: translateY(-3px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
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
