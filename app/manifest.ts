import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QraftPaper — AI Question Paper Generation",
    short_name: "QraftPaper",
    description:
      "Turn your syllabus, previous year papers and weightages into exam-ready question papers and quizzes.",
    id: "/",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#080808",
    orientation: "portrait-primary",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
