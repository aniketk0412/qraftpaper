import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { supportEmail } from "@/lib/site";

export const metadata: Metadata = {
  title: "About - QraftPaper",
  description:
    "QraftPaper helps educators turn text-based syllabi, past papers and weightages into review-ready question papers.",
};

export default function AboutPage() {
  return (
    <LegalPage eyebrow="Company" title="About QraftPaper">
      <LegalSection heading="What we do">
        <p>
          QraftPaper turns a syllabus, sample papers and previous-year papers
          into review-ready question papers and quizzes. Educators set the
          structure, inspect the generated draft and keep final control before
          anything reaches students.
        </p>
      </LegalSection>

      <LegalSection heading="Who it's for">
        <p>
          Built for universities, colleges and examination boards. Educators set
          the blueprint; QraftPaper produces draft papers for review, with
          export to PDF and Word.
        </p>
      </LegalSection>

      <LegalSection heading="How we think about it">
        <p>
          <strong className="text-fg">Faithful to your format.</strong> Output
          follows the structure and style you configure.
        </p>
        <p>
          <strong className="text-fg">Private by default.</strong> Your material
          is encrypted and never used to train any model.
        </p>
        <p>
          <strong className="text-fg">Educator in control.</strong> Every
          generated paper is a reviewable draft - you have the final say.
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
          - we&apos;d love to help set up your workspace.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
