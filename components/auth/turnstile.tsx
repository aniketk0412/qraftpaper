"use client";

import Script from "next/script";

// Cloudflare Turnstile bot check. Renders only when a site key is configured,
// so the form works normally in dev / before keys are set. On load, Turnstile
// injects a hidden `cf-turnstile-response` input into the surrounding <form>,
// which the signup server action verifies.
export function Turnstile() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-theme="auto"
        data-size="flexible"
      />
    </>
  );
}
