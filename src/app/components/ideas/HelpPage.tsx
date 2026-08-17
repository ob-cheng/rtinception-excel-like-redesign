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
        a: "Each tab shows the same ideas through a different lens: Franchise surfaces strategy and ranking columns, Evidence Function surfaces study-design and endpoint columns, and Funded collects the ideas that have been approved for investment.",
      },
      {
        q: "How do I switch portfolios?",
        a: "Use the portfolio panel on the left. Select a portfolio to focus the list, or choose “All” to see every idea together. You can collapse the panel to give the grid more room.",
      },
    ],
  },
  {
    title: "Editing ideas",
    items: [
      {
        q: "How do I edit a cell?",
        a: "Double-click a cell, or select it and press Enter or just start typing. Press Enter to save and move down, Tab to save and move right, or Esc to cancel.",
      },
      {
        q: "Why does a column show a small padlock and won't let me type?",
        a: "That column is owned by another function and is read-only from the tab you're on — for example, Franchise-owned columns are shown but locked in Evidence Function. Switch to the owning tab to edit it.",
      },
      {
        q: "Why is an entire row greyed out?",
        a: "The record is locked because it has been finalized (such as a funded idea). Locked rows stay visible for reference but can't be edited until they're reopened.",
      },
      {
        q: "Are my changes saved automatically?",
        a: "Yes. Edits save on their own as you move off a row — a small dot marks a row with unsaved changes, and it clears once the save completes.",
      },
      {
        q: "How do I add a new idea?",
        a: "Type into the “+ Add new idea…” row at the bottom of the grid, or use the Add control in the status bar. Give it a unique ID and it joins the list.",
      },
    ],
  },
  {
    title: "Finding & organizing",
    items: [
      {
        q: "How do I sort or filter a column?",
        a: "Click a column header to sort (again to reverse, once more to clear). Use the filter icon in the header to show only the values you pick — active filters are noted in the status bar.",
      },
      {
        q: "What does the search box cover?",
        a: "Search spans the whole record, not just visible columns, so you can find an idea by a value the current tab happens to hide.",
      },
    ],
  },
  {
    title: "Prioritizing & funding",
    items: [
      {
        q: "What does the Prioritize button do?",
        a: "It opens a guided flow: choose a lens (Brand Ranking or TA Priority) and a scope, then drag records into the order you want. Saving renumbers them 1 through N for that lens.",
      },
      {
        q: "How do I mark an idea as funded?",
        a: "Open a row's menu and choose to mark it funded — it moves to the Funded tab. You can remove it from funded later to return it to the working pipeline.",
      },
      {
        q: "Can I duplicate, delete, or export ideas?",
        a: "Yes — the row menu (⋯) covers duplicate, delete, and viewing an idea's details or history. Export in the header downloads the current list.",
      },
    ],
  },
  {
    title: "Appearance",
    items: [
      {
        q: "Can I change the theme or zoom?",
        a: "Use the appearance toggle in the header to switch between light and dark, and the −/+ control to zoom the interface in or out. Both preferences are remembered on this device.",
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
          className="mt-12 rounded-[18px] px-7 py-7 flex flex-col items-center text-center"
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
            className="flex items-center justify-center gap-2 h-[40px] px-6 rounded-[12px] text-[14px] font-medium active:scale-[0.97] transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ring)]"
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
