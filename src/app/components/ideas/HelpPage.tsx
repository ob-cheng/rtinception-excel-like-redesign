import { useState } from "react";
import { ChevronDown, Mail } from "lucide-react";

type QA = { q: string; a: string };
type Section = { title: string; items: QA[] };

// Grouped by the task a person is trying to do, most-common first, so the answer
// they need is where they'd look. Answers are one or two sentences — concise and
// clear beats exhaustive (Simplicity, §16).
const SECTIONS: Section[] = [
  {
    title: "Getting started",
    items: [
      {
        q: "What is the Ideas List?",
        a: "It's the shared workspace where clinical-trial ideas are captured, prioritized, and tracked from first proposal through funding — one row per idea, across every portfolio.",
      },
      {
        q: "What do the Franchise, Evidence Function, and Funded tabs show?",
        a: "All three show the same ideas, just through different columns. Franchise surfaces strategy and ranking, Evidence Function surfaces study design and endpoints, and Funded collects the ideas approved for investment. Switching tabs changes which columns you see — it doesn't hide any records except that funded ideas live on the Funded tab.",
      },
      {
        q: "How do I switch portfolios?",
        a: "Use the portfolio panel on the left. Pick a portfolio to focus the list, or choose “All portfolios” to see everything together, each row showing its live idea count. Collapse the panel with the chevron to give the grid more room.",
      },
      {
        q: "Why does a Portfolio column appear sometimes but not others?",
        a: "The Portfolio column shows up only when you're viewing “All portfolios,” so you can tell records apart. Inside a single portfolio it would repeat the same value on every row, so it's hidden.",
      },
    ],
  },
  {
    title: "Editing ideas",
    items: [
      {
        q: "How do I edit a cell?",
        a: "Select a cell with a click, then double-click, press Enter or F2, or just start typing to edit it. While editing, Enter saves and moves down, Tab saves and moves right, and Esc cancels.",
      },
      {
        q: "How do I move around the grid with the keyboard?",
        a: "Arrow keys move the selected cell, Tab moves right and wraps to the next row, and Delete or Backspace clears a selected cell. Columns with a fixed set of choices open as a dropdown when you edit them.",
      },
      {
        q: "Why does a column show a small padlock and won't let me type?",
        a: "That column is owned by the other function, so it's read-only from the tab you're on. Ownership runs both ways: some columns are managed by the Evidence Function (and locked in Franchise), and others are managed by Franchise (and locked in Evidence Function). Switch to the owning tab to edit it.",
      },
      {
        q: "Are my changes saved automatically?",
        a: "Yes. A small amber dot marks a row with unsaved edits; it becomes a spinner while saving and clears when done. Saves happen when you leave the row, after a short pause, when you switch tabs, and when you leave the page. If a save ever fails it retries on your next change.",
      },
      {
        q: "What do the info icons on some column headers mean?",
        a: "A few columns carry a small info icon with plain-language guidance on what to enter — for example, how to phrase a Study Name. Hover it to read the note.",
      },
    ],
  },
  {
    title: "Adding ideas",
    items: [
      {
        q: "How do I add a new idea?",
        a: "Click the “+ Add study” button at the top-right of the table. A card opens with the fields for the tab you're on, so you fill in exactly what that view manages; fields owned by the other function appear locked. Give it a unique ID and save.",
      },
      {
        q: "Why won't it accept my new idea?",
        a: "Every idea needs an ID, and it has to be unique — no two records can share one. If the ID is blank or already in use, you'll see a message and the idea won't be added until you change it.",
      },
    ],
  },
  {
    title: "Finding & organizing",
    items: [
      {
        q: "How do I sort or filter a column?",
        a: "Click a column header to sort (again to reverse, once more to clear); empty values always sort to the bottom. Use the filter icon in the header to show only the values you pick — the number of active filters shows in the status bar, and a filter only affects the views where its column is visible.",
      },
      {
        q: "What does the search box cover?",
        a: "Search spans the whole record, not just the visible columns, so you can find an idea by a value the current tab happens to hide.",
      },
      {
        q: "Can I change which columns I see and their order?",
        a: "Yes. Open “Columns” in the header to drag columns into a new order, freeze a column so it stays put as you scroll, or hide ones you don't need. Changes apply to the current tab only and are remembered on this device; “Reset” restores that tab's defaults. The ID column is always first.",
      },
    ],
  },
  {
    title: "Prioritizing & funding",
    items: [
      {
        q: "What does the Prioritize button do?",
        a: "It opens a guided flow: pick your role — Brand Director (rank one product's studies) or Therapeutic Area VP (rank a whole portfolio) — choose the scope, then drag the records into the order you want. Saving renumbers them 1 through N for that ranking.",
      },
      {
        q: "How do I mark an idea as funded?",
        a: "Open a row's menu (⋯) and choose “Mark as funded” — it moves to the Funded tab. You can remove it from Funded later to return it to the working pipeline.",
      },
      {
        q: "What else is in the row menu?",
        a: "The ⋯ menu on each row lets you edit the idea, view its details, view its history, mark it funded, duplicate it (as a new record with its own ID), or delete it.",
      },
      {
        q: "How do I see an idea's full details or history?",
        a: "From the row menu, “View idea details” opens a panel with the full specification, study design, and financials, and “View idea history” shows a timeline of activity on that idea.",
      },
      {
        q: "How do I export the list?",
        a: "Use Export in the header to export the current list, reflecting whatever tab, portfolio, filters, and search you have applied.",
      },
    ],
  },
  {
    title: "Appearance",
    items: [
      {
        q: "Can I change the theme or zoom?",
        a: "Open Settings from your profile picture at the bottom of the sidebar. There you can switch between light and dark and zoom the interface between 80% and 150% (the percentage doubles as a reset to 100%). Both preferences are remembered on this device.",
      },
    ],
  },
];

function AccordionItem({ item, isOpen, onToggle }: { item: QA; isOpen: boolean; onToggle: () => void }) {
  return (
    <div style={{ borderBottom: "1px solid var(--hairline-soft)" }}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex items-center justify-between gap-4 w-full text-left py-4 group focus-visible:outline-none"
      >
        <span
          className="text-[15px] font-medium transition-colors duration-150"
          style={{ color: isOpen ? "var(--text-1)" : "var(--text-2)" }}
        >
          {item.q}
        </span>
        <ChevronDown
          size={17}
          strokeWidth={2}
          className="shrink-0 transition-transform duration-300"
          style={{ color: "var(--text-3)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {/* Grid-rows trick: animate max height to content without measuring, so the
          reveal is smooth and the answer never clips. */}
      <div
        className="grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr", opacity: isOpen ? 1 : 0 }}
      >
        <div className="overflow-hidden">
          <p className="text-[14px] leading-relaxed pb-4 pr-8" style={{ color: "var(--text-2)" }}>
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

export function HelpPage() {
  // Track the single open item globally (accordion) so the page stays calm — one
  // answer at a time, keyed by section+index.
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[720px] mx-auto px-8 py-12">
        {/* Header — a confident title leads, no decorative badge (Apple's Support /
            Settings help pages are typographic, not iconographic). */}
        <div className="flex flex-col items-start mb-10">
          <h1 className="text-[34px] font-semibold tracking-[-0.024em] leading-[1.1]" style={{ color: "var(--text-1)" }}>
            How can we help?
          </h1>
          <p className="text-[16px] mt-2.5 font-normal" style={{ color: "var(--text-3)" }}>
            Answers to the questions people ask most about the Ideas List.
          </p>
        </div>

        {/* Q&A sections */}
        <div className="flex flex-col gap-10">
          {SECTIONS.map(section => (
            <section key={section.title}>
              <h2
                className="text-[12px] font-semibold uppercase tracking-[0.06em] mb-1"
                style={{ color: "var(--text-3)" }}
              >
                {section.title}
              </h2>
              <div>
                {section.items.map((item, i) => {
                  const key = `${section.title}-${i}`;
                  return (
                    <AccordionItem
                      key={key}
                      item={item}
                      isOpen={openKey === key}
                      onToggle={() => setOpenKey(k => (k === key ? null : key))}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Contact support */}
        <div
          className="mt-12 rounded-[20px] px-7 py-7 flex flex-col items-center text-center"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--hairline)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <h3 className="text-[17px] font-semibold tracking-[-0.01em]" style={{ color: "var(--text-1)" }}>
            Still need a hand?
          </h3>
          <p className="text-[14px] mt-1.5 mb-5 max-w-[380px]" style={{ color: "var(--text-3)" }}>
            Our support team is happy to help with anything you can't find here.
          </p>
          <a
            href="mailto:ideas-support@alcon.com?subject=Ideas%20List%20support"
            className="flex items-center justify-center gap-2 h-[40px] px-6 rounded-full text-[14px] font-medium active:scale-[0.97] transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)]"
            style={{
              backgroundColor: "var(--accent-strong)",
              color: "var(--on-accent)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.28), 0 1px 0 rgba(255,255,255,0.10) inset",
            }}
          >
            <Mail size={15} strokeWidth={2.2} />
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
}
