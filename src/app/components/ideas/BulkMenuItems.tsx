import { useState } from "react";
import { ChevronLeft, ChevronRight, CircleDollarSign, CircleMinus, Copy, Pencil, Trash2 } from "lucide-react";
import type { Column, Idea, ViewKey } from "../../types";

// The right-click action list when MORE THAN ONE selected row is right-clicked. It mirrors the
// floating BulkActionBar — same actions, same order (Edit field · Mark as funded · Duplicate ·
// Delete) — so the two bulk surfaces can never disagree. The single-row items (Edit / View details /
// View history) are intentionally absent: they don't make sense across a multi-row selection.
// Rendered inside the same glass shell as RowMenuItems (via RowContextMenu), so it reads identically.

export type BulkMenuData = {
  count: number;
  view: ViewKey;
  editableDropdownCols: Column[];
  onBulkFund: () => void;
  onBulkSetField: (key: keyof Idea, value: string) => void;
  onBulkDuplicate: () => void;
  onBulkDelete: () => void;
};

type Step = { kind: "fields" } | { kind: "values"; col: Column };

export function BulkMenuItems({
  data,
  onAfterAction,
}: {
  data: BulkMenuData;
  // Called after any action runs, so the container (RowContextMenu) closes itself.
  onAfterAction: () => void;
}) {
  // Which "Edit field" step is open, or null for the root action list. Mirrors the bar's popover.
  const [step, setStep] = useState<Step | null>(null);

  const { count, view, editableDropdownCols, onBulkFund, onBulkSetField, onBulkDuplicate, onBulkDelete } = data;
  const unfund = view === "Funded";
  const canEdit = editableDropdownCols.length > 0;
  const isValues = step?.kind === "values";

  // Shared item recipe — identical to RowMenuItems.item so both menus read the same.
  const itemCls =
    "flex items-center gap-2.5 w-full text-left px-3.5 h-[34px] text-[13px] transition-colors duration-100 rounded-[8px] mx-1 my-px active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)]";
  const neutralHover = "hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/10";

  // ── Step 2/3: the field / value chooser, in place of the root list. ──
  if (step) {
    return (
      <div className="max-h-[300px] overflow-y-auto">
        <button
          type="button"
          onClick={() => setStep(isValues ? { kind: "fields" } : null)}
          className={`${itemCls} ${neutralHover}`}
          style={{ width: "calc(100% - 8px)", color: "var(--text-2)" }}
        >
          <ChevronLeft size={13} strokeWidth={2} className="text-gray-400" />
          {isValues ? (step as { col: Column }).col.label : "Set field"}
        </button>
        <div className="border-t border-gray-100 dark:border-white/10 my-1 mx-1" />

        {!isValues && editableDropdownCols.map(col => (
          <button
            key={col.key}
            role="menuitem"
            type="button"
            onClick={() => setStep({ kind: "values", col })}
            className={`${itemCls} justify-between ${neutralHover}`}
            style={{ width: "calc(100% - 8px)", color: "var(--text-1)" }}
          >
            {col.label}
            <ChevronRight size={14} strokeWidth={2} className="opacity-40" />
          </button>
        ))}

        {isValues && (step as { col: Column }).col.options!.map(opt => (
          <button
            key={opt}
            role="menuitem"
            type="button"
            onClick={() => { onBulkSetField((step as { col: Column }).col.key, opt); onAfterAction(); }}
            className={`${itemCls} ${neutralHover}`}
            style={{ width: "calc(100% - 8px)", color: "var(--text-1)" }}
          >
            {opt || <span style={{ color: "var(--text-3)" }}>(empty)</span>}
          </button>
        ))}
      </div>
    );
  }

  // ── Root: the bulk action list, in the bar's order. ──
  return (
    <>
      {/* Selection count — the same "N selected" language the bar uses, as a quiet header. */}
      <div className="px-3.5 h-[26px] flex items-center text-[11px] font-semibold uppercase" style={{ color: "var(--text-3)", letterSpacing: "0.04em" }}>
        {count} selected
      </div>
      <div className="border-t border-gray-100 dark:border-white/10 my-1 mx-1" />

      {/* Edit field — opens the two-step chooser in place. Disabled when the view has no editable
          dropdown fields, matching the bar. */}
      <button
        role="menuitem"
        type="button"
        disabled={!canEdit}
        onClick={() => setStep({ kind: "fields" })}
        className={`${itemCls} justify-between ${neutralHover} disabled:opacity-40 disabled:cursor-not-allowed`}
        style={{ width: "calc(100% - 8px)", color: "var(--text-1)" }}
      >
        <span className="flex items-center gap-2.5">
          <Pencil size={13} strokeWidth={2} className="text-gray-400 dark:text-gray-400" />
          Edit field
        </span>
        {canEdit && <ChevronRight size={14} strokeWidth={2} className="opacity-40" />}
      </button>

      <div className="border-t border-gray-100 dark:border-white/10 my-1 mx-1" />

      {/* Mark as funded / Remove from funded */}
      <button
        role="menuitem"
        type="button"
        onClick={() => { onBulkFund(); onAfterAction(); }}
        className={`${itemCls} ${neutralHover}`}
        style={{ width: "calc(100% - 8px)", color: "var(--text-1)" }}
      >
        <span className="text-gray-400 dark:text-gray-400">
          {unfund ? <CircleMinus size={13} strokeWidth={2} /> : <CircleDollarSign size={13} strokeWidth={2} />}
        </span>
        {unfund ? "Remove from funded" : "Mark as funded"}
      </button>

      <div className="border-t border-gray-100 dark:border-white/10 my-1 mx-1" />

      {/* Duplicate */}
      <button
        role="menuitem"
        type="button"
        onClick={() => { onBulkDuplicate(); onAfterAction(); }}
        className={`${itemCls} ${neutralHover}`}
        style={{ width: "calc(100% - 8px)", color: "var(--text-1)" }}
      >
        <Copy size={13} strokeWidth={2} className="text-gray-400 dark:text-gray-400" />
        Duplicate
      </button>

      {/* Delete — destructive, in the danger register (matching the row menu + bar). */}
      <button
        role="menuitem"
        type="button"
        onClick={() => { onBulkDelete(); onAfterAction(); }}
        className={`${itemCls} text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:bg-red-100/70`}
        style={{ width: "calc(100% - 8px)" }}
      >
        <Trash2 size={13} strokeWidth={2} className="text-red-400" />
        Delete
      </button>
    </>
  );
}
