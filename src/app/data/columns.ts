import type { Column, Idea, ViewKey } from "../types";
import { PORTFOLIOS } from "./portfolios";
import { PRODUCT_NAMES } from "./ideas";

// The Comparator column is a single-select: either "None" (no comparator arm) or one of the
// products a study can be measured against. Kept as one exported list so the column editor and any
// mock-data seeding stay in sync with the actual product catalog.
export const COMPARATOR_OPTIONS = ["None", ...PRODUCT_NAMES] as const;

export const columns: Column[] = [
  { key: "uid",                  label: "UID",                                      width: 100 },
  { key: "franchise",            label: "Franchise",                                width: 120, options: ["Surgical", "Vision Care", "Pharmaceutical"] },
  { key: "area",                 label: "Therapeutic Area",                         width: 120, options: ["CRCX", "Retina", "Glaucoma", "Cataract", "Dry Eye", "Refractive"] },
  { key: "brandRanking",         label: "Brand Ranking",                            width: 100, align: "right" },
  { key: "areaPrioritization",   label: "TA Priority",                              width: 100, align: "right" },
  { key: "pathway",              label: "Research Pathway",                         width: 120, options: ["IIT", "AIT", "HEOR", "Clinical", "Test Created", "Sponsored"] },
  { key: "rtiYear",              label: "RTI Year",                                 width: 100, align: "right" },
  { key: "atpProduct",           label: "Product Type",                             width: 120 },
  { key: "project",              label: "Product / Project",                        width: 120 },
  { key: "comparator",           label: "Comparator",                               width: 140, tooltip: true, options: [...COMPARATOR_OPTIONS] },
  { key: "studyName",            label: "Study Name",                               width: 160, tooltip: true,
    note: "Type a short, clear name for the study. Keep it simple — so simple a young student could read it and know what the study is about. Just a few words, no long sentences." },
  { key: "strategicImperatives", label: "Strategic Imperatives",                    width: 250, tooltip: true },
  { key: "researchQuestions",    label: "Research Questions",                       width: 250, tooltip: true },
  { key: "potentialClaims",      label: "Potential Claims",                         width: 250, tooltip: true },
  { key: "totalIndirect",        label: "Total Estimated Indirect ($)",             width: 170, align: "right" },
  { key: "totalDirect",          label: "Total Estimated Direct ($)",               width: 170, align: "right" },
  { key: "totalCost",            label: "Total Study Cost ($)",                     width: 150, align: "right" },
  { key: "total2027Indirect",    label: "Total Estimated 2027 Indirect ($)",        width: 170, align: "right" },
  { key: "total2027Direct",      label: "Total Estimated 2027 Direct ($)",          width: 170, align: "right" },
  { key: "total2027Cost",        label: "Total Study 2027 Cost ($)",                width: 150, align: "right" },
  { key: "primaryEndpoint",      label: "Primary Endpoint",                         width: 250, tooltip: true },
  { key: "secondaryEndpoint",    label: "Secondary Endpoint",                       width: 250, tooltip: true },
  { key: "otherEndpoints",       label: "Other Endpoints",                          width: 250, tooltip: true },
  { key: "studyDesign",          label: "Study Design",                             width: 250, tooltip: true,  options: ["Monadic", "Comparative", "Controlled", "Masked", "Crossover", "Parallel"] },
  { key: "proposedStatistics",   label: "Proposed Statistics",                      width: 250, tooltip: true },
  { key: "sampleSize",           label: "Sample Size",                              width: 120, align: "right" },
  { key: "pos",                  label: "POS",                                      width: 100, align: "right" },
  { key: "region",               label: "Region / Country",                         width: 120 },
  { key: "startDate",            label: "Start Date",                               width: 120 },
  { key: "endDate",              label: "End Date (CSR)",                           width: 120 },
  { key: "regionalFeedback",     label: "Regional Feedback",                        width: 250, tooltip: true },
  { key: "comments",             label: "Comments",                                 width: 250, tooltip: true },
  { key: "portfolio",            label: "Portfolio",                                width: 120, options: [...PORTFOLIOS] },
];

// The tab strip switches which slice of the schema is on screen — not which rows.
// `columns` above stays the single source of truth for labels and editors; a view is
// just an ordered list of keys into it, so the two can never drift apart.
// `status` is intentionally absent from every view — it's backend state that decides which
// tab a record shows under (see the Funded filter in App), not a column users see or edit.
const FRANCHISE_KEYS: (keyof Idea)[] = [
  "uid", "franchise", "area", "brandRanking", "areaPrioritization", "pathway",
  "rtiYear", "atpProduct", "project", "comparator", "studyName", "strategicImperatives", "researchQuestions", "potentialClaims",
  "pos", "region",
  "totalIndirect", "totalDirect", "totalCost", "total2027Indirect", "total2027Direct", "total2027Cost",
];

const EVIDENCE_KEYS: (keyof Idea)[] = [
  "uid",
  // Franchise-owned framing, surfaced here (right before the endpoints) so Evidence can see the
  // strategic context it's building evidence for — visible but read-only (EVIDENCE_READONLY_KEYS).
  "pathway", "atpProduct", "project", "researchQuestions", "potentialClaims",
  "totalIndirect", "totalDirect", "totalCost", "total2027Indirect", "total2027Direct", "total2027Cost",
  "primaryEndpoint", "secondaryEndpoint", "otherEndpoints",
  "studyDesign", "proposedStatistics", "sampleSize",
  "pos", "region", "startDate", "endDate",
  "regionalFeedback", "comments",
];

export const VIEW_KEYS: Record<ViewKey, (keyof Idea)[]> = {
  "Franchise": FRANCHISE_KEYS,
  "Evidence Function": EVIDENCE_KEYS,
  // Funded records are decided — this tab is a full read of them, so it shows every column:
  // the Franchise set first, then the Evidence Function set appended (deduping shared keys
  // like `uid` so the spine appears once). `comparator` is intentionally excluded — it's a
  // Franchise-only working column and shouldn't surface on the Funded read.
  "Funded": [
    ...FRANCHISE_KEYS.filter(k => k !== "comparator"),
    ...EVIDENCE_KEYS.filter(k => !FRANCHISE_KEYS.includes(k)),
  ],
};

export const VIEWS = Object.keys(VIEW_KEYS) as ViewKey[];

// Excel-style frozen columns, per view. These scroll with the table until their left edge reaches
// the grid's edge, then stick in place while the rest keeps scrolling. Each view's defaults pin a
// natural group: Franchise/Funded pin the ranking block; Evidence pins the Franchise-owned framing
// (the read-only reference columns) so it stays in view while the endpoint/study columns scroll
// underneath. Users can then pin/unpin any column independently — frozen columns need not be
// adjacent; the sticky geometry stacks them at the left edge and unfrozen columns scroll under.
const FROZEN_KEYS_BY_VIEW: Record<ViewKey, (keyof Idea)[]> = {
  "Franchise": ["brandRanking", "areaPrioritization", "pathway"],
  "Evidence Function": ["pathway", "atpProduct", "project", "researchQuestions", "potentialClaims"],
  // Funded is a flat read — nothing frozen by default (users can still pin columns themselves).
  "Funded": [],
};

export const frozenKeys = (v: ViewKey): (keyof Idea)[] => FROZEN_KEYS_BY_VIEW[v];

// Columns hidden BY DEFAULT in a view. They still exist in the view's schema, so they remain
// available to toggle back on in the Columns popover — they're just off out of the box.
// Funded should open looking like the Franchise tab: everything Franchise shows, and nothing else.
// So its Evidence-only columns are hidden by default, plus a few Franchise columns that are noise on
// the funded read (ranking, product type, strategic imperatives, POS).
const FUNDED_DEFAULT_HIDDEN: (keyof Idea)[] = [
  // Evidence-only columns — present as options, hidden by default so Funded mirrors Franchise.
  ...VIEW_KEYS["Funded"].filter(k => !FRANCHISE_KEYS.includes(k)),
  // Plus these Franchise columns, hidden by default on the funded read.
  "brandRanking", "areaPrioritization", "atpProduct", "strategicImperatives", "pos",
];

const HIDDEN_BY_VIEW: Partial<Record<ViewKey, (keyof Idea)[]>> = {
  "Funded": FUNDED_DEFAULT_HIDDEN,
};

export const defaultHiddenKeys = (v: ViewKey): (keyof Idea)[] => HIDDEN_BY_VIEW[v] ?? [];

// The built-in column order for a view, excluding UID (which is always the fixed first,
// non-reorderable column). This is the view's original order — identity columns first, the
// ranking block in the middle. Column customization is layered on top: users reorder these keys
// and freeze columns by identity (useColumnPrefs stores the frozen set by key, so freezing
// follows a column as it moves), with reorder and freeze fully independent.
export const defaultColumnOrder = (v: ViewKey): (keyof Idea)[] =>
  VIEW_KEYS[v].filter(k => k !== "uid");

// Franchise-owned columns that also appear in the Evidence Function tab for reference. There they
// are read-only: Evidence can see the framing but only Franchise edits it. In Franchise/Funded they
// behave like any other editable column.
export const EVIDENCE_READONLY_KEYS: (keyof Idea)[] = ["pathway", "atpProduct", "project", "potentialClaims"];

// Columns each tab can see but not edit, because another team owns them: Evidence borrows the
// Franchise-owned framing (including the research question). Absent tabs (Funded) stay fully
// editable — it's the decided-records read.
const READONLY_BY_VIEW: Partial<Record<ViewKey, (keyof Idea)[]>> = {
  "Evidence Function": EVIDENCE_READONLY_KEYS,
  // Evidence owns the commercial/operational figures; Franchise sees them but can't edit them.
  // Research Questions is Evidence-owned framing: editable in Evidence, read-only in Franchise.
  "Franchise": [
    "pos", "region",
    "totalIndirect", "totalDirect", "totalCost", "total2027Indirect", "total2027Direct", "total2027Cost",
    "researchQuestions",
  ],
};

export const isColReadOnly = (view: ViewKey, key: keyof Idea): boolean =>
  READONLY_BY_VIEW[view]?.includes(key) ?? false;

const columnByKey = new Map(columns.map(c => [c.key, c]));
// Resolve a view into its Column[]. `order` (a full key list including "uid" first, as
// produced by useColumnPrefs.visibleKeys — already reordered and with hidden columns dropped)
// overrides the built-in VIEW_KEYS order so user customization flows through the same pipeline;
// omitted → the view's default order.
export const viewColumns = (v: ViewKey, order?: (keyof Idea)[]): Column[] =>
  (order ?? VIEW_KEYS[v]).map(k => columnByKey.get(k)!);
