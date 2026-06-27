/**
 * Client-side pre-flight for the new-subject upload, mirroring the server's
 * hard limit so the form fails fast — before a round trip, and before an empty
 * or oversized selection can leave behind an orphan "Needs docs" subject.
 */

// Keep in sync with MAX_UPLOAD_BYTES in app/api/documents/upload/route.ts.
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB per file

function prettyMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Returns a user-facing problem with the chosen files, or null if they're fine.
 * Takes the minimal { name, size } shape so it's trivially unit-testable.
 */
export function checkUploadFiles(
  files: { name: string; size: number }[],
): string | null {
  if (files.length === 0) {
    return "Add at least one text-based PDF before creating the subject.";
  }
  const tooBig = files.find((file) => file.size > MAX_UPLOAD_BYTES);
  if (tooBig) {
    return `"${tooBig.name}" is ${prettyMb(tooBig.size)} — each PDF must be under 5 MB.`;
  }
  return null;
}
