import { useEffect, useMemo, useRef, useState } from "react";
import { Briefcase, Check, ChessKnight, ChevronLeft, ChevronRight, Eye, Layers, Microscope, Moon, Sun, UserPen } from "lucide-react";
import type { RankPersona, ViewKey } from "../../types";
import type { Theme } from "../../hooks/usePreferences";
import { PORTFOLIOS, PORTFOLIO_ABBR } from "../../data/portfolios";
import { useModalA11y } from "../../hooks/useModalA11y";

// What the interview collects — the profile fields (theme/zoom are applied live via the setters
// below, so they aren't part of this payload). Passed up on Finish/Skip.
export type OnboardingResult = {
  persona: RankPersona | null;
  portfolio: string | null;
  focusView: ViewKey | null;
};

type StepId = "welcome" | "portfolio" | "focus" | "role" | "appearance";

// The first-run setup interview. A short, fully skippable walk that seeds the app's defaults so a
// new user doesn't have to hunt for them. Styled to match PrioritizeModal (same shell, backdrop,
// focus trap, step-fade) so it reads as part of the same product, not a bolted-on wizard. Theme
// and zoom are applied live as the user picks them — instant preview — while portfolio / focus /
// role are gathered locally and committed on Finish (or on Skip, with whatever's chosen so far).
export function OnboardingModal({
  open,
  initial,
  theme,
  onSetTheme,
  zoom,
  onSetZoom,
  onSkip,
  onComplete,
}: {
  open: boolean;
  initial: OnboardingResult;
  theme: Theme;
  onSetTheme: (t: Theme) => void;
  zoom: number;
  onSetZoom: (z: number) => void;
  onSkip: (result: OnboardingResult) => void;
  onComplete: (result: OnboardingResult) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [persona, setPersona] = useState<RankPersona | null>(initial.persona);
  const [portfolio, setPortfolio] = useState<string | null>(initial.portfolio);
  const [focusView, setFocusView] = useState<ViewKey | null>(initial.focusView);

  const steps: StepId[] = ["welcome", "portfolio", "focus", "role", "appearance"];
  const stepId = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const overlayRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [reduced, setReduced] = useState(false);

  // Honor prefers-reduced-motion: under it we drop the scale/translate entrance and the height
  // tween, and cross-fade with opacity only (per the motion accessibility rule).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Mount + reset selections each time the interview opens (initial reflects the current profile so
  // a redo starts from what's already chosen).
  useEffect(() => {
    if (open) {
      setMounted(true);
      setStepIndex(0);
      setPersona(initial.persona);
      setPortfolio(initial.portfolio);
      setFocusView(initial.focusView);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 320);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reveal after the first painted frame so the entrance transition actually plays.
  useEffect(() => {
    if (!open || !mounted) return;
    const r = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(r);
  }, [open, mounted]);

  // Measure content height so the shell can animate between steps of different sizes.
  useEffect(() => {
    const el = contentRef.current;
    if (!el || !mounted) return;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted, stepIndex]);

  useModalA11y(mounted, overlayRef, shellRef);

  const result = useMemo<OnboardingResult>(() => ({ persona, portfolio, focusView }), [persona, portfolio, focusView]);

  if (!mounted) return null;

  // Which steps require a choice before you can move on. Welcome and appearance have no required
  // pick (theme/zoom always have a live value); the middle three each need a selection.
  const canAdvance =
    stepId === "portfolio" ? portfolio !== null :
    stepId === "focus" ? focusView !== null :
    stepId === "role" ? persona !== null :
    true;

  const next = () => {
    if (!canAdvance) return;
    setStepIndex(i => Math.min(steps.length - 1, i + 1));
  };
  const back = () => setStepIndex(i => Math.max(0, i - 1));

  // Return advances the flow (Finish on the last step) as long as focus isn't on an interactive
  // control that owns Enter itself — pressing Return on a choice card still just picks that card.
  // Blocked when the current step still needs a selection.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" || e.target instanceof HTMLButtonElement) return;
    e.preventDefault();
    if (!canAdvance) return;
    if (isLast) onComplete(result);
    else next();
  };

  return (
    <div ref={overlayRef} onKeyDown={onKeyDown} className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ overscrollBehavior: "contain" }}>
      <div
        onClick={() => onSkip(result)}
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      <div
        ref={shellRef}
        role="dialog"
        aria-modal="true"
        aria-label="Set up your workspace"
        className="relative flex flex-col rounded-[20px] overflow-hidden"
        style={{
          backgroundColor: "var(--surface-modal)",
          width: "min(560px, calc(100vw - 48px))",
          height: height ?? "auto",
          maxHeight: "90vh",
          boxShadow: "0 32px 80px -16px rgba(15,23,42,0.42), 0 0 0 1px var(--hairline)",
          opacity: visible ? 1 : 0,
          transform: reduced ? "none" : visible ? "scale(1) translateY(0)" : "scale(0.96) translateY(12px)",
          transition: reduced
            ? "opacity 0.2s ease"
            : "height 0.36s cubic-bezier(0.16,1,0.3,1), opacity 0.26s ease, transform 0.36s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div ref={contentRef} className="flex flex-col" style={{ maxHeight: "90vh" }}>
          {/* Progress rail (hidden on the welcome step). Rail segments are decorative; the step
              position is announced via the accessible label so it isn't carried by color alone. */}
          {stepId !== "welcome" && (
            <div
              className="flex items-center gap-3 px-6 pt-5"
              role="group"
              aria-label={`Step ${stepIndex} of ${steps.length - 1}`}
            >
              <div className="flex items-center gap-1.5 flex-1" aria-hidden="true">
                {steps.slice(1).map((s, i) => (
                  <span
                    key={s}
                    className="h-1 flex-1 rounded-full transition-colors duration-300"
                    style={{ backgroundColor: i <= stepIndex - 1 ? "var(--accent-strong)" : "var(--control-track)" }}
                  />
                ))}
              </div>
              <span
                className="text-[11px] font-medium tabular-nums shrink-0"
                style={{ color: "var(--text-3)" }}
                aria-hidden="true"
              >
                {stepIndex}/{steps.length - 1}
              </span>
            </div>
          )}

          {/* Body — keyed by step so each entrance fades in gently. */}
          <div key={stepId} className="step-fade flex-1 min-h-0 overflow-y-auto px-6 py-6">
            {stepId === "welcome" && (
              <div className="flex flex-col items-center text-center py-6">
                {/* Just the mark — a thin-line UserPen glyph in the accent color, no tile or
                    background. Restraint over decoration; the type carries the moment. */}
                <span className="grid place-items-center mb-6" style={{ color: "var(--accent)" }}>
                  <UserPen size={44} strokeWidth={1.5} />
                </span>
                <p className="text-[13px] font-medium tracking-[0.01em] mb-1.5" style={{ color: "var(--accent)" }}>
                  Hey there, first time here?
                </p>
                <h2 className="text-[28px] font-semibold leading-[1.12] text-gray-900 dark:text-gray-100 tracking-[-0.03em] text-balance">
                  Let&apos;s set up your workspace
                </h2>
                <p className="text-[15px] leading-[1.6] mt-3 max-w-[400px] text-pretty" style={{ color: "var(--text-3)" }}>
                  A few quick questions so the application opens the way you work — the right portfolio,
                  tab, and appearance.
                  <br />
                  You can change any of it later, or skip and explore.
                </p>
              </div>
            )}

            {stepId === "portfolio" && (
              <StepShell title="Which portfolio do you work on?" subtitle="We&apos;ll focus the list here when you open the app.">
                <div className="grid grid-cols-2 gap-2">
                  <OptionTile
                    selected={portfolio === "All"}
                    onClick={() => setPortfolio("All")}
                    badge="ALL"
                    label="All portfolios"
                  />
                  {PORTFOLIOS.map(p => (
                    <OptionTile
                      key={p}
                      selected={portfolio === p}
                      onClick={() => setPortfolio(p)}
                      badge={PORTFOLIO_ABBR[p] ?? <Layers size={13} strokeWidth={2} />}
                      label={p}
                    />
                  ))}
                </div>
              </StepShell>
            )}

            {stepId === "focus" && (
              <StepShell title="What's your primary focus?" subtitle="Sets the tab you'll land on. You can switch tabs anytime.">
                <div className="grid grid-cols-2 gap-3">
                  <ChoiceCard
                    selected={focusView === "Franchise"}
                    onClick={() => setFocusView("Franchise")}
                    icon={<ChessKnight size={20} strokeWidth={1.9} />}
                    title="Franchise"
                    subtitle="Strategy, ranking, and study framing"
                  />
                  <ChoiceCard
                    selected={focusView === "Evidence Function"}
                    onClick={() => setFocusView("Evidence Function")}
                    icon={<Microscope size={20} strokeWidth={1.9} />}
                    title="Evidence Function"
                    subtitle="Study design, endpoints, and cost"
                  />
                </div>
              </StepShell>
            )}

            {stepId === "role" && (
              <StepShell title="What's your role?" subtitle="Used to prioritize records — we'll remember it so you're not asked each time.">
                <div className="grid grid-cols-2 gap-3">
                  <ChoiceCard
                    selected={persona === "brand"}
                    onClick={() => setPersona("brand")}
                    icon={<Eye size={20} strokeWidth={1.9} />}
                    title="Brand Director"
                    subtitle="Prioritize one product's records"
                  />
                  <ChoiceCard
                    selected={persona === "portfolio"}
                    onClick={() => setPersona("portfolio")}
                    icon={<Briefcase size={20} strokeWidth={1.9} />}
                    title="Therapeutic Area VP"
                    subtitle="Prioritize a whole portfolio"
                  />
                </div>
              </StepShell>
            )}

            {stepId === "appearance" && (
              <StepShell title="Make it comfortable" subtitle="Pick a theme and text size. Adjust anytime from Settings.">
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="text-[12px] font-medium mb-2" style={{ color: "var(--text-3)" }}>Theme</p>
                    <div className="grid grid-cols-2 gap-3">
                      <ChoiceCard
                        selected={theme === "light"}
                        onClick={() => onSetTheme("light")}
                        icon={<Sun size={20} strokeWidth={1.9} />}
                        title="Light"
                        subtitle="Bright and crisp"
                      />
                      <ChoiceCard
                        selected={theme === "dark"}
                        onClick={() => onSetTheme("dark")}
                        icon={<Moon size={20} strokeWidth={1.9} />}
                        title="Dark"
                        subtitle="Easy on the eyes"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium mb-2" style={{ color: "var(--text-3)" }}>Display size</p>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { z: 0.9, label: "Compact" },
                        { z: 1, label: "Default" },
                        { z: 1.25, label: "Large" },
                      ] as const).map(({ z, label }) => {
                        const active = Math.abs(zoom - z) < 0.001;
                        return (
                          <button
                            key={label}
                            onClick={() => onSetZoom(z)}
                            aria-pressed={active}
                            className="relative flex flex-col items-center gap-1 py-3 rounded-[14px] active:scale-[0.98] transition-[transform,background-color,border-color] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]/40"
                            style={{
                              border: `1px solid ${active ? "var(--accent-strong)" : "var(--hairline)"}`,
                              backgroundColor: active ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "transparent",
                            }}
                          >
                            {active && (
                              <span className="absolute top-2 right-2 grid place-items-center w-5 h-5 rounded-full text-white" style={{ backgroundColor: "var(--accent-strong)" }}>
                                <Check size={12} strokeWidth={3} />
                              </span>
                            )}
                            <span className="font-semibold text-gray-900 dark:text-gray-100" style={{ fontSize: `${13 * z}px` }}>Aa</span>
                            <span className="text-[12px]" style={{ color: "var(--text-3)" }}>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </StepShell>
            )}
          </div>

          {/* Footer: Skip (left) · Back / Next / Finish (right). */}
          <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4">
            <button
              onClick={() => onSkip(result)}
              className="inline-flex items-center h-[36px] px-2 -mx-2 rounded-lg text-[13px] text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]/40"
            >
              Skip setup
            </button>

            <div className="flex items-center gap-3">
              {stepIndex > 0 && (
                <button
                  onClick={back}
                  className="inline-flex items-center gap-1 h-[36px] px-4 rounded-full text-[13px] font-medium text-gray-600 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-[0.98] transition-[transform,background-color,color] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]/40"
                >
                  <ChevronLeft size={15} /> Back
                </button>
              )}
              {isLast ? (
                <button
                  onClick={() => onComplete(result)}
                  className="inline-flex items-center gap-1.5 h-[36px] pl-4 pr-6 rounded-full text-white text-[13px] font-medium active:scale-[0.99] transition-[transform,filter] duration-100 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-modal)]"
                  style={{ backgroundColor: "var(--accent-strong)" }}
                >
                  <Check size={15} strokeWidth={2.4} /> Finish setup
                </button>
              ) : (
                <button
                  onClick={next}
                  disabled={!canAdvance}
                  aria-disabled={!canAdvance}
                  className="inline-flex items-center gap-1 h-[36px] pl-6 pr-4 rounded-full text-white text-[13px] font-medium transition-[transform,filter,opacity] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-modal)] enabled:active:scale-[0.99] enabled:hover:brightness-[1.06] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "var(--accent-strong)" }}
                >
                  {stepIndex === 0 ? "Get started" : "Next"} <ChevronRight size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[18px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em] text-balance">{title}</h2>
      <p className="text-[13px] mt-0.5 mb-4 text-pretty" style={{ color: "var(--text-3)" }}>{subtitle}</p>
      {children}
    </div>
  );
}

// A large tap card with a selected ring — used for the binary/small choices (focus, role, theme).
function ChoiceCard({
  selected,
  onClick,
  icon,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className="relative flex flex-col items-start gap-3 p-4 rounded-[16px] text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] active:scale-[0.98] transition-[transform,background-color,border-color,box-shadow] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]/40"
      style={{
        border: `1px solid ${selected ? "var(--accent-strong)" : "var(--hairline)"}`,
        boxShadow: selected ? "0 0 0 1px var(--accent-strong)" : "none",
      }}
    >
      {selected && (
        <span className="absolute top-3 right-3 grid place-items-center w-5 h-5 rounded-full text-white" style={{ backgroundColor: "var(--accent-strong)" }}>
          <Check size={12} strokeWidth={3} />
        </span>
      )}
      {/* No tinted plate behind the glyph — the icon itself carries the accent, but only when
          selected, so selection is the single source of color (no redundant always-on fill). */}
      <span className="grid place-items-center" style={{ color: selected ? "var(--accent)" : "var(--text-3)" }}>
        {icon}
      </span>
      <span>
        <span className="block text-[15px] font-medium text-gray-900 dark:text-gray-100">{title}</span>
        <span className="block text-[12px] mt-0.5" style={{ color: "var(--text-3)" }}>{subtitle}</span>
      </span>
    </button>
  );
}

// A compact row tile with an abbreviation badge — used for the portfolio grid (many options).
function OptionTile({
  selected,
  onClick,
  badge,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  badge: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      title={label}
      className="flex items-center gap-2.5 px-3 py-2.5 min-h-[54px] rounded-[12px] text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] active:scale-[0.98] transition-[transform,background-color,border-color,box-shadow] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]/40"
      style={{
        border: `1px solid ${selected ? "var(--accent-strong)" : "var(--hairline)"}`,
        boxShadow: selected ? "0 0 0 1px var(--accent-strong)" : "none",
      }}
    >
      {/* Badge is unfilled to match ChoiceCard — the abbreviation reads in muted ink, turning
          accent only when selected. Same selection language as the focus/role cards. */}
      <span
        className="shrink-0 grid place-items-center w-7 text-[11px] font-semibold tracking-wide"
        style={{ color: selected ? "var(--accent)" : "var(--text-3)" }}
      >
        {badge}
      </span>
      <span className="min-w-0 flex-1 text-[13px] leading-[1.3] text-gray-900 dark:text-gray-100 line-clamp-2 [overflow-wrap:anywhere]">{label}</span>
      {/* Same filled-circle check as ChoiceCard and the display-size tiles — one selection mark app-wide. */}
      {selected && (
        <span className="shrink-0 grid place-items-center w-5 h-5 rounded-full text-white" style={{ backgroundColor: "var(--accent-strong)" }}>
          <Check size={12} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
