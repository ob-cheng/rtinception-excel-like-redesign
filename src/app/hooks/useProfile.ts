import { useCallback, useEffect, useState } from "react";
import type { RankPersona, ViewKey } from "../types";
import { PORTFOLIOS } from "../data/portfolios";

// The first-run setup interview captures a few defaults so the app arrives pre-configured and
// the Prioritize flow can reuse the chosen persona (skipping its role question). This is
// persisted exactly like theme/zoom/columns (see usePreferences.ts / useColumnPrefs.ts): one
// `alcon.`-namespaced key, a lazy validated initializer, and a single debounced write effect.
// Theme and zoom are NOT stored here — they already persist via usePreferences; the interview
// applies them through applyTheme/setZoom. This hook only holds the interview's own answers.
const PROFILE_KEY = "alcon.profile.v1";

export type Profile = {
  onboarded: boolean;
  persona: RankPersona | null;        // "brand" (Brand Director) | "portfolio" (Therapeutic Area VP)
  portfolio: string | null;           // a PORTFOLIOS value or "All"
  focusView: ViewKey | null;          // "Franchise" | "Evidence Function" (Funded excluded)
};

const DEFAULT_PROFILE: Profile = {
  onboarded: false,
  persona: null,
  portfolio: null,
  focusView: null,
};

// The focus tab is one of the two role-flavored views a person self-identifies with; "Funded" is
// a shared/derived view, not something the interview offers as a home tab.
const FOCUS_VIEWS: ViewKey[] = ["Franchise", "Evidence Function"];

// Coerce arbitrary stored/incoming JSON into a valid Profile, dropping anything that no longer
// matches the live enums (a removed portfolio, a stale persona) so a bad save can't wedge the app.
function sanitize(raw: unknown): Profile {
  if (!raw || typeof raw !== "object") return DEFAULT_PROFILE;
  const r = raw as Record<string, unknown>;

  const persona: RankPersona | null =
    r.persona === "brand" || r.persona === "portfolio" ? r.persona : null;

  const portfolioOk =
    typeof r.portfolio === "string" &&
    (r.portfolio === "All" || (PORTFOLIOS as readonly string[]).includes(r.portfolio));
  const portfolio = portfolioOk ? (r.portfolio as string) : null;

  const focusView =
    typeof r.focusView === "string" && FOCUS_VIEWS.includes(r.focusView as ViewKey)
      ? (r.focusView as ViewKey)
      : null;

  return {
    onboarded: r.onboarded === true,
    persona,
    portfolio,
    focusView,
  };
}

function initialProfile(): Profile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const saved = window.localStorage.getItem(PROFILE_KEY);
    if (!saved) return DEFAULT_PROFILE;
    return sanitize(JSON.parse(saved));
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function useProfile() {
  const [profile, setProfileState] = useState<Profile>(initialProfile);

  // Debounce persistence to match the other prefs hooks (a step-by-step interview can fire a
  // handful of updates in quick succession); one write after activity settles is enough.
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      } catch {
        // Storage full or unavailable (private mode) — the in-memory profile still works.
      }
    }, 250);
    return () => clearTimeout(id);
  }, [profile]);

  const setProfile = useCallback((patch: Partial<Profile>) => {
    setProfileState(p => ({ ...p, ...patch }));
  }, []);

  // Finish (or skip) the interview: write whatever was chosen and mark it done so the modal
  // won't reappear on reload. Unprovided fields keep their existing values (which may be null,
  // i.e. "use the app's built-in default").
  const completeOnboarding = useCallback((patch: Partial<Profile>) => {
    setProfileState(p => ({ ...p, ...patch, onboarded: true }));
  }, []);

  // Re-run the interview: flip onboarded back to false (App renders the modal again). Existing
  // answers stay as the interview's initial values so the user sees their current setup pre-filled.
  const restartOnboarding = useCallback(() => {
    setProfileState(p => ({ ...p, onboarded: false }));
  }, []);

  return { profile, setProfile, completeOnboarding, restartOnboarding };
}
