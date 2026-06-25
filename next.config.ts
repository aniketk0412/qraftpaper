import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

// ANALYZE=true npm run build → opens a treemap of every chunk in the
// bundle. Use it before adding heavy dependencies and after big refactors
// so the route bundles don't quietly creep into multi-megabyte territory.
// In normal builds this is a no-op (enabled flag is false).
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Content-Security-Policy tuned to exactly what the app loads:
//  - self-hosted Geist fonts (next/font bundles them at build, no Google CDN)
//  - two inline <script> tags (theme bootstrap + JSON-LD) → 'unsafe-inline'
//  - Cloudflare Turnstile widget (script + iframe) on signup
//  'unsafe-eval' is kept because the Next.js dev/runtime client uses it; the
//  rest of the policy still blocks foreign script/style origins, object/embed,
//  framing of this app, and <base>/form hijacking.
// Google AdSense needs its script, ad-iframe, pixel and beacon hosts
// allowlisted. These are added ONLY when AdSense is actually configured
// (NEXT_PUBLIC_ADSENSE_CLIENT set), so the default policy stays tight for a
// site that isn't serving ads yet.
const adsenseEnabled = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);
const adsHosts = {
  script:
    "https://pagead2.googlesyndication.com https://*.googlesyndication.com https://partner.googleadservices.com https://www.googletagservices.com https://adservice.google.com https://tpc.googlesyndication.com",
  img: "https://*.googlesyndication.com https://*.g.doubleclick.net https://www.google.com",
  connect:
    "https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.g.doubleclick.net https://www.google.com",
  frame:
    "https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com",
} as const;
const ads = (key: keyof typeof adsHosts) =>
  adsenseEnabled ? ` ${adsHosts[key]}` : "";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com${ads("script")}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${ads("img")}`,
  "font-src 'self' data:",
  `connect-src 'self' https://challenges.cloudflare.com${ads("connect")}`,
  `frame-src 'self' https://challenges.cloudflare.com${ads("frame")}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: ["pdf-parse"],
  // The PDF export routes read a vendored Unicode font (lib/export/fonts) at
  // runtime via fs. Output-file tracing can't see that dynamically-built path,
  // so include it explicitly or the font goes missing from the serverless
  // bundle on Vercel. (render.ts falls back to the built-in font if it's
  // absent, so a miss degrades gracefully rather than 500-ing — but we want it
  // present so the glyphs actually render.)
  outputFileTracingIncludes: {
    "/api/export/**": ["./lib/export/fonts/**"],
  },
  // A stable id for THIS build, inlined into both client and server bundles.
  // Each deploy gets a new value (git SHA on Vercel, else a build timestamp);
  // the update prompt compares the running app against /api/version to detect
  // that a newer version has shipped — the PWA "update available" signal
  // without a service worker.
  env: {
    NEXT_PUBLIC_BUILD_ID:
      process.env.VERCEL_GIT_COMMIT_SHA ??
      process.env.NEXT_PUBLIC_BUILD_ID ??
      `build-${Date.now()}`,
  },
  async headers() {
    // Keep authenticated/private surfaces out of search indexes — these hold
    // user papers, billing and account data, not marketing pages. Recovery
    // routes (forgot/reset-password) carry tokens in the URL, so they get
    // the same treatment via a robust X-Robots-Tag header.
    const privateRoots = [
      "dashboard",
      "papers",
      "billing",
      "account",
      "forgot-password",
      "reset-password",
    ];
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    const privateHeaders = privateRoots.flatMap((root) => [
      { source: `/${root}`, headers: noindex },
      { source: `/${root}/:path*`, headers: noindex },
    ]);

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      ...privateHeaders,
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
