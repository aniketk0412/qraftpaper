import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { PaperShowcase } from "@/components/landing/paper-showcase";
import { Quiz } from "@/components/landing/quiz";
import { Pricing } from "@/components/landing/pricing";
import { Faq } from "@/components/landing/faq";
import { Cta } from "@/components/landing/cta";
import { faqs } from "@/lib/faqs";
import { PLANS } from "@/lib/plans";
import { siteConfig, siteUrl } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "QraftPaper",
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
      description: siteConfig.description,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "QraftPaper",
      description: siteConfig.description,
      publisher: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: "QraftPaper",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: siteConfig.description,
      offers: {
        "@type": "Offer",
        // Entry tier price from the single source of truth — strip the "$" so
        // Schema.org sees a plain numeric string.
        price: PLANS.educator.price.replace(/[^0-9.]/g, ""),
        priceCurrency: "USD",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

// Explicit canonical for the home page; we removed the global one in the
// layout (it was making every page declare itself a duplicate of "/").
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const session = await auth();
  const signedIn = Boolean(session?.user);
  // Vercel injects the visitor's two-letter country code as a request header.
  // Used only for display-side currency formatting in the Pricing card —
  // billing itself stays in USD via LemonSqueezy.
  const country = (await headers()).get("x-vercel-ip-country") ?? undefined;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteNav signedIn={signedIn} />
      <main>
        <Hero signedIn={signedIn} />
        <HowItWorks signedIn={signedIn} />
        <Features />
        <PaperShowcase />
        <Quiz signedIn={signedIn} />
        <Pricing country={country} signedIn={signedIn} />
        <Faq />
        <Cta signedIn={signedIn} />
      </main>
      <SiteFooter />
    </>
  );
}
