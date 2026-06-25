import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import PDFDocument from "pdfkit";

import type { QuestionPaper, Quiz } from "@/lib/types";

// PDFKit's built-in Helvetica is WinAnsi-only, so Unicode common in real exam
// papers — math relations/operators (≤ ≥ ≠ ∑ √ ∫ ∞ →), Greek (π θ λ μ), and
// super/subscripts — renders as missing glyphs. We register a vendored
// Liberation Sans TTF (SIL OFL, lib/export/fonts) which embeds the actual
// glyphs. Loaded once and cached; `null` means it couldn't be read, in which
// case we fall back to PDFKit's built-in fonts (today's behaviour) rather than
// fail the export. The font files are bundled on Vercel via
// outputFileTracingIncludes in next.config.ts.
interface FontSet {
  regular: string;
  bold: string;
}
// PDFKit's built-in faces — used when the vendored TTFs can't be read.
const BUILTIN_FONTS: FontSet = { regular: "Helvetica", bold: "Helvetica-Bold" };
const EMBEDDED_FONTS: FontSet = { regular: "body", bold: "body-bold" };

function loadFont(file: string): Buffer | null {
  try {
    return readFileSync(join(process.cwd(), "lib/export/fonts", file));
  } catch {
    return null;
  }
}

let cachedFonts: { regular: Buffer; bold: Buffer } | null | undefined;
function unicodeFonts(): { regular: Buffer; bold: Buffer } | null {
  if (cachedFonts !== undefined) return cachedFonts;
  const regular = loadFont("LiberationSans-Regular.ttf");
  const bold = loadFont("LiberationSans-Bold.ttf");
  cachedFonts = regular && bold ? { regular, bold } : null;
  return cachedFonts;
}

// Liberation Sans covers our target glyphs except the subscript digits
// (U+2080–2089). Map those to ASCII so e.g. "x₁" prints as "x1" instead of a
// missing-glyph box. Applied to PDF content only — DOCX/Word render subscripts
// natively. Superscripts (²³) and the rest of the math/Greek set ARE covered.
export function pdfSafe(text: string): string {
  return text.replace(/[₀-₉]/g, (c) =>
    String.fromCharCode(48 + (c.charCodeAt(0) - 0x2080)),
  );
}

export async function renderPaperPdf(paper: QuestionPaper) {
  return collectPdf((doc, fonts) => {
    doc.font(fonts.bold).fontSize(18).text(pdfSafe(paper.examTitle), {
      align: "center",
    });
    doc.moveDown(0.4);
    doc
      .font(fonts.regular)
      .fontSize(10)
      .text(pdfSafe(`${paper.course} | ${paper.subject} (${paper.subjectCode})`), {
        align: "center",
      });
    doc.text(`Duration: ${paper.durationMins} minutes | Marks: ${paper.totalMarks}`, {
      align: "center",
    });
    doc.moveDown();

    for (const section of paper.sections) {
      doc.font(fonts.bold).fontSize(13).text(pdfSafe(section.title));
      doc.font(fonts.regular).fontSize(10).text(pdfSafe(section.instruction));
      doc.moveDown(0.5);

      for (const question of section.questions) {
        doc
          .font(fonts.regular)
          .fontSize(10)
          .text(
            pdfSafe(`${question.number}. ${question.text} (${question.marks} marks)`),
            { continued: false },
          );
        doc
          .fontSize(8)
          .fillColor("#555")
          .text(
            pdfSafe(`${question.unit} | ${question.difficulty} | ${question.bloom}`),
          );
        doc.fillColor("#000").moveDown(0.45);
      }

      doc.moveDown(0.5);
    }
  });
}

export async function renderQuizPdf(quiz: Quiz) {
  return collectPdf((doc, fonts) => {
    doc.font(fonts.bold).fontSize(18).text(pdfSafe(quiz.title), {
      align: "center",
    });
    doc.moveDown(0.4);
    doc
      .font(fonts.regular)
      .fontSize(10)
      .text(
        pdfSafe(`${quiz.subject} (${quiz.subjectCode}) | ${quiz.durationMins} minutes`),
        { align: "center" },
      );
    doc.moveDown();

    quiz.questions.forEach((question, index) => {
      doc.font(fonts.regular).fontSize(11).text(pdfSafe(`${index + 1}. ${question.prompt}`));
      question.options.forEach((option, optionIndex) => {
        const label = String.fromCharCode(65 + optionIndex);
        doc.fontSize(10).text(pdfSafe(`   ${label}. ${option}`));
      });
      doc
        .fontSize(8)
        .fillColor("#555")
        .text(
          pdfSafe(
            `Answer: ${String.fromCharCode(65 + question.correctIndex)} | ${question.unit} | ${question.difficulty}`,
          ),
        );
      doc.fillColor("#000").moveDown(0.6);
    });
  });
}

export async function renderPaperDocx(paper: QuestionPaper) {
  const children: Paragraph[] = [
    new Paragraph({
      text: paper.examTitle,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph(`${paper.course} | ${paper.subject} (${paper.subjectCode})`),
    new Paragraph(`Duration: ${paper.durationMins} minutes | Marks: ${paper.totalMarks}`),
  ];

  for (const section of paper.sections) {
    children.push(
      new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_2 }),
      new Paragraph({
        children: [new TextRun({ text: section.instruction, italics: true })],
      }),
    );

    for (const question of section.questions) {
      children.push(
        new Paragraph(
          `${question.number}. ${question.text} (${question.marks} marks)`,
        ),
        new Paragraph(`${question.unit} | ${question.difficulty} | ${question.bloom}`),
      );
    }
  }

  return Packer.toBuffer(
    new Document({
      sections: [{ children }],
    }),
  );
}

export async function renderQuizDocx(quiz: Quiz) {
  const children: Paragraph[] = [
    new Paragraph({ text: quiz.title, heading: HeadingLevel.TITLE }),
    new Paragraph(`${quiz.subject} (${quiz.subjectCode}) | ${quiz.durationMins} minutes`),
  ];

  quiz.questions.forEach((question, index) => {
    children.push(new Paragraph(`${index + 1}. ${question.prompt}`));
    question.options.forEach((option, optionIndex) => {
      const label = String.fromCharCode(65 + optionIndex);
      children.push(new Paragraph(`   ${label}. ${option}`));
    });
    children.push(
      new Paragraph(
        `Answer: ${String.fromCharCode(65 + question.correctIndex)} | ${question.unit} | ${question.difficulty}`,
      ),
      new Paragraph(`Explanation: ${question.explanation}`),
    );
  });

  return Packer.toBuffer(
    new Document({
      sections: [{ children }],
    }),
  );
}

async function collectPdf(
  draw: (doc: PDFKit.PDFDocument, fonts: FontSet) => void,
) {
  // bufferPages lets us walk back over every page at the end to stamp the
  // "Page X of Y" footer once the total page count is known.
  const doc = new PDFDocument({ margin: 48, size: "A4", bufferPages: true });
  const chunks: Buffer[] = [];

  // Register the embedded Unicode faces when available; otherwise fall back to
  // PDFKit's built-in (Latin-1-only) Helvetica family.
  const embedded = unicodeFonts();
  let fonts: FontSet;
  if (embedded) {
    doc.registerFont(EMBEDDED_FONTS.regular, embedded.regular);
    doc.registerFont(EMBEDDED_FONTS.bold, embedded.bold);
    fonts = EMBEDDED_FONTS;
  } else {
    fonts = BUILTIN_FONTS;
  }
  doc.font(fonts.regular);

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  draw(doc, fonts);
  addPageNumbers(doc, fonts);
  doc.end();

  return done;
}

// Stamp a centered "Page X of Y" footer in the bottom margin of every page.
function addPageNumbers(doc: PDFKit.PDFDocument, fonts: FontSet) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc
      .font(fonts.regular)
      .fontSize(8)
      .fillColor("#888")
      .text(
        `Page ${i + 1} of ${range.count}`,
        48,
        doc.page.height - 32,
        { align: "center", width: doc.page.width - 96, lineBreak: false },
      );
  }
  doc.flushPages();
}
