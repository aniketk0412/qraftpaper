import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { supportEmail } from "@/lib/site";

export const metadata: Metadata = {
  title: "About — QraftPaper",
  description:
    "QraftPaper is enterprise-grade AI for assessment design — turning syllabi, past papers and weightages into exam-ready question papers.",
};

export default function AboutPage() {
  return (
    <LegalPage eyebrow="Company" title="About QraftPaper">
      <LegalSection heading="What we do">
        <p>
          QraftPaper turns a syllabus, sample papers and previous-year papers
          into exam-ready question papers and quizzes — blueprint-accurate to
          your unit weightages, balanced for difficulty, and guarded against
          repeats. What used to take weeks of paper-setting takes minutes.
        </p>
      </LegalSection>

      <LegalSection heading="Who it's for">
        <p>
          Built for universities, colleges and examination boards. Educators set
          the blueprint; QraftPaper produces draft papers their examination
          board can trust, with one-click export to PDF and Word.
        </p>
      </LegalSection>

      <LegalSection heading="How we think about it">
        <p>
          <strong className="text-fg">Faithful to your format.</strong> Output
          mirrors the structure and style of your real papers.
        </p>
        <p>
          <strong className="text-fg">Private by default.</strong> Your material
          is encrypted and never used to train any model.
        </p>
        <p>
          <strong className="text-fg">Educator in control.</strong> Every
          generated paper is a reviewable draft — you have the final say.
        </p>
      </LegalSection>

      <LegalSection heading="Talk to us">
        <p>
          Email{" "}
          <a
            className="text-accent transition-colors hover:text-accent-soft"
            href={`mailto:${supportEmail}`}
          >
            {supportEmail}
          </a>{" "}
          — we&apos;d love to help set up your workspace.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
