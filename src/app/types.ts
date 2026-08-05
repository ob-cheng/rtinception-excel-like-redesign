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
};

export type Column = { key: keyof Idea; label: string; width?: number; options?: string[]; tooltip?: boolean };

export type ViewKey = "Franchise" | "Evidence Function";

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
