import { useState, useRef, useEffect } from "react";
import { Home, FileText, HelpCircle, Search, ChevronUp, ChevronDown, ChevronLeft, Plus, Upload, Copy, Trash2, ChevronDown as Caret, Filter, Check, MoreHorizontal, Pencil, Eye, Clock, Loader2, Lock, X, ArrowRight, PenLine, Sparkles, Layers, ChevronLeft as PanelCollapse } from "lucide-react";
import { Toaster, toast } from "sonner";

// Signed-in user — in a real app this is resolved from the user ID the app reads at startup.
// Role is derived from that identity, not entered by hand.
const currentUser = { id: "sahil.k", name: "Sahil", role: "Researcher" };

const NAVY = "#0d2d6b";
const NAVY_DARK = "#0a2458";

const PORTFOLIOS = [
  "Cat/Vit Consumables & Visualization",
  "Specialty Equipment",
  "Refractive",
  "Intraocular Lenses (IOL)",
  "Digital",
  "Contact Lenses",
  "Rx Glaucoma",
  "Rx Dry Eye",
  "Ocular Health",
] as const;

const PORTFOLIO_ABBR: Record<string, string> = {
  "All": "ALL",
  "Cat/Vit Consumables & Visualization": "CVC",
  "Specialty Equipment": "SE",
  "Refractive": "REF",
  "Intraocular Lenses (IOL)": "IOL",
  "Digital": "DIG",
  "Contact Lenses": "CL",
  "Rx Glaucoma": "GLA",
  "Rx Dry Eye": "DE",
  "Ocular Health": "OH",
};

type Idea = {
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

const initialIdeas: Idea[] = [
  { uid: "CE128",  franchise: "Surgical",      area: "CRCX",     brandRanking: "Tier 1", areaPrioritization: "High",   pathway: "IIT",          rtiYear: "2025", atpProduct: "BSS Plus",                 project: "BSS Plus Clarity Study",           strategicImperatives: "Improve surgical outcomes",              researchQuestions: "Does BSS Plus reduce post-op inflammation vs. standard BSS?",              potentialClaims: "Superior corneal clarity post-op",                   totalIndirect: "42,000",  totalDirect: "128,000", totalCost: "170,000", total2027Indirect: "21,000", total2027Direct: "64,000",  total2027Cost: "85,000",  primaryEndpoint: "CDVA at day 30",                     secondaryEndpoint: "Corneal pachymetry at day 7",          otherEndpoints: "Patient comfort VAS score",              studyDesign: "Comparative", proposedStatistics: "CDVA powered at 80%, α=0.05",     sampleSize: "120", pos: "75%", region: "USA, Germany",        startDate: "Jan 2025", endDate: "Dec 2026", regionalFeedback: "", comments: "",                             portfolio: "Cat/Vit Consumables & Visualization" },
  { uid: "CE127",  franchise: "Surgical",      area: "CRCX",     brandRanking: "Tier 1", areaPrioritization: "High",   pathway: "Test created", rtiYear: "2025", atpProduct: "BSS Plus",                 project: "BSS Plus Osmolarity",              strategicImperatives: "Differentiate BSS Plus portfolio",              researchQuestions: "Can modified osmolarity BSS maintain endothelial cell count longer?",       potentialClaims: "Sustained endothelial cell preservation at 3 months", totalIndirect: "38,000",  totalDirect: "95,000",  totalCost: "133,000", total2027Indirect: "19,000", total2027Direct: "48,000",  total2027Cost: "67,000",  primaryEndpoint: "Endothelial cell count at 3 months", secondaryEndpoint: "CCT at 1 month",                      otherEndpoints: "Specular microscopy morphology",         studyDesign: "Controlled", proposedStatistics: "ECC powered at 85%, α=0.05",      sampleSize: "80",  pos: "65%", region: "USA",                 startDate: "Mar 2025", endDate: "Sep 2026", regionalFeedback: "", comments: "Coordinating with EU site",   portfolio: "Cat/Vit Consumables & Visualization" },
  { uid: "CE125",  franchise: "Surgical",      area: "CRCX",     brandRanking: "Tier 1", areaPrioritization: "High",   pathway: "IIT",          rtiYear: "2024", atpProduct: "INTREPID",                 project: "INTREPID Hybrid Tip",              strategicImperatives: "Market share in MIGS segment",                  researchQuestions: "Does hybrid tip design reduce phaco time in dense cataracts?",             potentialClaims: "Fastest aspiration rate in its class",               totalIndirect: "55,000",  totalDirect: "210,000", totalCost: "265,000", total2027Indirect: "27,500", total2027Direct: "105,000", total2027Cost: "132,500", primaryEndpoint: "Mean phaco time (seconds)",          secondaryEndpoint: "CDE (cumulative dissipated energy)",  otherEndpoints: "Surgeon ergonomics rating",              studyDesign: "Comparative", proposedStatistics: "Phaco time powered at 90%, α=0.05",sampleSize: "200", pos: "80%", region: "USA, Japan",          startDate: "Jun 2024", endDate: "Jun 2026", regionalFeedback: "", comments: "",                             portfolio: "Specialty Equipment" },
  { uid: "RXG005", franchise: "Surgical",      area: "CRCX",     brandRanking: "Tier 2", areaPrioritization: "Medium", pathway: "AIT",          rtiYear: "2026", atpProduct: "Centurion",                project: "Centurion Silver",                 strategicImperatives: "Reduce surge-related complications",             researchQuestions: "Efficacy of Active Fluidics vs. gravity in surge prevention",              potentialClaims: "Reduce surge by 40% vs. predicate",                  totalIndirect: "30,000",  totalDirect: "85,000",  totalCost: "115,000", total2027Indirect: "30,000", total2027Direct: "85,000",  total2027Cost: "115,000", primaryEndpoint: "Peak surge amplitude (mmHg)",        secondaryEndpoint: "IOP fluctuation range intra-op",      otherEndpoints: "Post-op CDVA at day 1",                  studyDesign: "Controlled", proposedStatistics: "Surge amplitude powered at 80%",  sampleSize: "150", pos: "70%", region: "USA, Canada",         startDate: "Feb 2026", endDate: "Feb 2028", regionalFeedback: "", comments: "",                             portfolio: "Specialty Equipment" },
  { uid: "RXG006", franchise: "Surgical",      area: "CRCX",     brandRanking: "Tier 2", areaPrioritization: "High",   pathway: "IIT",          rtiYear: "2025", atpProduct: "Centurion",                project: "Centurion IOP Stability",          strategicImperatives: "Establish IOP control leadership",              researchQuestions: "IOP fluctuation during phaco with Active Fluidics vs. standard",           potentialClaims: "Best-in-class IOP stability during phaco",           totalIndirect: "35,000",  totalDirect: "110,000", totalCost: "145,000", total2027Indirect: "17,500", total2027Direct: "55,000",  total2027Cost: "72,500",  primaryEndpoint: "IOP SD during phaco (mmHg)",         secondaryEndpoint: "CDVA at day 30",                      otherEndpoints: "Anterior chamber stability score",       studyDesign: "Parallel",   proposedStatistics: "IOP SD powered at 80%, α=0.05",  sampleSize: "160", pos: "72%", region: "USA",                 startDate: "Apr 2025", endDate: "Oct 2026", regionalFeedback: "", comments: "",                             portfolio: "Specialty Equipment" },
  { uid: "CE123",  franchise: "Surgical",      area: "CRCX",     brandRanking: "Tier 2", areaPrioritization: "Medium", pathway: "AIT",          rtiYear: "2024", atpProduct: "OVD",                      project: "OVD Chamber Maintenance",          strategicImperatives: "Protect anterior segment integrity",             researchQuestions: "Does cohesive OVD outperform dispersive in anterior chamber maintenance?",  potentialClaims: "Maintains anterior chamber depth throughout",        totalIndirect: "22,000",  totalDirect: "68,000",  totalCost: "90,000",  total2027Indirect: "11,000", total2027Direct: "34,000",  total2027Cost: "45,000",  primaryEndpoint: "ACD stability during capsulorhexis", secondaryEndpoint: "Endothelial cell loss at 1 month",    otherEndpoints: "OVD removal time",                       studyDesign: "Crossover",  proposedStatistics: "ACD powered at 85%",              sampleSize: "100", pos: "68%", region: "Germany, France",     startDate: "Jan 2024", endDate: "Dec 2025", regionalFeedback: "", comments: "Harmonized with EU registry",  portfolio: "Cat/Vit Consumables & Visualization" },
  { uid: "VCR041", franchise: "Vision Care",   area: "Dry Eye",  brandRanking: "Tier 1", areaPrioritization: "High",   pathway: "Sponsored",    rtiYear: "2025", atpProduct: "Systane Ultra UD",         project: "Systane Ultra UD Relief",          strategicImperatives: "Lead single-dose dry eye segment",              researchQuestions: "Duration of relief with unit-dose Systane vs. multi-dose",                 potentialClaims: "24-hour dry eye symptom relief, single dose",        totalIndirect: "48,000",  totalDirect: "175,000", totalCost: "223,000", total2027Indirect: "48,000", total2027Direct: "175,000", total2027Cost: "223,000", primaryEndpoint: "OSDI score at 24 hours",             secondaryEndpoint: "Symptom-free hours (patient diary)",  otherEndpoints: "TBUT at 4 and 8 hours",                  studyDesign: "Comparative", proposedStatistics: "OSDI powered at 90%, α=0.05",     sampleSize: "250", pos: "78%", region: "USA, UK, Australia",  startDate: "Mar 2025", endDate: "Mar 2027", regionalFeedback: "", comments: "Requires IRB in AUS",          portfolio: "Rx Dry Eye" },
  { uid: "VCR039", franchise: "Vision Care",   area: "Dry Eye",  brandRanking: "Tier 1", areaPrioritization: "High",   pathway: "IIT",          rtiYear: "2026", atpProduct: "Systane Hydration",        project: "Systane Hydration 6-Month",        strategicImperatives: "Drive patient loyalty via satisfaction data",   researchQuestions: "Patient satisfaction and re-purchase intent at 6 months",                  potentialClaims: "90% patient satisfaction at 6 months",               totalIndirect: "25,000",  totalDirect: "80,000",  totalCost: "105,000", total2027Indirect: "25,000", total2027Direct: "80,000",  total2027Cost: "105,000", primaryEndpoint: "TSPS at 6 months",                   secondaryEndpoint: "Re-purchase intent questionnaire",    otherEndpoints: "OSDI at 3 and 6 months",                 studyDesign: "Monadic",    proposedStatistics: "TSPS powered at 80%",             sampleSize: "180", pos: "60%", region: "USA",                 startDate: "Jan 2026", endDate: "Dec 2027", regionalFeedback: "", comments: "Protocol in development",      portfolio: "Rx Dry Eye" },
  { uid: "VCR044", franchise: "Vision Care",   area: "Glaucoma", brandRanking: "Tier 2", areaPrioritization: "Medium", pathway: "AIT",          rtiYear: "2025", atpProduct: "Travatan Z",               project: "Travatan Z Next Gen",              strategicImperatives: "Reduce dosing burden for glaucoma patients",    researchQuestions: "Non-inferiority of next-gen Travatan Z at reduced drop frequency",         potentialClaims: "Non-inferior IOP lowering with fewer drops",         totalIndirect: "60,000",  totalDirect: "240,000", totalCost: "300,000", total2027Indirect: "30,000", total2027Direct: "120,000", total2027Cost: "150,000", primaryEndpoint: "Mean IOP at week 12",                secondaryEndpoint: "% patients achieving IOP ≤18 mmHg",   otherEndpoints: "Medication adherence score",             studyDesign: "Parallel",   proposedStatistics: "IOP non-inferiority, Δ≤1.5 mmHg", sampleSize: "320", pos: "74%", region: "USA, Canada, Spain",  startDate: "May 2025", endDate: "Nov 2027", regionalFeedback: "", comments: "",                             portfolio: "Rx Glaucoma" },
  { uid: "PHR012", franchise: "Pharmaceutical",area: "Retina",   brandRanking: "Tier 1", areaPrioritization: "High",   pathway: "Sponsored",    rtiYear: "2024", atpProduct: "Aflibercept",              project: "Aflibercept Extended Dosing",      strategicImperatives: "Establish extended dosing superiority in nAMD", researchQuestions: "52-week BCVA outcomes with q12w vs. q8w aflibercept",                      potentialClaims: "Vision gain ≥15 ETDRS letters at 52 weeks",          totalIndirect: "120,000", totalDirect: "580,000", totalCost: "700,000", total2027Indirect: "60,000", total2027Direct: "290,000", total2027Cost: "350,000", primaryEndpoint: "BCVA gain ≥15 letters at 52 weeks",  secondaryEndpoint: "CST reduction at 24 weeks",           otherEndpoints: "Injection frequency, PRN switch rate",   studyDesign: "Comparative", proposedStatistics: "BCVA powered at 90%, α=0.05",     sampleSize: "400", pos: "85%", region: "USA, EU, Japan",      startDate: "Feb 2024", endDate: "Apr 2027", regionalFeedback: "", comments: "",                             portfolio: "Ocular Health" },
  { uid: "PHR015", franchise: "Pharmaceutical",area: "Retina",   brandRanking: "Tier 1", areaPrioritization: "High",   pathway: "IIT",          rtiYear: "2026", atpProduct: "Aflibercept HD",           project: "Aflibercept HD Injection",         strategicImperatives: "Reduce treatment burden in retinal disease",    researchQuestions: "Safety and efficacy of high-dose aflibercept at q16w interval",            potentialClaims: "Reduce injection burden to q16w",                    totalIndirect: "95,000",  totalDirect: "420,000", totalCost: "515,000", total2027Indirect: "95,000", total2027Direct: "420,000", total2027Cost: "515,000", primaryEndpoint: "Injection-free interval at 52 weeks",secondaryEndpoint: "BCVA change from baseline at 52w",    otherEndpoints: "CST, safety & tolerability",             studyDesign: "Controlled", proposedStatistics: "Injection interval powered at 85%",sampleSize: "350", pos: "70%", region: "USA, Germany, Japan", startDate: "Jun 2026", endDate: "Jun 2029", regionalFeedback: "", comments: "Awaiting HD formulation sign-off", portfolio: "Ocular Health" },
  { uid: "PHR018", franchise: "Pharmaceutical",area: "Glaucoma", brandRanking: "Tier 2", areaPrioritization: "Medium", pathway: "AIT",          rtiYear: "2026", atpProduct: "Simbrinza",                project: "Simbrinza BID Protocol",           strategicImperatives: "Strengthen IOP reduction portfolio",            researchQuestions: "IOP reduction efficacy of Simbrinza BID vs. TID at 12 months",            potentialClaims: "IOP reduction ≥30% from baseline at 12M",            totalIndirect: "45,000",  totalDirect: "160,000", totalCost: "205,000", total2027Indirect: "45,000", total2027Direct: "160,000", total2027Cost: "205,000", primaryEndpoint: "% IOP reduction at 12 months",       secondaryEndpoint: "Mean diurnal IOP at 6 months",        otherEndpoints: "Tolerability and adherence rates",       studyDesign: "Parallel",   proposedStatistics: "IOP reduction powered at 80%",    sampleSize: "280", pos: "65%", region: "USA, Brazil",         startDate: "Mar 2026", endDate: "Mar 2028", regionalFeedback: "", comments: "BID label change needed",      portfolio: "Rx Glaucoma" },
  { uid: "CE119",  franchise: "Surgical",      area: "Cataract", brandRanking: "Tier 1", areaPrioritization: "High",   pathway: "IIT",          rtiYear: "2024", atpProduct: "AcrySof IQ Vivity+",      project: "AcrySof IQ Vivity+ EDOF",         strategicImperatives: "Capture premium IOL market with EDOF",          researchQuestions: "Full visual range outcomes and dysphotopsia rates vs. monofocal",          potentialClaims: "Full range of vision without dysphotopsia",          totalIndirect: "70,000",  totalDirect: "310,000", totalCost: "380,000", total2027Indirect: "35,000", total2027Direct: "155,000", total2027Cost: "190,000", primaryEndpoint: "UDVA, UIVA, UNVA at 3 months",       secondaryEndpoint: "Dysphotopsia questionnaire score",    otherEndpoints: "Patient-reported spectacle independence", studyDesign: "Comparative", proposedStatistics: "UDVA powered at 90%",             sampleSize: "240", pos: "82%", region: "USA, Germany, India", startDate: "Jul 2024", endDate: "Jan 2027", regionalFeedback: "", comments: "Harmonized with CE marking",   portfolio: "Intraocular Lenses (IOL)" },
  { uid: "CE121",  franchise: "Surgical",      area: "Cataract", brandRanking: "Tier 1", areaPrioritization: "High",   pathway: "Sponsored",    rtiYear: "2024", atpProduct: "AcrySof IQ PanOptix",     project: "AcrySof IQ PanOptix Independence", strategicImperatives: "Drive spectacle independence messaging",         researchQuestions: "Rate of spectacle independence at 12 months in trifocal IOL patients",     potentialClaims: "Spectacle independence in 85% of patients",          totalIndirect: "85,000",  totalDirect: "360,000", totalCost: "445,000", total2027Indirect: "42,500", total2027Direct: "180,000", total2027Cost: "222,500", primaryEndpoint: "% spectacle-free at 12 months",      secondaryEndpoint: "UDVA, UIVA, UNVA at 6 months",        otherEndpoints: "Patient satisfaction index",             studyDesign: "Monadic",    proposedStatistics: "Spectacle independence powered at 90%", sampleSize: "300", pos: "88%", region: "USA, UK, France",     startDate: "Jan 2024", endDate: "Jun 2026", regionalFeedback: "", comments: "",                             portfolio: "Intraocular Lenses (IOL)" },
  { uid: "VCR051", franchise: "Vision Care",   area: "Dry Eye",  brandRanking: "Tier 1", areaPrioritization: "High",   pathway: "Sponsored",    rtiYear: "2025", atpProduct: "Pataday Once Daily",       project: "Pataday Seasonal Allergy",         strategicImperatives: "Own peak allergy season narrative",             researchQuestions: "Symptom-free days during peak allergy season with Pataday OD vs. placebo", potentialClaims: "Symptom-free days ≥5 of 7 at peak season",          totalIndirect: "50,000",  totalDirect: "190,000", totalCost: "240,000", total2027Indirect: "50,000", total2027Direct: "190,000", total2027Cost: "240,000", primaryEndpoint: "Symptom-free days/week at peak season",secondaryEndpoint: "Ocular itching VAS at day 14",        otherEndpoints: "Rescue medication use",                  studyDesign: "Controlled", proposedStatistics: "Symptom-free days powered at 85%",sampleSize: "350", pos: "80%", region: "USA, Canada",         startDate: "Feb 2025", endDate: "Nov 2026", regionalFeedback: "", comments: "",                             portfolio: "Rx Dry Eye" },
  { uid: "RXG009", franchise: "Surgical",      area: "CRCX",     brandRanking: "Tier 2", areaPrioritization: "Medium", pathway: "IIT",          rtiYear: "2026", atpProduct: "Centurion Active Sentry",  project: "Active Sentry Zero-Surge",         strategicImperatives: "Zero-surge as a clinical standard",             researchQuestions: "Can Active Sentry eliminate measurable surge events in routine phaco?",    potentialClaims: "Zero-surge phacoemulsification",                     totalIndirect: "28,000",  totalDirect: "92,000",  totalCost: "120,000", total2027Indirect: "28,000", total2027Direct: "92,000",  total2027Cost: "120,000", primaryEndpoint: "Surge events per case (n=0)",        secondaryEndpoint: "IOP peaks intra-op",                  otherEndpoints: "CDVA at day 7",                          studyDesign: "Controlled", proposedStatistics: "Surge count powered at 80%",      sampleSize: "140", pos: "62%", region: "USA",                 startDate: "Apr 2026", endDate: "Oct 2027", regionalFeedback: "", comments: "Prototype instrument required",  portfolio: "Specialty Equipment" },
  { uid: "PHR022", franchise: "Pharmaceutical",area: "Retina",   brandRanking: "Tier 2", areaPrioritization: "Medium", pathway: "Sponsored",    rtiYear: "2025", atpProduct: "Ozurdex",                  project: "Ozurdex PRN Protocol",             strategicImperatives: "Flexible dosing for real-world DME management", researchQuestions: "Anatomic and functional outcomes with PRN Ozurdex vs. fixed dosing",       potentialClaims: "Anatomic resolution at 6M with PRN dosing",          totalIndirect: "55,000",  totalDirect: "220,000", totalCost: "275,000", total2027Indirect: "55,000", total2027Direct: "220,000", total2027Cost: "275,000", primaryEndpoint: "CST normalization at 6 months",      secondaryEndpoint: "BCVA change from baseline at 6M",     otherEndpoints: "Injection frequency, IOP excursions",    studyDesign: "Parallel",   proposedStatistics: "CST powered at 80%, α=0.05",      sampleSize: "220", pos: "71%", region: "USA, Italy, Spain",   startDate: "Sep 2025", endDate: "Sep 2027", regionalFeedback: "", comments: "",                             portfolio: "Ocular Health" },
  { uid: "CE131",  franchise: "Surgical",      area: "CRCX",     brandRanking: "Tier 3", areaPrioritization: "Low",    pathway: "AIT",          rtiYear: "2026", atpProduct: "MIVS 27g",                 project: "MIVS 27g Plus Hypotony",           strategicImperatives: "Reduce vitreoretinal post-op complications",    researchQuestions: "Incidence of post-op hypotony with 27g vs. 25g MIVS instrumentation",     potentialClaims: "Lowest incidence of post-op hypotony",               totalIndirect: "18,000",  totalDirect: "55,000",  totalCost: "73,000",  total2027Indirect: "18,000", total2027Direct: "55,000",  total2027Cost: "73,000",  primaryEndpoint: "Hypotony rate at day 7 (IOP <6 mmHg)",secondaryEndpoint: "IOP at day 1, 7, and 30",             otherEndpoints: "Vitreous prolapse incidence",            studyDesign: "Comparative", proposedStatistics: "Hypotony rate powered at 80%",    sampleSize: "160", pos: "58%", region: "Germany, Japan",      startDate: "Jun 2026", endDate: "Dec 2027", regionalFeedback: "", comments: "Harmonized with JSCR",         portfolio: "Cat/Vit Consumables & Visualization" },
];

const emptyDraft: Idea = { uid: "", franchise: "", area: "", brandRanking: "", areaPrioritization: "", pathway: "", rtiYear: "", atpProduct: "", project: "", strategicImperatives: "", researchQuestions: "", potentialClaims: "", totalIndirect: "", totalDirect: "", totalCost: "", total2027Indirect: "", total2027Direct: "", total2027Cost: "", primaryEndpoint: "", secondaryEndpoint: "", otherEndpoints: "", studyDesign: "", proposedStatistics: "", sampleSize: "", pos: "", region: "", startDate: "", endDate: "", regionalFeedback: "", comments: "", portfolio: "" };

const isLocked = (_row: Idea) => false;
const LOCK_REASON = "";

type SortDir = "asc" | "desc" | null;

type Column = { key: keyof Idea; label: string; options?: string[] };

const columns: Column[] = [
  { key: "uid",                  label: "UID" },
  { key: "franchise",            label: "FRANCHISE",                                options: ["Surgical", "Vision Care", "Pharmaceutical"] },
  { key: "area",                 label: "THERAPEUTIC AREA",                         options: ["CRCX", "Retina", "Glaucoma", "Cataract", "Dry Eye"] },
  { key: "brandRanking",         label: "BRAND RANKING" },
  { key: "areaPrioritization",   label: "THERAPEUTIC AREA PRIORITIZATION" },
  { key: "pathway",              label: "RESEARCH PATHWAY",                         options: ["IIT", "AIT", "Test created", "Sponsored"] },
  { key: "rtiYear",              label: "RTI YEAR (WHEN STUDY STARTS)" },
  { key: "atpProduct",           label: "ATP OR KEY PRODUCT" },
  { key: "project",              label: "PRODUCT OR PROJECT" },
  { key: "strategicImperatives", label: "STRATEGIC IMPERATIVES" },
  { key: "researchQuestions",    label: "RESEARCH QUESTIONS / DETAILS" },
  { key: "potentialClaims",      label: "POTENTIAL CLAIMS" },
  { key: "totalIndirect",        label: "TOTAL ESTIMATED INDIRECT ($)" },
  { key: "totalDirect",          label: "TOTAL ESTIMATED DIRECT ($)" },
  { key: "totalCost",            label: "TOTAL ESTIMATED BUDGET" },
  { key: "total2027Indirect",    label: "TOTAL ESTIMATED 2027 INDIRECT ($)" },
  { key: "total2027Direct",      label: "TOTAL ESTIMATED 2027 DIRECT ($)" },
  { key: "total2027Cost",        label: "ESTIMATED 2027 SPEND ($)" },
  { key: "primaryEndpoint",      label: "POTENTIAL PRIMARY ENDPOINT" },
  { key: "secondaryEndpoint",    label: "POTENTIAL SECONDARY ENDPOINT" },
  { key: "otherEndpoints",       label: "POTENTIAL OTHER ENDPOINTS" },
  { key: "studyDesign",          label: "PROPOSED STUDY DESIGN",                    options: ["Monadic", "Comparative", "Controlled", "Masked", "Crossover", "Parallel"] },
  { key: "proposedStatistics",   label: "PROPOSED STATISTICS (WHICH ENDPOINTS ARE POWERED)" },
  { key: "sampleSize",           label: "POTENTIAL SAMPLE SIZE" },
  { key: "pos",                  label: "POS" },
  { key: "region",               label: "REGION / COUNTRY ACCEPTING SUBMISSION" },
  { key: "startDate",            label: "START DATE" },
  { key: "endDate",              label: "END DATE (CSR)" },
  { key: "regionalFeedback",     label: "REGIONAL FEEDBACK" },
  { key: "comments",             label: "COMMENTS" },
  { key: "portfolio",            label: "PORTFOLIO",                                options: [...PORTFOLIOS] },
];

// The tab strip switches which slice of the schema is on screen — not which rows.
// `columns` above stays the single source of truth for labels and editors; a view is
// just an ordered list of keys into it, so the two can never drift apart.
type ViewKey = "Franchise" | "Evidence Function";

const VIEW_KEYS: Record<ViewKey, (keyof Idea)[]> = {
  "Franchise": [
    "uid", "franchise", "area", "brandRanking", "areaPrioritization", "pathway",
    "rtiYear", "atpProduct", "project", "strategicImperatives", "researchQuestions", "potentialClaims",
  ],
  "Evidence Function": [
    "uid", "totalCost", "total2027Cost", "primaryEndpoint", "secondaryEndpoint", "otherEndpoints",
    "studyDesign", "proposedStatistics", "sampleSize", "pos", "region", "startDate", "endDate",
    "regionalFeedback", "comments",
  ],
};

const VIEWS = Object.keys(VIEW_KEYS) as ViewKey[];

const columnByKey = new Map(columns.map(c => [c.key, c]));
const viewColumns = (v: ViewKey): Column[] => VIEW_KEYS[v].map(k => columnByKey.get(k)!);

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

type MoveDir = "down" | "right" | null;

function GridCell({
  col,
  value,
  active,
  editing,
  seed,
  placeholder,
  indicator,
  locked,
  swapClass = "",
  swapStyle,
  onSelect,
  onStartEdit,
  onCommit,
  onCancel,
  onLocked,
}: {
  col: Column;
  value: string;
  active: boolean;
  editing: boolean;
  seed: string;
  placeholder?: string;
  indicator?: "dirty" | "saving" | "error" | null;
  locked?: boolean;
  swapClass?: string;
  swapStyle?: React.CSSProperties;
  onSelect: () => void;
  onStartEdit: () => void;
  onCommit: (v: string, move: MoveDir) => void;
  onCancel: () => void;
  onLocked?: () => void;
}) {
  const isFirst = col.key === "uid";

  if (editing) {
    if (col.options) {
      return (
        <td className="p-0" style={{ borderRight: "1px solid rgba(0,0,0,0.05)" }}>
          <select
            autoFocus
            defaultValue={value}
            onChange={e => onCommit(e.target.value, null)}
            onBlur={e => onCommit(e.target.value, null)}
            onKeyDown={e => {
              if (e.key === "Escape") { e.preventDefault(); onCancel(); }
            }}
            className="w-full px-4 py-[10px] text-[13px] bg-white outline-none"
            style={{ boxShadow: "0 0 0 2px rgba(13,45,107,0.55) inset" }}
          >
            <option value="">—</option>
            {col.options.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </td>
      );
    }
    return (
      <td className="p-0" style={{ borderRight: "1px solid rgba(0,0,0,0.05)" }}>
        <input
          autoFocus
          key={seed}
          defaultValue={seed}
          onFocus={e => e.target.select()}
          onBlur={e => onCommit(e.target.value, null)}
          onKeyDown={e => {
            const el = e.target as HTMLInputElement;
            if (e.key === "Enter") { e.preventDefault(); onCommit(el.value, "down"); }
            else if (e.key === "Tab") { e.preventDefault(); onCommit(el.value, "right"); }
            else if (e.key === "Escape") { e.preventDefault(); onCancel(); }
          }}
          className="w-full px-4 py-[10px] text-[13px] bg-white outline-none"
          style={{ boxShadow: "0 0 0 2px rgba(13,45,107,0.55) inset" }}
        />
      </td>
    );
  }

  return (
    <td
      onClick={onSelect}
      onDoubleClick={locked ? onLocked : onStartEdit}
      title={locked ? LOCK_REASON : undefined}
      style={{
        ...swapStyle,
        borderRight: "1px solid rgba(0,0,0,0.05)",
        boxShadow: active
          ? locked
            ? "0 0 0 2px rgba(156,163,175,0.5) inset"
            : "0 0 0 2px rgba(13,45,107,0.55) inset"
          : undefined,
        backgroundColor: active
          ? locked ? "rgba(156,163,175,0.06)" : "rgba(13,45,107,0.03)"
          : undefined,
      }}
      className={`${swapClass} px-4 py-[10px] select-none whitespace-nowrap text-[13px] leading-snug transition-colors duration-100 ${
        locked ? "cursor-not-allowed" : "cursor-cell"
      } ${
        isFirst
          ? locked ? "font-medium" : "font-medium text-gray-800"
          : locked ? "" : ""
      }`}
    >
      <span className="inline-flex items-center gap-1.5" style={{ color: locked ? "#aeaeb2" : isFirst ? "#1c1c1e" : "#3c3c43" }}>
        {isFirst && locked && (
          <Lock size={11} className="shrink-0" style={{ color: "#aeaeb2" }} strokeWidth={2} />
        )}
        {value !== "" ? value : (
          <span style={{ color: "#c7c7cc" }}>{placeholder}</span>
        )}
        {!locked && col.options && active && <Caret size={10} strokeWidth={2} style={{ color: "#aeaeb2" }} />}
        {indicator === "saving" && (
          <Loader2 size={10} className="animate-spin shrink-0" style={{ color: "#f59e0b" }} />
        )}
        {indicator === "dirty" && (
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#f59e0b" }} title="Unsaved changes" />
        )}
        {indicator === "error" && (
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#ef4444" }} title="Save failed" />
        )}
      </span>
    </td>
  );
}

function RowMenu({
  row,
  locked,
  onEdit,
  onViewDetails,
  onViewHistory,
  onDuplicate,
  onDelete,
}: {
  row: Idea;
  locked?: boolean;
  onEdit: (row: Idea) => void;
  onViewDetails: (row: Idea) => void;
  onViewHistory: (row: Idea) => void;
  onDuplicate: (row: Idea) => void;
  onDelete: (row: Idea) => void;
}) {
  const [open, setOpen] = useState(false);

  function item(icon: React.ReactNode, label: string, action: () => void, danger = false, disabled = false) {
    if (disabled) {
      return (
        <div
          title={LOCK_REASON}
          className="flex items-center gap-2.5 w-full text-left px-3.5 py-[7px] text-[13px] rounded-lg mx-1 my-px text-gray-300 cursor-not-allowed"
          style={{ width: "calc(100% - 8px)" }}
        >
          <span className="text-gray-300">{icon}</span>
          {label}
        </div>
      );
    }
    return (
      <button
        onClick={() => { action(); setOpen(false); }}
        className={`flex items-center gap-2.5 w-full text-left px-3.5 py-[7px] text-[13px] transition-colors duration-100 rounded-lg mx-1 my-px active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0d2d6b]/30 ${
          danger
            ? "text-red-500 hover:bg-red-50 active:bg-red-100/70"
            : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
        }`}
        style={{ width: "calc(100% - 8px)" }}
      >
        <span className={danger ? "text-red-400" : "text-gray-400"}>{icon}</span>
        {label}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="p-1.5 rounded-lg active:scale-95 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30"
        style={{ color: "#8e8e93" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.06)")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}
      >
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="pop-in surface-pop absolute right-0 top-full mt-1.5 z-50 w-52 rounded-[14px] py-1.5 overflow-hidden"
            style={{
              backgroundColor: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid rgba(0,0,0,0.1)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            {locked && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 mb-1 border-b border-gray-100 text-[11.5px] text-gray-400">
                <Lock size={11} strokeWidth={2} />
                Locked — read only
              </div>
            )}
            {item(<Pencil size={13} />, "Edit idea", () => onEdit(row), false, locked)}
            {item(<Eye size={13} />, "View idea details", () => onViewDetails(row))}
            {item(<Clock size={13} />, "View idea history", () => onViewHistory(row))}
            <div className="border-t border-gray-100 my-1" />
            {item(<Copy size={13} />, "Duplicate", () => onDuplicate(row), false, locked)}
            {item(<Trash2 size={13} />, "Delete", () => onDelete(row), true, locked)}
          </div>
        </>
      )}
    </div>
  );
}

// ─── History data generator ───────────────────────────────────────────────────

type HistoryEvent = {
  id: string;
  date: string;
  time: string;
  action: string;
  actor: string;
  committee?: string;
  note?: string;
};

const ACTORS = ["Dr. Sarah M.", "James L.", "Priya N.", "Tom R.", "Lisa C.", "Marcus W."];
const COMMITTEES = ["Clinical Review", "Scientific Committee", "Portfolio Board", "Budget Panel"];

function generateHistory(row: Idea): HistoryEvent[] {
  const seed = row.uid.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const pick = <T,>(arr: T[], offset = 0) => arr[(seed + offset) % arr.length];

  const baseYear = 2024;
  const baseMonth = ((seed % 10) + 1);

  const fmt = (offset: number) => {
    const month = String(Math.min(baseMonth + offset, 12)).padStart(2, "0");
    const day = String(((seed * (offset + 1)) % 25) + 1).padStart(2, "0");
    const hour = String(((seed + offset * 3) % 10) + 8).padStart(2, "0");
    const min = String((seed * (offset + 2)) % 60).padStart(2, "0");
    return { date: `${baseYear}-${month}-${day}`, time: `${hour}:${min}` };
  };

  const events: HistoryEvent[] = [
    {
      id: `${row.uid}-create`,
      ...fmt(0),
      action: "Idea created",
      actor: pick(ACTORS, 0),
      note: `Initial draft submitted for ${row.project}. Research pathway: ${row.pathway}.`,
    },
    {
      id: `${row.uid}-edit1`,
      ...fmt(1),
      action: "Potential claims updated",
      actor: pick(ACTORS, 1),
      note: `"${row.potentialClaims.slice(0, 60)}${row.potentialClaims.length > 60 ? "…" : ""}"`,
    },
    {
      id: `${row.uid}-edit2`,
      ...fmt(2),
      action: "Research questions revised",
      actor: pick(ACTORS, 2),
      committee: pick(COMMITTEES, 0),
    },
    {
      id: `${row.uid}-edit3`,
      ...fmt(3),
      action: "Study design confirmed",
      actor: pick(ACTORS, 3),
      note: `Design set to ${row.studyDesign || "TBD"}.`,
    },
  ];

  return events.reverse();
}


// ─── Idea Detail Panel ─────────────────────────────────────────────────────────

function IdeaDetailPanel({
  row,
  onClose,
  onEdit,
}: {
  row: Idea | null;
  onClose: () => void;
  onEdit: (row: Idea) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Animate in on mount, out before unmount
  useEffect(() => {
    if (row) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [row]);

  // Escape to dismiss + focus trap
  useEffect(() => {
    if (!row) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // Move focus into panel
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [row, onClose]);

  if (!row) return null;

  const locked = isLocked(row);

  // The specification reads like a calm, iOS-Settings-style list — label left, value right,
  // separated by hairlines. No colored chips, no all-caps eyebrow on every field.
  const spec: { label: string; value: string }[] = [
    { label: "Portfolio",                    value: row.portfolio },
    { label: "Franchise",                    value: row.franchise },
    { label: "Therapeutic area",             value: row.area },
    { label: "Brand ranking",                value: row.brandRanking },
    { label: "TA prioritization",            value: row.areaPrioritization },
    { label: "Research pathway",             value: row.pathway },
    { label: "RTI year",                     value: row.rtiYear },
    { label: "ATP or key product",           value: row.atpProduct },
    { label: "Product or project",           value: row.project },
    { label: "Strategic imperatives",        value: row.strategicImperatives },
    { label: "Research questions / details", value: row.researchQuestions },
  ];

  const endpoints: { label: string; value: string }[] = [
    { label: "Primary endpoint",   value: row.primaryEndpoint },
    { label: "Secondary endpoint", value: row.secondaryEndpoint },
    { label: "Other endpoints",    value: row.otherEndpoints },
    { label: "Study design",       value: row.studyDesign },
    { label: "Statistics",         value: row.proposedStatistics },
    { label: "Sample size",        value: row.sampleSize },
    { label: "POS",                value: row.pos },
    { label: "Region / Country",   value: row.region },
    { label: "Start date",         value: row.startDate },
    { label: "End date (CSR)",     value: row.endDate },
    { label: "Regional feedback",  value: row.regionalFeedback },
  ];

  const financials: { label: string; value: string }[] = [
    { label: "Total estimated budget",  value: row.totalCost },
    { label: "Estimated 2027 spend",    value: row.total2027Cost },
    { label: "Total indirect ($)",      value: row.totalIndirect },
    { label: "Total direct ($)",        value: row.totalDirect },
    { label: "2027 indirect ($)",       value: row.total2027Indirect },
    { label: "2027 direct ($)",         value: row.total2027Direct },
  ];

  const governance: { label: string; value: string }[] = [
    { label: "Created by",    value: "Sahil Kapoor" },
    { label: "Created",       value: "Mar 12, 2024" },
    { label: "Last modified", value: "Jun 3, 2025" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Scrim */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Panel — slides from right */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Idea details — ${row.uid}`}
        className="absolute right-0 top-0 h-full w-[460px] max-w-full bg-white flex flex-col outline-none"
        style={{
          boxShadow: "-1px 0 0 rgba(0,0,0,0.04), -24px 0 60px -20px rgba(15,23,42,0.28)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header — content-first: the project is the real title, the UID is metadata. */}
        <div className="shrink-0 px-7 pt-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="font-mono text-[11px] tracking-[0.02em] text-gray-400">{row.uid}</span>
                {locked && (
                  <>
                    <span className="text-gray-200">·</span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                      <Lock size={11} strokeWidth={2} /> Locked
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-[26px] leading-[1.15] tracking-[-0.02em] text-gray-900 truncate">
                {row.project || "Untitled idea"}
              </h2>
              <p className="text-[13px] text-gray-400 mt-1.5">{row.franchise} · {row.area}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 -mr-1 -mt-1 grid place-items-center w-8 h-8 rounded-full text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-700 active:scale-95 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
            >
              <X size={15} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-7 pb-8">

          {/* Hero — the aspirational claim leads, set large and confident. */}
          <div className="rounded-2xl px-5 py-5" style={{ backgroundColor: `${NAVY}07` }}>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles size={13} strokeWidth={2} style={{ color: NAVY }} />
              <p className="text-[11px] font-medium tracking-[0.01em]" style={{ color: NAVY }}>Potential claims</p>
            </div>
            <p className="text-[19px] leading-[1.45] tracking-[-0.01em] text-gray-900">
              {row.potentialClaims || <span className="text-gray-300">No claims defined yet.</span>}
            </p>
          </div>

          {/* Specification — quiet label/value rows on hairlines. */}
          <div className="mt-7">
            <p className="text-[12px] font-medium text-gray-400 mb-1">Specification</p>
            <dl>
              {spec.map((f, i) => (
                <div
                  key={f.label}
                  className={`flex items-baseline justify-between gap-6 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
                >
                  <dt className="text-[13px] text-gray-500 shrink-0">{f.label}</dt>
                  <dd className="text-[13px] text-gray-900 text-right">
                    {f.value || <span className="text-gray-300">—</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Study design & endpoints */}
          <div className="mt-7">
            <p className="text-[12px] font-medium text-gray-400 mb-1">Study Design &amp; Endpoints</p>
            <dl>
              {endpoints.map((f, i) => (
                <div
                  key={f.label}
                  className={`flex items-baseline justify-between gap-6 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
                >
                  <dt className="text-[13px] text-gray-500 shrink-0">{f.label}</dt>
                  <dd className="text-[13px] text-gray-900 text-right">
                    {f.value || <span className="text-gray-300">—</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Financials */}
          <div className="mt-7">
            <p className="text-[12px] font-medium text-gray-400 mb-1">Financials</p>
            <dl>
              {financials.map((f, i) => (
                <div
                  key={f.label}
                  className={`flex items-baseline justify-between gap-6 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
                >
                  <dt className="text-[13px] text-gray-500 shrink-0">{f.label}</dt>
                  <dd className="text-[13px] text-gray-900 text-right font-mono tabular-nums">
                    {f.value || <span className="text-gray-300 font-sans">—</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Comments */}
          {row.comments && (
            <div className="mt-7">
              <p className="text-[12px] font-medium text-gray-400 mb-1">Comments</p>
              <p className="text-[13px] text-gray-700 leading-relaxed">{row.comments}</p>
            </div>
          )}

          {/* Governance */}
          <div className="mt-7">
            <p className="text-[12px] font-medium text-gray-400 mb-1">Governance</p>
            <dl>
              {governance.map((f, i) => (
                <div
                  key={f.label}
                  className={`flex items-baseline justify-between gap-6 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
                >
                  <dt className="text-[13px] text-gray-500 shrink-0">{f.label}</dt>
                  <dd className="text-[13px] text-gray-900 text-right">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Footer — one clear action, or a calm lock explanation. */}
        <div className="shrink-0 px-7 py-4 border-t border-gray-100 bg-white/80 backdrop-blur">
          {locked ? (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-gray-50 rounded-2xl text-[13px] text-gray-500 leading-relaxed">
              <Lock size={14} strokeWidth={2} className="text-gray-400 mt-px shrink-0" />
              {LOCK_REASON}
            </div>
          ) : (
            <button
              onClick={() => { onEdit(row); onClose(); }}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-full text-white text-[14px] font-medium active:scale-[0.99] transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0d2d6b]/50"
              style={{ backgroundColor: NAVY }}
            >
              <PenLine size={15} strokeWidth={2} />
              Edit idea
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Idea History Panel ────────────────────────────────────────────────────────

function IdeaHistoryPanel({
  row,
  onClose,
}: {
  row: Idea | null;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (row) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [row]);

  useEffect(() => {
    if (!row) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [row, onClose]);

  if (!row) return null;

  const events = generateHistory(row);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Scrim */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Panel — slides from right, matching the detail panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Activity for ${row.uid}`}
        className="absolute right-0 top-0 h-full w-[460px] max-w-full bg-white flex flex-col outline-none"
        style={{
          boxShadow: "-1px 0 0 rgba(0,0,0,0.04), -24px 0 60px -20px rgba(15,23,42,0.28)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header */}
        <div className="shrink-0 px-7 pt-6 pb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[20px] leading-tight tracking-[-0.02em] text-gray-900">Activity</h2>
            <p className="text-[13px] text-gray-400 mt-1 truncate">
              <span className="font-mono text-[11px] text-gray-400">{row.uid}</span>
              <span className="mx-1.5 text-gray-200">·</span>
              {row.project}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 grid place-items-center w-8 h-8 rounded-full text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-700 active:scale-95 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          >
            <X size={15} strokeWidth={2.25} />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-7 pb-8">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 pb-10">
              <Clock size={30} strokeWidth={1.2} className="text-gray-300" />
              <p className="text-[14px] text-gray-500">No activity yet</p>
              <p className="text-[13px]">Changes will appear here as the idea progresses.</p>
            </div>
          ) : (
            <ol className="relative">
              {events.map((ev, i) => {
                const last = i === events.length - 1;

                return (
                  <li key={ev.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* Rail + node */}
                    <div className="relative shrink-0 flex justify-center" style={{ width: 12 }}>
                      {!last && <span className="absolute top-3 bottom-[-24px] w-px" style={{ backgroundColor: "#eceef1" }} />}
                      <span
                        className="relative mt-1 rounded-full ring-4 ring-white"
                        style={{ width: 8, height: 8, backgroundColor: "#d1d5db" }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 -mt-0.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-[14px] text-gray-900 leading-snug">{ev.action}</p>
                        <time className="shrink-0 text-[11.5px] tabular-nums" style={{ color: "#aab0ba" }}>
                          {new Date(`${ev.date}T00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </time>
                      </div>
                      <p className="text-[12px] text-gray-400 mt-1">
                        {ev.actor}{ev.committee && <> · {ev.committee}</>} · {ev.time}
                      </p>
                      {ev.note && (
                        <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">{ev.note}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Portfolio Side Panel ─────────────────────────────────────────────────────

function PortfolioPanel({
  rows,
  active,
  open,
  onSelect,
  onToggle,
}: {
  rows: Idea[];
  active: string;
  open: boolean;
  onSelect: (p: string) => void;
  onToggle: () => void;
}) {
  const counts = new Map<string, number>();
  counts.set("All", rows.length);
  for (const p of PORTFOLIOS) counts.set(p, 0);
  for (const row of rows) {
    if (row.portfolio) counts.set(row.portfolio, (counts.get(row.portfolio) ?? 0) + 1);
  }

  function PortfolioRow({ label, pKey }: { label: string; pKey: string }) {
    const isActive = active === pKey;
    const count = counts.get(pKey) ?? 0;
    return (
      <button
        onClick={() => onSelect(pKey)}
        title={label}
        className={`relative w-full flex items-center gap-2 rounded-[9px] text-left transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30 ${
          isActive
            ? "text-white shadow-[0_1px_3px_rgba(13,45,107,0.25)]"
            : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-[0_1px_3px_rgba(0,0,0,0.07)]"
        }`}
        style={{
          minHeight: 33,
          padding: open ? "6px 10px" : "6px 0",
          backgroundColor: isActive ? NAVY : undefined,
          justifyContent: open ? undefined : "center",
        }}
      >
        {open ? (
          <>
            <span className={`text-[12.5px] leading-snug flex-1 min-w-0 truncate ${isActive ? "font-medium" : ""}`}>
              {label}
            </span>
            <span
              className={`shrink-0 text-[10.5px] tabular-nums rounded-full px-[6px] py-px font-semibold ${
                isActive
                  ? "bg-white/20 text-white"
                  : count > 0
                    ? "bg-gray-200/80 text-gray-500"
                    : "text-gray-300"
              }`}
            >
              {count > 0 ? count : "—"}
            </span>
          </>
        ) : (
          <span
            className={`text-[9px] font-bold tracking-[0.04em] ${
              isActive ? "text-white" : "text-gray-400"
            }`}
          >
            {PORTFOLIO_ABBR[pKey] ?? pKey.slice(0, 3).toUpperCase()}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className="relative shrink-0 flex flex-col overflow-hidden"
      style={{
        width: open ? 220 : 54,
        transition: "width 0.3s cubic-bezier(0.16,1,0.3,1)",
        backgroundColor: "#f4f4f6",
        boxShadow: "1px 0 0 rgba(0,0,0,0.07)",
      }}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center" style={{ height: 56 }}>
        {open ? (
          <div className="flex items-center justify-between w-full px-3 pr-2">
            <div className="flex items-center gap-2 select-none">
              <Layers size={12} strokeWidth={2.2} className="text-gray-400 shrink-0" />
              <span className="text-[11px] font-semibold text-gray-400 tracking-[0.06em] uppercase">
                Portfolio
              </span>
            </div>
            <button
              onClick={onToggle}
              title="Collapse"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-black/[0.05] active:scale-95 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30"
            >
              <PanelCollapse size={13} strokeWidth={2} />
            </button>
          </div>
        ) : (
          <button
            onClick={onToggle}
            title="Expand portfolio panel"
            className="w-full h-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0d2d6b]/30"
          >
            <Layers size={15} strokeWidth={1.9} />
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-3" style={{ padding: open ? "0 8px 12px" : "0 6px 12px" }}>
        {/* All portfolios */}
        <PortfolioRow label="All portfolios" pKey="All" />

        {/* Divider */}
        <div className="my-2" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }} />

        {/* Individual portfolios */}
        <div className="flex flex-col gap-[2px]">
          {PORTFOLIOS.map(p => (
            <PortfolioRow key={p} label={p} pKey={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SortIcon({ dir }: { dir: SortDir }) {
  return (
    <span className="inline-flex flex-col ml-1 gap-[1px] opacity-40">
      <ChevronUp size={8} strokeWidth={2.5} className={dir === "asc" ? "opacity-100 text-[#0d2d6b]" : ""} />
      <ChevronDown size={8} strokeWidth={2.5} className={dir === "desc" ? "opacity-100 text-[#0d2d6b]" : ""} />
    </span>
  );
}

export default function App() {
  const [portfolio, setPortfolio] = useState<string>("All");
  const [panelOpen, setPanelOpen] = useState(true);
  const [view, setView] = useState<ViewKey>("Franchise");
  // pendingView updates immediately on click so tabs animate in sync with the table swap.
  const [pendingView, setPendingView] = useState<ViewKey>("Franchise");
  // "out" = current columns leaving. dir is +1 when moving to a tab on the right.
  const [swapping, setSwapping] = useState(false);
  const [dir, setDir] = useState(1);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [rows, setRows] = useState<Idea[]>(initialIdeas);
  const [draft, setDraft] = useState<Idea>(emptyDraft);

  // Per-column value filters (Excel-style). Empty array / missing key = no filter on that column.
  const [colFilters, setColFilters] = useState<Partial<Record<keyof Idea, string[]>>>({});
  const [openFilter, setOpenFilter] = useState<keyof Idea | null>(null);

  // Active-cell cursor + edit state (r spans sorted rows; the last index is the draft row)
  const [active, setActive] = useState<{ r: number; c: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [seed, setSeed] = useState("");
  const [detailRow, setDetailRow] = useState<Idea | null>(null);
  const [historyRow, setHistoryRow] = useState<Idea | null>(null);
  const [dirtySet, setDirtySet] = useState<Set<string>>(new Set());
  const [savingSet, setSavingSet] = useState<Set<string>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);
  const dirtyRows = useRef<Set<string>>(new Set());
  const savingRows = useRef<Set<string>>(new Set());
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // rowsRef keeps flush logic in sync with latest rows state without stale closures
  const rowsRef = useRef(rows);
  useEffect(() => { rowsRef.current = rows; }, [rows]);

  // Columns currently on screen. Everything index-based — the cursor, keyboard nav,
  // commits — is relative to this list, not the full schema.
  const cols = viewColumns(view);

  // Tab underline slides between tabs, so we measure the active button's box.
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });
  // Measure on mount so the indicator starts in the right place.
  useEffect(() => {
    const el = tabRefs.current[VIEWS.indexOf(view)];
    if (el) setTabIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, []);

  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (swapTimer.current) clearTimeout(swapTimer.current); }, []);

  // Only the columns right of UID take part in the swap. UID is the spine: same column,
  // same place, in both views — moving it would imply the rows themselves changed.
  function swapProps(ci: number): { swapClass: string; swapStyle?: React.CSSProperties } {
    if (ci === 0) return { swapClass: "" };
    if (swapping) {
      return {
        swapClass: "",
        swapStyle: {
          transform: `translateX(${-dir * 20}px)`,
          opacity: 0,
          // Leaving is brisk and linear-ish; arriving is the slow settle. Asymmetry reads as intent.
          transition: "transform 0.16s cubic-bezier(0.4, 0, 1, 1), opacity 0.14s ease",
        },
      };
    }
    return { swapClass: "col-enter" };
  }

  function switchView(next: ViewKey) {
    if (next === view || swapping) return;
    // Persist anything pending before the grid re-keys under a new column set.
    if (dirtyRows.current.size > 0) flushDirty();
    setIsEditing(false);
    setActive(null);
    setOpenFilter(null);
    setDir(VIEWS.indexOf(next) > VIEWS.indexOf(view) ? 1 : -1);
    // Update tab UI immediately — measure the target button now, before any state flush.
    const el = tabRefs.current[VIEWS.indexOf(next)];
    if (el) setTabIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    setPendingView(next);
    setSwapping(true);
    swapTimer.current = setTimeout(() => {
      // Column indices change with the view — a sort on a now-hidden column would be invisible.
      if (sortCol && !VIEW_KEYS[next].includes(sortCol as keyof Idea)) {
        setSortCol(null);
        setSortDir(null);
      }
      if (gridRef.current) gridRef.current.scrollLeft = 0;
      setView(next);
      setSwapping(false);
    }, 140);
  }

  function handleSort(key: string) {
    if (sortCol === key) {
      setSortDir(d => d === "asc" ? "desc" : d === "desc" ? null : "asc");
      if (sortDir === "desc") setSortCol(null);
    } else {
      setSortCol(key);
      setSortDir("asc");
    }
  }

  // --- Dirty-row save strategy ---
  // Changes accumulate locally; API calls only fire on row-leave or 3s idle.
  // This keeps the gateway quiet even during rapid Tab/Enter navigation.

  function syncDirtyState() {
    setDirtySet(new Set(dirtyRows.current));
  }

  function syncSavingState() {
    setSavingSet(new Set(savingRows.current));
  }

  async function flushDirty(uids?: string[]) {
    // A flush is happening now — cancel any pending idle timer so it doesn't
    // fire a redundant empty flush a moment later.
    if (idleTimer.current) { clearTimeout(idleTimer.current); idleTimer.current = null; }
    const toSave = uids ?? Array.from(dirtyRows.current);
    for (const uid of toSave) {
      if (savingRows.current.has(uid)) continue;
      savingRows.current.add(uid);
      dirtyRows.current.delete(uid);
      syncDirtyState();
      syncSavingState();
      const row = rowsRef.current.find(r => r.uid === uid);
      if (!row) { savingRows.current.delete(uid); syncSavingState(); continue; }
      try {
        // Simulated API call — replace with real fetch/axios call
        await new Promise<void>((res, rej) =>
          setTimeout(() => (Math.random() > 0.15 ? res() : rej(new Error("Network error"))), 600)
        );
      } catch {
        dirtyRows.current.add(uid);
        toast.error(`Failed to save ${uid}`, { description: "Will retry on next change." });
        syncDirtyState();
      } finally {
        savingRows.current.delete(uid);
        syncSavingState();
      }
    }
  }

  function markDirty(uid: string) {
    dirtyRows.current.add(uid);
    syncDirtyState();
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => flushDirty(), 3000);
  }

  // Flush on tab/window blur so no data is lost on tab switch or close
  useEffect(() => {
    function handleBlur() { if (dirtyRows.current.size > 0) flushDirty(); }
    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBlur);
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", handleBlur);
    };
  }, []);

  const filtered = rows.filter(row => {
    const matchesPortfolio = portfolio === "All" || row.portfolio === portfolio;
    // Search spans the whole record — finding a row by a value the current view hides is useful.
    const matchesSearch = !search || Object.values(row).some(v => v.toLowerCase().includes(search.toLowerCase()));
    // Column filters only apply while their column is visible, so a filter set in one
    // view never silently hides rows in the other.
    const matchesFilters = cols.every(col => {
      const sel = colFilters[col.key];
      return !sel || sel.length === 0 || sel.includes(row[col.key]);
    });
    return matchesPortfolio && matchesSearch && matchesFilters;
  });

  const distinctValues = (key: keyof Idea) =>
    Array.from(new Set(rows.map(r => r[key]).filter(v => v !== ""))).sort((a, b) => a.localeCompare(b));

  function toggleFilterValue(key: keyof Idea, value: string) {
    setColFilters(prev => {
      const cur = prev[key] ?? [];
      const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value];
      return { ...prev, [key]: next };
    });
  }

  const activeFilterCount = cols.filter(c => (colFilters[c.key]?.length ?? 0) > 0).length;

  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const av = (a as any)[sortCol] as string;
        const bv = (b as any)[sortCol] as string;
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      })
    : filtered;

  const draftIndex = sorted.length;
  const totalRows = sorted.length + 1;

  // sortedRef lets the row-leave effect resolve UIDs without capturing a stale closure.
  const sortedRef = useRef(sorted);
  sortedRef.current = sorted; // update synchronously every render — no effect needed

  // Track previous active UID (not index) so flush survives tab/sort/filter changes.
  const prevActiveUid = useRef<string | null>(null);
  useEffect(() => {
    const curUid =
      active !== null && active.r !== draftIndex
        ? sortedRef.current[active.r]?.uid ?? null
        : null;
    const prevUid = prevActiveUid.current;
    if (prevUid !== curUid) {
      prevActiveUid.current = curUid;
      if (prevUid && dirtyRows.current.has(prevUid)) flushDirty([prevUid]);
    }
  }, [active?.r]);

  // Keep keyboard focus on the grid whenever a cell is selected but not being edited.
  useEffect(() => {
    if (active && !isEditing) gridRef.current?.focus();
  }, [active, isEditing]);

  function commitValue(r: number, c: number, val: string) {
    const key = cols[c].key;
    if (r === draftIndex) {
      const next = { ...draft, [key]: val };
      const trimmedUid = next.uid.trim();
      if (trimmedUid) {
        if (rowsRef.current.some(r => r.uid === trimmedUid)) {
          toast.error(`UID ${trimmedUid} already exists`, { description: "Choose a unique UID." });
          setDraft(next);
          return;
        }
        setRows(prev => [...prev, next]);
        setDraft(emptyDraft);
        toast.success(`Added idea ${next.uid}`);
        markDirty(next.uid); // new rows persist through the same dirty-row flush strategy
      } else {
        setDraft(next);
      }
    } else {
      const target = sorted[r];
      if (target && !isLocked(target)) {
        if (key === "uid") {
          const trimmedUid = val.trim();
          if (trimmedUid !== target.uid && rowsRef.current.some(r => r.uid === trimmedUid)) {
            toast.error(`UID ${trimmedUid} already exists`, { description: "Choose a unique UID." });
            return;
          }
        }
        setRows(prev => prev.map(row => (row.uid === target.uid ? { ...row, [key]: val } : row)));
        markDirty(target.uid);
      }
    }
  }

  function move(dr: number, dc: number) {
    setActive(a => {
      const base = a ?? { r: 0, c: 0 };
      return { r: clamp(base.r + dr, 0, totalRows - 1), c: clamp(base.c + dc, 0, cols.length - 1) };
    });
    setIsEditing(false);
  }

  function startEdit(withSeed: string) {
    setSeed(withSeed);
    setIsEditing(true);
  }

  function currentValue(r: number, c: number) {
    const key = cols[c].key;
    return r === draftIndex ? draft[key] : (sorted[r]?.[key] ?? "");
  }

  // A grid position is locked when it sits on a locked (Funded) record. The draft row is never locked.
  function isLockedAt(r: number) {
    return r !== draftIndex && !!sorted[r] && isLocked(sorted[r]);
  }

  // Throttle the lock toast so hammering keys / repeated clicks don't stack notifications.
  const lockToastAt = useRef(0);
  function notifyLocked() {
    const now = Date.now();
    if (now - lockToastAt.current < 1500) return;
    lockToastAt.current = now;
    toast("This idea is locked", { description: LOCK_REASON, icon: <Lock size={15} /> });
  }

  function onGridKeyDown(e: React.KeyboardEvent) {
    if (isEditing || !active) return;
    const { r, c } = active;
    if (e.key === "ArrowUp") { e.preventDefault(); move(-1, 0); }
    else if (e.key === "ArrowDown") { e.preventDefault(); move(1, 0); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); move(0, -1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); move(0, 1); }
    else if (e.key === "Tab") {
      e.preventDefault();
      if (c < cols.length - 1) move(0, 1);
      else setActive({ r: clamp(r + 1, 0, totalRows - 1), c: 0 });
    }
    // Any key that would enter edit / clear a locked row is intercepted with an explanation.
    else if (isLockedAt(r) && (e.key === "Enter" || e.key === "F2" || e.key === "Delete" || e.key === "Backspace" || (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey))) {
      e.preventDefault();
      notifyLocked();
    }
    else if (e.key === "Enter" || e.key === "F2") { e.preventDefault(); startEdit(currentValue(r, c)); }
    else if ((e.key === "Delete" || e.key === "Backspace") && r !== draftIndex) { e.preventDefault(); commitValue(r, c, ""); }
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { startEdit(e.key); }
  }

  function handleCommit(r: number, c: number, val: string, dir: MoveDir) {
    commitValue(r, c, val);
    setIsEditing(false);
    if (dir === "down") setActive({ r: clamp(r + 1, 0, totalRows - 1), c });
    else if (dir === "right") setActive({ r, c: clamp(c + 1, 0, cols.length - 1) });
  }

  function duplicateRow(row: Idea) {
    let newUid = `${row.uid}-copy`;
    let n = 2;
    while (rows.some(r => r.uid === newUid)) newUid = `${row.uid}-copy${n++}`;
    setRows(prev => [...prev, { ...row, uid: newUid }]);
    toast.success(`Duplicated ${row.uid}`);
  }

  function deleteRow(row: Idea) {
    setRows(prev => prev.filter(r => r.uid !== row.uid));
    toast(`Deleted ${row.uid}`, { description: "Row removed from the list." });
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ fontFamily: "'Open Sans', sans-serif", backgroundColor: "#f5f5f7" }}>
      <style>{`
        /* Materialize: blur + scale settle together so the surface reads as a material arriving. */
        @keyframes popIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.97); filter: blur(2px); }
          to   { opacity: 1; transform: translateY(0) scale(1);    filter: blur(0); }
        }
        .pop-in { animation: popIn 0.16s cubic-bezier(0.16, 1, 0.3, 1); transform-origin: top right; }

        /* View swap: the incoming columns arrive from the side the tab moved toward, so the
           tab strip and the content agree about direction. --enter carries the sign.
           The UID column never gets this class — it's the spine the rows are identified by,
           and animating it would claim something changed that didn't. */
        @keyframes colEnter {
          from { opacity: 0; transform: translateX(var(--enter, 24px)); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .col-enter { animation: colEnter 0.38s cubic-bezier(0.16, 1, 0.3, 1) backwards; }

        /* §14 Reduced motion — swap material/spring motion for a gentle cross-fade, drop transforms. */
        @media (prefers-reduced-motion: reduce) {
          @keyframes popIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .pop-in { animation: popIn 0.12s ease; }
          @keyframes colEnter {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .col-enter { animation: colEnter 0.14s ease backwards; }
          *, *::before, *::after {
            transition-property: opacity, color, background-color, border-color !important;
            transition-duration: 0.12s !important;
            animation-duration: 0.12s !important;
          }
        }

        /* §14 Reduced transparency — make blurred chrome solid. */
        @media (prefers-reduced-transparency: reduce) {
          .chrome-blur { backdrop-filter: none !important; background-color: rgb(243 244 246) !important; }
        }

        /* §14 Increased contrast — give floating surfaces a defined border. */
        @media (prefers-contrast: more) {
          .surface-pop { border-color: rgba(17, 24, 39, 0.55) !important; }
        }
      `}</style>
      <Toaster position="bottom-right" richColors />

      {/* Sidebar */}
      <aside
        className="flex flex-col items-center pt-5 pb-5 shrink-0"
        style={{
          width: 80,
          background: `linear-gradient(180deg, #0f3272 0%, ${NAVY_DARK} 100%)`,
          boxShadow: "1px 0 0 rgba(0,0,0,0.12)",
        }}
      >
        {/* Logo mark */}
        <div
          className="flex items-center justify-center rounded-[14px] text-white font-bold select-none mb-7"
          style={{
            width: 44, height: 44,
            background: "rgba(255,255,255,0.14)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 8px rgba(0,0,0,0.18)",
            fontSize: 11.5,
            letterSpacing: "0.05em",
          }}
        >
          Alcon
        </div>

        {/* Nav */}
        <nav className="flex flex-col items-center gap-0.5 w-full px-2">
          {[
            { icon: <Home size={19} strokeWidth={1.7} />, label: "Home", active: true },
            { icon: <FileText size={19} strokeWidth={1.7} />, label: "Ideas", active: false },
            { icon: <HelpCircle size={19} strokeWidth={1.7} />, label: "Help", active: false },
          ].map(item => (
            <button
              key={item.label}
              className={`flex flex-col items-center gap-1 w-full py-2.5 rounded-xl transition-all duration-150 active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                item.active
                  ? "text-white bg-white/[0.15] shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                  : "text-white/45 hover:text-white/80 hover:bg-white/[0.07]"
              }`}
            >
              {item.icon}
              <span className="text-[9.5px] font-medium tracking-[0.02em]">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User identity */}
        <div className="flex-1" />
        <div className="flex flex-col items-center gap-1">
          <div
            className="flex items-center justify-center rounded-full text-white font-semibold select-none"
            style={{
              width: 34, height: 34,
              background: "rgba(255,255,255,0.18)",
              fontSize: 13,
              letterSpacing: "-0.01em",
              boxShadow: "0 0 0 2px rgba(255,255,255,0.1)",
            }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <span className="text-[9.5px] font-medium text-white/65 mt-0.5 tracking-[0.01em]">{currentUser.name}</span>
        </div>
      </aside>

      <PortfolioPanel
        rows={rows}
        active={portfolio}
        open={panelOpen}
        onSelect={p => { setPortfolio(p); setActive(null); setIsEditing(false); }}
        onToggle={() => setPanelOpen(o => !o)}
      />

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden flex flex-col px-8 pt-7 pb-4 gap-4">

          {/* Page header */}
          <div className="flex items-center justify-between gap-4 shrink-0">
            <div>
              <h2 className="text-[24px] font-semibold text-gray-900 tracking-[-0.022em] leading-tight">Ideas List</h2>
              <p className="text-[13px] mt-0.5 font-normal" style={{ color: "#8e8e93" }}>
                {portfolio === "All" ? "All portfolios" : portfolio}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8e8e93" }} />
                <input
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-[30px] pr-3 h-[34px] w-52 rounded-[10px] text-[13px] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#0d2d6b]/30 transition-all duration-150"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.05)",
                    border: "none",
                    color: "#1c1c1e",
                  }}
                />
              </div>
              {/* Export */}
              <button
                onClick={() => toast.success("Export started", { description: `${rows.length} ideas exported.` })}
                className="flex items-center gap-1.5 h-[34px] px-4 rounded-[10px] text-[13px] font-medium active:scale-[0.97] transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30"
                style={{
                  backgroundColor: NAVY,
                  color: "white",
                  boxShadow: "0 1px 3px rgba(13,45,107,0.35), 0 1px 0 rgba(255,255,255,0.08) inset",
                }}
              >
                <Upload size={12} strokeWidth={2.2} />
                Export
              </button>
            </div>
          </div>

          {/* Tabs row */}
          <div className="shrink-0">
            <div className="relative inline-flex items-center gap-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
              {VIEWS.map((v, i) => (
                <button
                  key={v}
                  ref={el => { tabRefs.current[i] = el; }}
                  onClick={() => switchView(v)}
                  className={`flex items-center gap-1.5 px-4 py-[9px] text-[13.5px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30 ${
                    pendingView === v ? "font-semibold text-[#0d2d6b]" : "font-medium text-[#8e8e93] hover:text-gray-700"
                  }`}
                >
                  {v}
                  <span
                    className={`text-[10.5px] px-[6px] py-px rounded-full font-semibold tabular-nums transition-all duration-150 ${
                      pendingView === v ? "text-white" : "bg-gray-100/80 text-gray-400"
                    }`}
                    style={pendingView === v ? { backgroundColor: NAVY } : {}}
                  >
                    {VIEW_KEYS[v].length}
                  </span>
                </button>
              ))}
              <span
                aria-hidden
                className="absolute bottom-0 rounded-full"
                style={{
                  left: tabIndicator.left,
                  width: tabIndicator.width,
                  height: 2,
                  backgroundColor: NAVY,
                  transform: "translateY(50%)",
                  transition: "left 0.32s cubic-bezier(.16,1,.3,1), width 0.32s cubic-bezier(.16,1,.3,1)",
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div
            ref={gridRef}
            tabIndex={0}
            onKeyDown={onGridKeyDown}
            className="flex-1 overflow-auto bg-white rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/20 transition-shadow"
            style={{
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <div
              key={view}
              style={{ "--enter": `${dir * 28}px` } as React.CSSProperties}
            >
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="chrome-blur sticky top-0 z-20 backdrop-blur-sm" style={{ backgroundColor: "rgba(249,249,251,0.92)", boxShadow: "0 1px 0 rgba(0,0,0,0.07)" }}>
                  {cols.map((col, ci) => {
                    const selected = colFilters[col.key] ?? [];
                    const isFiltered = selected.length > 0;
                    const sw = swapProps(ci);
                    return (
                      <th
                        key={col.key}
                        className={`${sw.swapClass} text-left px-4 py-[10px] text-[10px] font-semibold tracking-[0.08em] uppercase select-none whitespace-nowrap border-r relative`}
                        style={{ ...sw.swapStyle, color: "#8e8e93", borderColor: "rgba(0,0,0,0.06)" }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <button
                            onClick={() => handleSort(col.key)}
                            className={`flex items-center hover:text-gray-700 transition-colors duration-150 cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30 ${sortCol === col.key ? "text-[#0d2d6b]" : ""}`}
                          >
                            {col.label}
                            <SortIcon dir={sortCol === col.key ? sortDir : null} />
                          </button>
                          <button
                            onClick={() => setOpenFilter(o => (o === col.key ? null : col.key))}
                            title="Filter column"
                            className={`p-[3px] rounded-md transition-all duration-100 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30 ${isFiltered ? "text-[#0d2d6b] bg-[#0d2d6b]/8" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                          >
                            <Filter size={12} fill={isFiltered ? "currentColor" : "none"} />
                          </button>
                        </div>

                        {openFilter === col.key && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setOpenFilter(null)} />
                            <div className="pop-in surface-pop absolute right-0 top-full mt-1.5 z-40 w-56 rounded-[14px] py-1 normal-case tracking-normal font-normal"
                              style={{
                                backgroundColor: "rgba(255,255,255,0.92)",
                                backdropFilter: "blur(20px) saturate(180%)",
                                border: "1px solid rgba(0,0,0,0.1)",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
                              }}
                            >
                              <div className="flex items-center justify-between px-3.5 py-2 border-b border-gray-100">
                                <span className="text-[11.5px] font-semibold text-gray-600">Filter by {col.label.toLowerCase()}</span>
                                {isFiltered && (
                                  <button
                                    onClick={() => setColFilters(prev => ({ ...prev, [col.key]: [] }))}
                                    className="text-[11.5px] font-medium text-[#0d2d6b] hover:opacity-70 transition-opacity duration-100 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                              <div className="max-h-52 overflow-auto py-1">
                                {distinctValues(col.key).length === 0 && (
                                  <div className="px-3.5 py-2.5 text-[12px] text-gray-400">No values</div>
                                )}
                                {distinctValues(col.key).map(val => {
                                  const checked = selected.includes(val);
                                  return (
                                    <button
                                      key={val}
                                      onClick={() => toggleFilterValue(col.key, val)}
                                      className="flex items-center gap-2.5 w-full text-left px-3.5 py-[7px] text-[13px] text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0d2d6b]/30"
                                    >
                                      <span className={`flex items-center justify-center w-[15px] h-[15px] rounded-[4px] border transition-all duration-100 ${checked ? "text-white border-[#0d2d6b]" : "border-gray-300"}`}
                                        style={checked ? { backgroundColor: NAVY } : {}}>
                                        {checked && <Check size={9.5} strokeWidth={3} />}
                                      </span>
                                      {val}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </th>
                    );
                  })}
                  <th className="w-[64px]" style={{ borderColor: "rgba(0,0,0,0.06)" }} />
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, ri) => {
                  const rowLocked = isLocked(row);
                  return (
                  <tr
                    key={`${row.uid}-${ri}`}
                    className={`group transition-colors duration-100 ${
                      rowLocked ? "bg-[#fafafa]" : ri % 2 === 1 ? "bg-[#fafafa]/60" : "bg-white"
                    } ${rowLocked ? "hover:bg-gray-100/50" : "hover:bg-[#eef2fa]"}`}
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                  >
                    {cols.map((col, ci) => {
                      const isSaving = savingSet.has(row.uid);
                      const isDirty = dirtySet.has(row.uid);
                      const indicator = ci === 0
                        ? isSaving ? "saving" : isDirty ? "dirty" : null
                        : null;
                      return (
                        <GridCell
                          key={col.key}
                          col={col}
                          value={row[col.key]}
                          locked={rowLocked}
                          {...swapProps(ci)}
                          active={active?.r === ri && active?.c === ci}
                          editing={isEditing && active?.r === ri && active?.c === ci}
                          seed={seed}
                          indicator={indicator}
                          onSelect={() => { setActive({ r: ri, c: ci }); setIsEditing(false); }}
                          onStartEdit={() => { setActive({ r: ri, c: ci }); startEdit(row[col.key]); }}
                          onCommit={(v, dir) => handleCommit(ri, ci, v, dir)}
                          onCancel={() => setIsEditing(false)}
                          onLocked={() => { setActive({ r: ri, c: ci }); notifyLocked(); }}
                        />
                      );
                    })}
                    <td className="px-2 py-[10px] whitespace-nowrap">
                      <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                        <RowMenu
                          row={row}
                          locked={rowLocked}
                          onEdit={r => { setActive({ r: ri, c: 0 }); startEdit(r[cols[0].key]); }}
                          onViewDetails={r => { setHistoryRow(null); setDetailRow(r); }}
                          onViewHistory={r => { setDetailRow(null); setHistoryRow(r); }}
                          onDuplicate={duplicateRow}
                          onDelete={deleteRow}
                        />
                      </div>
                    </td>
                  </tr>
                  );
                })}

                {/* Draft / add row */}
                <tr className="bg-white" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                  {cols.map((col, ci) => (
                    <GridCell
                      key={col.key}
                      col={col}
                      value={draft[col.key]}
                      {...swapProps(ci)}
                      placeholder={ci === 0 ? "+ Add new idea…" : ""}
                      active={active?.r === draftIndex && active?.c === ci}
                      editing={isEditing && active?.r === draftIndex && active?.c === ci}
                      seed={seed}
                      onSelect={() => { setActive({ r: draftIndex, c: ci }); setIsEditing(false); }}
                      onStartEdit={() => { setActive({ r: draftIndex, c: ci }); startEdit(draft[col.key]); }}
                      onCommit={(v, dir) => handleCommit(draftIndex, ci, v, dir)}
                      onCancel={() => setIsEditing(false)}
                    />
                  ))}
                  <td />
                </tr>
              </tbody>
            </table>
            </div>
          </div>

          {/* Footer status bar */}
          <div className="flex items-center justify-between text-[12px] px-0.5 shrink-0" style={{ color: "#8e8e93" }}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setActive({ r: draftIndex, c: 0 }); startEdit(""); }}
                className="flex items-center gap-1.5 font-semibold transition-all duration-100 hover:opacity-70 active:scale-95 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30"
                style={{ color: NAVY }}
              >
                <Plus size={12} strokeWidth={2.5} />
                Add row
              </button>
              <span className="text-gray-400/80">
                {sorted.length} {sorted.length === 1 ? "idea" : "ideas"}
                {(portfolio !== "All" || search || activeFilterCount > 0) && ` — filtered from ${rows.length}`}
                {activeFilterCount > 0 && ` · ${activeFilterCount} ${activeFilterCount === 1 ? "filter" : "filters"} active`}
              </span>
            </div>
            <span className="text-gray-400 text-[11.5px]">Double-click or type to edit · Tab / Enter to move · Del to clear</span>
          </div>

        </main>
      </div>

      <IdeaDetailPanel
        row={detailRow}
        onClose={() => setDetailRow(null)}
        onEdit={r => { setActive({ r: 0, c: 0 }); startEdit(r[cols[0].key]); }}
      />
      <IdeaHistoryPanel
        row={historyRow}
        onClose={() => setHistoryRow(null)}
      />
    </div>
  );
}
