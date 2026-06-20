import Script from "next/script";

/**
 * Google AdSense loader. Renders nothing until NEXT_PUBLIC_ADSENSE_CLIENT is
 * set (e.g. "ca-pub-1234567890123456"), so the site ships with zero ad code by
 * default and goes live the moment the env var is added in Vercel — no code
 * change, no redeploy of source. The matching ads.txt route and the CSP
 * allowances in next.config.ts are gated on the same variable.
 */
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export function AdSense() {
  if (!ADSENSE_CLIENT) {
    return null;
  }

  return (
    <Script
      id="adsbygoogle-loader"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  );
}
