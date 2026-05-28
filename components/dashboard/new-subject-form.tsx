"use client";

import { useRouter } from "next/navigation";
import { Info, UploadCloud } from "lucide-react";
import { useState } from "react";

import { GlowButton } from "@/components/ui/glow-button";

const fileFields = [
  {
    name: "combined",
    label: "Combined study-material PDF",
    hint: "Recommended: syllabus, samples and PYQs in one text-based PDF.",
  },
  {
    name: "syllabus",
    label: "Syllabus PDF",
    hint: "Optional if it is already included in the combined PDF.",
  },
  {
    name: "sample",
    label: "Sample paper PDF",
    hint: "Optional if it is already included in the combined PDF.",
  },
  {
    name: "pyq",
    label: "Previous-year paper PDF",
    hint: "Optional if it is already included in the combined PDF.",
  },
];

export function NewSubjectForm() {
  const router = useRouter();
  const [status, setStatus] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus("Creating subject...");
    setError(undefined);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const code = String(formData.get("code") ?? "").trim();

    try {
      const subjectResponse = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      });

      if (!subjectResponse.ok) {
        const body = (await subjectResponse.json()) as { error?: string };
        throw new Error(body.error ?? "Unable to create subject");
      }

      const { subject } = (await subjectResponse.json()) as {
        subject: { id: string };
      };

      setStatus("Uploading PDFs and extracting text...");

      const uploadData = new FormData();
      uploadData.set("subjectId", subject.id);
      let uploadedFileCount = 0;

      for (const field of fileFields) {
        const value = formData.get(field.name);
        if (value instanceof File && value.size > 0) {
          uploadData.set(field.name, value);
          uploadedFileCount += 1;
        }
      }

      if (uploadedFileCount === 0) {
        throw new Error("Upload at least one text-based PDF for this subject.");
      }

      const uploadResponse = await fetch("/api/documents/upload", {
        method: "POST",
        body: uploadData,
      });

      if (!uploadResponse.ok) {
        const body = (await uploadResponse.json()) as { error?: string };
        throw new Error(body.error ?? "Unable to upload documents");
      }

      setStatus("Subject profile ready.");
      router.push("/dashboard");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create subject",
      );
      setStatus(undefined);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.78rem] font-medium text-fg-muted">
            Subject name
          </span>
          <input
            name="name"
            required
            placeholder="Data Structures & Algorithms"
            className="h-11 rounded-xl border border-line bg-tint/[0.03] px-3.5 text-sm text-fg placeholder:text-fg-subtle transition-all duration-200 focus:border-violet/50 focus:bg-tint/[0.05] focus:outline-none focus:ring-2 focus:ring-violet/20"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="flex items-baseline gap-2 text-[0.78rem] font-medium text-fg-muted">
            Subject code
            <span className="font-normal text-fg-subtle">(optional)</span>
          </span>
          <input
            name="code"
            placeholder="CS-204"
            className="h-11 rounded-xl border border-line bg-tint/[0.03] px-3.5 text-sm text-fg placeholder:text-fg-subtle transition-all duration-200 focus:border-violet/50 focus:bg-tint/[0.05] focus:outline-none focus:ring-2 focus:ring-violet/20"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-accent/25 bg-accent/[0.06] p-4">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-accent" />
          <p className="text-[0.82rem] font-medium text-fg">
            Before you upload
          </p>
        </div>
        <ul className="mt-2 flex flex-col gap-1.5 text-[0.78rem] leading-relaxed text-fg-muted">
          <li>
            Bundle your material into one combined PDF where you can — fewer,
            larger files keep extraction faster and cost you less.
          </li>
          <li>
            Use text-based PDFs only. Image-only or scanned documents can&apos;t
            be read as text, so they won&apos;t build a usable profile.
          </li>
          <li>
            No image-heavy files — extracting hundreds of diagrams or photos
            would need a vision model and isn&apos;t supported here.
          </li>
        </ul>
      </div>

      <div className="grid gap-3">
        {fileFields.map((field) => (
          <label
            key={field.name}
            className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-tint/[0.02] px-4 py-3.5 transition-colors hover:border-line-strong"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-tint/[0.04] text-violet-bright ring-1 ring-line">
              <UploadCloud className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.86rem] font-medium">
                {field.label}
              </span>
              <span className="block text-[0.72rem] text-fg-subtle">
                {field.hint}
              </span>
            </span>
            <input
              name={field.name}
              type="file"
              accept="application/pdf"
              className="max-w-[11rem] text-[0.72rem] text-fg-muted file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-[0.72rem] file:font-medium file:text-on-accent"
            />
          </label>
        ))}
      </div>

      {(status || error) && (
        <p className="rounded-xl border border-line bg-tint/[0.02] px-4 py-3 text-[0.78rem] leading-relaxed text-fg-muted">
          {error ?? status}
        </p>
      )}

      <GlowButton type="submit" size="lg" className="mt-1 w-full" disabled={pending}>
        {pending ? "Building profile..." : "Create subject"}
      </GlowButton>
    </form>
  );
}
