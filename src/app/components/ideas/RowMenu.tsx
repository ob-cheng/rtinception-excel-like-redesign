import { useState } from "react";
import { CircleCheck, CircleSlash, Clock, Copy, Eye, Lock, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Idea } from "../../types";
import { LOCK_REASON } from "../../lib/locking";

export function RowMenu({
  row,
  locked,
  onEdit,
  onViewDetails,
  onViewHistory,
  onToggleFound,
  onDuplicate,
  onDelete,
}: {
  row: Idea;
  locked?: boolean;
  onEdit: (row: Idea) => void;
  onViewDetails: (row: Idea) => void;
  onViewHistory: (row: Idea) => void;
  onToggleFound: (row: Idea) => void;
  onDuplicate: (row: Idea) => void;
  onDelete: (row: Idea) => void;
}) {
  const [open, setOpen] = useState(false);

  function item(icon: React.ReactNode, label: string, action: () => void, danger = false, disabled = false) {
    if (disabled) {
      return (
        <div
          title={LOCK_REASON}
          className="flex items-center gap-2.5 w-full text-left px-3.5 py-[7px] text-[13px] rounded-lg mx-1 my-px text-gray-300 dark:text-gray-500 cursor-not-allowed"
          style={{ width: "calc(100% - 8px)" }}
        >
          <span className="text-gray-300 dark:text-gray-500">{icon}</span>
          {label}
        </div>
      );
    }
    return (
      <button
        onClick={() => { action(); setOpen(false); }}
        className={`flex items-center gap-2.5 w-full text-left px-3.5 py-[7px] text-[13px] transition-colors duration-100 rounded-lg mx-1 my-px active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)] ${
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
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="p-1.5 rounded-lg active:scale-95 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)]"
        style={{ color: "var(--text-3)" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--hairline)")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}
      >
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="pop-in surface-pop absolute right-0 top-full mt-1.5 z-50 w-52 rounded-[14px] py-1.5 overflow-hidden"
            style={{
              backgroundColor: "var(--surface-raised)",
              backdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid var(--hairline)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            {locked && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 mb-1 border-b border-gray-100 dark:border-white/10 text-[11.5px] text-gray-400 dark:text-gray-400">
                <Lock size={11} strokeWidth={2} />
                Locked — read only
              </div>
            )}
            {item(<Pencil size={13} />, "Edit idea", () => onEdit(row), false, locked)}
            {item(<Eye size={13} />, "View idea details", () => onViewDetails(row))}
            {item(<Clock size={13} />, "View idea history", () => onViewHistory(row))}
            <div className="border-t border-gray-100 dark:border-white/10 my-1" />
            {row.status === "Funded"
              ? item(<CircleSlash size={13} />, "Remove from Funded", () => onToggleFound(row))
              : item(<CircleCheck size={13} />, "Mark as funded", () => onToggleFound(row))}
            <div className="border-t border-gray-100 dark:border-white/10 my-1" />
            {item(<Copy size={13} />, "Duplicate", () => onDuplicate(row), false, locked)}
            {item(<Trash2 size={13} />, "Delete", () => onDelete(row), true, locked)}
          </div>
        </>
      )}
    </div>
  );
}
