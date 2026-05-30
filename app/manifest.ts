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
    // Shortcuts surface on long-press of the home-screen icon on Android
    // (and on macOS / Windows for installed PWAs). Three high-intent entry
    // points so a returning user can skip the landing/dashboard and jump
    // straight to the action they came back to do. Same primary-purple icon
    // as the main app — long-press menus generally show monochrome anyway.
    shortcuts: [
      {
        name: "Open dashboard",
        short_name: "Dashboard",
        description: "Jump straight to your study dashboard",
        url: "/dashboard",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: "New subject",
        short_name: "New subject",
        description: "Create a new subject and upload PYQs",
        url: "/dashboard/subjects/new",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: "Try a sample quiz",
        short_name: "Sample quiz",
        description: "Take a free MCQ quiz — no credits used",
        url: "/demo/quiz",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    ],
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
