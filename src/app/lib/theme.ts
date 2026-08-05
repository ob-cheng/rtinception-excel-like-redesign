// Brand constants. Kept as plain values (not Tailwind classes) because several of them
// are used inside inline styles for gradients, ring colors, and animated surfaces.

export const NAVY = "#0d2d6b";
export const NAVY_DARK = "#0a2458";

// Signed-in user — in a real app this is resolved from the user ID the app reads at startup.
// Role is derived from that identity, not entered by hand.
export const currentUser = { id: "sahil.k", name: "Sahil", role: "Researcher" };
