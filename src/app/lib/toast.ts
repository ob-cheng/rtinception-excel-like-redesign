import { toast } from "sonner";

// Toast dwell times (ms), tuned to content + interactivity per notification best practice:
// a bare confirmation is brief; a notice with a description lingers; anything carrying an Undo
// gets a long window to find + press it; a validation error stays put well past a glance.
// Sonner additionally pauses whichever timer is running while the pointer is over the stack.
export const TOAST_MS = { confirm: 3000, notice: 5000, action: 10000, error: 8000 } as const;

// "1 idea" / "3 ideas" — keeps the bulk-action toasts grammatical for any selection size.
export const ideasLabel = (n: number) => `${n} ${n === 1 ? "idea" : "ideas"}`;

// Emit an undoable toast: centralizes the long dwell time and the one-tap Undo across every
// mutation (inline edit / add / save / duplicate / delete / rank / fund) so they stay identical.
export function reversibleToast(
  message: string,
  opts: { description?: string; success?: boolean; icon?: React.ReactNode; undo: () => void },
) {
  const cfg = {
    description: opts.description,
    duration: TOAST_MS.action,
    icon: opts.icon,
    action: { label: "Undo", onClick: () => opts.undo() },
  };
  if (opts.success) toast.success(message, cfg);
  else toast(message, cfg);
}
