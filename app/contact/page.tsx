import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { siteUrl, supportEmail } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact - QraftPaper",
  description:
    "Get in touch with the QraftPaper team. Email us for support, bug reports, billing questions, privacy and data requests, or partnership enquiries.",
  alternates: { canonical: "/contact" },
};

const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": `${siteUrl}/contact`,
  url: `${siteUrl}/contact`,
  name: "Contact QraftPaper",
  description:
    "Reach the QraftPaper team for support, bug reports, billing, and privacy requests.",
  mainEntity: {
    "@type": "Organization",
    name: "QraftPaper",
    url: siteUrl,
    email: supportEmail,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: supportEmail,
      availableLanguage: ["English"],
    },
  },
};

function MailLink() {
  return (
    <a
      className="text-accent transition-colors hover:text-accent-soft"
      href={`mailto:${supportEmail}`}
    >
      {supportEmail}
    </a>
  );
}

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <LegalPage eyebrow="Get in touch" title="Contact us">
        <LegalSection heading="Email us">
          <p>
            QraftPaper is run by a small team. The fastest way to reach a human
            is email — we read every message that comes in at <MailLink />.
            There&apos;s no phone line and no chatbot; a person replies.
          </p>
          <p>
            To help us answer quickly, tell us what you were trying to do, what
            happened instead, and — if it&apos;s about a generated paper or
            quiz — the subject and the paper or quiz title.
          </p>
        </LegalSection>

        <LegalSection heading="Support & feedback">
          <p>
            Stuck on something, or have an idea that would make QraftPaper
            better for your exams? Email <MailLink /> with &ldquo;Support&rdquo;
            or &ldquo;Feature request&rdquo; in the subject. Feature requests
            from students genuinely shape what we build next.
          </p>
        </LegalSection>

        <LegalSection heading="Bug reports">
          <p>
            If something is broken — a paper won&apos;t generate, an export is
            malformed, a quiz scores wrong — send the details to <MailLink />.
            Include the page you were on and roughly when it happened so we can
            trace it in our logs.
          </p>
        </LegalSection>

        <LegalSection heading="Billing & subscriptions">
          <p>
            Payments are handled by Lemon Squeezy, our merchant of record. For
            invoices, refunds, payment-method changes or cancellations, you can
            use the customer portal linked in your receipt email, or write to{" "}
            <MailLink /> and we&apos;ll help sort it out.
          </p>
        </LegalSection>

        <LegalSection heading="Privacy & data requests">
          <p>
            To access, export or permanently delete the data tied to your
            account, email <MailLink /> from the address you signed up with. You
            can also delete your account and all its data yourself from{" "}
            <span className="text-fg">Settings → Danger zone</span>. See our{" "}
            <a
              className="text-accent transition-colors hover:text-accent-soft"
              href="/privacy"
            >
              Privacy Policy
            </a>{" "}
            for how we handle your information.
          </p>
        </LegalSection>

        <LegalSection heading="Response times">
          <p>
            We aim to reply within two business days. Privacy and billing
            requests are prioritised. If you haven&apos;t heard back after a few
            days, it&apos;s worth checking your spam folder and then emailing us
            again — occasionally replies get filtered.
          </p>
        </LegalSection>
      </LegalPage>
    </>
  );
}
