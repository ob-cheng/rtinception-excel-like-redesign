import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CircleDollarSign, CircleMinus, Copy, Pencil, Trash2, X } from "lucide-react";
import type { Column, Idea, ViewKey } from "../../types";

// Floating bulk-action bar. Appears (materializes, §12) only while rows are selected and floats over
// the grid, centered near the bottom edge. It hosts the two bulk actions the user asked for:
//   • Mark as funded (Remove from funded on the Funded tab) — one write across the selection.
//   • Edit field — a two-step popover: pick a dropdown field, then pick a value; applied to all.
// The glass shell reuses the same recipe as RowContextMenu / the toasts (§12) so it reads as the
// same floating material as the rest of the app's chrome.

type Step = { kind: "fields" } | { kind: "values"; col: Column };

export function BulkActionBar({
  count,
  view,
  editableDropdownCols,
  onClear,
  onBulkFund,
  onBulkSetField,
  onBulkDuplicate,
  onBulkDelete,
}: {
  count: number;
  view: ViewKey;
  editableDropdownCols: Column[];
  onClear: () => void;
  onBulkFund: () => void;
  onBulkSetField: (key: keyof Idea, value: string) => void;
  onBulkDuplicate: () => void;
  onBulkDelete: () => void;
}) {
  // Keep the bar mounted through its exit animation so it dematerializes the way it arrived (§7),
  // rather than vanishing the instant the selection empties.
  const [mounted, setMounted] = useState(count > 0);
  const [closing, setClosing] = useState(false);
  // Which "Edit field" step is open, or null when the popover is closed.
  const [step, setStep] = useState<Step | null>(null);

  // Hold the last non-zero count so the exit animation doesn't flash "0 selected" as it leaves.
  const lastCount = useRef(count);
  if (count > 0) lastCount.current = count;

  useEffect(() => {
    if (count > 0) { setMounted(true); setClosing(false); }
    else if (mounted) { setClosing(true); setStep(null); }
  }, [count, mounted]);

  // Dismiss the field popover on Escape (the bar itself is dismissed by clearing the selection).
  useEffect(() => {
    if (!step) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); setStep(null); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [step]);

  const closePopover = useCallback(() => setStep(null), []);

  if (!mounted) return null;

  const shown = lastCount.current;
  const unfund = view === "Funded";
  const canEdit = editableDropdownCols.length > 0;

  return (
    <div className="absolute inset-x-0 bottom-14 z-30 flex justify-center pointer-events-none">
      <div
        onAnimationEnd={() => { if (closing) { setMounted(false); setClosing(false); } }}
        className={`${closing ? "pop-out" : "pop-in"} surface-pop pointer-events-auto relative flex items-center gap-1.5 rounded-full py-1.5 pl-3 pr-1.5`}
        style={{
          transformOrigin: "bottom center",
          backgroundColor: "var(--surface-modal)",
          border: "1px solid var(--hairline)",
          boxShadow: "0 10px 34px rgba(0,0,0,0.12)",
        }}
      >
        {/* Selection count */}
        <span className="text-[13px] font-semibold tabular-nums px-1.5" style={{ color: "var(--text-1)", letterSpacing: "-0.006em" }}>
          {shown} selected
        </span>

        <span className="w-px h-5 mx-1" style={{ backgroundColor: "var(--hairline)" }} aria-hidden />

        {/* Edit field — opens the two-step popover, anchored to this button so it rises directly
            above it (not the bar's far edge). */}
        <div className="relative flex">
          <button
            type="button"
            disabled={!canEdit}
            title={canEdit ? undefined : "No bulk-editable fields in this view"}
            onClick={() => setStep(s => (s ? null : { kind: "fields" }))}
            data-open={!!step}
            className="flex items-center gap-2 h-[34px] px-3 rounded-full text-[13px] font-medium transition-colors duration-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)] enabled:hover:bg-[color:var(--fill-subtle)] data-[open=true]:bg-[color:var(--fill-subtle)] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: "var(--text-1)" }}
          >
            <Pencil size={15} strokeWidth={2} />
            Edit field
          </button>

          {step && (
            <FieldPopover
              step={step}
              onPickField={col => setStep({ kind: "values", col })}
              onBack={() => setStep({ kind: "fields" })}
              onPickValue={(key, value) => { onBulkSetField(key, value); closePopover(); }}
              cols={editableDropdownCols}
              onDismiss={closePopover}
            />
          )}
        </div>

        {/* Mark as funded / Remove from funded */}
        <button
          type="button"
          onClick={onBulkFund}
          className="flex items-center gap-2 h-[34px] px-3 rounded-full text-[13px] font-medium transition-colors duration-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)] hover:bg-[color:var(--fill-subtle)]"
          style={{ color: "var(--text-1)" }}
        >
          {unfund ? <CircleMinus size={15} strokeWidth={2} /> : <CircleDollarSign size={15} strokeWidth={2} />}
          {unfund ? "Remove from funded" : "Mark as funded"}
        </button>

        {/* Duplicate — one copy per selected record */}
        <button
          type="button"
          onClick={onBulkDuplicate}
          className="flex items-center gap-2 h-[34px] px-3 rounded-full text-[13px] font-medium transition-colors duration-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)] hover:bg-[color:var(--fill-subtle)]"
          style={{ color: "var(--text-1)" }}
        >
          <Copy size={15} strokeWidth={2} />
          Duplicate
        </button>

        {/* Delete — destructive, so it reads in the danger register and sits apart on the right. */}
        <button
          type="button"
          onClick={onBulkDelete}
          className="flex items-center gap-2 h-[34px] px-3 rounded-full text-[13px] font-medium transition-colors duration-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)] hover:bg-red-50 dark:hover:bg-red-500/10 active:bg-red-100/70 dark:active:bg-red-500/15"
          style={{ color: "var(--danger-text)" }}
        >
          <Trash2 size={15} strokeWidth={2} />
          Delete
        </button>
        {/* delete uses the danger token for its foreground */}

        <span className="w-px h-5 mx-1" style={{ backgroundColor: "var(--hairline)" }} aria-hidden />

        {/* Clear selection */}
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="grid place-items-center w-[34px] h-[34px] rounded-full transition-colors duration-100 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)] hover:bg-[color:var(--fill-subtle)]"
          style={{ color: "var(--text-3)" }}
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

// The two-step chooser, floated above the "Edit field" button. Step 1 lists the bulk-editable
// dropdown fields; step 2 lists the chosen field's values. Same glass language as the bar.
function FieldPopover({
  step,
  cols,
  onPickField,
  onPickValue,
  onBack,
  onDismiss,
}: {
  step: Step;
  cols: Column[];
  onPickField: (col: Column) => void;
  onPickValue: (key: keyof Idea, value: string) => void;
  onBack: () => void;
  onDismiss: () => void;
}) {
  const isValues = step.kind === "values";
  return (
    <>
      {/* Click-catcher: a click anywhere else closes the popover (the bar stays). */}
      <div className="fixed inset-0 z-40" onMouseDown={onDismiss} />
      <div
        role="menu"
        className="pop-in surface-pop absolute bottom-full left-0 mb-3 z-50 w-60 rounded-[16px] py-1.5 overflow-hidden"
        style={{
          transformOrigin: "bottom left",
          backgroundColor: "var(--surface-raised)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid var(--hairline)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {/* Header — a static label on step 1, a Back affordance on step 2. */}
        {isValues ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 w-full text-left px-2.5 h-[32px] text-[12px] font-medium transition-colors duration-100 rounded-[8px] mx-1 hover:bg-[color:var(--fill-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)]"
            style={{ width: "calc(100% - 8px)", color: "var(--text-2)" }}
          >
            <ChevronLeft size={14} strokeWidth={2} />
            {step.col.label}
          </button>
        ) : (
          <div className="px-3.5 h-[28px] flex items-center text-[11px] font-semibold uppercase" style={{ color: "var(--text-3)", letterSpacing: "0.04em" }}>
            Set field
          </div>
        )}

        <div className="border-t border-gray-100 dark:border-white/10 my-1 mx-1" />

        {/* Scrollable body — long option lists (e.g. Comparator-length) stay contained. */}
        <div className="max-h-[280px] overflow-y-auto">
          {!isValues && cols.map(col => (
            <button
              key={col.key}
              role="menuitem"
              type="button"
              onClick={() => onPickField(col)}
              className="flex items-center justify-between gap-2 w-full text-left px-3.5 h-[34px] text-[13px] transition-colors duration-100 rounded-[8px] mx-1 my-px active:scale-[0.98] hover:bg-[color:var(--fill-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)]"
              style={{ width: "calc(100% - 8px)", color: "var(--text-1)" }}
            >
              {col.label}
              <ChevronRight size={14} strokeWidth={2} className="opacity-40" />
            </button>
          ))}

          {isValues && step.col.options!.map(opt => (
            <button
              key={opt}
              role="menuitem"
              type="button"
              onClick={() => onPickValue(step.col.key, opt)}
              className="flex items-center w-full text-left px-3.5 h-[34px] text-[13px] transition-colors duration-100 rounded-[8px] mx-1 my-px active:scale-[0.98] hover:bg-[color:var(--fill-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent-ring)]"
              style={{ width: "calc(100% - 8px)", color: "var(--text-1)" }}
            >
              {opt || <span style={{ color: "var(--text-3)" }}>(empty)</span>}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
