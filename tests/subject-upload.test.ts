import { describe, expect, it } from "vitest";

import { checkUploadFiles, MAX_UPLOAD_BYTES } from "@/lib/subject-upload";

describe("checkUploadFiles", () => {
  it("requires at least one file", () => {
    expect(checkUploadFiles([])).toMatch(/at least one/i);
  });

  it("accepts files within the size limit (boundary inclusive)", () => {
    expect(checkUploadFiles([{ name: "a.pdf", size: 1_000_000 }])).toBeNull();
    expect(
      checkUploadFiles([{ name: "a.pdf", size: MAX_UPLOAD_BYTES }]),
    ).toBeNull();
  });

  it("rejects a file over the limit and names it", () => {
    const msg = checkUploadFiles([
      { name: "ok.pdf", size: 1000 },
      { name: "huge.pdf", size: MAX_UPLOAD_BYTES + 1 },
    ]);
    expect(msg).toContain("huge.pdf");
    expect(msg).toMatch(/under 5 MB/i);
  });
});
