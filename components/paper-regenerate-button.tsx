"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { GenerationProgress } from "@/components/dashboard/generation-progress";
import { GlowButton } from "@/components/ui/glow-button";
import type { PaperGenerationConfig } from "@/lib/ai/generate";

/**
 * One-click "give me another paper with the same settings" button on the
 * paper editor.
 *
 * Reuses the EXACT same config and subjectId the original was generated
 * from, so the new paper matches the format of the old one — but with
 * fresh question text and topic selection. Saves the user from going
 * back to the dashboard and re-entering total marks / sections /
 * difficulty mix.
 */
export function PaperRegenerateButton({
  subjectId,
  config,
}: {
  subjectId: string;
  config: PaperGenerationConfig;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function regenerate() {
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/generate/paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, config }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        paper?: { id: string };
        error?: string;
      };
      if (!response.ok || !body.paper) {
        throw new Error(body.error ?? "Generation failed");
      }
      // Navigate into the new paper. We keep the progress modal open
      // through the navigation so the user sees finished → unmount
      // rather than a flash of the old editor.
      router.push(`/papers/${body.paper.id}`);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to regenerate paper";
      setError(message);
      setPending(false);
    }
  }

  return (
    <>
      <GenerationProgress
        key={pending ? "open" : "closed"}
        kind="paper"
        open={pending}
        errorMessage={error}
      />
      <GlowButton
        type="button"
        variant="secondary"
        size="sm"
        onClick={regenerate}
        disabled={pending}
      >
        <RefreshCw
          className={pending ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"}
        />
        {pending ? "Generating..." : "Regenerate"}
      </GlowButton>
    </>
  );
}
