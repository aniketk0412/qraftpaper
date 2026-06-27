import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { supportEmail } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy — QraftPaper",
  description:
    "How QraftPaper collects, uses, shares, secures and retains your data, the cookies and storage we use, and the rights you have over your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" updated="May 2026">
      <LegalSection heading="Overview">
        <p>
          QraftPaper is a paid platform for educational institutions, operated by
          Aniket Kumbhar. This policy explains what we collect, why, how we
          protect and share it, and the choices you have. We collect only what we
          need to run the Service.
        </p>
      </LegalSection>

      <LegalSection heading="Information we collect">
        <p>
          <strong className="text-fg">Account data</strong> — your name, work
          email and institution, used to create and secure your workspace.
        </p>
        <p>
          <strong className="text-fg">Uploaded material</strong> — the syllabi,
          sample papers and previous-year papers you upload. We extract text to
          build a compact subject profile used for generation.
        </p>
        <p>
          <strong className="text-fg">Usage & technical data</strong> —
          generation activity, basic logs, IP address and device/browser
          information needed for security, billing and reliability.
        </p>
        <p>
          <strong className="text-fg">Billing data</strong> — handled by our
          payment processor; we do not store full card details.
        </p>
      </LegalSection>

      <LegalSection heading="How we use your data">
        <p>
          To generate papers and quizzes from your material, operate and secure
          your account, process billing, provide support, and improve
          reliability. We do not sell your personal data.
        </p>
      </LegalSection>

      <LegalSection heading="AI processing & model training">
        <p id="data-processing" className="scroll-mt-24">
          To generate content, the relevant text from your subject profile and
          your generation settings are sent to our AI provider to fulfil your
          request. Your papers, syllabi and uploads are{" "}
          <strong className="text-fg">never used to train any AI model</strong>,
          by us or by our providers for their own model training.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies & local storage">
        <p>
          We use a strictly-necessary <strong className="text-fg">session
          cookie</strong> to keep you signed in — no third-party advertising or
          tracking cookies.
        </p>
        <p>
          We also store small preferences in your browser&apos;s local storage:
          your <strong className="text-fg">theme choice</strong> and any{" "}
          <strong className="text-fg">custom blueprints</strong> you create.
          These stay on your device and are not sent to advertisers; clearing
          your browser storage removes them.
        </p>
      </LegalSection>

      <LegalSection heading="Third-party processors">
        <p>
          We share data only with service providers that help us run QraftPaper,
          under contracts that limit their use of it. These include providers for{" "}
          <strong className="text-fg">AI generation</strong>,{" "}
          <strong className="text-fg">cloud hosting</strong>,{" "}
          <strong className="text-fg">database storage</strong> and{" "}
          <strong className="text-fg">payment processing</strong>. We do not sell
          or rent your data to anyone.
        </p>
      </LegalSection>

      <LegalSection heading="International data transfers">
        <p>
          Our providers may process data in countries other than yours. Where
          required, we rely on appropriate safeguards for such transfers.
        </p>
      </LegalSection>

      <LegalSection heading="Security">
        <p id="security" className="scroll-mt-24">
          All uploads are encrypted in transit and at rest. Passwords are stored
          hashed, never in plain text. Access is limited to the people in your
          workspace, with login-attempt throttling and account lockout against
          brute force. No system is perfectly secure, but we work to protect
          your data and will notify affected users of a breach as required by
          law.
        </p>
      </LegalSection>

      <LegalSection heading="Data retention">
        <p>
          We keep your material and generated output for as long as your
          workspace is active. You can delete subjects and generated papers at
          any time; deletion removes the associated content from active systems.
          We may retain limited records where required for legal or billing
          purposes.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          Depending on where you live, you may have rights to access, correct,
          export, restrict or delete your personal data, and to object to certain
          processing. To make a request, contact{" "}
          <a
            className="text-accent transition-colors hover:text-accent-soft"
            href={`mailto:${supportEmail}`}
          >
            {supportEmail}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="Children's privacy">
        <p>
          QraftPaper is intended for use by educational institutions and their
          staff, not for direct use by children. We do not knowingly collect
          personal data from children outside an institution&apos;s authorised
          use.
        </p>
      </LegalSection>

      <LegalSection heading="Changes & contact">
        <p>
          We may update this policy; material changes will be communicated to
          workspace owners. Questions or requests? Email{" "}
          <a
            className="text-accent transition-colors hover:text-accent-soft"
            href={`mailto:${supportEmail}`}
          >
            {supportEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
