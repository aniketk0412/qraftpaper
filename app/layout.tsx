import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import { MotionConfig } from "motion/react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { SiteBackground } from "@/components/effects/site-background";
import { UpdatePrompt } from "@/components/update-prompt";
import { RouteProgress } from "@/components/route-progress";
import { AdSense } from "@/components/adsense";
import { siteConfig, siteUrl } from "@/lib/site";

// Editorial Print type system, all self-hosted via next/font (no runtime CDN
// fetch). Three deliberate roles, each exposed as a CSS variable that the
// @theme tokens in globals.css read:
//   --font-app       Plus Jakarta Sans → body copy (font-sans)
//   --font-editorial Source Serif 4    → headings   (font-serif), set as the
//                                        default h1–h4 family in globals.css
//   --font-data      IBM Plex Mono     → data/labels (font-mono): "70 marks",
//                                        "Unit I", uppercase eyebrows
// To swap any role, change just its import + variable here.
const sans = Plus_Jakarta_Sans({
  variable: "--font-app",
  subsets: ["latin"],
  display: "swap",
});

const serif = Source_Serif_4({
  variable: "--font-editorial",
  subsets: ["latin"],
  display: "swap",
});

// IBM Plex Mono is not a variable font, so next/font requires explicit weights.
const mono = IBM_Plex_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteConfig.title,
  description: siteConfig.description,
  applicationName: "QraftPaper",
  keywords: [
    "mock exam paper generator",
    "AI study tool for students",
    "MCQ quiz generator from syllabus",
    "practice paper from previous year",
    "college exam prep",
    "syllabus to mock paper",
    "PYQ question paper generator",
    "AI test prep",
    "engineering exam practice papers",
  ],
  authors: [{ name: "QraftPaper" }],
  creator: "QraftPaper",
  publisher: "QraftPaper",
  category: "education",
  // Don't set a global canonical — that would tell search engines every page
  // is a duplicate of "/". Per-page metadata can set its own canonical when
  // we have one to declare; otherwise Next.js leaves the URL canonical to
  // itself.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "QraftPaper",
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteUrl,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  appleWebApp: {
    capable: true,
    title: "QraftPaper",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e8ecf0" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1620" },
  ],
  colorScheme: "light dark",
};

// Runs before paint so the theme is applied without a flash: stored choice
// wins, otherwise fall back to the visitor's OS colour-scheme preference.
const themeScript = `(function(){try{var t=localStorage.getItem('qp-theme');if(t!=='dark'&&t!=='light'){t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light';}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${serif.variable} ${mono.variable} antialiased`}
    >
      <body className="min-h-screen bg-canvas text-fg">
        {/* Preconnect to the third-party hosts our app talks to on first
         * paint. React 19 hoists these <link> tags into <head>. PostHog is
         * loaded as soon as the client provider mounts, so warming the TLS
         * + DNS path saves ~80-150 ms on the first event POST. We do NOT
         * preconnect to LemonSqueezy because it only matters at /billing
         * checkout click (a navigation that already inherits its own
         * connection cost), and we don't preconnect to Google Fonts —
         * next/font self-hosts the woff2's at build, no runtime CDN fetch. */}
        <link rel="preconnect" href="https://us.i.posthog.com" />
        <link rel="dns-prefetch" href="https://us-assets.i.posthog.com" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <RouteProgress />
        <PostHogProvider>
          <MotionConfig reducedMotion="user">
            <SiteBackground />
            <SmoothScroll>
              <div className="relative z-10">{children}</div>
            </SmoothScroll>
          </MotionConfig>
        </PostHogProvider>
        <UpdatePrompt />
        <AdSense />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
