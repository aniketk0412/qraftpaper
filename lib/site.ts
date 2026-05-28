export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://qraftpaper.vercel.app";

// Single support inbox shown across footer, legal pages and the about page.
// Override via env so a working mail address can be swapped in without
// touching code; the default is the placeholder used at launch.
export const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@qraftpaper.app";

export const siteConfig = {
  name: "QraftPaper",
  title: "QraftPaper — AI Question Paper Generation, Engineered",
  description:
    "QraftPaper turns your syllabus, past papers and weightages into exam-ready question papers and quizzes. Enterprise-grade AI for institutions and educators.",
  url: siteUrl,
  supportEmail,
} as const;
