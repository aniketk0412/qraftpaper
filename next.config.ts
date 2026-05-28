import type { NextConfig } from "next";

// Content-Security-Policy tuned to exactly what the app loads:
//  - self-hosted Geist fonts (next/font bundles them at build, no Google CDN)
//  - two inline <script> tags (theme bootstrap + JSON-LD) → 'unsafe-inline'
//  - Cloudflare Turnstile widget (script + iframe) on signup
//  'unsafe-eval' is kept because the Next.js dev/runtime client uses it; the
//  rest of the policy still blocks foreign script/style origins, object/embed,
//  framing of this app, and <base>/form hijacking.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src 'self' https://challenges.cloudflare.com",
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
  serverExternalPackages: ["pdf-parse"],
  async headers() {
    // Keep authenticated/private surfaces out of search indexes — these hold
    // user papers, billing and account data, not marketing pages. Two sources
    // per route so both the base path and any sub-path are covered.
    const privateRoots = ["dashboard", "papers", "billing", "account"];
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

export default nextConfig;
