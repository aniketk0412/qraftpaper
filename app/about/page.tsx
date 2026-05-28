import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { supportEmail } from "@/lib/site";

export const metadata: Metadata = {
  title: "About - QraftPaper",
  description:
    "QraftPaper is an AI exam-prep tool for college students. Upload your syllabus and last year's question paper, get mock exam papers and MCQ quizzes to practise on.",
};

export default function AboutPage() {
  return (
    <LegalPage eyebrow="Company" title="About QraftPaper">
      <LegalSection heading="What we do">
        <p>
          QraftPaper is an AI exam-prep tool for college students. Upload your
          syllabus and last year&apos;s question paper, and it generates mock
          exam papers and timed MCQ quizzes that look and feel like the real
          thing — so you can actually practise instead of re-reading notes.
        </p>
      </LegalSection>

      <LegalSection heading="Who it's for">
        <p>
          Engineering, medical, commerce, law and humanities students at Indian
          (and elsewhere) colleges who have exams coming up and want practice
          questions in the exact format of their real paper, not generic
          textbook prompts.
        </p>
      </LegalSection>

      <LegalSection heading="How we think about it">
        <p>
          <strong className="text-fg">Mirrors your real paper.</strong> Output
          follows the structure, marks split and difficulty mix of the PYQ
          you upload.
        </p>
        <p>
          <strong className="text-fg">Private by default.</strong> Your syllabus
          and uploads are encrypted and never used to train any model.
        </p>
        <p>
          <strong className="text-fg">It&apos;s a practice tool, not a teacher.</strong>{" "}
          AI questions are not guaranteed to be 100% correct. Cross-check with
          your textbook before relying on any answer.
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
          if you have a feature request, a bug, or your generated paper is
          straight-up wrong.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
