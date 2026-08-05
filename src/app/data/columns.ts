import type { Column, Idea, ViewKey } from "../types";
import { PORTFOLIOS } from "./portfolios";

export const columns: Column[] = [
  { key: "uid",                  label: "UID",                                      width: 100 },
  { key: "franchise",            label: "Franchise",                                width: 100, options: ["Surgical", "Vision Care", "Pharmaceutical"] },
  { key: "area",                 label: "Therapeutic Area",                         width: 100, options: ["CRCX", "Retina", "Glaucoma", "Cataract", "Dry Eye", "Refractive"] },
  { key: "brandRanking",         label: "Brand Ranking",                            width: 100 },
  { key: "areaPrioritization",   label: "TA Priority",                              width: 100 },
  { key: "pathway",              label: "Research Pathway",                         width: 100, options: ["IIT", "AIT", "HEOR", "Clinical", "Test Created", "Sponsored"] },
  { key: "rtiYear",              label: "RTI Year",                                 width: 100 },
  { key: "atpProduct",           label: "ATP / Key Product",                        width: 150 },
  { key: "project",              label: "Product / Project",                        width: 150 },
  { key: "strategicImperatives", label: "Strategic Imperatives",                    width: 250, tooltip: true },
  { key: "researchQuestions",    label: "Research Questions",                       width: 250, tooltip: true },
  { key: "potentialClaims",      label: "Potential Claims",                         width: 250, tooltip: true },
  { key: "totalCost",            label: "Total Budget",                             width: 100 },
  { key: "total2027Cost",        label: "2027 Spend",                               width: 100 },
  { key: "primaryEndpoint",      label: "Primary Endpoint",                         width: 250, tooltip: true },
  { key: "secondaryEndpoint",    label: "Secondary Endpoint",                       width: 250, tooltip: true },
  { key: "otherEndpoints",       label: "Other Endpoints",                          width: 250, tooltip: true },
  { key: "studyDesign",          label: "Study Design",                             width: 250, tooltip: true,  options: ["Monadic", "Comparative", "Controlled", "Masked", "Crossover", "Parallel"] },
  { key: "proposedStatistics",   label: "Proposed Statistics",                      width: 250, tooltip: true },
  { key: "sampleSize",           label: "Sample Size",                              width: 100 },
  { key: "pos",                  label: "POS",                                      width: 100 },
  { key: "region",               label: "Region / Country",                         width: 100 },
  { key: "startDate",            label: "Start Date",                               width: 100 },
  { key: "endDate",              label: "End Date (CSR)",                           width: 100 },
  { key: "regionalFeedback",     label: "Regional Feedback",                        width: 250, tooltip: true },
  { key: "comments",             label: "Comments",                                 width: 250, tooltip: true },
  { key: "portfolio",            label: "Portfolio",                                width: 150, options: [...PORTFOLIOS] },
];

// The tab strip switches which slice of the schema is on screen — not which rows.
// `columns` above stays the single source of truth for labels and editors; a view is
// just an ordered list of keys into it, so the two can never drift apart.
export const VIEW_KEYS: Record<ViewKey, (keyof Idea)[]> = {
  "Franchise": [
    "uid", "franchise", "area", "brandRanking", "areaPrioritization", "pathway",
    "rtiYear", "atpProduct", "project", "strategicImperatives", "researchQuestions", "potentialClaims",
    "pos", "region", "totalCost", "total2027Cost",
  ],
  "Evidence Function": [
    "uid", "primaryEndpoint", "secondaryEndpoint", "otherEndpoints",
    "studyDesign", "proposedStatistics", "sampleSize", "startDate", "endDate",
    "regionalFeedback", "comments",
  ],
};

export const VIEWS = Object.keys(VIEW_KEYS) as ViewKey[];

const columnByKey = new Map(columns.map(c => [c.key, c]));
export const viewColumns = (v: ViewKey): Column[] => VIEW_KEYS[v].map(k => columnByKey.get(k)!);
