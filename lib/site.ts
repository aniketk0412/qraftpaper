export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://qraftpaper.vercel.app";

// Single support inbox shown across footer, legal pages and the about page.
// Override via env before production if this inbox is not owned.
export const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@qraftpaper.app";

export const siteConfig = {
  name: "QraftPaper",
  title: "QraftPaper — AI mock papers from your syllabus",
  description:
    "Upload your syllabus and last year's question paper. QraftPaper generates structured mock exam papers and timed MCQ quizzes so you can practise instead of pretending to study.",
  url: siteUrl,
  supportEmail,
} as const;
