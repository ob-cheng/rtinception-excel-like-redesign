// Shared domain types. Everything the grid renders is a string — the source system
// hands us pre-formatted values, and keeping one cell type keeps the editors simple.

export type Idea = {
  uid: string;
  franchise: string;
  area: string;
  brandRanking: string;
  areaPrioritization: string;
  pathway: string;
  rtiYear: string;
  atpProduct: string;
  project: string;
  strategicImperatives: string;
  researchQuestions: string;
  potentialClaims: string;
  totalIndirect: string;
  totalDirect: string;
  totalCost: string;
  total2027Indirect: string;
  total2027Direct: string;
  total2027Cost: string;
  primaryEndpoint: string;
  secondaryEndpoint: string;
  otherEndpoints: string;
  studyDesign: string;
  proposedStatistics: string;
  sampleSize: string;
  pos: string;
  region: string;
  startDate: string;
  endDate: string;
  regionalFeedback: string;
  comments: string;
  portfolio: string;
  // Lifecycle status. A record whose status is "Funded" leaves the Franchise / Evidence
  // Function tabs and collects under the Funded tab instead. Optional so existing seed rows
  // fall back to a default; edited/created records always carry an explicit value.
  status?: string;
};

// The status value that moves a record into the Funded tab.
export const FUNDED_STATUS = "Funded";
export const STATUS_OPTIONS = ["Proposed", "Under Review", "Approved", "Funded", "Declined"];

export type Column = { key: keyof Idea; label: string; width?: number; options?: string[]; tooltip?: boolean };

export type ViewKey = "Franchise" | "Evidence Function" | "Funded";

// Ranking flow. A Brand Director orders one product's records (writes `brandRanking`);
// a Portfolio Director orders a whole portfolio's records (writes `areaPrioritization`).
export type RankPersona = "brand" | "portfolio";

export type RankingConfig = {
  persona: RankPersona;
  // The scope value: a `project` (product) name for brand, a `portfolio` name for portfolio.
  scope: string;
};

export type SortDir = "asc" | "desc" | null;

export type MoveDir = "down" | "right" | null;

export type CellIndicator = "dirty" | "saving" | "error" | null;

export type HistoryEvent = {
  id: string;
  date: string;
  time: string;
  action: string;
  actor: string;
  committee?: string;
  note?: string;
};
