export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://qraftpaper.vercel.app";

// Single support inbox shown across footer, legal pages and the about page.
// Override via env before production if this inbox is not owned.
export const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@qraftpaper.app";

export const siteConfig = {
  name: "QraftPaper",
  title: "QraftPaper - AI Question Paper Generation",
  description:
    "QraftPaper turns text-based syllabi, past papers and weightages into exam-ready question papers and quizzes for educators.",
  url: siteUrl,
  supportEmail,
} as const;
