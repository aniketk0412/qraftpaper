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

/**
 * Upload (or replace) documents for an EXISTING subject — the missing half of
 * the flow. Until now the only upload path created a brand-new subject, so a
 * "Needs docs" subject was a dead end. Posts to /api/documents/upload with the
 * subjectId (the route already supports it) and refreshes on success, so the
 * page re-renders with the freshly built profile.
 */
export function SubjectDocumentsUpload({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
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
    setError(undefined);
    setStatus("Uploading PDFs and building the subject profile...");

    try {
      const uploadData = new FormData();
      uploadData.set("subjectId", subjectId);
      for (const { field, file } of chosen) {
        uploadData.set(field, file);
      }

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: uploadData,
      });

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Unable to upload documents"),
        );
      }

      setStatus("Subject profile ready.");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to upload documents",
      );
      setStatus(undefined);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
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

      <GlowButton
        type="submit"
        size="lg"
        className="mt-1 w-full"
        disabled={pending}
      >
        {pending ? "Building profile..." : "Upload documents"}
      </GlowButton>
    </form>
  );
}
