"use client";

import { useRouter } from "next/navigation";
import { FileCheck2, Info, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";

import { GlowButton } from "@/components/ui/glow-button";
import { FormError } from "@/components/ui/form-error";
import { readErrorMessage } from "@/lib/fetch-error";
import { checkUploadFiles } from "@/lib/subject-upload";
import { cn } from "@/lib/utils";

/** Human-readable file size, e.g. "2.4 MB". */
function prettyBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const code = String(formData.get("code") ?? "").trim();

    // Collect the chosen files (keeping each one's field name for the upload)
    // and validate BEFORE creating anything — an empty or oversized selection
    // must not leave behind an orphan "Needs docs" subject.
    const chosen = fileFields
      .map((field) => ({ field: field.name, file: formData.get(field.name) }))
      .filter(
        (entry): entry is { field: string; file: File } =>
          entry.file instanceof File && entry.file.size > 0,
      );

    const fileIssue = checkUploadFiles(chosen.map((entry) => entry.file));
    if (fileIssue) {
      setError(fileIssue);
      setStatus(undefined);
      return;
    }

    setPending(true);
    setStatus("Creating subject...");
    setError(undefined);

    // Once true, the subject row exists — so an upload failure below can say
    // "saved as Needs docs" instead of implying nothing happened.
    let subjectCreated = false;

    try {
      const subjectResponse = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      });

      if (!subjectResponse.ok) {
        throw new Error(
          await readErrorMessage(subjectResponse, "Unable to create subject"),
        );
      }

      const created = (await subjectResponse.json().catch(() => null)) as {
        subject?: { id: string };
      } | null;
      const subjectId = created?.subject?.id;
      if (!subjectId) {
        throw new Error(
          "The subject was created but the server sent an unexpected response. Refresh the page to check.",
        );
      }
      subjectCreated = true;

      setStatus("Uploading PDFs and extracting text...");

      const uploadData = new FormData();
      uploadData.set("subjectId", subjectId);
      for (const { field, file } of chosen) {
        uploadData.set(field, file);
      }

      const uploadResponse = await fetch("/api/documents/upload", {
        method: "POST",
        body: uploadData,
      });

      if (!uploadResponse.ok) {
        throw new Error(
          await readErrorMessage(uploadResponse, "Unable to upload documents"),
        );
      }

      setStatus("Subject profile ready.");
      router.push("/dashboard");
      router.refresh();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create subject";
      setError(
        subjectCreated
          ? `Your subject was saved, but its documents couldn't be processed: ${message} It's on your dashboard as "Needs docs" — open it to upload again.`
          : message,
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
          <FileDropField key={field.name} {...field} />
        ))}
      </div>

      {error ? (
        <FormError>{error}</FormError>
      ) : status ? (
        <p className="rounded-xl border border-line bg-tint/[0.02] px-4 py-3 text-[0.78rem] leading-relaxed text-fg-muted">
          {status}
        </p>
      ) : null}

      <GlowButton type="submit" size="lg" className="mt-1 w-full" disabled={pending}>
        {pending ? "Building profile..." : "Create subject"}
      </GlowButton>
    </form>
  );
}

/**
 * A single file slot with a clearly-visible attached state. The native file
 * input is its truncated, off-theme selves no more: we keep a real (sr-only)
 * `<input type="file">` in the DOM so the form's FormData still picks it up,
 * and render our own UI on top —
 *   - empty: a dashed dropzone (click or drag a PDF in)
 *   - attached: an accent card with the file name, size, and Change / Remove.
 */
function FileDropField({
  name,
  label,
  hint,
}: {
  name: string;
  label: string;
  hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  function remove() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (!dropped || dropped.type !== "application/pdf") return;
    // Mirror the drop into the real input so form submission includes it.
    const dt = new DataTransfer();
    dt.items.add(dropped);
    if (inputRef.current) inputRef.current.files = dt.files;
    setFile(dropped);
  }

  return (
    <div>
      {/* Real input — visually hidden but present so FormData reads its file. */}
      <input
        ref={inputRef}
        id={name}
        name={name}
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
        className="sr-only"
      />

      {file ? (
        <div className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/[0.07] px-4 py-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/30">
            <FileCheck2 className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span
              className="block truncate text-[0.86rem] font-medium text-fg"
              title={file.name}
            >
              {file.name}
            </span>
            <span className="block text-[0.72rem] text-fg-subtle">
              {prettyBytes(file.size)} · {label} attached
            </span>
          </span>
          <label
            htmlFor={name}
            className="shrink-0 cursor-pointer rounded-full border border-line px-3 py-1.5 text-[0.72rem] text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            Change
          </label>
          <button
            type="button"
            onClick={remove}
            aria-label={`Remove ${label}`}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-fg-subtle transition-colors hover:bg-tint/[0.08] hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={name}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "group flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed px-4 py-3.5 transition-colors",
            dragging
              ? "border-violet/60 bg-violet/[0.08]"
              : "border-line bg-tint/[0.02] hover:border-violet/40 hover:bg-violet/[0.04]",
          )}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-tint/[0.04] text-violet-bright ring-1 ring-line transition-colors group-hover:ring-violet/30">
            <UploadCloud className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.86rem] font-medium">{label}</span>
            <span className="block text-[0.72rem] text-fg-subtle">
              {dragging ? "Drop your PDF to attach it" : hint}
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-[0.72rem] font-medium text-on-accent transition-transform group-hover:scale-[1.03]">
            Choose file
          </span>
        </label>
      )}
    </div>
  );
}
