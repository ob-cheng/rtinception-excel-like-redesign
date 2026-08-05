import { useState } from "react";
import { Clock, Copy, Eye, Lock, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Idea } from "../../types";
import { LOCK_REASON } from "../../lib/locking";

export function RowMenu({
  row,
  locked,
  onEdit,
  onViewDetails,
  onViewHistory,
  onDuplicate,
  onDelete,
}: {
  row: Idea;
  locked?: boolean;
  onEdit: (row: Idea) => void;
  onViewDetails: (row: Idea) => void;
  onViewHistory: (row: Idea) => void;
  onDuplicate: (row: Idea) => void;
  onDelete: (row: Idea) => void;
}) {
  const [open, setOpen] = useState(false);

  function item(icon: React.ReactNode, label: string, action: () => void, danger = false, disabled = false) {
    if (disabled) {
      return (
        <div
          title={LOCK_REASON}
          className="flex items-center gap-2.5 w-full text-left px-3.5 py-[7px] text-[13px] rounded-lg mx-1 my-px text-gray-300 cursor-not-allowed"
          style={{ width: "calc(100% - 8px)" }}
        >
          <span className="text-gray-300">{icon}</span>
          {label}
        </div>
      );
    }
    return (
      <button
        onClick={() => { action(); setOpen(false); }}
        className={`flex items-center gap-2.5 w-full text-left px-3.5 py-[7px] text-[13px] transition-colors duration-100 rounded-lg mx-1 my-px active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0d2d6b]/30 ${
          danger
            ? "text-red-500 hover:bg-red-50 active:bg-red-100/70"
            : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
        }`}
        style={{ width: "calc(100% - 8px)" }}
      >
        <span className={danger ? "text-red-400" : "text-gray-400"}>{icon}</span>
        {label}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="p-1.5 rounded-lg active:scale-95 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30"
        style={{ color: "#8e8e93" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.06)")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}
      >
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="pop-in surface-pop absolute right-0 top-full mt-1.5 z-50 w-52 rounded-[14px] py-1.5 overflow-hidden"
            style={{
              backgroundColor: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid rgba(0,0,0,0.1)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            {locked && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 mb-1 border-b border-gray-100 text-[11.5px] text-gray-400">
                <Lock size={11} strokeWidth={2} />
                Locked — read only
              </div>
            )}
            {item(<Pencil size={13} />, "Edit idea", () => onEdit(row), false, locked)}
            {item(<Eye size={13} />, "View idea details", () => onViewDetails(row))}
            {item(<Clock size={13} />, "View idea history", () => onViewHistory(row))}
            <div className="border-t border-gray-100 my-1" />
            {item(<Copy size={13} />, "Duplicate", () => onDuplicate(row), false, locked)}
            {item(<Trash2 size={13} />, "Delete", () => onDelete(row), true, locked)}
          </div>
        </>
      )}
    </div>
  );
}
