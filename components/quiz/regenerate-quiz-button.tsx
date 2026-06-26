"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

export function RegenerateQuizButton({
  subjectId,
  questionCount,
  durationMins,
}: {
  subjectId: string;
  questionCount: number;
  durationMins: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function regenerate() {
    if (pending) return;
    setPending(true);
    setError(null);

    const response = await fetch("/api/generate/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId,
        config: {
          questionCount,
          durationMins,
          difficultyMix: { Easy: 30, Medium: 50, Hard: 20 },
        },
      }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      quiz?: { id: string };
      error?: string;
    };

    if (!response.ok || !body.quiz) {
      setPending(false);
      setError(body.error ?? "Unable to regenerate quiz");
      return;
    }

    router.push(`/quiz/${body.quiz.id}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={regenerate}
        disabled={pending}
        className="flex items-center gap-2.5 rounded-xl glass px-4 py-3 text-[0.82rem] text-fg-muted transition-colors hover:text-fg disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
        ) : (
          <Sparkles className="h-4 w-4 text-violet-bright" />
        )}
        {pending ? "Regenerating…" : "Regenerate this quiz"}
      </button>
      {error && (
        <p className="flex items-center gap-1 px-1 text-[0.74rem] font-medium text-danger">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
