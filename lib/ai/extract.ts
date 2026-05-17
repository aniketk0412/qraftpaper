import type { ChatCompletion } from "openai/resources/chat/completions";

import { getOpenRouterClient, OPENROUTER_MODELS } from "./openrouter";
import type { SubjectProfile } from "@/lib/types";

const MIN_EXTRACTED_TEXT_CHARS = 400;

export async function extractPdfText(buffer: Buffer) {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });

  try {
    const parsed = await parser.getText();
    const text = normalizeWhitespace(parsed.text ?? "");

    if (text.length >= MIN_EXTRACTED_TEXT_CHARS) {
      return text;
    }

    const screenshots = await parser.getScreenshot({
      first: 3,
      imageDataUrl: true,
      imageBuffer: false,
    });
    const images = screenshots.pages
      .map((page) => page.dataUrl)
      .filter((dataUrl): dataUrl is string => Boolean(dataUrl));

    return ocrPdfImagesWithHaiku(images);
  } finally {
    await parser.destroy();
  }
}

async function ocrPdfImagesWithHaiku(images: string[]) {
  if (images.length === 0) {
    return "";
  }

  const response = (await getOpenRouterClient().chat.completions.create({
    model: OPENROUTER_MODELS.extraction,
    temperature: 0,
    max_tokens: 4000,
    messages: [
      {
        role: "system",
        content:
          "Extract readable text from the supplied PDF image/data. Preserve headings, unit labels, question numbers, marks, and syllabus structure. Return plain text only.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "The local PDF text extractor found too little text. OCR these rendered PDF pages and return the extracted text.",
          },
          ...images.map((imageUrl) => ({
            type: "image_url",
            image_url: {
              url: imageUrl,
            },
          })),
        ],
      },
    ],
  } as Parameters<
    ReturnType<typeof getOpenRouterClient>["chat"]["completions"]["create"]
  >[0])) as ChatCompletion;

  logUsage("ocr-pdf", response.usage);

  return normalizeWhitespace(response.choices[0]?.message.content ?? "");
}

const profileTool = {
  type: "function" as const,
  function: {
    name: "save_subject_profile",
    description: "Persist the compact subject profile extracted from documents.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["units", "questionBank", "formatBlueprint", "difficultyMix"],
      properties: {
        units: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["unit", "title", "topics"],
            properties: {
              unit: { type: "string" },
              title: { type: "string" },
              topics: { type: "array", items: { type: "string" } },
            },
          },
        },
        questionBank: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["text", "unit", "type"],
            properties: {
              text: { type: "string" },
              unit: { type: "string" },
              type: {
                type: "string",
                enum: ["short", "descriptive", "long", "mcq"],
              },
              marks: { type: "number" },
            },
          },
        },
        formatBlueprint: {
          type: "object",
          additionalProperties: false,
          required: [
            "sections",
            "totalMarks",
            "durationMins",
            "instructionStyle",
          ],
          properties: {
            sections: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: [
                  "title",
                  "instruction",
                  "marksPerQuestion",
                  "count",
                ],
                properties: {
                  title: { type: "string" },
                  instruction: { type: "string" },
                  marksPerQuestion: { type: "number" },
                  count: { type: "number" },
                },
              },
            },
            totalMarks: { type: "number" },
            durationMins: { type: "number" },
            instructionStyle: { type: "string" },
          },
        },
        difficultyMix: {
          type: "object",
          additionalProperties: false,
          required: ["Easy", "Medium", "Hard"],
          properties: {
            Easy: { type: "number" },
            Medium: { type: "number" },
            Hard: { type: "number" },
          },
        },
      },
    },
  },
};

export async function buildSubjectProfile(input: {
  subjectName: string;
  subjectCode: string;
  documents: { type: string; fileName: string; extractedText: string }[];
}) {
  const sourceText = input.documents
    .map(
      (document) =>
        `# ${document.type.toUpperCase()}: ${document.fileName}\n${document.extractedText}`,
    )
    .join("\n\n---\n\n");

  const response = (await getOpenRouterClient().chat.completions.create({
    model: OPENROUTER_MODELS.extraction,
    temperature: 0.2,
    max_tokens: 3500,
    messages: [
      {
        role: "system",
        content:
          "You build compact subject profiles for exam-paper generation. Extract syllabus units, recurring PYQ/sample-paper questions, the paper format, and difficulty distribution. Use concise JSON only through the provided tool.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Subject: ${input.subjectName}\nCode: ${input.subjectCode}\nBuild a compact SubjectProfile from these extracted documents.`,
          },
          {
            type: "text",
            text: sourceText,
            cache_control: { type: "ephemeral" },
          },
        ],
      },
    ],
    tools: [profileTool],
    tool_choice: {
      type: "function",
      function: { name: "save_subject_profile" },
    },
  } as Parameters<
    ReturnType<typeof getOpenRouterClient>["chat"]["completions"]["create"]
  >[0])) as ChatCompletion;

  logUsage("build-subject-profile", response.usage);

  const toolCall = response.choices[0]?.message.tool_calls?.[0];
  const args = toolCall?.type === "function" ? toolCall.function.arguments : "";

  if (!args) {
    throw new Error("OpenRouter did not return a subject profile tool call");
  }

  return JSON.parse(args) as SubjectProfile;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\r/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
}

function logUsage(label: string, usage: unknown) {
  console.info(`[ai:${label}] usage`, usage);
}
