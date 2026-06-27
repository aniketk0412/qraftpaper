"use client";

import { FileCheck2, Info, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** Human-readable file size, e.g. "2.4 MB". */
function prettyBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** The four document slots a subject accepts. Shared by the new-subject form
 *  and the add-documents form so both stay in sync with the upload route. */
export const fileFields = [
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

/** The "what makes a good upload" guidance, identical across upload surfaces. */
export function UploadHints() {
  return (
    <div className="rounded-2xl border border-accent/25 bg-accent/[0.06] p-4">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 shrink-0 text-accent" />
        <p className="text-[0.82rem] font-medium text-fg">Before you upload</p>
      </div>
      <ul className="mt-2 flex flex-col gap-1.5 text-[0.78rem] leading-relaxed text-fg-muted">
        <li>
          Bundle your material into one combined PDF where you can — fewer,
          larger files keep extraction faster and cost you less.
        </li>
        <li>
          Use text-based PDFs only. Image-only or scanned documents can&apos;t be
          read as text, so they won&apos;t build a usable profile.
        </li>
        <li>
          No image-heavy files — extracting hundreds of diagrams or photos would
          need a vision model and isn&apos;t supported here.
        </li>
      </ul>
    </div>
  );
}

/**
 * A single file slot with a clearly-visible attached state. The native file
 * input is its truncated, off-theme self no more: we keep a real (sr-only)
 * `<input type="file">` in the DOM so the form's FormData still picks it up,
 * and render our own UI on top —
 *   - empty: a dashed dropzone (click or drag a PDF in)
 *   - attached: an accent card with the file name, size, and Change / Remove.
 */
export function FileDropField({
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
