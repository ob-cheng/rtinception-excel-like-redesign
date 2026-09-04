import { CircleCheck, CircleSlash, Clock, Copy, Eye, Pencil, Trash2 } from "lucide-react";
import type { Idea } from "../../types";

// The single source of truth for a row's action list — the ordered items, their icons, labels,
// dividers, and danger flag. Rendered inside BOTH the kebab dropdown (RowMenu)
// and the right-click context menu (RowContextMenu), so the two can never drift: they only differ
// in their outer glass shell and how each one closes itself (via onAfterAction).
export type RowMenuActions = {
  onEdit: (row: Idea) => void;
  onViewDetails: (row: Idea) => void;
  onViewHistory: (row: Idea) => void;
  onToggleFound: (row: Idea) => void;
  onDuplicate: (row: Idea) => void;
  onDelete: (row: Idea) => void;
};

export function RowMenuItems({
  row,
  actions,
  onAfterAction,
}: {
  row: Idea;
  actions: RowMenuActions;
  // Called after any action runs, so the container that mounted this list closes itself.
  onAfterAction: () => void;
}) {
  function item(icon: React.ReactNode, label: string, action: () => void, danger = false) {
    return (
      <button
        role="menuitem"
        onClick={() => { action(); onAfterAction(); }}
        className={`flex items-center gap-2.5 w-full text-left px-3.5 py-[7px] text-[13px] transition-colors duration-100 rounded-[8px] mx-1 my-px active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)] ${
          danger
            ? "text-red-500 hover:bg-red-50 active:bg-red-100/70"
            : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/10"
        }`}
        style={{ width: "calc(100% - 8px)" }}
      >
        <span className={danger ? "text-red-400" : "text-gray-400 dark:text-gray-400"}>{icon}</span>
        {label}
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
        ? item(<CircleSlash size={13} />, "Remove from Funded", () => actions.onToggleFound(row))
        : item(<CircleCheck size={13} />, "Mark as funded", () => actions.onToggleFound(row))}
      <div className="border-t border-gray-100 dark:border-white/10 my-1 mx-1" />
      {item(<Copy size={13} />, "Duplicate", () => actions.onDuplicate(row))}
      {item(<Trash2 size={13} />, "Delete", () => actions.onDelete(row), true)}
    </>
  );
}
