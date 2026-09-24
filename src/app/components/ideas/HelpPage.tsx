import { useState } from "react";
import { ChevronDown, Mail } from "lucide-react";

type QA = { q: string; a: string };
type Section = { title: string; items: QA[] };

// Grouped by the task a person is trying to do, most-common first, so the answer
// they need is where they'd look. Answers are tightened to one or two plain
// sentences — clear and scannable beats exhaustive (Simplicity, §16).
const SECTIONS: Section[] = [
  {
    title: "Getting started",
    items: [
      {
        q: "What is the Ideas List?",
        a: "A shared workspace for clinical-trial ideas — one row per idea, tracked from first proposal through funding across every portfolio.",
      },
      {
        q: "What are the Franchise, Evidence Function, and Funded tabs?",
        a: "Three views of the same ideas. Franchise shows strategy and ranking, Evidence Function shows study design and endpoints, and Funded collects the ideas approved for investment. Switching tabs changes the columns you see, not which records exist.",
      },
      {
        q: "How do I switch portfolios?",
        a: "Use the panel on the left. Pick a portfolio to focus the list, or “All portfolios” to see everything with live idea counts. Collapse the panel with the chevron for more room.",
      },
      {
        q: "Why does the Portfolio column come and go?",
        a: "It appears only under “All portfolios,” where you need it to tell records apart. Inside one portfolio every row would repeat the same value, so it's hidden.",
      },
    ],
  },
  {
    title: "Editing ideas",
    items: [
      {
        q: "How do I edit a cell?",
        a: "Click to select, then double-click, press Enter, or just start typing. While editing: Enter saves and moves down, Tab saves and moves right, Esc cancels.",
      },
      {
        q: "How do I move around with the keyboard?",
        a: "Arrow keys move the selection, Tab moves right and wraps to the next row, and Delete or Backspace clears the selected cell. Cells with fixed choices open as a dropdown.",
      },
      {
        q: "How do I select multiple rows at once?",
        a: "Click a row's checkbox to select it, then hold Shift and click another checkbox — every row in between is selected too. Use the checkbox in the header to select or clear all visible rows.",
      },
      {
        q: "Why is a column locked with a padlock?",
        a: "It's owned by the other function, so it's read-only from your tab. Some columns belong to the Evidence Function, others to Franchise. Switch to the owning tab to edit it.",
      },
      {
        q: "Are my changes saved automatically?",
        a: "Yes. An amber dot marks a row with unsaved edits, turns into a spinner while saving, and clears when done. Saves happen as you leave the row, switch tabs, or leave the page — and retry on your next change if one ever fails.",
      },
      {
        q: "What are the info icons on some headers?",
        a: "Guidance on what to enter — for example, how to phrase a Study Name. Hover the icon to read the note.",
      },
    ],
  },
  {
    title: "Adding ideas",
    items: [
      {
        q: "How do I add a new idea?",
        a: "Click “+ Add study” at the top-right of the table. A card opens with the fields for your current tab; fields owned by the other function stay locked. Give it a unique ID and save.",
      },
      {
        q: "Why won't my new idea save?",
        a: "Every idea needs an ID, and it must be unique. If it's blank or already in use, you'll see a message and the idea won't be added until you change it.",
      },
    ],
  },
  {
    title: "Finding & organizing",
    items: [
      {
        q: "How do I sort or filter a column?",
        a: "Click a header to sort — again to reverse, once more to clear (empty values sort last). Use the filter icon to show only the values you pick; the active-filter count appears in the status bar.",
      },
      {
        q: "What does search cover?",
        a: "The whole record, not just visible columns — so you can find an idea by a value the current tab happens to hide.",
      },
      {
        q: "Can I change which columns I see?",
        a: "Yes. Open “Columns” to reorder, freeze, or hide columns. Changes apply to the current tab, are saved on this device, and “Reset” restores the defaults. The ID column stays first.",
      },
    ],
  },
  {
    title: "Prioritizing & funding",
    items: [
      {
        q: "What does Prioritize do?",
        a: "Opens a guided flow: pick your role — Brand Director (rank one product's studies) or Therapeutic Area VP (rank a portfolio) — choose the scope, then drag records into order. Saving renumbers them 1 through N.",
      },
      {
        q: "How do I mark an idea as funded?",
        a: "In a row's ⋯ menu, choose “Mark as funded” to move it to the Funded tab. You can remove it later to return it to the pipeline.",
      },
      {
        q: "What else is in the row menu?",
        a: "The ⋯ menu lets you edit, view details, view history, mark funded, duplicate (as a new record with its own ID), or delete an idea.",
      },
      {
        q: "How do I see an idea's details or history?",
        a: "From the ⋯ menu: “View idea details” opens the full spec, study design, and financials; “View idea history” shows a timeline of activity.",
      },
      {
        q: "How do I export the list?",
        a: "Use Export in the header. It saves the current list — reflecting your tab, portfolio, filters, and search — as a CSV.",
      },
    ],
  },
  {
    title: "Appearance",
    items: [
      {
        q: "Can I change the theme or zoom?",
        a: "Open Settings from your profile picture at the bottom of the sidebar to switch light or dark and zoom from 80% to 150% (tap the percentage to reset to 100%). Both are saved on this device.",
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
