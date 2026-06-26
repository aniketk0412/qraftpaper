"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  FileDropField,
  UploadHints,
  fileFields,
} from "@/components/dashboard/file-drop-field";
import { FormError } from "@/components/ui/form-error";
import { GlowButton } from "@/components/ui/glow-button";
import { readErrorMessage } from "@/lib/fetch-error";
import { checkUploadFiles } from "@/lib/subject-upload";

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

      <UploadHints />

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
