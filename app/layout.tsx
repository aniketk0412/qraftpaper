import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MotionConfig } from "motion/react";
import "./globals.css";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { SiteBackground } from "@/components/effects/site-background";
import { CursorGlow } from "@/components/effects/cursor-glow";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QraftPaper — AI Question Paper Generation, Engineered",
  description:
    "QraftPaper turns your syllabus, past papers and weightages into exam-ready question papers. Enterprise-grade AI for institutions and educators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-canvas text-fg">
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
