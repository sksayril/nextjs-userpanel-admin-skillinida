/** Standard Educational Qualification Options */
export const QUALIFICATION_OPTIONS = [
  "10th Standard (Secondary / Madhyamik)",
  "12th Standard (Higher Secondary / H.S.)",
  "Diploma / Vocational (ITI)",
  "Graduate / Bachelor's Degree (B.A / B.Sc / B.Com / B.Tech / BCA / etc.)",
  "Post Graduate / Master's Degree (M.A / M.Sc / M.Com / M.Tech / MCA / etc.)",
  "Doctorate / PhD / Higher",
  "Below 10th Standard",
  "Other Qualification"
] as const;

export type QualificationOption = (typeof QUALIFICATION_OPTIONS)[number];
