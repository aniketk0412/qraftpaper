import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QraftPaper — AI mock papers for students",
    short_name: "QraftPaper",
    description:
      "Upload your syllabus + last year's question paper. Get mock exam papers and timed MCQ quizzes to actually practise on.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#e8ecf0",
    theme_color: "#2d8b8b",
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
        // "any" — the apple-icon centers the Q mark with no safe-zone padding,
        // so declaring it "maskable" would let Android crop the logo on round
        // adaptive icons. Use "any" until a properly padded variant exists.
        purpose: "any",
      },
    ],
  };
}
