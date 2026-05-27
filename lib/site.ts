export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://qraftpaper.vercel.app";

export const siteConfig = {
  name: "QraftPaper",
  title: "QraftPaper — AI Question Paper Generation, Engineered",
  description:
    "QraftPaper turns your syllabus, past papers and weightages into exam-ready question papers and quizzes. Enterprise-grade AI for institutions and educators.",
  url: siteUrl,
} as const;
