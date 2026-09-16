import { useEffect, useRef, useState } from "react";
import { Lock, X } from "lucide-react";
import type { Column, Idea, ViewKey } from "../../types";
import { isColReadOnly } from "../../data/columns";
import { comparatorOptionsFor, emptyDraft } from "../../data/ideas";
import { useModalA11y } from "../../hooks/useModalA11y";
import { SelectField } from "./SelectField";

// The record card — one glass modal that does double duty for BOTH creating a new study and
// editing an existing one, so the two read as the same act (Familiarity: same layout, same rules,
// same place). It sources its fields from the grid rather than defining its own set — the fields
// are the view's *visible* columns — but for data entry it groups them by kind (the record's key
// first, then the fields the user fills, then anything owned elsewhere) rather than dumping them in
// raw column order, so the card reads as a task instead of a table row stood on end.
// The read-only ownership rule is the exact same
// `isColReadOnly` the table uses — so a field the user can't edit in Franchise (Evidence-owned,
// and vice-versa) shows here too, just locked. That coupling means the card can never drift from
// the grid as columns/ownership change. Inline cell editing still exists as the quick single-value
// path; this card is the considered, whole-record path shared by Add and Edit.
//
// Mode is snapshotted at open time (isEdit / baseUid) so the title, footer, and UID rules stay
// stable through the exit animation even as the parent clears its edit target. Shell (spring
// entrance, backdrop, Escape) matches PrioritizeModal so the whole family reads as one.

// Who owns the columns a given view can see but not edit — used for the "Managed by …" hint on
// locked fields, matching the toast copy the grid shows on a read-only edit attempt.
const OWNER_BY_VIEW: Partial<Record<ViewKey, string>> = {
  "Franchise": "the Evidence Function",
  "Evidence Function": "Franchise",
};

export function AddStudyModal({
  open,
  view,
  mode = "create",
  initial = null,
  columns,
  existingUids,
  onClose,
  onSubmit,
}: {
  open: boolean;
  view: ViewKey;
  // "create" opens blank; "edit" prefills from `initial` and saves in place.
  mode?: "create" | "edit";
  initial?: Idea | null;
  // The columns visible in the current view, in display order (already resolved by App via
  // viewColumns(view, visibleKeys(view))) — so hiding a column in the grid also drops it here.
  columns: Column[];
  existingUids: Set<string>;
  onClose: () => void;
  onSubmit: (idea: Idea) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState<Idea>(emptyDraft);
  // Snapshotted at open so title/footer/UID rules survive the exit animation unchanged.
  const [isEdit, setIsEdit] = useState(false);
  const [baseUid, setBaseUid] = useState<string | null>(null);
  // Attempted-submit gate: only surface the "UID required" hint after the user actually tries to
  // save, so a blank card never scolds them before they've done anything (Forgiveness §16).
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  // Scroll-edge state (§12): the header/footer hairlines exist only where content is scrolled
  // beneath them, so the body reads as flowing under floating chrome rather than boxed by dividers.
  const [scrolled, setScrolled] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const uidFieldRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Trap Tab inside the card, inert the background, and restore focus to the trigger on close (§A.4).
  // Keyed to `mounted` so the isolation holds through the exit animation.
  useModalA11y(mounted, overlayRef, dialogRef);

  // On open: seed the draft (blank for create, the record for edit) and snapshot the mode.
  // Play the exit before unmounting on close.
  useEffect(() => {
    if (open) {
      setMounted(true);
      setConfirmDiscard(false);
      setAttemptedSubmit(false);
      setScrolled(false);
      setAtBottom(true);
      const editing = mode === "edit" && initial != null;
      setIsEdit(editing);
      setBaseUid(editing ? initial!.uid : null);
      setDraft(editing ? initial! : emptyDraft);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 320);
      return () => clearTimeout(t);
    }
  }, [open, mode, initial]);

  // Reveal after the mounted-but-invisible frame paints so the entrance actually transitions.
  useEffect(() => {
    if (!open || !mounted) return;
    const r = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(r);
  }, [open, mounted]);

  // Focus the record's key field (UID) once the card is up — the one field every study needs.
  useEffect(() => {
    if (open && mounted) {
      const r = requestAnimationFrame(() => uidFieldRef.current?.focus());
      return () => cancelAnimationFrame(r);
    }
  }, [open, mounted]);

  // Seed the scroll-edge state once laid out: if the form doesn't overflow, the footer hairline
  // should stay hidden (there's nothing scrolled beneath it).
  useEffect(() => {
    if (!open || !mounted) return;
    const r = requestAnimationFrame(() => {
      const el = bodyRef.current;
      if (el) setAtBottom(el.scrollHeight - el.clientHeight <= 1);
    });
    return () => cancelAnimationFrame(r);
  }, [open, mounted]);

  // Forgiveness (§16): if the card holds unsaved edits, confirm before an accidental Esc/backdrop
  // dismissal throws them away. A clean card closes silently. `baseline` is what "unchanged" means:
  // the record being edited, or a blank draft when creating.
  const baseline = isEdit && baseUid != null ? (initial ?? emptyDraft) : emptyDraft;
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  // Themed discard confirmation instead of window.confirm — same glass surface and voice as the
  // rest of the app, with buttons that name the consequence (§W.3).
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  function attemptClose() {
    if (dirty) { setConfirmDiscard(true); return; }
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      // ⌘/Ctrl+Return commits from anywhere in the form (Achievement §16) — the keyboard path to
      // the same act as the footer's primary button, so it routes through submit()'s validation too.
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); submit(); return; }
      if (e.key !== "Escape") return;
      // While the discard prompt is up, Escape dismisses the prompt (keep editing), not the card.
      if (confirmDiscard) { e.stopPropagation(); setConfirmDiscard(false); return; }
      attemptClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const owner = OWNER_BY_VIEW[view] ?? "another team";
  // Label the save shortcut with the right modifier for the platform (Familiarity §16).
  const isMac = typeof navigator !== "undefined" && /Mac|iP(hone|ad|od)/.test(navigator.platform);

  // The one required, validated field — same rule as the grid's commit: non-empty + unique. In edit
  // mode the record's own UID doesn't count as "taken" (so an unchanged UID is fine, and a rename is
  // allowed as long as it's free — matching the inline commit path).
  const trimmedUid = draft.uid.trim();
  const uidTaken = trimmedUid.length > 0 && trimmedUid !== baseUid && existingUids.has(trimmedUid);
  const canSave = trimmedUid.length > 0 && !uidTaken;
  // A UID the user still owes us — only shown after they try to save (Understanding, not scolding).
  const uidMissing = attemptedSubmit && trimmedUid.length === 0;

  const set = (key: keyof Idea, val: string) => setDraft(d => ({ ...d, [key]: val }));

  // The primary button stays live rather than dimming to a dead 40% — pressing it with an invalid
  // UID doesn't silently fail (Agency §16); it takes the user straight to the field that needs them
  // and names what's missing, instead of leaving them to guess why nothing happened.
  function submit() {
    if (!canSave) {
      setAttemptedSubmit(true);
      const el = uidFieldRef.current;
      if (el) { el.focus(); el.scrollIntoView({ block: "nearest" }); }
      return;
    }
    onSubmit({ ...draft, uid: trimmedUid });
  }

  // One field block (label + control + message), rendered identically wherever it lands — identity,
  // details, or managed-elsewhere — so the control set stays consistent while the grouping does the
  // layout work. `primary` gives the record's key (UID) a little more presence.
  const renderField = (col: Column, opts: { primary?: boolean } = {}) => {
    const { primary = false } = opts;
    const readOnly = isColReadOnly(view, col.key);
    const isUid = col.key === "uid";
    const longText = col.tooltip === true;
    const options = col.key === "comparator" ? comparatorOptionsFor(draft.project) : col.options;
    const value = draft[col.key] ?? "";
    const fieldError = isUid && (uidTaken || uidMissing);

    return (
      <div key={col.key}>
        <label
          htmlFor={`add-${col.key}`}
          className="flex items-center gap-1.5 text-[12px] font-medium mb-1.5"
          style={{ color: "var(--text-2)" }}
        >
          {col.label}
          {isUid && <span style={{ color: "var(--accent)" }}>*</span>}
          {readOnly && <Lock size={11} strokeWidth={2} style={{ color: "var(--text-4)" }} />}
        </label>

        {readOnly ? (
          // Locked here (owned by another view). Show the real value when editing; a quiet dash when
          // empty — the section header already says who manages these, so no need to repeat it per field.
          <div
            id={`add-${col.key}`}
            className="w-full min-h-[36px] px-3 py-2 flex items-center rounded-[12px] text-[13px] cursor-not-allowed"
            style={{ backgroundColor: "var(--fill-subtle)", color: value ? "var(--text-3)" : "var(--text-4)" }}
          >
            {value ? <span>{value}</span> : <span>—</span>}
          </div>
        ) : options ? (
          <SelectField
            id={`add-${col.key}`}
            value={value}
            options={options}
            onChange={val => set(col.key, val)}
          />
        ) : longText ? (
          <textarea
            id={`add-${col.key}`}
            value={value}
            onChange={e => set(col.key, e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-[12px] text-base sm:text-[13px] leading-[1.45] resize-y placeholder:text-[color:var(--text-4)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-ring)] transition-shadow duration-100"
            style={{ backgroundColor: "var(--fill-subtle)", color: "var(--text-1)", border: "1px solid var(--hairline)" }}
          />
        ) : (
          <input
            id={`add-${col.key}`}
            ref={isUid ? (el => { uidFieldRef.current = el; }) : undefined}
            type="text"
            value={value}
            placeholder={isUid ? "Unique identifier" : undefined}
            onChange={e => set(col.key, e.target.value)}
            className={`w-full ${primary ? "h-[42px] text-[15px]" : "h-[36px] text-base sm:text-[13px]"} px-3 rounded-[12px] placeholder:text-[color:var(--text-4)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-ring)] transition-shadow duration-100`}
            style={{
              backgroundColor: "var(--fill-subtle)",
              color: "var(--text-1)",
              border: fieldError ? "1px solid var(--danger)" : "1px solid var(--hairline)",
            }}
          />
        )}

        {fieldError ? (
          <p className="text-[11.5px] mt-1" style={{ color: "var(--danger-text)" }}>
            {uidTaken
              ? `UID ${trimmedUid} already exists — choose a unique UID.`
              : "Add a UID to save this record."}
          </p>
        ) : col.note ? (
          <p className="text-[11.5px] mt-1 leading-[1.4]" style={{ color: "var(--text-3)" }}>{col.note}</p>
        ) : null}
      </div>
    );
  };

  // Partition the visible columns by kind for the grouped layout (order within each group preserves
  // the grid's column order, so spatial familiarity survives the regrouping).
  const uidCol = columns.find(c => c.key === "uid");
  const restCols = columns.filter(c => c.key !== "uid");
  const lockedCols = restCols.filter(c => isColReadOnly(view, c.key));
  const editableCols = restCols.filter(c => !isColReadOnly(view, c.key));
  // A field is "long" only if it renders as a textarea — i.e. flagged long-text AND not a dropdown.
  // Dropdowns stay in the two-column grid even when they carry a tooltip (e.g. Comparator).
  const colOptions = (c: Column) => (c.key === "comparator" ? comparatorOptionsFor(draft.project) : c.options);
  const isLong = (c: Column) => c.tooltip === true && !colOptions(c);
  const longCols = editableCols.filter(isLong);
  const shortCols = editableCols.filter(c => !isLong(c));

  if (!mounted) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ overscrollBehavior: "contain" }}>
      <div
        onClick={attemptClose}
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit study" : "Add study"}
        className="relative flex flex-col rounded-[20px] overflow-hidden w-full"
        style={{
          backgroundColor: "var(--surface-modal)",
          maxWidth: "min(680px, calc(100vw - 48px))",
          maxHeight: "90vh",
          boxShadow: "0 32px 80px -16px rgba(15,23,42,0.42), 0 0 0 1px var(--hairline)",
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1) translateY(0)" : "scale(0.96) translateY(12px)",
          transition: "opacity 0.26s ease, transform 0.36s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header */}
        <div
          className="shrink-0 flex items-start justify-between gap-4 px-6 pt-5 pb-4"
          style={{
            borderBottom: "1px solid",
            borderBottomColor: scrolled ? "var(--hairline)" : "transparent",
            transition: "border-color 0.2s ease",
          }}
        >
          <div className="min-w-0">
            <h2 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em]">{isEdit ? "Edit study" : "Add study"}</h2>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--text-3)" }}>{isEdit ? `${view} record` : `New ${view} record`}</p>
          </div>
          <button
            onClick={attemptClose}
            aria-label="Close"
            className="shrink-0 -mr-1 grid place-items-center w-8 h-8 rounded-full text-gray-400 dark:text-gray-400 bg-gray-100/70 dark:bg-white/[0.06] hover:bg-gray-200/70 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-200 active:scale-95 transition-all duration-100"
          >
            <X size={15} strokeWidth={2.25} />
          </button>
        </div>

        {/* Body — grouped for data entry: the record's key first, then the fields the user fills,
            then anything owned elsewhere (locked) gathered at the end for context. */}
        <div
          ref={bodyRef}
          onScroll={e => {
            const el = e.currentTarget;
            setScrolled(el.scrollTop > 1);
            setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight <= 1);
          }}
          className="flex-1 min-h-0 overflow-y-auto px-6 py-5"
        >
          <div className="space-y-7">
            {/* Identity — the one key that names the record; short by nature, so it doesn't need
                to span the full width. */}
            {uidCol && (
              <div className="max-w-[320px]">
                {renderField(uidCol, { primary: true })}
              </div>
            )}

            {/* Study details — the fields the user actually fills. Short fields flow in two columns;
                long-text fields stack full-width below so they get room to breathe. */}
            {(shortCols.length > 0 || longCols.length > 0) && (
              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.07em] mb-3" style={{ color: "var(--text-3)" }}>
                  Study details
                </h3>
                {shortCols.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                    {shortCols.map(col => renderField(col))}
                  </div>
                )}
                {longCols.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {longCols.map(col => renderField(col))}
                  </div>
                )}
              </section>
            )}

            {/* Owned elsewhere — locked fields, shown for context but kept out of the input flow so
                the user isn't stepping over things they can't change. */}
            {lockedCols.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.07em]" style={{ color: "var(--text-3)" }}>
                    Managed by {owner}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "var(--text-4)" }}>
                    <Lock size={10} strokeWidth={2} /> read-only
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                  {lockedCols.map(col => renderField(col))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="shrink-0 flex items-center justify-between gap-3 px-6 py-4"
          style={{
            borderTop: "1px solid",
            borderTopColor: atBottom ? "transparent" : "var(--hairline)",
            transition: "border-color 0.2s ease",
          }}
        >
          {/* Quiet discoverability for the keyboard commit path (§16 wayfinding) — hidden on
              narrow screens where there's no physical keyboard to speak of. */}
          <span className="hidden sm:flex items-center gap-1 text-[11.5px]" style={{ color: "var(--text-4)" }}>
            <kbd
              className="grid place-items-center min-w-[18px] h-[18px] px-1 rounded-[5px] text-[11px] font-sans"
              style={{ backgroundColor: "var(--fill-subtle)", border: "1px solid var(--hairline)", color: "var(--text-3)" }}
            >
              {isMac ? "⌘" : "Ctrl"}
            </kbd>
            <kbd
              className="grid place-items-center min-w-[18px] h-[18px] px-1 rounded-[5px] text-[11px] font-sans"
              style={{ backgroundColor: "var(--fill-subtle)", border: "1px solid var(--hairline)", color: "var(--text-3)" }}
            >
              ↵
            </kbd>
            <span className="ml-0.5">to {isEdit ? "save" : "add"}</span>
          </span>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={attemptClose}
              className="h-[36px] px-5 rounded-full text-[13px] font-medium text-gray-600 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-[0.98] transition-all duration-100"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              aria-disabled={!canSave}
              className="h-[36px] px-6 rounded-full text-white text-[13px] font-medium active:scale-[0.99] transition-all duration-100"
              style={{ backgroundColor: "var(--accent-strong)", opacity: canSave ? 1 : 0.55 }}
            >
              {isEdit ? "Save changes" : "Add study"}
            </button>
          </div>
        </div>

        {/* Discard confirmation — a calm, plain nested prompt (§W.3/§W.6). Buttons name the
            consequence so the choice is answerable without re-reading the body. */}
        {confirmDiscard && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Discard changes"
            className="absolute inset-0 z-10 flex items-center justify-center p-6"
            style={{ backgroundColor: "color-mix(in srgb, var(--surface-modal) 62%, transparent)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }}
          >
            <div
              className="w-full max-w-[360px] rounded-[16px] p-5"
              style={{ backgroundColor: "var(--surface-raised)", border: "1px solid var(--hairline)", boxShadow: "0 20px 50px -12px rgba(15,23,42,0.4)" }}
            >
              <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-1)" }}>Discard changes?</h3>
              <p className="text-[13px] mt-1.5 leading-[1.45]" style={{ color: "var(--text-3)" }}>
                Your edits to this record haven&apos;t been saved. They will be lost if you close now.
              </p>
              <div className="flex items-center justify-end gap-2.5 mt-5">
                <button
                  onClick={() => setConfirmDiscard(false)}
                  className="h-[34px] px-4 rounded-full text-[13px] font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-[0.98] transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)]"
                  style={{ color: "var(--text-2)" }}
                >
                  Keep editing
                </button>
                <button
                  autoFocus
                  onClick={() => { setConfirmDiscard(false); onClose(); }}
                  className="h-[34px] px-4 text-[13px] font-medium rounded-full active:scale-[0.98] transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--accent-ring)]"
                  style={{ backgroundColor: "var(--danger)", color: "var(--on-danger)" }}
                >
                  Discard changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
