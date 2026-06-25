import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { examPapers } from "@/lib/exam-papers";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Programmatic SEO landing pages — one per catalogued subject. These target
  // the high-intent "<subject> previous year question paper" queries, so they
  // carry a higher priority than the static legal/auth pages.
  const examPaperRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/exam-papers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...examPapers.map((p) => ({
      url: `${siteUrl}/exam-papers/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/signup`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      // The interactive sample quiz is the strongest "try it now" entry
      // point — index it so SERP traffic can land directly on the demo
      // instead of bouncing through the homepage.
      url: `${siteUrl}/demo/quiz`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    ...examPaperRoutes,
  ];
}
