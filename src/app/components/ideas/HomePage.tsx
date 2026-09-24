import { useState } from "react";
import { PawPrint } from "lucide-react";

// Full-size photo URL for a given dog — kept in one place so the preloader and the <img> agree.
const dogSrc = (id: string) => `https://images.unsplash.com/photo-${id}?w=760&h=560&fit=crop&crop=faces&auto=format`;

// The Home page isn't built yet, so we borrow Amazon's actual move: when there's nothing to show,
// show a good dog. Amazon's error pages feature real employee-owned dogs, each with a tiny bio
// (name, age, a quirky fact), a plain "sorry, that's not here" message, and a fresh dog on every
// refresh. We do the same — one of our office dogs, on rotation — until the real dashboard lands.
type Dog = { id: string; name: string; bio: string };

const OFFICE_DOGS: Dog[] = [
  {
    id: "1767381604151-bae00f2fb337",
    name: "Waffles",
    bio: "Waffles is 3, has never met a tennis ball he didn't love, and naps under the standing desks.",
  },
  {
    id: "1767381392938-c95d24cd5873",
    name: "Talulah",
    bio: "One-year-old Talulah lives for tummy rubs and supervises every stand-up meeting from the couch.",
  },
  {
    id: "1617218326259-2a338a730d1c",
    name: "RoRo",
    bio: "RoRo the Chiweenie is 5. His favorite toy is a pizza-slice pillow and he takes it everywhere.",
  },
  {
    id: "1549308423-a9b1b61cd4b1",
    name: "Barkley",
    bio: "Barkley the beagle is 4, an expert at finding dropped snacks, and answers to \"treat?\" from any distance.",
  },
];

export function HomePage() {
  // A fresh dog on every visit (and on demand) — exactly Amazon's refresh-for-a-new-pup trick.
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * OFFICE_DOGS.length));
  // True only while the *next* dog's photo is downloading, so we can disable the button and avoid
  // firing overlapping swaps — but we never blank the current dog while we wait.
  const [swapping, setSwapping] = useState(false);
  const dog = OFFICE_DOGS[idx];

  // Preload the next dog's photo, then swap image + name + bio together in a single render. Because
  // the new photo is already decoded in cache when idx flips, the <img> paints it immediately
  // instead of flashing its empty background — which is what caused the flicker.
  const nextDog = () => {
    if (swapping) return;
    const nextIdx = (idx + 1 + Math.floor(Math.random() * (OFFICE_DOGS.length - 1))) % OFFICE_DOGS.length;
    setSwapping(true);
    const img = new Image();
    const commit = () => { setIdx(nextIdx); setSwapping(false); };
    img.onload = commit;
    img.onerror = commit; // never get stuck if a photo fails — just swap anyway.
    img.src = dogSrc(OFFICE_DOGS[nextIdx].id);
  };

  return (
    <main className="flex-1 overflow-auto grid place-items-center px-8 py-12" style={{ backgroundColor: "var(--app-bg)" }}>
      <div className="flex flex-col items-center text-center" style={{ maxWidth: "32rem" }}>
        {/* Amazon's layout: the apology sits ABOVE the photo, plain and understated. */}
        <h1 style={{ color: "var(--text-1)", letterSpacing: "-0.02em" }}>Sorry! This page isn't here yet.</h1>
        <p className="mt-2" style={{ fontSize: "var(--text-base)", lineHeight: 1.55, color: "var(--text-2)" }}>
          Your home dashboard is still being built.
          <br />
          Try the <span style={{ color: "var(--accent)", fontWeight: 600 }}>Ideas</span> tab, or go back a step.
        </p>

        {/* The photo, done Amazon's way: a clean rectangular color photograph — no circle, no fade,
            no vignette. Just the dog, with modest rounded corners so it reads as a photo, not a card. */}
        {/* No `key` here on purpose: reusing the same <img> element (rather than remounting it per
            dog) lets the browser paint the already-preloaded next photo without a blank frame. */}
        <img
          src={dogSrc(dog.id)}
          alt={`${dog.name}, one of the office dogs`}
          className="mt-8 w-full object-cover"
          style={{
            maxWidth: "26rem",
            aspectRatio: "19 / 14",
            borderRadius: "0.75rem",
            backgroundColor: "var(--surface-2)",
          }}
        />

        {/* The caption, Amazon-style: "[Name] · Dogs of the office", the name bold, a "meet the
            rest" link below. Amazon's clicks through to a gallery; ours swaps in the next dog. */}
        <p className="mt-4" style={{ fontSize: "var(--text-base)", color: "var(--text-2)" }}>
          <span style={{ fontWeight: 700, color: "var(--text-1)" }}>{dog.name}</span>
          <span style={{ color: "var(--text-3)" }}> · Dogs of the office</span>
        </p>
        {/* Fixed height reserves room for a two-line bio, so switching dogs never nudges the
            button (or anything below) up and down as the copy length changes. */}
        <p
          className="mt-1 flex items-center justify-center"
          style={{ fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--text-3)", maxWidth: "24rem", minHeight: "2.4rem" }}
        >
          {dog.bio}
        </p>

        <button
          type="button"
          onClick={nextDog}
          disabled={swapping}
          className="group mt-6 inline-flex items-center gap-2 rounded-full transition-all duration-150 active:scale-[0.97] disabled:cursor-wait"
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--accent)",
            padding: "0.5rem 1.1rem",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--hairline)",
            boxShadow: "var(--shadow-card)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = "var(--row-hover)";
            e.currentTarget.style.borderColor = "var(--accent-ring)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = "var(--surface)";
            e.currentTarget.style.borderColor = "var(--hairline)";
          }}
        >
          <PawPrint
            size={15}
            strokeWidth={2.25}
            className="transition-transform duration-150 group-hover:-rotate-12"
          />
          Meet another dog
        </button>
      </div>
    </main>
  );
}
