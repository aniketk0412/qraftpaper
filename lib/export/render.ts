import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import PDFDocument from "pdfkit";

import type { QuestionPaper, Quiz } from "@/lib/types";

export async function renderPaperPdf(paper: QuestionPaper) {
  return collectPdf((doc) => {
    doc.fontSize(18).text(paper.examTitle, { align: "center" });
    doc.moveDown(0.4);
    doc
      .fontSize(10)
      .text(`${paper.course} | ${paper.subject} (${paper.subjectCode})`, {
        align: "center",
      });
    doc.text(`Duration: ${paper.durationMins} minutes | Marks: ${paper.totalMarks}`, {
      align: "center",
    });
    doc.moveDown();

    for (const section of paper.sections) {
      doc.fontSize(13).text(section.title, { underline: true });
      doc.fontSize(10).text(section.instruction);
      doc.moveDown(0.5);

      for (const question of section.questions) {
        doc
          .fontSize(10)
          .text(
            `${question.number}. ${question.text} (${question.marks} marks)`,
            { continued: false },
          );
        doc
          .fontSize(8)
          .fillColor("#555")
          .text(`${question.unit} | ${question.difficulty} | ${question.bloom}`);
        doc.fillColor("#000").moveDown(0.45);
      }

      doc.moveDown(0.5);
    }
  });
}

export async function renderQuizPdf(quiz: Quiz) {
  return collectPdf((doc) => {
    doc.fontSize(18).text(quiz.title, { align: "center" });
    doc.moveDown(0.4);
    doc
      .fontSize(10)
      .text(`${quiz.subject} (${quiz.subjectCode}) | ${quiz.durationMins} minutes`, {
        align: "center",
      });
    doc.moveDown();

    quiz.questions.forEach((question, index) => {
      doc.fontSize(11).text(`${index + 1}. ${question.prompt}`);
      question.options.forEach((option, optionIndex) => {
        const label = String.fromCharCode(65 + optionIndex);
        doc.fontSize(10).text(`   ${label}. ${option}`);
      });
      doc
        .fontSize(8)
        .fillColor("#555")
        .text(
          `Answer: ${String.fromCharCode(65 + question.correctIndex)} | ${question.unit} | ${question.difficulty}`,
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

async function collectPdf(draw: (doc: PDFKit.PDFDocument) => void) {
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  draw(doc);
  doc.end();

  return done;
}
