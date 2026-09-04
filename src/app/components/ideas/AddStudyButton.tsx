import { Plus } from "lucide-react";

// The "create record" affordance, anchored to the top-right of the table (below the Export
// action in the header). Adding a study enters new *data* into the grid — a different act from
// the app-chrome controls (Columns, Prioritize, Export) that operate *on* the view — so it lives
// on the table itself rather than in the header cluster.
//
// The Apple capsule (continuous full curve): at rest a clean 34px circle showing only "+"; on
// hover/focus it expands leftward into a 112px pill reading "＋ Add study" — matching the width of
// the Prioritize / Export actions above it while keeping the softer, rounder Apple shape. Shares
// the navy fill/shadow and 34px height with those actions so it still reads as one family.
//
// Anchored right-0 in App, so the box grows toward the left: the icon stays in its left tile and
// the plus glides toward the left edge as the label fades in to its right. The button animates its
// own width (34→112) on one easing curve and collapses back symmetrically; the overflow clip hides
// the label until the box opens. Honors reduced-motion.
export function AddStudyButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Add study"
      className="group flex items-center h-[34px] w-[34px] hover:w-[112px] focus-visible:w-[112px] rounded-full overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface)]"
      style={{
        backgroundColor: "var(--accent-strong)",
        color: "var(--on-accent)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.28), 0 1px 0 rgba(255,255,255,0.10) inset",
      }}
    >
      {/* Icon — leftmost child and the 34×34 tile at rest; stays put while the box widens, so the
          plus glides toward the left edge as the label appears to its right. */}
      <span className="grid place-items-center w-[34px] h-[34px] shrink-0">
        <Plus size={16} strokeWidth={2.4} />
      </span>
      {/* Label — clipped by the button's rest width; fades in as the box widens to 112px (matching
          the Prioritize / Export min-width above). */}
      <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 ease-out motion-reduce:transition-none text-[13px] font-medium -ml-0.5">
        Add study
      </span>
    </button>
  );
}
