// Portfolio taxonomy. The abbreviations are what the side panel shows when collapsed.
export const PORTFOLIOS = [
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

export const PORTFOLIO_ABBR: Record<string, string> = {
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
