import type { SortDir } from "../../types";

export function SortIcon({ dir }: { dir: SortDir }) {
  const active = "currentColor";
  const dim = "currentColor";

  if (dir === "asc") {
    return (
      <svg width="9" height="10" viewBox="0 0 9 10" fill="none" aria-label="Sorted ascending">
        <path d="M4.5 1.5L4.5 8.5" stroke={active} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 4L4.5 1.5L7 4" stroke={active} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (dir === "desc") {
    return (
      <svg width="9" height="10" viewBox="0 0 9 10" fill="none" aria-label="Sorted descending">
        <path d="M4.5 8.5L4.5 1.5" stroke={active} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 6L4.5 8.5L7 6" stroke={active} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="9" height="10" viewBox="0 0 9 10" fill="none" aria-label="Sort" style={{ opacity: 0.35 }}>
      <path d="M2 3.5L4.5 1L7 3.5" stroke={dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 6.5L4.5 9L7 6.5" stroke={dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
