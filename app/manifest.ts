import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QraftPaper - AI Question Paper Generation",
    short_name: "QraftPaper",
    description:
      "Turn text-based syllabi, previous-year papers and weightages into review-ready question papers and quizzes.",
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
