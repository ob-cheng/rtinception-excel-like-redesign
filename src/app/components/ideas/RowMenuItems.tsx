import { useCallback, useEffect, useRef, useState } from "react";
import { Check, CircleCheck, CircleSlash, Clock, Copy, Eye, Pencil, Trash2 } from "lucide-react";
import type { Idea } from "../../types";

// The single source of truth for a row's action list — the ordered items, their icons, labels,
// dividers, and (for consequential actions) an in-place confirmation. Rendered inside BOTH the
// kebab dropdown (RowMenu) and the right-click context menu (RowContextMenu), so the two can never
// drift: they only differ in their outer glass shell and how each one closes itself (onAfterAction).
export type RowMenuActions = {
  onEdit: (row: Idea) => void;
  onViewDetails: (row: Idea) => void;
  onViewHistory: (row: Idea) => void;
  onToggleFound: (row: Idea) => void;
  onDuplicate: (row: Idea) => void;
  onDelete: (row: Idea) => void;
};

// How long an armed item waits for its confirming click before quietly reverting — a soft escape
// hatch (§2 Agency), not a race. No visible countdown; the revert is silent.
const DISARM_MS = 3200;

// The documented weakness of inline "click-to-confirm" is that a fast DOUBLE-CLICK blows straight
// through it — the second click lands on the just-armed item and commits by accident. So we swallow
// any click that arrives within this window of arming; a deliberate second click always comes later.
const GUARD_MS = 400;

// The solid fill an armed item takes on. One colour per action, from tokens so it holds in both
// themes: destructive red for Delete, the brand accent for a reversible structural change
// (Duplicate / un-fund), the measured emerald for the positive commit (Mark as funded).
type Tone = "danger" | "accent" | "positive";
const TONE: Record<Tone, string> = {
  danger: "var(--danger)",
  accent: "var(--accent-strong)",
  positive: "var(--confirm-ok)",
};

export function RowMenuItems({
  row,
  actions,
  onAfterAction,
}: {
  row: Idea;
  actions: RowMenuActions;
  // Called after any action actually runs, so the container that mounted this list closes itself.
  onAfterAction: () => void;
}) {
  // Which consequential item is currently armed (its id), or null. Only one at a time — arming a
  // second disarms the first, so the menu can never show two half-committed actions.
  const [armed, setArmed] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const armedAt = useRef(0); // when the current item armed — used to reject double-click confirms

  const clearTimer = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = undefined;
  };
  const arm = useCallback((id: string) => {
    clearTimer();
    setArmed(id);
    armedAt.current = Date.now();
    timer.current = window.setTimeout(() => setArmed(null), DISARM_MS); // silent auto-revert (§16)
  }, []);
  const commit = useCallback((action: () => void) => {
    // Reject a click that lands within the guard window of arming — that's a double-click, not a
    // considered second click. The deliberate confirm always arrives well after GUARD_MS.
    if (Date.now() - armedAt.current < GUARD_MS) return;
    clearTimer();
    setArmed(null);
    action();
    onAfterAction();
  }, [onAfterAction]);

  useEffect(() => () => clearTimer(), []);

  // Plain items (Edit / View details / View history) — no consequence, so no confirmation:
  // one click runs and closes, exactly as before.
  function item(icon: React.ReactNode, label: string, action: () => void) {
    return (
      <button
        role="menuitem"
        onClick={() => { action(); onAfterAction(); }}
        className="flex items-center gap-2.5 w-full text-left px-3.5 h-[34px] text-[13px] transition-colors duration-100 rounded-[8px] mx-1 my-px active:scale-[0.98] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)]"
        style={{ width: "calc(100% - 8px)" }}
      >
        <span className="text-gray-400 dark:text-gray-400">{icon}</span>
        {label}
      </button>
    );
  }

  // Consequential items — Delete, Duplicate, Mark as funded. First click arms: the item fills with
  // its tone and its label becomes "Confirm", right where it sits. Second click commits. Nothing
  // opens; the item just changes colour (one clean transition).
  function confirmItem(
    id: string,
    icon: React.ReactNode,
    label: string,
    tone: Tone,
    action: () => void,
  ) {
    const isArmed = armed === id;
    const restText = tone === "danger" ? "text-red-500" : "text-gray-700 dark:text-gray-200";
    const restIcon = tone === "danger" ? "text-red-400" : "text-gray-400 dark:text-gray-400";
    const restHover = tone === "danger"
      ? "hover:bg-red-50 dark:hover:bg-red-500/10 active:bg-red-100/70"
      : "hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/10";
    return (
      <button
        role="menuitem"
        data-armed={isArmed}
        aria-label={isArmed ? `Confirm ${label.toLowerCase()}` : label}
        onClick={() => (isArmed ? commit(action) : arm(id))}
        className={`flex items-center gap-2.5 w-full text-left px-3.5 h-[34px] text-[13px] rounded-[8px] mx-1 my-px active:scale-[0.98] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)] ${isArmed ? "font-semibold text-white" : restHover}`}
        style={{ width: "calc(100% - 8px)", backgroundColor: isArmed ? TONE[tone] : undefined }}
      >
        {/* Armed: the icon flips to a check and the label becomes an explicit prompt, so the
            second, deliberate click reads unmistakably as a confirmation — not relying on colour
            alone (accessibility) and never a bare re-label of the same button. */}
        <span className={isArmed ? "text-white" : restIcon}>{isArmed ? <Check size={13} strokeWidth={2.5} /> : icon}</span>
        <span className={isArmed ? "flex-1" : `flex-1 ${restText}`}>{isArmed ? "Confirm" : label}</span>
        {isArmed && <span className="text-[11px] font-medium text-white/80">Click again</span>}
      </button>
    );
  }

  return (
    <>
      {item(<Pencil size={13} />, "Edit idea", () => actions.onEdit(row))}
      {item(<Eye size={13} />, "View idea details", () => actions.onViewDetails(row))}
      {item(<Clock size={13} />, "View idea history", () => actions.onViewHistory(row))}
      <div className="border-t border-gray-100 dark:border-white/10 my-1 mx-1" />
      {row.status === "Funded"
        ? confirmItem("toggle", <CircleSlash size={13} />, "Remove from Funded", "accent", () => actions.onToggleFound(row))
        : confirmItem("toggle", <CircleCheck size={13} />, "Mark as funded", "positive", () => actions.onToggleFound(row))}
      <div className="border-t border-gray-100 dark:border-white/10 my-1 mx-1" />
      {confirmItem("duplicate", <Copy size={13} />, "Duplicate", "accent", () => actions.onDuplicate(row))}
      {confirmItem("delete", <Trash2 size={13} />, "Delete", "danger", () => actions.onDelete(row))}
    </>
  );
}
