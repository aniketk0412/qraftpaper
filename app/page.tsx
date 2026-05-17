import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/landing/hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { Stats } from "@/components/landing/stats";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { PaperShowcase } from "@/components/landing/paper-showcase";
import { Quiz } from "@/components/landing/quiz";
import { Testimonials } from "@/components/landing/testimonials";
import { Pricing } from "@/components/landing/pricing";
import { Faq } from "@/components/landing/faq";
import { Cta } from "@/components/landing/cta";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <TrustStrip />
        <Stats />
        <HowItWorks />
        <Features />
        <PaperShowcase />
        <Quiz />
        <Testimonials />
        <Pricing />
        <Faq />
        <Cta />
      </main>
      <SiteFooter />
    </>
  );
}
