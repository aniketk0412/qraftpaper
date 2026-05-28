import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { MotionConfig } from "motion/react";
import "./globals.css";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { SiteBackground } from "@/components/effects/site-background";
import { CursorGlow } from "@/components/effects/cursor-glow";
import { siteConfig, siteUrl } from "@/lib/site";

// Self-hosted via next/font — Inter for the SaaS-modern body/headline feel
// (Söhne / GT America class, closest free equivalent on Google Fonts), with
// JetBrains Mono for monospace eyebrow labels and code-like text.
const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteConfig.title,
  description: siteConfig.description,
  applicationName: "QraftPaper",
  keywords: [
    "question paper generator",
    "AI exam paper",
    "quiz generator",
    "MCQ generator",
    "syllabus to exam",
    "previous year papers",
    "assessment design",
    "education AI",
    "exam blueprint",
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
      className={`${sans.variable} ${mono.variable} antialiased`}
    >
      <body className="min-h-screen bg-canvas text-fg">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <MotionConfig reducedMotion="user">
          <SiteBackground />
          <CursorGlow />
          <SmoothScroll>
            <div className="relative z-10">{children}</div>
          </SmoothScroll>
        </MotionConfig>
      </body>
    </html>
  );
}
